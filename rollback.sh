#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 回滚脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 回滚到部署前状态或指定备份
# 使用: ./rollback.sh [OPTIONS]
# ============================================================================

set -euo pipefail

# ============================================================================
# 全局变量和配置
# ============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly PROJECT_ROOT="$(pwd)"
readonly LOG_FILE="/var/log/dongpaidi-deploy.log"
readonly BACKUP_ROOT="$PROJECT_ROOT/backups"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 参数
AUTO_MODE=false
BACKUP_DIR=""
FORCE=false

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [ROLLBACK] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
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

# 确认提示函数
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$FORCE" == "true" ]] || [[ "$AUTO_MODE" == "true" ]]; then
        log "INFO" "自动模式：跳过确认 - $message"
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

# ============================================================================
# 回滚函数
# ============================================================================

# 查找最新的预部署备份
find_latest_pre_deploy_backup() {
    local latest_backup=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "pre-deploy-*" -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
    
    if [[ -n "$latest_backup" ]] && [[ -d "$latest_backup" ]]; then
        echo "$latest_backup"
    else
        return 1
    fi
}

# 列出可用的备份
list_available_backups() {
    echo -e "${CYAN}可用的备份:${NC}"
    echo
    
    local backup_count=0
    
    # 列出预部署备份
    if find "$BACKUP_ROOT" -maxdepth 1 -type d -name "pre-deploy-*" -print0 2>/dev/null | grep -zq .; then
        echo -e "${YELLOW}预部署备份:${NC}"
        find "$BACKUP_ROOT" -maxdepth 1 -type d -name "pre-deploy-*" -printf '%T@ %p\n' | sort -nr | while read -r timestamp path; do
            local backup_name=$(basename "$path")
            local backup_date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
            local backup_size=$(du -sh "$path" 2>/dev/null | cut -f1)
            echo "  $backup_name ($backup_date, $backup_size)"
            ((backup_count++))
        done
        echo
    fi
    
    # 列出常规备份
    if find "$BACKUP_ROOT" -maxdepth 1 -type d -name "backup-*" -print0 2>/dev/null | grep -zq .; then
        echo -e "${YELLOW}常规备份:${NC}"
        find "$BACKUP_ROOT" -maxdepth 1 -type d -name "backup-*" -printf '%T@ %p\n' | sort -nr | head -10 | while read -r timestamp path; do
            local backup_name=$(basename "$path")
            local backup_date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
            local backup_size=$(du -sh "$path" 2>/dev/null | cut -f1)
            echo "  $backup_name ($backup_date, $backup_size)"
            ((backup_count++))
        done
    fi
    
    if [[ $backup_count -eq 0 ]]; then
        echo -e "${RED}未找到可用的备份${NC}"
        return 1
    fi
}

# 停止所有服务
stop_services() {
    log "INFO" "停止所有服务..."
    
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        if docker-compose down --remove-orphans; then
            log "SUCCESS" "服务停止成功"
        else
            log "WARN" "服务停止时出现警告"
        fi
    else
        log "WARN" "Docker Compose文件不存在，跳过服务停止"
    fi
    
    # 清理可能残留的容器
    local containers=$(docker ps -aq --filter "name=dongpaidi-")
    if [[ -n "$containers" ]]; then
        log "INFO" "清理残留容器..."
        docker rm -f $containers || true
    fi
}

# 恢复配置文件
restore_configs() {
    local backup_dir="$1"
    
    log "INFO" "恢复配置文件..."
    
    if [[ -d "$backup_dir/config" ]]; then
        # 备份当前配置
        local current_backup="$PROJECT_ROOT/.rollback-backup-$(date '+%Y%m%d-%H%M%S')"
        mkdir -p "$current_backup"
        
        local config_files=(
            "docker-compose.yml"
            ".env"
            "config/nginx.conf"
            "scripts/init-db.sql"
        )
        
        for config_file in "${config_files[@]}"; do
            if [[ -f "$PROJECT_ROOT/$config_file" ]]; then
                local dest_dir="$current_backup/$(dirname "$config_file")"
                mkdir -p "$dest_dir"
                cp "$PROJECT_ROOT/$config_file" "$dest_dir/"
            fi
        done
        
        log "INFO" "当前配置已备份到: $current_backup"
        
        # 恢复配置文件
        if cp -r "$backup_dir/config/"* "$PROJECT_ROOT/"; then
            log "SUCCESS" "配置文件恢复完成"
        else
            log "ERROR" "配置文件恢复失败"
            return 1
        fi
    else
        log "WARN" "备份中未找到配置文件"
    fi
}

