#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 主部署脚本
# ============================================================================
# 版本: 1.0.0
# 作者: AI Agent
# 描述: 统一部署入口点，支持模块化部署和多种执行模式
# 使用: ./deploy.sh [OPTIONS]
# ============================================================================

set -euo pipefail  # 严格模式：遇到错误立即退出

# ============================================================================
# 全局变量和配置
# ============================================================================

# 脚本基础信息
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(pwd)"
readonly DEPLOY_STATE_FILE="${PROJECT_ROOT}/.deploy-state"
readonly LOG_FILE="/var/log/dongpaidi-deploy.log"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# 部署配置
readonly REQUIRED_PORTS=(3000 5432 6379 80 443)
readonly REQUIRED_MEMORY_GB=1
readonly REQUIRED_DISK_GB=10
readonly MAX_CPU_USAGE=80

# 默认参数
DRY_RUN=false
FORCE=false
VERBOSE=false
STEP_BY_STEP=false
SKIP_CHECKS=false
BACKUP_BEFORE_DEPLOY=true

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 确保日志目录存在
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    
    # 写入日志文件
    echo "[$timestamp] [$level] [DEPLOY] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
    # 控制台输出（带颜色）
    case "$level" in
        "DEBUG")
            [[ "$VERBOSE" == "true" ]] && echo -e "${CYAN}[DEBUG]${NC} $message" >&2
            ;;
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" >&2
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        "FATAL")
            echo -e "${RED}[FATAL]${NC} $message" >&2
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
    
    log "FATAL" "脚本在第 $line_number 行发生错误，退出码: $exit_code"
    log "ERROR" "执行失败，开始清理..."
    
    cleanup_on_failure
    exit $exit_code
}

# 失败时清理函数
cleanup_on_failure() {
    log "INFO" "开始清理失败的部署..."
    
    # 停止可能启动的容器
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose down --remove-orphans 2>/dev/null || true
    fi
    
    # 清理临时文件
    find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null || true
    
    # 更新部署状态
    echo "FAILED:$(date '+%Y-%m-%d %H:%M:%S')" > "$DEPLOY_STATE_FILE"
    
    log "INFO" "清理完成"
}

# 确认提示函数
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$FORCE" == "true" ]]; then
        log "INFO" "强制模式：跳过确认 - $message"
        return 0
    fi
    
    local prompt
    if [[ "$default" == "y" ]]; then
        prompt="$message [Y/n]: "
    else
        prompt="$message [y/N]: "
    fi
    
    while true; do
        read -p "$prompt" -r response
        response=${response:-$default}
        
        case "$response" in
            [Yy]|[Yy][Ee][Ss])
                return 0
                ;;
            [Nn]|[Nn][Oo])
                return 1
                ;;
            *)
                echo "请输入 y 或 n"
                ;;
        esac
    done
}

# 步骤执行函数
execute_step() {
    local step_name="$1"
    local step_function="$2"
    local step_description="$3"
    
    log "INFO" "开始执行: $step_description"
    
    if [[ "$STEP_BY_STEP" == "true" ]]; then
        if ! confirm "是否执行步骤: $step_description" "y"; then
            log "WARN" "跳过步骤: $step_name"
            return 0
        fi
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] 将要执行: $step_function"
        return 0
    fi
    
    # 记录步骤开始
    echo "STEP:$step_name:STARTED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
    
    # 执行步骤
    if $step_function; then
        echo "STEP:$step_name:COMPLETED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
        log "INFO" "步骤完成: $step_description"
        return 0
    else
        echo "STEP:$step_name:FAILED:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"
        log "ERROR" "步骤失败: $step_description"
        return 1
    fi
}

# 检查步骤是否已完成
is_step_completed() {
    local step_name="$1"
    
    if [[ ! -f "$DEPLOY_STATE_FILE" ]]; then
        return 1
    fi
    
    grep -q "STEP:$step_name:COMPLETED:" "$DEPLOY_STATE_FILE" 2>/dev/null
}

# 设置错误处理
trap 'handle_error $LINENO' ERR

# ============================================================================
# 部署步骤函数
# ============================================================================

# 步骤1: 环境检查
step_check_environment() {
    log "INFO" "执行环境检查..."

    if [[ -f "./check-environment.sh" ]]; then
        chmod +x ./check-environment.sh
        ./check-environment.sh
    else
        log "ERROR" "环境检查脚本不存在: ./check-environment.sh"
        return 1
    fi
}

