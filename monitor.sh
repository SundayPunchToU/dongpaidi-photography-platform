#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 监控脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 实时监控系统资源和服务性能
# 使用: ./monitor.sh [OPTIONS]
# ============================================================================

set -euo pipefail

# ============================================================================
# 全局变量和配置
# ============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly PROJECT_ROOT="$(pwd)"
readonly LOG_FILE="/var/log/dongpaidi-deploy.log"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 监控配置
readonly REFRESH_INTERVAL=5  # 刷新间隔（秒）
readonly WARNING_CPU=70      # CPU使用率警告阈值
readonly WARNING_MEMORY=80   # 内存使用率警告阈值
readonly WARNING_DISK=85     # 磁盘使用率警告阈值

# 参数
CONTINUOUS=false
ONCE=false
SERVICES_ONLY=false

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [MONITOR] $message" | sudo tee -a "$LOG_FILE" >/dev/null
}

# 清屏函数
clear_screen() {
    if [[ "$CONTINUOUS" == "true" ]]; then
        clear
    fi
}

# 获取颜色状态
get_status_color() {
    local value=$1
    local warning_threshold=$2
    local critical_threshold=${3:-90}
    
    if (( $(echo "$value >= $critical_threshold" | bc -l) )); then
        echo "$RED"
    elif (( $(echo "$value >= $warning_threshold" | bc -l) )); then
        echo "$YELLOW"
    else
        echo "$GREEN"
    fi
}

# ============================================================================
# 系统监控函数
# ============================================================================

# 显示系统信息
show_system_info() {
    echo -e "${WHITE}==================== 系统信息 ====================${NC}"
    echo -e "${CYAN}服务器:${NC} $(hostname) ($(hostname -I | awk '{print $1}'))"
    echo -e "${CYAN}系统:${NC} $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo -e "${CYAN}内核:${NC} $(uname -r)"
    echo -e "${CYAN}运行时间:${NC} $(uptime -p)"
    echo -e "${CYAN}当前时间:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo
}

# 显示CPU信息
show_cpu_info() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local cpu_cores=$(nproc)
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    
    local cpu_color=$(get_status_color "$cpu_usage" "$WARNING_CPU")
    
    echo -e "${WHITE}==================== CPU 状态 ====================${NC}"
    echo -e "${CYAN}CPU核心数:${NC} $cpu_cores"
    echo -e "${CYAN}CPU使用率:${NC} ${cpu_color}${cpu_usage}%${NC}"
    echo -e "${CYAN}负载平均:${NC} $load_avg"
    echo
}

# 显示内存信息
show_memory_info() {
    local mem_info=$(free -h | grep Mem)
    local total_mem=$(echo "$mem_info" | awk '{print $2}')
    local used_mem=$(echo "$mem_info" | awk '{print $3}')
    local available_mem=$(echo "$mem_info" | awk '{print $7}')
    
    # 计算内存使用率
    local total_kb=$(free | grep Mem | awk '{print $2}')
    local used_kb=$(free | grep Mem | awk '{print $3}')
    local mem_usage=$((used_kb * 100 / total_kb))
    
    local mem_color=$(get_status_color "$mem_usage" "$WARNING_MEMORY")
    
    echo -e "${WHITE}==================== 内存状态 ====================${NC}"
    echo -e "${CYAN}总内存:${NC} $total_mem"
    echo -e "${CYAN}已用内存:${NC} ${mem_color}$used_mem (${mem_usage}%)${NC}"
    echo -e "${CYAN}可用内存:${NC} $available_mem"
    echo
}

# 显示磁盘信息
show_disk_info() {
    echo -e "${WHITE}==================== 磁盘状态 ====================${NC}"
    
    df -h | grep -E '^/dev/' | while read -r line; do
        local filesystem=$(echo "$line" | awk '{print $1}')
        local size=$(echo "$line" | awk '{print $2}')
        local used=$(echo "$line" | awk '{print $3}')
        local available=$(echo "$line" | awk '{print $4}')
        local usage_percent=$(echo "$line" | awk '{print $5}' | sed 's/%//')
        local mount_point=$(echo "$line" | awk '{print $6}')
        
        local disk_color=$(get_status_color "$usage_percent" "$WARNING_DISK")
        
        echo -e "${CYAN}挂载点:${NC} $mount_point"
        echo -e "${CYAN}文件系统:${NC} $filesystem"
        echo -e "${CYAN}总大小:${NC} $size"
        echo -e "${CYAN}已使用:${NC} ${disk_color}$used (${usage_percent}%)${NC}"
        echo -e "${CYAN}可用:${NC} $available"
        echo
    done
}

