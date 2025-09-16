#!/bin/bash

# 懂拍帝摄影平台 - 安全配置检查脚本
# 用于检查环境变量配置的安全性

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

# 检查.env文件是否存在
check_env_file_exists() {
    log "INFO" "检查环境变量文件..."
    
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log "ERROR" ".env文件不存在"
        log "INFO" "请复制.env.example文件为.env并填入正确的配置"
        return 1
    fi
    
    log "SUCCESS" ".env文件存在"
    return 0
}

# 检查必需的环境变量
check_required_env_vars() {
    log "INFO" "检查必需的环境变量..."
    
    # 加载环境变量
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    fi
    
    local required_vars=(
        "NODE_ENV"
        "PORT"
        "DATABASE_URL"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "ENCRYPTION_KEY"
        "ADMIN_PASSWORD"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "缺少必需的环境变量："
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    log "SUCCESS" "所有必需的环境变量都已设置"
    return 0
}

# 检查密钥安全性
check_secret_security() {
    log "INFO" "检查密钥安全性..."
    
    local issues=()
    
    # 检查JWT_SECRET长度
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        issues+=("JWT_SECRET长度不足32字符（当前：${#JWT_SECRET}字符）")
    fi
    
    # 检查JWT_REFRESH_SECRET长度
    if [[ ${#JWT_REFRESH_SECRET} -lt 32 ]]; then
        issues+=("JWT_REFRESH_SECRET长度不足32字符（当前：${#JWT_REFRESH_SECRET}字符）")
    fi
    
    # 检查ENCRYPTION_KEY长度
    if [[ ${#ENCRYPTION_KEY} -ne 32 ]]; then
        issues+=("ENCRYPTION_KEY必须是32字符（当前：${#ENCRYPTION_KEY}字符）")
    fi
    
    # 检查是否使用默认值
    local default_secrets=(
        "YOUR_SUPER_SECURE_JWT_SECRET_AT_LEAST_32_CHARACTERS_LONG"
        "YOUR_SUPER_SECURE_REFRESH_SECRET_AT_LEAST_32_CHARACTERS_LONG"
        "YOUR_32_CHARACTER_ENCRYPTION_KEY"
        "your_jwt_secret_key_2024_dongpaidi_very_secure"
        "CHANGE_THIS_JWT_SECRET_TO_SECURE_RANDOM_STRING_AT_LEAST_32_CHARS"
        "CHANGE_THIS_REFRESH_SECRET_TO_SECURE_RANDOM_STRING_AT_LEAST_32_CHARS"
        "CHANGE_THIS_32_CHAR_ENCRYPTION_KEY"
    )
    
    for default_secret in "${default_secrets[@]}"; do
        if [[ "$JWT_SECRET" == "$default_secret" ]] || [[ "$JWT_REFRESH_SECRET" == "$default_secret" ]] || [[ "$ENCRYPTION_KEY" == "$default_secret" ]]; then
            issues+=("检测到使用默认密钥值，存在安全风险")
            break
        fi
    done
    
    # 检查管理员密码
    if [[ "$ADMIN_PASSWORD" == "admin123456" ]] || [[ "$ADMIN_PASSWORD" == "CHANGE_THIS_ADMIN_PASSWORD" ]]; then
        issues+=("管理员密码使用默认值，存在安全风险")
    fi
    
    if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
        issues+=("管理员密码长度不足8字符")
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        log "ERROR" "发现安全问题："
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        return 1
    fi
    
    log "SUCCESS" "密钥安全性检查通过"
    return 0
}

# 检查数据库配置安全性
check_database_security() {
    log "INFO" "检查数据库配置安全性..."
    
    local issues=()
    
    # 检查数据库密码
    if [[ "$DATABASE_URL" == *"dongpaidi_password_2024"* ]] || [[ "$DATABASE_URL" == *"CHANGE_THIS_DATABASE_PASSWORD"* ]]; then
        issues+=("数据库使用默认密码，存在安全风险")
    fi
    
    # 检查Redis密码
    if [[ "$REDIS_PASSWORD" == "redis_password_2024" ]] || [[ "$REDIS_PASSWORD" == "CHANGE_THIS_REDIS_PASSWORD" ]]; then
        issues+=("Redis使用默认密码，存在安全风险")
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        log "ERROR" "发现数据库安全问题："
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        return 1
    fi
    
    log "SUCCESS" "数据库配置安全性检查通过"
    return 0
}

# 检查CORS配置
check_cors_security() {
    log "INFO" "检查CORS配置安全性..."
    
    if [[ "$CORS_ORIGIN" == "*" ]]; then
        log "WARN" "CORS配置允许所有域名访问，生产环境建议设置具体域名"
        return 0
    fi
    
    log "SUCCESS" "CORS配置安全性检查通过"
    return 0
}

# 生成安全密钥建议
generate_secure_keys() {
    log "INFO" "生成安全密钥建议..."
    
    echo ""
    echo "🔑 建议使用以下安全密钥："
    echo ""
    echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
    echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
    echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")"
    echo ""
    echo "或者使用后端提供的密钥生成工具："
    echo "cd dongpaidi-backend && npm run generate-keys"
    echo ""
}

# 主函数
main() {
    echo "🔒 懂拍帝摄影平台 - 安全配置检查"
    echo "=================================="
    echo ""
    
    local exit_code=0
    
    # 执行各项检查
    check_env_file_exists || exit_code=1
    check_required_env_vars || exit_code=1
    check_secret_security || exit_code=1
    check_database_security || exit_code=1
    check_cors_security || exit_code=1
    
    echo ""
    
    if [[ $exit_code -eq 0 ]]; then
        log "SUCCESS" "所有安全检查通过！"
    else
        log "ERROR" "发现安全问题，请修复后重新检查"
        generate_secure_keys
    fi
    
    echo ""
    echo "=================================="
    
    exit $exit_code
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