# 恢复数据库
restore_database() {
    local backup_dir="$1"
    
    log "INFO" "恢复数据库..."
    
    # 启动数据库服务
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log "INFO" "启动数据库服务..."
        docker-compose up -d postgres redis
        
        # 等待数据库启动
        local wait_time=0
        local max_wait=60
        
        while [[ $wait_time -lt $max_wait ]]; do
            if docker exec dongpaidi-postgres pg_isready -U dongpaidi_user -d dongpaidi_prod >/dev/null 2>&1; then
                break
            fi
            sleep 5
            wait_time=$((wait_time + 5))
        done
        
        if [[ $wait_time -ge $max_wait ]]; then
            log "ERROR" "数据库启动超时"
            return 1
        fi
    fi
    
    # 恢复PostgreSQL
    local pg_backup=$(find "$backup_dir/database" -name "postgresql_*.sql" -type f | head -1)
    if [[ -n "$pg_backup" ]] && [[ -f "$pg_backup" ]]; then
        log "INFO" "恢复PostgreSQL数据库..."
        
        # 删除现有数据库并重新创建
        docker exec dongpaidi-postgres psql -U dongpaidi_user -d postgres -c "DROP DATABASE IF EXISTS dongpaidi_prod;"
        docker exec dongpaidi-postgres psql -U dongpaidi_user -d postgres -c "CREATE DATABASE dongpaidi_prod OWNER dongpaidi_user;"
        
        # 恢复数据
        if docker exec -i dongpaidi-postgres psql -U dongpaidi_user -d dongpaidi_prod < "$pg_backup"; then
            log "SUCCESS" "PostgreSQL数据库恢复完成"
        else
            log "ERROR" "PostgreSQL数据库恢复失败"
            return 1
        fi
    else
        log "WARN" "未找到PostgreSQL备份文件"
    fi
    
    # 恢复Redis
    local redis_backup=$(find "$backup_dir/database" -name "redis_dump_*.rdb" -type f | head -1)
    if [[ -n "$redis_backup" ]] && [[ -f "$redis_backup" ]]; then
        log "INFO" "恢复Redis数据..."
        
        # 停止Redis，复制备份文件，然后重启
        docker-compose stop redis
        docker cp "$redis_backup" dongpaidi-redis:/data/dump.rdb
        docker-compose start redis
        
        log "SUCCESS" "Redis数据恢复完成"
    else
        log "WARN" "未找到Redis备份文件"
    fi
}

# 恢复数据文件
restore_data_files() {
    local backup_dir="$1"
    
    log "INFO" "恢复数据文件..."
    
    # 恢复上传文件
    if [[ -d "$backup_dir/data/uploads" ]]; then
        if [[ -d "$PROJECT_ROOT/data/uploads" ]]; then
            rm -rf "$PROJECT_ROOT/data/uploads"
        fi
        
        if cp -r "$backup_dir/data/uploads" "$PROJECT_ROOT/data/"; then
            local file_count=$(find "$PROJECT_ROOT/data/uploads" -type f | wc -l)
            log "SUCCESS" "上传文件恢复完成 ($file_count 个文件)"
        else
            log "ERROR" "上传文件恢复失败"
        fi
    fi
    
    # 恢复SSL证书
    if [[ -d "$backup_dir/data/ssl" ]]; then
        if [[ -d "$PROJECT_ROOT/ssl" ]]; then
            rm -rf "$PROJECT_ROOT/ssl"
        fi
        
        if cp -r "$backup_dir/data/ssl" "$PROJECT_ROOT/"; then
            log "SUCCESS" "SSL证书恢复完成"
        else
            log "ERROR" "SSL证书恢复失败"
        fi
    fi
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 显示帮助信息
show_help() {
    cat << EOF
懂拍帝摄影平台回滚脚本

使用方法:
    $SCRIPT_NAME [OPTIONS]

选项:
    --auto              自动模式，使用最新的预部署备份
    --backup DIR        指定备份目录
    --force             强制执行，跳过确认提示
    --list              列出可用的备份
    --help              显示此帮助信息

示例:
    $SCRIPT_NAME --auto                     # 自动回滚到最新预部署备份
    $SCRIPT_NAME --backup backup-20240914   # 回滚到指定备份
    $SCRIPT_NAME --list                     # 列出可用备份

备份目录: $BACKUP_ROOT
日志文件: $LOG_FILE
EOF
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
                shift
                ;;
            --backup)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --list)
                list_available_backups
                exit 0
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