# 显示网络信息
show_network_info() {
    echo -e "${WHITE}==================== 网络状态 ====================${NC}"
    
    # 显示网络接口
    local interfaces=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo)
    
    for interface in $interfaces; do
        local ip_addr=$(ip addr show "$interface" | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1)
        local status=$(ip link show "$interface" | grep -o 'state [A-Z]*' | awk '{print $2}')
        
        if [[ -n "$ip_addr" ]]; then
            echo -e "${CYAN}接口:${NC} $interface"
            echo -e "${CYAN}IP地址:${NC} $ip_addr"
            echo -e "${CYAN}状态:${NC} $status"
            echo
        fi
    done
    
    # 显示网络连接数
    local connections=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)
    echo -e "${CYAN}活动连接数:${NC} $connections"
    echo
}

# ============================================================================
# 服务监控函数
# ============================================================================

# 显示Docker容器状态
show_docker_status() {
    echo -e "${WHITE}==================== Docker 状态 ==================${NC}"
    
    if command -v docker >/dev/null 2>&1; then
        local docker_status="运行中"
        if ! systemctl is-active --quiet docker; then
            docker_status="${RED}未运行${NC}"
        fi
        
        echo -e "${CYAN}Docker服务:${NC} $docker_status"
        echo -e "${CYAN}Docker版本:${NC} $(docker --version | cut -d' ' -f3 | sed 's/,//')"
        echo
        
        # 显示容器状态
        if docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q dongpaidi; then
            echo -e "${CYAN}容器状态:${NC}"
            docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|dongpaidi)"
            echo
        else
            echo -e "${YELLOW}未找到懂拍帝相关容器${NC}"
            echo
        fi
    else
        echo -e "${RED}Docker未安装${NC}"
        echo
    fi
}

# 显示服务资源使用
show_service_resources() {
    echo -e "${WHITE}==================== 服务资源 ====================${NC}"
    
    if command -v docker >/dev/null 2>&1 && docker ps | grep -q dongpaidi; then
        echo -e "${CYAN}容器资源使用:${NC}"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -E "(NAME|dongpaidi)"
        echo
    else
        echo -e "${YELLOW}未找到运行中的服务容器${NC}"
        echo
    fi
}

