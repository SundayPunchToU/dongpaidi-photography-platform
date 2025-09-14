#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 环境检查脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 检查系统环境、资源和依赖项
# 使用: ./check-environment.sh
# ============================================================================

set -euo pipefail

# ============================================================================
# 全局变量和配置
# ============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly LOG_FILE="/var/log/dongpaidi-deploy.log"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 系统要求
readonly MIN_MEMORY_GB=1
readonly MIN_DISK_GB=10
readonly MAX_CPU_USAGE=80
readonly REQUIRED_PORTS=(3000 5432 6379 80 443)

# 检查结果
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 写入日志文件
    echo "[$timestamp] [$level] [ENV-CHECK] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
    # 控制台输出
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ((WARNINGS++))
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ((CHECKS_FAILED++))
            ;;
        "SUCCESS")
            echo -e "${GREEN}[✓]${NC} $message"
            ((CHECKS_PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}[✗]${NC} $message"
            ((CHECKS_FAILED++))
            ;;
    esac
}

# 检查函数模板
check_item() {
    local item_name="$1"
    local check_function="$2"
    local description="$3"
    
    echo -n "检查 $description... "
    
    if $check_function; then
        log "SUCCESS" "$item_name: $description"
    else
        log "FAIL" "$item_name: $description"
    fi
}

# ============================================================================
# 系统检查函数
# ============================================================================

# 检查操作系统
check_os() {
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        if [[ "$ID" == "ubuntu" ]]; then
            local version_major=$(echo "$VERSION_ID" | cut -d. -f1)
            if [[ $version_major -ge 20 ]]; then
                echo "操作系统: $PRETTY_NAME ✓"
                return 0
            else
                echo "操作系统版本过低: $PRETTY_NAME (需要 Ubuntu 20.04+)"
                return 1
            fi
        else
            echo "不支持的操作系统: $PRETTY_NAME (需要 Ubuntu)"
            return 1
        fi
    else
        echo "无法检测操作系统"
        return 1
    fi
}

# 检查CPU
check_cpu() {
    local cpu_cores=$(nproc)
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    
    if [[ $cpu_cores -ge 2 ]]; then
        if (( $(echo "$cpu_usage < $MAX_CPU_USAGE" | bc -l) )); then
            echo "CPU: ${cpu_cores}核, 使用率: ${cpu_usage}% ✓"
            return 0
        else
            echo "CPU使用率过高: ${cpu_usage}% (建议 < ${MAX_CPU_USAGE}%)"
            return 1
        fi
    else
        echo "CPU核心数不足: ${cpu_cores}核 (建议 >= 2核)"
        return 1
    fi
}

# 检查内存
check_memory() {
    local total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local available_mem_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    local total_mem_gb=$((total_mem_kb / 1024 / 1024))
    local available_mem_gb=$((available_mem_kb / 1024 / 1024))
    
    if [[ $total_mem_gb -ge $MIN_MEMORY_GB ]]; then
        if [[ $available_mem_gb -ge 1 ]]; then
            echo "内存: 总计${total_mem_gb}GB, 可用${available_mem_gb}GB ✓"
            return 0
        else
            echo "可用内存不足: ${available_mem_gb}GB (需要 >= 1GB)"
            return 1
        fi
    else
        echo "总内存不足: ${total_mem_gb}GB (需要 >= ${MIN_MEMORY_GB}GB)"
        return 1
    fi
}

# 检查磁盘空间
check_disk() {
    local available_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ $available_gb -ge $MIN_DISK_GB ]]; then
        echo "磁盘空间: ${available_gb}GB 可用 ✓"
        return 0
    else
        echo "磁盘空间不足: ${available_gb}GB (需要 >= ${MIN_DISK_GB}GB)"
        return 1
    fi
}

# 检查端口占用
check_ports() {
    local occupied_ports=()
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=($port)
        fi
    done
    
    if [[ ${#occupied_ports[@]} -eq 0 ]]; then
        echo "端口检查: 所需端口均可用 ✓"
        return 0
    else
        echo "端口被占用: ${occupied_ports[*]} (需要端口: ${REQUIRED_PORTS[*]})"
        return 1
    fi
}

# 检查Docker
check_docker() {
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        local major_version=$(echo "$docker_version" | cut -d. -f1)
        
        if [[ $major_version -ge 20 ]]; then
            if systemctl is-active --quiet docker; then
                echo "Docker: v$docker_version (运行中) ✓"
                return 0
            else
                echo "Docker已安装但未运行: v$docker_version"
                return 1
            fi
        else
            echo "Docker版本过低: v$docker_version (需要 >= 20.0)"
            return 1
        fi
    else
        echo "Docker未安装"
        return 1
    fi
}

# 检查Docker Compose
check_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        local major_version=$(echo "$compose_version" | cut -d. -f1)
        
        if [[ $major_version -ge 2 ]]; then
            echo "Docker Compose: v$compose_version ✓"
            return 0
        else
            echo "Docker Compose版本过低: v$compose_version (需要 >= 2.0)"
            return 1
        fi
    else
        echo "Docker Compose未安装"
        return 1
    fi
}

# 检查网络连接
check_network() {
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "网络连接: 正常 ✓"
        return 0
    else
        echo "网络连接: 异常"
        return 1
    fi
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 执行所有检查
run_all_checks() {
    echo -e "${WHITE}==================== 环境检查 ====================${NC}"
    echo -e "${CYAN}开始检查系统环境和依赖项...${NC}"
    echo
    
    # 系统基础检查
    echo -e "${BLUE}系统基础检查:${NC}"
    check_item "os" "check_os" "操作系统版本"
    check_item "cpu" "check_cpu" "CPU资源"
    check_item "memory" "check_memory" "内存资源"
    check_item "disk" "check_disk" "磁盘空间"
    check_item "ports" "check_ports" "端口占用"
    check_item "network" "check_network" "网络连接"
    echo
    
    # Docker环境检查
    echo -e "${BLUE}Docker环境检查:${NC}"
    check_item "docker" "check_docker" "Docker服务"
    check_item "docker_compose" "check_docker_compose" "Docker Compose"
    echo
}

# 显示检查结果
show_results() {
    echo -e "${WHITE}==================== 检查结果 ====================${NC}"
    echo -e "${GREEN}通过检查: $CHECKS_PASSED${NC}"
    echo -e "${RED}失败检查: $CHECKS_FAILED${NC}"
    echo -e "${YELLOW}警告信息: $WARNINGS${NC}"
    echo -e "${WHITE}=================================================${NC}"
    echo
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 环境检查全部通过，可以开始部署！${NC}"
        log "INFO" "环境检查完成: 通过 $CHECKS_PASSED, 失败 $CHECKS_FAILED, 警告 $WARNINGS"
        return 0
    else
        echo -e "${RED}❌ 环境检查发现问题，请修复后重试！${NC}"
        log "ERROR" "环境检查失败: 通过 $CHECKS_PASSED, 失败 $CHECKS_FAILED, 警告 $WARNINGS"
        return 1
    fi
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    log "INFO" "开始环境检查..."
    
    # 执行所有检查
    run_all_checks
    
    # 显示结果
    show_results
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