# 步骤2: Docker设置
step_setup_docker() {
    log "INFO" "设置Docker环境..."

    if [[ -f "./setup-docker.sh" ]]; then
        chmod +x ./setup-docker.sh
        ./setup-docker.sh
    else
        log "ERROR" "Docker设置脚本不存在: ./setup-docker.sh"
        return 1
    fi
}

# 步骤3: 数据库初始化
step_init_database() {
    log "INFO" "初始化数据库..."

    if [[ -f "./init-database.sh" ]]; then
        chmod +x ./init-database.sh
        ./init-database.sh
    else
        log "ERROR" "数据库初始化脚本不存在: ./init-database.sh"
        return 1
    fi
}

# 步骤4: 启动服务
step_start_services() {
    log "INFO" "启动服务..."

    if [[ -f "./start-services.sh" ]]; then
        chmod +x ./start-services.sh
        ./start-services.sh
    else
        log "ERROR" "服务启动脚本不存在: ./start-services.sh"
        return 1
    fi
}

# 步骤5: 健康检查
step_health_check() {
    log "INFO" "执行健康检查..."

    if [[ -f "./health-check.sh" ]]; then
        chmod +x ./health-check.sh
        ./health-check.sh
    else
        log "ERROR" "健康检查脚本不存在: ./health-check.sh"
        return 1
    fi
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 显示帮助信息
show_help() {
    cat << EOF
懂拍帝摄影平台部署脚本

使用方法:
    $SCRIPT_NAME [OPTIONS]

选项:
    --dry-run           演练模式，显示将要执行的操作但不实际执行
    --force             强制执行，跳过确认提示
    --verbose           详细输出模式
    --step-by-step      分步执行，每步需要用户确认
    --skip-checks       跳过环境检查（不推荐）
    --no-backup         不执行部署前备份
    --help              显示此帮助信息

示例:
    $SCRIPT_NAME                    # 标准部署
    $SCRIPT_NAME --dry-run          # 演练模式
    $SCRIPT_NAME --force --verbose  # 强制执行，详细输出
    $SCRIPT_NAME --step-by-step     # 分步执行

日志文件: $LOG_FILE
状态文件: $DEPLOY_STATE_FILE
EOF
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log "INFO" "启用演练模式"
                shift
                ;;
            --force)
                FORCE=true
                log "INFO" "启用强制模式"
                shift
                ;;
            --verbose)
                VERBOSE=true
                log "INFO" "启用详细输出模式"
                shift
                ;;
            --step-by-step)
                STEP_BY_STEP=true
                log "INFO" "启用分步执行模式"
                shift
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                log "WARN" "跳过环境检查（不推荐）"
                shift
                ;;
            --no-backup)
                BACKUP_BEFORE_DEPLOY=false
                log "INFO" "禁用部署前备份"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 显示部署计划
show_deployment_plan() {
    echo
    echo -e "${WHITE}==================== 部署计划 ====================${NC}"
    echo -e "${CYAN}项目:${NC} 懂拍帝摄影平台"
    echo -e "${CYAN}版本:${NC} 1.0.0"
    echo -e "${CYAN}环境:${NC} 生产环境"
    echo -e "${CYAN}服务器:${NC} $(hostname) ($(hostname -I | awk '{print $1}'))"
    echo -e "${CYAN}部署目录:${NC} $PROJECT_ROOT"
    echo
    echo -e "${WHITE}部署步骤:${NC}"
    echo -e "  1. ${GREEN}环境检查${NC} - 验证系统资源和依赖"
    echo -e "  2. ${GREEN}Docker设置${NC} - 配置容器环境"
    echo -e "  3. ${GREEN}数据库初始化${NC} - 设置PostgreSQL和Redis"
    echo -e "  4. ${GREEN}启动服务${NC} - 启动所有容器服务"
    echo -e "  5. ${GREEN}健康检查${NC} - 验证服务状态"
    echo
    echo -e "${WHITE}配置参数:${NC}"
    echo -e "  演练模式: ${YELLOW}$DRY_RUN${NC}"
    echo -e "  强制执行: ${YELLOW}$FORCE${NC}"
    echo -e "  详细输出: ${YELLOW}$VERBOSE${NC}"
    echo -e "  分步执行: ${YELLOW}$STEP_BY_STEP${NC}"
    echo -e "  跳过检查: ${YELLOW}$SKIP_CHECKS${NC}"
    echo -e "  部署前备份: ${YELLOW}$BACKUP_BEFORE_DEPLOY${NC}"
    echo -e "${WHITE}=================================================${NC}"
    echo
}