# 显示服务端点状态
show_service_endpoints() {
    echo -e "${WHITE}==================== 服务端点 ====================${NC}"
    
    local server_ip=$(hostname -I | awk '{print $1}')
    
    # 检查各个端点
    local endpoints=(
        "API健康检查:http://localhost:3000/api/v1/health"
        "API服务:http://localhost:3000/api/v1"
        "Nginx状态:http://localhost:80/health"
        "主页面:http://localhost:80"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local name=$(echo "$endpoint_info" | cut -d':' -f1)
        local url=$(echo "$endpoint_info" | cut -d':' -f2-)
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
        local status_text="异常"
        local status_color="$RED"
        
        if [[ "$status_code" == "200" ]]; then
            status_text="正常"
            status_color="$GREEN"
        elif [[ "$status_code" == "000" ]]; then
            status_text="无响应"
            status_color="$RED"
        else
            status_text="状态码: $status_code"
            status_color="$YELLOW"
        fi
        
        echo -e "${CYAN}$name:${NC} ${status_color}$status_text${NC}"
    done
    
    echo
    echo -e "${CYAN}外部访问地址:${NC}"
    echo -e "  🌐 主页面: http://$server_ip"
    echo -e "  🔧 API服务: http://$server_ip:3000/api/v1"
    echo -e "  ❤️  健康检查: http://$server_ip:3000/api/v1/health"
    echo
}

# 显示数据库状态
show_database_status() {
    echo -e "${WHITE}==================== 数据库状态 ==================${NC}"
    
    # PostgreSQL状态
    if docker ps | grep -q dongpaidi-postgres; then
        local pg_status="运行中"
        local pg_color="$GREEN"
        
        if docker exec dongpaidi-postgres pg_isready -U dongpaidi_user -d dongpaidi_prod >/dev/null 2>&1; then
            pg_status="运行中 (连接正常)"
        else
            pg_status="运行中 (连接异常)"
            pg_color="$YELLOW"
        fi
        
        echo -e "${CYAN}PostgreSQL:${NC} ${pg_color}$pg_status${NC}"
        
        # 显示数据库大小
        local db_size=$(docker exec dongpaidi-postgres psql -U dongpaidi_user -d dongpaidi_prod -t -c "SELECT pg_size_pretty(pg_database_size('dongpaidi_prod'));" 2>/dev/null | xargs || echo "未知")
        echo -e "${CYAN}数据库大小:${NC} $db_size"
    else
        echo -e "${CYAN}PostgreSQL:${NC} ${RED}未运行${NC}"
    fi
    
    # Redis状态
    if docker ps | grep -q dongpaidi-redis; then
        local redis_status="运行中"
        local redis_color="$GREEN"
        
        if docker exec dongpaidi-redis redis-cli -a redis_password_2024 ping >/dev/null 2>&1; then
            redis_status="运行中 (连接正常)"
        else
            redis_status="运行中 (连接异常)"
            redis_color="$YELLOW"
        fi
        
        echo -e "${CYAN}Redis:${NC} ${redis_color}$redis_status${NC}"
        
        # 显示Redis内存使用
        local redis_memory=$(docker exec dongpaidi-redis redis-cli -a redis_password_2024 info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "未知")
        echo -e "${CYAN}Redis内存:${NC} $redis_memory"
    else
        echo -e "${CYAN}Redis:${NC} ${RED}未运行${NC}"
    fi
    
    echo
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 显示帮助信息
show_help() {
    cat << EOF
懂拍帝摄影平台监控脚本

使用方法:
    $SCRIPT_NAME [OPTIONS]

选项:
    --continuous        连续监控模式 (每${REFRESH_INTERVAL}秒刷新)
    --once              单次监控模式 (默认)
    --services          仅显示服务状态
    --help              显示此帮助信息

示例:
    $SCRIPT_NAME                    # 单次监控
    $SCRIPT_NAME --continuous       # 连续监控
    $SCRIPT_NAME --services         # 仅显示服务状态

监控阈值:
    CPU使用率警告: ${WARNING_CPU}%
    内存使用率警告: ${WARNING_MEMORY}%
    磁盘使用率警告: ${WARNING_DISK}%

按 Ctrl+C 退出连续监控模式
EOF
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --continuous|-c)
                CONTINUOUS=true
                shift
                ;;
            --once|-o)
                ONCE=true
                shift
                ;;
            --services|-s)
                SERVICES_ONLY=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 显示完整监控信息
show_full_monitor() {
    clear_screen
    
    show_system_info
    
    if [[ "$SERVICES_ONLY" == "false" ]]; then
        show_cpu_info
        show_memory_info
        show_disk_info
        show_network_info
    fi
    
    show_docker_status
    show_service_resources
    show_service_endpoints
    show_database_status
    
    if [[ "$CONTINUOUS" == "true" ]]; then
        echo -e "${CYAN}刷新间隔: ${REFRESH_INTERVAL}秒 | 按 Ctrl+C 退出${NC}"
    fi
}

# 执行监控
run_monitor() {
    if [[ "$CONTINUOUS" == "true" ]]; then
        log "INFO" "开始连续监控模式"
        
        # 设置信号处理
        trap 'echo -e "\n${GREEN}监控已停止${NC}"; exit 0' INT
        
        while true; do
            show_full_monitor
            sleep "$REFRESH_INTERVAL"
        done
    else
        log "INFO" "执行单次监控"
        show_full_monitor
    fi
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    # 解析命令行参数
    parse_arguments "$@"
    
    # 执行监控
    run_monitor
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
