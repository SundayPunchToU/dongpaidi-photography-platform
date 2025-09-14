#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 健康检查脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 全面检查所有服务的健康状态和性能指标
# 使用: ./health-check.sh
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

# 健康检查配置
readonly TIMEOUT=10
readonly MAX_RESPONSE_TIME=2000  # 毫秒
readonly MIN_SUCCESS_RATE=95     # 百分比

# 检查结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [HEALTH-CHECK] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ((WARNING_CHECKS++))
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ((FAILED_CHECKS++))
            ;;
        "SUCCESS")
            echo -e "${GREEN}[✓]${NC} $message"
            ((PASSED_CHECKS++))
            ;;
        "FAIL")
            echo -e "${RED}[✗]${NC} $message"
            ((FAILED_CHECKS++))
            ;;
    esac
    ((TOTAL_CHECKS++))
}

# HTTP请求函数
make_http_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-$TIMEOUT}"
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}|%{time_total}" --max-time "$timeout" "$url" 2>/dev/null || echo "000|0")
    local end_time=$(date +%s%3N)
    
    local status_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    local response_time_ms=$(echo "($end_time - $start_time)" | bc)
    
    echo "$status_code|$response_time_ms"
}

# ============================================================================
# 容器健康检查函数
# ============================================================================

# 检查容器状态
check_container_status() {
    local container_name="$1"
    local service_name="$2"
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        local uptime=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2, $3, $4}')
        log "SUCCESS" "$service_name 容器运行正常 ($uptime)"
        return 0
    else
        log "FAIL" "$service_name 容器未运行或状态异常"
        return 1
    fi
}

# 检查容器资源使用
check_container_resources() {
    local container_name="$1"
    local service_name="$2"
    
    if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -q "$container_name"; then
        local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "$container_name")
        local cpu_usage=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
        local mem_usage=$(echo "$stats" | awk '{print $3}')
        
        # 检查CPU使用率
        if (( $(echo "$cpu_usage < 80" | bc -l) )); then
            log "SUCCESS" "$service_name CPU使用率正常: ${cpu_usage}%"
        else
            log "WARN" "$service_name CPU使用率较高: ${cpu_usage}%"
        fi
        
        log "INFO" "$service_name 内存使用: $mem_usage"
        return 0
    else
        log "FAIL" "$service_name 无法获取资源使用情况"
        return 1
    fi
}

# ============================================================================
# 服务健康检查函数
# ============================================================================