# 执行备份
perform_backup() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
        log "INFO" "执行部署前备份..."

        if [[ -f "./backup.sh" ]]; then
            chmod +x ./backup.sh
            ./backup.sh --pre-deploy
        else
            log "WARN" "备份脚本不存在，跳过备份"
        fi
    fi
}

# 主部署函数
main_deploy() {
    local total_steps=5
    local current_step=0

    # 显示部署计划
    show_deployment_plan

    # 确认开始部署
    if [[ "$DRY_RUN" == "false" ]] && [[ "$FORCE" == "false" ]]; then
        if ! confirm "是否开始部署？" "y"; then
            log "INFO" "用户取消部署"
            exit 0
        fi
    fi

    # 执行备份
    if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
        perform_backup
    fi

    # 步骤1: 环境检查
    if [[ "$SKIP_CHECKS" == "false" ]]; then
        current_step=$((current_step + 1))
        show_progress $current_step $total_steps "环境检查"

        if ! is_step_completed "check_environment"; then
            execute_step "check_environment" "step_check_environment" "环境检查和依赖验证"
        else
            log "INFO" "环境检查已完成，跳过"
        fi
    fi

    # 步骤2: Docker设置
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "Docker设置"

    if ! is_step_completed "setup_docker"; then
        execute_step "setup_docker" "step_setup_docker" "Docker环境配置"
    else
        log "INFO" "Docker设置已完成，跳过"
    fi

    # 步骤3: 数据库初始化
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "数据库初始化"

    if ! is_step_completed "init_database"; then
        execute_step "init_database" "step_init_database" "数据库初始化和迁移"
    else
        log "INFO" "数据库初始化已完成，跳过"
    fi

    # 步骤4: 启动服务
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "启动服务"

    if ! is_step_completed "start_services"; then
        execute_step "start_services" "step_start_services" "启动所有容器服务"
    else
        log "INFO" "服务启动已完成，跳过"
    fi

    # 步骤5: 健康检查
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "健康检查"

    execute_step "health_check" "step_health_check" "服务健康检查和验证"

    # 部署完成
    echo "DEPLOY:SUCCESS:$(date '+%Y-%m-%d %H:%M:%S')" >> "$DEPLOY_STATE_FILE"

    echo
    echo -e "${GREEN}🎉 部署成功完成！${NC}"
    echo -e "${WHITE}==================== 部署结果 ====================${NC}"
    echo -e "${CYAN}API服务:${NC} http://$(hostname -I | awk '{print $1}'):3000"
    echo -e "${CYAN}管理后台:${NC} http://$(hostname -I | awk '{print $1}'):3001"
    echo -e "${CYAN}数据库:${NC} PostgreSQL (端口: 5432)"
    echo -e "${CYAN}缓存:${NC} Redis (端口: 6379)"
    echo -e "${CYAN}日志文件:${NC} $LOG_FILE"
    echo -e "${CYAN}状态文件:${NC} $DEPLOY_STATE_FILE"
    echo -e "${WHITE}=================================================${NC}"
    echo

    log "INFO" "部署成功完成"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    # 解析命令行参数
    parse_arguments "$@"

    # 检查是否为root用户
    if [[ $EUID -ne 0 ]]; then
        log "ERROR" "此脚本需要root权限运行"
        exit 1
    fi

    # 检查项目目录
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log "ERROR" "项目目录不存在: $PROJECT_ROOT"
        exit 1
    fi

    # 创建必要的目录
    mkdir -p "$PROJECT_ROOT"/{logs,backups,data/{postgres,redis}}

    # 初始化日志
    log "INFO" "开始部署懂拍帝摄影平台..."
    log "INFO" "项目根目录: $PROJECT_ROOT"
    log "INFO" "部署状态文件: $DEPLOY_STATE_FILE"

    # 执行主部署流程
    main_deploy
}

# 如果脚本被直接执行（而不是被source），则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
