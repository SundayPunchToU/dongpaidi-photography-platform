#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 完全自动化部署脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 一键自动化部署，适用于CI/CD和无人值守部署
# 使用: ./auto-deploy.sh
# ============================================================================

set -euo pipefail

# ============================================================================
# 全局变量和配置
# ============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly PROJECT_ROOT="$(pwd)"
readonly LOG_FILE="/var/log/dongpaidi-deploy.log"
readonly DEPLOY_STATE_FILE="${PROJECT_ROOT}/.deploy-state"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 部署配置
readonly AUTO_DEPLOY_VERSION="1.0.0"
readonly DEPLOYMENT_TIMEOUT=1800  # 30分钟
readonly HEALTH_CHECK_RETRIES=3
readonly HEALTH_CHECK_INTERVAL=30

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [AUTO-DEPLOY] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[✓]${NC} $message"
            ;;
        "FATAL")
            echo -e "${RED}[FATAL]${NC} $message"
            ;;
    esac
}

# 进度条函数
show_progress() {
    local current=$1
    local total=$2
    local message="$3"
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((current * width / total))
    
    printf "\r${BLUE}[%3d%%]${NC} [" "$percentage"
    printf "%*s" "$completed" | tr ' ' '='
    printf "%*s" $((width - completed)) | tr ' ' '-'
    printf "] %s" "$message"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    local line_number=$1
    
    log "FATAL" "自动部署在第 $line_number 行失败，退出码: $exit_code"
    
    # 记录失败状态
    echo "AUTO_DEPLOY:FAILED:$(date '+%Y-%m-%d %H:%M:%S'):$exit_code" >> "$DEPLOY_STATE_FILE"
    
    # 尝试回滚
    if [[ -f "./rollback.sh" ]]; then
        log "INFO" "尝试自动回滚..."
        chmod +x ./rollback.sh
        ./rollback.sh --auto || log "ERROR" "自动回滚失败"
    fi
    
    exit $exit_code
}

# 设置错误处理
trap 'handle_error $LINENO' ERR

# ============================================================================
# 预检查函数
# ============================================================================

# 预部署检查
pre_deployment_check() {
    log "INFO" "执行预部署检查..."
    
    # 检查是否为root用户
    if [[ $EUID -ne 0 ]]; then
        log "FATAL" "自动部署需要root权限"
        exit 1
    fi
    
    # 检查必要的脚本文件
    local required_scripts=(
        "check-environment.sh"
        "setup-docker.sh"
        "init-database.sh"
        "start-services.sh"
        "health-check.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "./$script" ]]; then
            log "FATAL" "缺少必要的脚本文件: $script"
            exit 1
        fi
        chmod +x "./$script"
    done
    
    # 检查Docker服务
    if ! systemctl is-active --quiet docker; then
        log "INFO" "启动Docker服务..."
        systemctl start docker
        systemctl enable docker
    fi
    
    # 检查磁盘空间
    local available_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [[ $available_gb -lt 5 ]]; then
        log "FATAL" "磁盘空间不足: ${available_gb}GB (需要至少5GB)"
        exit 1
    fi
    
    log "SUCCESS" "预部署检查通过"
}

# ============================================================================
# 部署步骤函数
# ============================================================================

# 执行环境检查
execute_environment_check() {
    log "INFO" "执行环境检查..."
    
    if ./check-environment.sh; then
        log "SUCCESS" "环境检查通过"
        return 0
    else
        log "ERROR" "环境检查失败"
        return 1
    fi
}

# 执行Docker设置
execute_docker_setup() {
    log "INFO" "执行Docker设置..."
    
    if ./setup-docker.sh; then
        log "SUCCESS" "Docker设置完成"
        return 0
    else
        log "ERROR" "Docker设置失败"
        return 1
    fi
}

# 执行数据库初始化
execute_database_init() {
    log "INFO" "执行数据库初始化..."
    
    if ./init-database.sh; then
        log "SUCCESS" "数据库初始化完成"
        return 0
    else
        log "ERROR" "数据库初始化失败"
        return 1
    fi
}

# 执行服务启动
execute_services_start() {
    log "INFO" "执行服务启动..."
    
    if ./start-services.sh; then
        log "SUCCESS" "服务启动完成"
        return 0
    else
        log "ERROR" "服务启动失败"
        return 1
    fi
}

# 执行健康检查
execute_health_check() {
    log "INFO" "执行健康检查..."
    
    local retry_count=0
    while [[ $retry_count -lt $HEALTH_CHECK_RETRIES ]]; do
        if ./health-check.sh; then
            log "SUCCESS" "健康检查通过"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $HEALTH_CHECK_RETRIES ]]; then
                log "WARN" "健康检查失败，等待 $HEALTH_CHECK_INTERVAL 秒后重试 ($retry_count/$HEALTH_CHECK_RETRIES)"
                sleep $HEALTH_CHECK_INTERVAL
            fi
        fi
    done
    
    log "ERROR" "健康检查失败，已重试 $HEALTH_CHECK_RETRIES 次"
    return 1
}