# 检查PostgreSQL
check_postgresql() {
    echo -e "${BLUE}检查PostgreSQL数据库:${NC}"
    
    # 检查容器状态
    check_container_status "dongpaidi-postgres" "PostgreSQL"
    
    # 检查数据库连接
    if docker exec dongpaidi-postgres pg_isready -U dongpaidi_user -d dongpaidi_prod >/dev/null 2>&1; then
        log "SUCCESS" "PostgreSQL数据库连接正常"
    else
        log "FAIL" "PostgreSQL数据库连接失败"
        return 1
    fi
    
    # 检查数据库版本
    local db_version=$(docker exec dongpaidi-postgres psql -U dongpaidi_user -d dongpaidi_prod -t -c "SELECT version();" | head -1 | xargs)
    log "INFO" "PostgreSQL版本: $db_version"
    
    # 检查表结构
    local table_count=$(docker exec dongpaidi-postgres psql -U dongpaidi_user -d dongpaidi_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    if [[ "$table_count" -gt 0 ]]; then
        log "SUCCESS" "数据库表结构正常 (共 $table_count 个表)"
    else
        log "WARN" "数据库表结构可能未初始化"
    fi
    
    # 检查资源使用
    check_container_resources "dongpaidi-postgres" "PostgreSQL"
    
    echo
}

# 检查Redis
check_redis() {
    echo -e "${BLUE}检查Redis缓存:${NC}"
    
    # 检查容器状态
    check_container_status "dongpaidi-redis" "Redis"
    
    # 检查Redis连接
    if docker exec dongpaidi-redis redis-cli -a redis_password_2024 ping >/dev/null 2>&1; then
        log "SUCCESS" "Redis连接正常"
    else
        log "FAIL" "Redis连接失败"
        return 1
    fi
    
    # 检查Redis信息
    local redis_info=$(docker exec dongpaidi-redis redis-cli -a redis_password_2024 info server | grep redis_version | cut -d: -f2 | tr -d '\r')
    log "INFO" "Redis版本: $redis_info"
    
    # 检查内存使用
    local memory_info=$(docker exec dongpaidi-redis redis-cli -a redis_password_2024 info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    log "INFO" "Redis内存使用: $memory_info"
    
    # 检查资源使用
    check_container_resources "dongpaidi-redis" "Redis"
    
    echo
}

# 检查后端API
check_backend_api() {
    echo -e "${BLUE}检查后端API服务:${NC}"
    
    # 检查容器状态
    check_container_status "dongpaidi-backend" "Backend API"
    
    # 检查健康检查端点
    local health_result=$(make_http_request "http://localhost:3000/api/v1/health" 200 10)
    local status_code=$(echo "$health_result" | cut -d'|' -f1)
    local response_time=$(echo "$health_result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "200" ]]; then
        log "SUCCESS" "API健康检查端点正常 (响应时间: ${response_time}ms)"
    else
        log "FAIL" "API健康检查端点异常 (状态码: $status_code)"
        return 1
    fi
    
    # 检查API端点
    local api_endpoints=("/api/v1" "/api/v1/users" "/api/v1/works" "/api/v1/appointments")
    
    for endpoint in "${api_endpoints[@]}"; do
        local result=$(make_http_request "http://localhost:3000$endpoint" 200 5)
        local status=$(echo "$result" | cut -d'|' -f1)
        local time=$(echo "$result" | cut -d'|' -f2)
        
        if [[ "$status" == "200" ]]; then
            log "SUCCESS" "API端点 $endpoint 正常 (${time}ms)"
        else
            log "WARN" "API端点 $endpoint 异常 (状态码: $status)"
        fi
    done
    
    # 检查资源使用
    check_container_resources "dongpaidi-backend" "Backend API"
    
    echo
}

# 检查Nginx
check_nginx() {
    echo -e "${BLUE}检查Nginx反向代理:${NC}"
    
    # 检查容器状态
    check_container_status "dongpaidi-nginx" "Nginx"
    
    # 检查Nginx健康端点
    local nginx_result=$(make_http_request "http://localhost:80/health" 200 5)
    local status_code=$(echo "$nginx_result" | cut -d'|' -f1)
    local response_time=$(echo "$nginx_result" | cut -d'|' -f2)
    
    if [[ "$status_code" == "200" ]]; then
        log "SUCCESS" "Nginx健康检查正常 (响应时间: ${response_time}ms)"
    else
        log "FAIL" "Nginx健康检查异常 (状态码: $status_code)"
        return 1
    fi
    
    # 检查API代理
    local proxy_result=$(make_http_request "http://localhost:80/api/v1/health" 200 10)
    local proxy_status=$(echo "$proxy_result" | cut -d'|' -f1)
    local proxy_time=$(echo "$proxy_result" | cut -d'|' -f2)
    
    if [[ "$proxy_status" == "200" ]]; then
        log "SUCCESS" "Nginx API代理正常 (响应时间: ${proxy_time}ms)"
    else
        log "FAIL" "Nginx API代理异常 (状态码: $proxy_status)"
    fi
    
    # 检查资源使用
    check_container_resources "dongpaidi-nginx" "Nginx"
    
    echo
}

# ============================================================================
# 系统健康检查函数
# ============================================================================

# 检查系统资源
check_system_resources() {
    echo -e "${BLUE}检查系统资源:${NC}"
    
    # 检查CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage < 80" | bc -l) )); then
        log "SUCCESS" "系统CPU使用率正常: ${cpu_usage}%"
    else
        log "WARN" "系统CPU使用率较高: ${cpu_usage}%"
    fi
    
    # 检查内存使用
    local mem_info=$(free -h | grep Mem)
    local total_mem=$(echo "$mem_info" | awk '{print $2}')
    local used_mem=$(echo "$mem_info" | awk '{print $3}')
    local available_mem=$(echo "$mem_info" | awk '{print $7}')
    
    log "INFO" "系统内存: 总计 $total_mem, 已用 $used_mem, 可用 $available_mem"
    
    # 检查磁盘空间
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        log "SUCCESS" "磁盘空间使用正常: ${disk_usage}%"
    else
        log "WARN" "磁盘空间使用较高: ${disk_usage}%"
    fi
    
    echo
}

# 检查网络连接
check_network_connectivity() {
    echo -e "${BLUE}检查网络连接:${NC}"
    
    # 检查外网连接
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log "SUCCESS" "外网连接正常"
    else
        log "WARN" "外网连接异常"
    fi
    
    # 检查DNS解析
    if nslookup google.com >/dev/null 2>&1; then
        log "SUCCESS" "DNS解析正常"
    else
        log "WARN" "DNS解析异常"
    fi
    
    echo
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 执行完整健康检查
run_full_health_check() {
    echo -e "${WHITE}==================== 健康检查 ====================${NC}"
    echo -e "${CYAN}开始执行全面健康检查...${NC}"
    echo
    
    # 重置计数器
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    WARNING_CHECKS=0
    
    # 检查系统资源
    check_system_resources
    
    # 检查网络连接
    check_network_connectivity
    
    # 检查各个服务
    check_postgresql
    check_redis
    check_backend_api
    check_nginx
}

# 显示健康检查结果
show_health_summary() {
    echo -e "${WHITE}==================== 检查结果 ====================${NC}"
    echo -e "${GREEN}通过检查: $PASSED_CHECKS${NC}"
    echo -e "${RED}失败检查: $FAILED_CHECKS${NC}"
    echo -e "${YELLOW}警告信息: $WARNING_CHECKS${NC}"
    echo -e "${CYAN}总计检查: $TOTAL_CHECKS${NC}"
    echo
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "${CYAN}成功率: ${success_rate}%${NC}"
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "${GREEN}🎉 所有关键服务运行正常！${NC}"
        log "INFO" "健康检查完成: 成功率 ${success_rate}%"
        return 0
    else
        echo -e "${RED}❌ 发现 $FAILED_CHECKS 个严重问题，请及时处理！${NC}"
        log "ERROR" "健康检查发现问题: 失败 $FAILED_CHECKS, 警告 $WARNING_CHECKS"
        return 1
    fi
    
    echo -e "${WHITE}=================================================${NC}"
    echo
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    log "INFO" "开始健康检查..."
    
    # 执行健康检查
    run_full_health_check
    
    # 显示结果摘要
    show_health_summary
    
    log "INFO" "健康检查完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
