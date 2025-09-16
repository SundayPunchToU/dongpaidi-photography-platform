#!/bin/bash

# 懂拍帝摄影平台 - 安全密钥生成脚本
# 用于生成安全的随机密钥

set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# 项目根目录
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
    esac
}

# 检查依赖
check_dependencies() {
    local deps=("openssl" "node")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "缺少必需的依赖："
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        log "INFO" "请安装缺少的依赖后重试"
        exit 1
    fi
}

# 生成JWT密钥
generate_jwt_secret() {
    if command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    else
        openssl rand -hex 64
    fi
}

# 生成加密密钥
generate_encryption_key() {
    if command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
    else
        openssl rand -hex 16
    fi
}

# 生成数据库密码
generate_db_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-20
}

# 生成Redis密码
generate_redis_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-20
}

# 生成管理员密码
generate_admin_password() {
    openssl rand -base64 16 | tr -d "=+/" | cut -c1-12
}

# 生成API密钥
generate_api_key() {
    echo "dpd_$(openssl rand -hex 16)"
}

# 显示生成的密钥
display_keys() {
    local jwt_secret=$(generate_jwt_secret)
    local jwt_refresh_secret=$(generate_jwt_secret)
    local encryption_key=$(generate_encryption_key)
    local db_password=$(generate_db_password)
    local redis_password=$(generate_redis_password)
    local admin_password=$(generate_admin_password)
    local api_key=$(generate_api_key)
    
    echo ""
    echo "🔑 生成的安全密钥："
    echo "=================================="
    echo ""
    echo "# JWT配置"
    echo "JWT_SECRET=${jwt_secret}"
    echo "JWT_REFRESH_SECRET=${jwt_refresh_secret}"
    echo ""
    echo "# 加密配置"
    echo "ENCRYPTION_KEY=${encryption_key}"
    echo ""
    echo "# 数据库配置"
    echo "POSTGRES_PASSWORD=${db_password}"
    echo "DATABASE_URL=postgresql://dongpaidi_user:${db_password}@postgres:5432/dongpaidi_prod"
    echo ""
    echo "# Redis配置"
    echo "REDIS_PASSWORD=${redis_password}"
    echo "REDIS_URL=redis://:${redis_password}@redis:6379"
    echo ""
    echo "# 管理员配置"
    echo "ADMIN_PASSWORD=${admin_password}"
    echo ""
    echo "# API密钥（可选）"
    echo "API_KEY=${api_key}"
    echo ""
    echo "=================================="
    echo ""
    echo "⚠️  请妥善保管这些密钥，不要泄露给他人！"
    echo "💡 建议将这些密钥复制到您的.env文件中"
    echo ""
}

# 更新.env文件
update_env_file() {
    local env_file="$PROJECT_ROOT/.env"
    
    if [[ ! -f "$env_file" ]]; then
        log "WARN" ".env文件不存在，请先创建.env文件"
        return 1
    fi
    
    # 创建备份
    cp "$env_file" "${env_file}.backup.$(date +%Y%m%d_%H%M%S)"
    log "INFO" "已创建.env文件备份"
    
    # 生成新密钥
    local jwt_secret=$(generate_jwt_secret)
    local jwt_refresh_secret=$(generate_jwt_secret)
    local encryption_key=$(generate_encryption_key)
    local db_password=$(generate_db_password)
    local redis_password=$(generate_redis_password)
    local admin_password=$(generate_admin_password)
    
    # 更新环境变量
    sed -i.tmp "s/JWT_SECRET=.*/JWT_SECRET=${jwt_secret}/" "$env_file"
    sed -i.tmp "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${jwt_refresh_secret}/" "$env_file"
    sed -i.tmp "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${encryption_key}/" "$env_file"
    sed -i.tmp "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${db_password}/" "$env_file"
    sed -i.tmp "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${redis_password}/" "$env_file"
    sed -i.tmp "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=${admin_password}/" "$env_file"
    
    # 更新DATABASE_URL和REDIS_URL
    sed -i.tmp "s|DATABASE_URL=.*|DATABASE_URL=postgresql://dongpaidi_user:${db_password}@postgres:5432/dongpaidi_prod|" "$env_file"
    sed -i.tmp "s|REDIS_URL=.*|REDIS_URL=redis://:${redis_password}@redis:6379|" "$env_file"
    
    # 清理临时文件
    rm -f "${env_file}.tmp"
    
    log "SUCCESS" ".env文件已更新为新的安全密钥"
    log "WARN" "新的管理员密码: ${admin_password}"
    log "INFO" "建议运行 ./scripts/security-check.sh 验证配置"
}

# 主函数
main() {
    echo "🔑 懂拍帝摄影平台 - 安全密钥生成工具"
    echo "====================================="
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 解析命令行参数
    local update_env=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --update-env)
                update_env=true
                shift
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --update-env    直接更新.env文件中的密钥"
                echo "  --help, -h      显示此帮助信息"
                echo ""
                exit 0
                ;;
            *)
                log "ERROR" "未知选项: $1"
                echo "使用 --help 查看帮助信息"
                exit 1
                ;;
        esac
    done
    
    if [[ "$update_env" == true ]]; then
        update_env_file
    else
        display_keys
    fi
    
    echo ""
    echo "====================================="
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
