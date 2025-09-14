#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 备份脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 数据库和配置文件备份
# 使用: ./backup.sh [OPTIONS]
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

# 备份配置
readonly DB_NAME="dongpaidi_prod"
readonly DB_USER="dongpaidi_user"
readonly DB_PASSWORD="dongpaidi_password_2024"
readonly REDIS_PASSWORD="redis_password_2024"
readonly MAX_BACKUPS=10  # 保留最近10个备份

# 参数
BACKUP_TYPE="full"
PRE_DEPLOY=false

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [BACKUP] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
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
    esac
}

# 创建备份目录
create_backup_directory() {
    local backup_timestamp=$(date '+%Y%m%d-%H%M%S')
    local backup_dir="$BACKUP_ROOT"
    
    if [[ "$PRE_DEPLOY" == "true" ]]; then
        backup_dir="$BACKUP_ROOT/pre-deploy-$backup_timestamp"
    else
        backup_dir="$BACKUP_ROOT/backup-$backup_timestamp"
    fi
    
    mkdir -p "$backup_dir"/{database,config,data,logs}
    echo "$backup_dir"
}

# ============================================================================
# 备份函数
# ============================================================================

# 备份PostgreSQL数据库
backup_postgresql() {
    local backup_dir="$1"
    
    log "INFO" "备份PostgreSQL数据库..."
    
    if docker ps | grep -q dongpaidi-postgres; then
        local dump_file="$backup_dir/database/postgresql_${DB_NAME}_$(date '+%Y%m%d_%H%M%S').sql"
        
        if docker exec dongpaidi-postgres pg_dump -U "$DB_USER" -d "$DB_NAME" > "$dump_file"; then
            local file_size=$(du -h "$dump_file" | cut -f1)
            log "SUCCESS" "PostgreSQL备份完成: $dump_file ($file_size)"
        else
            log "ERROR" "PostgreSQL备份失败"
            return 1
        fi
    else
        log "WARN" "PostgreSQL容器未运行，跳过数据库备份"
    fi
}

# 备份Redis数据
backup_redis() {
    local backup_dir="$1"
    
    log "INFO" "备份Redis数据..."
    
    if docker ps | grep -q dongpaidi-redis; then
        # 触发Redis保存
        docker exec dongpaidi-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE >/dev/null 2>&1 || true
        
        # 等待保存完成
        sleep 5
        
        # 复制RDB文件
        local rdb_file="$backup_dir/database/redis_dump_$(date '+%Y%m%d_%H%M%S').rdb"
        if docker cp dongpaidi-redis:/data/dump.rdb "$rdb_file" 2>/dev/null; then
            local file_size=$(du -h "$rdb_file" | cut -f1)
            log "SUCCESS" "Redis备份完成: $rdb_file ($file_size)"
        else
            log "WARN" "Redis备份失败或无数据"
        fi
    else
        log "WARN" "Redis容器未运行，跳过Redis备份"
    fi
}

# 备份配置文件
backup_configs() {
    local backup_dir="$1"
    
    log "INFO" "备份配置文件..."
    
    local config_files=(
        "docker-compose.yml"
        ".env"
        "config/nginx.conf"
        "scripts/init-db.sql"
    )
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$config_file" ]]; then
            local dest_dir="$backup_dir/config/$(dirname "$config_file")"
            mkdir -p "$dest_dir"
            
            if cp "$PROJECT_ROOT/$config_file" "$dest_dir/"; then
                log "SUCCESS" "配置文件备份: $config_file"
            else
                log "ERROR" "配置文件备份失败: $config_file"
            fi
        fi
    done
}

# 备份数据文件
backup_data_files() {
    local backup_dir="$1"
    
    log "INFO" "备份数据文件..."
    
    # 备份上传文件
    if [[ -d "$PROJECT_ROOT/data/uploads" ]]; then
        if cp -r "$PROJECT_ROOT/data/uploads" "$backup_dir/data/"; then
            local file_count=$(find "$backup_dir/data/uploads" -type f | wc -l)
            log "SUCCESS" "上传文件备份完成 ($file_count 个文件)"
        else
            log "ERROR" "上传文件备份失败"
        fi
    fi
    
    # 备份SSL证书
    if [[ -d "$PROJECT_ROOT/ssl" ]] && [[ -n "$(ls -A "$PROJECT_ROOT/ssl" 2>/dev/null)" ]]; then
        if cp -r "$PROJECT_ROOT/ssl" "$backup_dir/data/"; then
            log "SUCCESS" "SSL证书备份完成"
        else
            log "ERROR" "SSL证书备份失败"
        fi
    fi
}