# 执行回滚
perform_rollback() {
    echo -e "${WHITE}==================== 系统回滚 ====================${NC}"
    echo -e "${CYAN}开始执行系统回滚...${NC}"
    echo
    
    # 确定备份目录
    local target_backup=""
    
    if [[ "$AUTO_MODE" == "true" ]]; then
        target_backup=$(find_latest_pre_deploy_backup)
        if [[ -z "$target_backup" ]]; then
            log "FATAL" "未找到预部署备份，无法自动回滚"
            exit 1
        fi
        log "INFO" "使用最新预部署备份: $(basename "$target_backup")"
    elif [[ -n "$BACKUP_DIR" ]]; then
        if [[ -d "$BACKUP_ROOT/$BACKUP_DIR" ]]; then
            target_backup="$BACKUP_ROOT/$BACKUP_DIR"
        elif [[ -d "$BACKUP_DIR" ]]; then
            target_backup="$BACKUP_DIR"
        else
            log "FATAL" "指定的备份目录不存在: $BACKUP_DIR"
            exit 1
        fi
        log "INFO" "使用指定备份: $(basename "$target_backup")"
    else
        log "FATAL" "请指定备份目录或使用 --auto 模式"
        exit 1
    fi
    
    # 显示回滚信息
    echo -e "${CYAN}回滚目标: $(basename "$target_backup")${NC}"
    echo -e "${CYAN}备份时间: $(stat -c %y "$target_backup" | cut -d. -f1)${NC}"
    echo -e "${CYAN}备份大小: $(du -sh "$target_backup" | cut -f1)${NC}"
    echo
    
    # 确认回滚
    if ! confirm "确定要执行回滚操作吗？此操作将覆盖当前数据" "n"; then
        log "INFO" "用户取消回滚操作"
        exit 0
    fi
    
    # 执行回滚步骤
    log "INFO" "开始回滚操作..."
    
    # 1. 停止服务
    stop_services
    
    # 2. 恢复配置文件
    restore_configs "$target_backup"
    
    # 3. 恢复数据库
    restore_database "$target_backup"
    
    # 4. 恢复数据文件
    restore_data_files "$target_backup"
    
    # 5. 重启服务
    log "INFO" "重启服务..."
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        if docker-compose up -d; then
            log "SUCCESS" "服务重启成功"
        else
            log "ERROR" "服务重启失败"
            return 1
        fi
    fi
    
    echo
    echo -e "${GREEN}🎉 回滚完成！${NC}"
    echo -e "${CYAN}回滚到备份: $(basename "$target_backup")${NC}"
    echo -e "${CYAN}完成时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo
    
    log "SUCCESS" "系统回滚完成: $(basename "$target_backup")"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    # 解析命令行参数
    parse_arguments "$@"
    
    log "INFO" "开始系统回滚..."
    
    # 检查备份目录是否存在
    if [[ ! -d "$BACKUP_ROOT" ]]; then
        log "FATAL" "备份目录不存在: $BACKUP_ROOT"
        exit 1
    fi
    
    # 执行回滚
    perform_rollback
    
    log "INFO" "系统回滚完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