# ============================================================================
# 主部署流程
# ============================================================================

# 显示部署信息
show_deployment_info() {
    echo
    echo -e "${WHITE}==================== 自动部署 ====================${NC}"
    echo -e "${CYAN}懂拍帝摄影平台自动化部署${NC}"
    echo -e "${CYAN}版本: $AUTO_DEPLOY_VERSION${NC}"
    echo -e "${CYAN}时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}服务器: $(hostname) ($(hostname -I | awk '{print $1}'))${NC}"
    echo -e "${CYAN}部署目录: $PROJECT_ROOT${NC}"
    echo -e "${WHITE}=================================================${NC}"
    echo
}

# 执行自动部署
execute_auto_deployment() {
    local total_steps=5
    local current_step=0
    
    # 记录部署开始
    echo "AUTO_DEPLOY:STARTED:$(date '+%Y-%m-%d %H:%M:%S')" > "$DEPLOY_STATE_FILE"
    
    # 步骤1: 环境检查
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "环境检查"
    execute_environment_check
    echo "STEP:environment_check:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 步骤2: Docker设置
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "Docker设置"
    execute_docker_setup
    echo "STEP:docker_setup:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 步骤3: 数据库初始化
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "数据库初始化"
    execute_database_init
    echo "STEP:database_init:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 步骤4: 服务启动
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "服务启动"
    execute_services_start
    echo "STEP:services_start:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 步骤5: 健康检查
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "健康检查"
    execute_health_check
    echo "STEP:health_check:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 记录部署成功
    echo "AUTO_DEPLOY:SUCCESS:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
}

# 显示部署结果
show_deployment_result() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    echo
    echo -e "${GREEN}🎉 自动部署成功完成！${NC}"
    echo
    echo -e "${WHITE}==================== 部署结果 ====================${NC}"
    echo -e "${CYAN}服务状态:${NC} 所有服务运行正常"
    echo -e "${CYAN}部署时间:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${CYAN}部署版本:${NC} $AUTO_DEPLOY_VERSION"
    echo
    echo -e "${CYAN}服务端点:${NC}"
    echo -e "  🌐 主页面: http://$server_ip"
    echo -e "  🔧 API服务: http://$server_ip:3000/api/v1"
    echo -e "  ❤️  健康检查: http://$server_ip:3000/api/v1/health"
    echo -e "  📊 系统状态: http://$server_ip/health"
    echo
    echo -e "${CYAN}数据库连接:${NC}"
    echo -e "  🐘 PostgreSQL: $server_ip:5432"
    echo -e "  🔴 Redis: $server_ip:6379"
    echo
    echo -e "${CYAN}管理命令:${NC}"
    echo -e "  查看状态: docker-compose ps"
    echo -e "  查看日志: docker-compose logs -f"
    echo -e "  停止服务: docker-compose down"
    echo -e "  重启服务: docker-compose restart"
    echo
    echo -e "${CYAN}日志文件:${NC}"
    echo -e "  部署日志: $LOG_FILE"
    echo -e "  状态文件: $DEPLOY_STATE_FILE"
    echo -e "${WHITE}=================================================${NC}"
    echo
    
    log "SUCCESS" "自动部署完成，所有服务正常运行"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    # 显示部署信息
    show_deployment_info
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    log "INFO" "开始自动部署..."
    
    # 预部署检查
    pre_deployment_check
    
    # 执行自动部署
    execute_auto_deployment
    
    # 计算部署时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    log "INFO" "部署耗时: ${minutes}分${seconds}秒"
    
    # 显示部署结果
    show_deployment_result
    
    log "INFO" "自动部署流程完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