# 备份日志文件
backup_logs() {
    local backup_dir="$1"
    
    log "INFO" "备份日志文件..."
    
    # 备份应用日志
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        if cp -r "$PROJECT_ROOT/logs" "$backup_dir/"; then
            local log_count=$(find "$backup_dir/logs" -name "*.log" | wc -l)
            log "SUCCESS" "应用日志备份完成 ($log_count 个日志文件)"
        else
            log "ERROR" "应用日志备份失败"
        fi
    fi
    
    # 备份系统部署日志
    if [[ -f "$LOG_FILE" ]]; then
        if cp "$LOG_FILE" "$backup_dir/logs/"; then
            log "SUCCESS" "系统日志备份完成"
        else
            log "ERROR" "系统日志备份失败"
        fi
    fi
}

# 创建备份清单
create_backup_manifest() {
    local backup_dir="$1"
    local manifest_file="$backup_dir/backup_manifest.txt"
    
    cat > "$manifest_file" << EOF
懂拍帝摄影平台备份清单
========================

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份类型: $BACKUP_TYPE
备份目录: $backup_dir
服务器: $(hostname) ($(hostname -I | awk '{print $1}'))

文件清单:
$(find "$backup_dir" -type f -exec ls -lh {} \; | awk '{print $9, $5}')

目录结构:
$(tree "$backup_dir" 2>/dev/null || find "$backup_dir" -type d)

备份完成时间: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log "SUCCESS" "备份清单创建完成: $manifest_file"
}

# 清理旧备份
cleanup_old_backups() {
    log "INFO" "清理旧备份文件..."
    
    local backup_count=$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "backup-*" | wc -l)
    
    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        local excess_count=$((backup_count - MAX_BACKUPS))
        
        # 删除最旧的备份
        find "$BACKUP_ROOT" -maxdepth 1 -type d -name "backup-*" -printf '%T@ %p\n' | \
        sort -n | head -n "$excess_count" | cut -d' ' -f2- | \
        while read -r old_backup; do
            if rm -rf "$old_backup"; then
                log "INFO" "删除旧备份: $(basename "$old_backup")"
            else
                log "ERROR" "删除旧备份失败: $(basename "$old_backup")"
            fi
        done
        
        log "SUCCESS" "清理了 $excess_count 个旧备份"
    else
        log "INFO" "备份数量正常 ($backup_count/$MAX_BACKUPS)，无需清理"
    fi
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 显示帮助信息
show_help() {
    cat << EOF
懂拍帝摄影平台备份脚本

使用方法:
    $SCRIPT_NAME [OPTIONS]

选项:
    --type TYPE         备份类型 (full|database|config|data)
    --pre-deploy        部署前备份
    --help              显示此帮助信息

备份类型:
    full                完整备份 (默认)
    database            仅备份数据库
    config              仅备份配置文件
    data                仅备份数据文件

示例:
    $SCRIPT_NAME                    # 完整备份
    $SCRIPT_NAME --type database    # 仅备份数据库
    $SCRIPT_NAME --pre-deploy       # 部署前备份

备份目录: $BACKUP_ROOT
日志文件: $LOG_FILE
EOF
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --pre-deploy)
                PRE_DEPLOY=true
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

# 执行备份
perform_backup() {
    echo -e "${WHITE}==================== 数据备份 ====================${NC}"
    echo -e "${CYAN}开始执行数据备份...${NC}"
    echo -e "${CYAN}备份类型: $BACKUP_TYPE${NC}"
    echo
    
    # 创建备份目录
    local backup_dir=$(create_backup_directory)
    log "INFO" "备份目录: $backup_dir"
    
    # 根据备份类型执行相应的备份
    case "$BACKUP_TYPE" in
        "full")
            backup_postgresql "$backup_dir"
            backup_redis "$backup_dir"
            backup_configs "$backup_dir"
            backup_data_files "$backup_dir"
            backup_logs "$backup_dir"
            ;;
        "database")
            backup_postgresql "$backup_dir"
            backup_redis "$backup_dir"
            ;;
        "config")
            backup_configs "$backup_dir"
            ;;
        "data")
            backup_data_files "$backup_dir"
            ;;
        *)
            log "ERROR" "不支持的备份类型: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # 创建备份清单
    create_backup_manifest "$backup_dir"
    
    # 清理旧备份
    if [[ "$PRE_DEPLOY" == "false" ]]; then
        cleanup_old_backups
    fi
    
    # 显示备份结果
    local backup_size=$(du -sh "$backup_dir" | cut -f1)
    echo
    echo -e "${GREEN}🎉 备份完成！${NC}"
    echo -e "${CYAN}备份目录: $backup_dir${NC}"
    echo -e "${CYAN}备份大小: $backup_size${NC}"
    echo -e "${CYAN}备份时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo
    
    log "SUCCESS" "备份完成: $backup_dir ($backup_size)"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    # 解析命令行参数
    parse_arguments "$@"
    
    log "INFO" "开始数据备份..."
    
    # 创建备份根目录
    mkdir -p "$BACKUP_ROOT"
    
    # 执行备份
    perform_backup
    
    log "INFO" "数据备份完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
