#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 数据库初始化脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 初始化PostgreSQL和Redis数据库
# 使用: ./init-database.sh
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

# 数据库配置 - 从环境变量读取
readonly DB_NAME="${POSTGRES_DB:-dongpaidi_prod}"
readonly DB_USER="${POSTGRES_USER:-dongpaidi_user}"
readonly DB_PASSWORD="${POSTGRES_PASSWORD:-PLEASE_SET_POSTGRES_PASSWORD}"
readonly REDIS_PASSWORD="${REDIS_PASSWORD:-PLEASE_SET_REDIS_PASSWORD}"

# 等待时间配置
readonly MAX_WAIT_TIME=300  # 5分钟
readonly CHECK_INTERVAL=5   # 5秒

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [DB-INIT] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
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

# 等待服务启动
wait_for_service() {
    local service_name="$1"
    local check_command="$2"
    local wait_time=0
    
    log "INFO" "等待 $service_name 服务启动..."
    
    while [[ $wait_time -lt $MAX_WAIT_TIME ]]; do
        if eval "$check_command" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name 服务已启动"
            return 0
        fi
        
        echo -n "."
        sleep $CHECK_INTERVAL
        wait_time=$((wait_time + CHECK_INTERVAL))
    done
    
    echo
    log "ERROR" "$service_name 服务启动超时"
    return 1
}

# ============================================================================
# 数据库初始化函数
# ============================================================================

# 创建数据库初始化SQL脚本
create_init_sql() {
    log "INFO" "创建数据库初始化脚本..."
    
    mkdir -p "$PROJECT_ROOT/scripts"
    
    cat > "$PROJECT_ROOT/scripts/init-db.sql" << 'EOF'
-- 懂拍帝摄影平台数据库初始化脚本
-- 创建时间: 2024-09-14

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 多平台用户标识
    openid VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    platform VARCHAR(20) DEFAULT 'wechat',
    
    -- 基本信息
    nickname VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    gender VARCHAR(10),
    birth_date DATE,
    location VARCHAR(100),
    
    -- 角色信息
    is_photographer BOOLEAN DEFAULT FALSE,
    is_model BOOLEAN DEFAULT FALSE,
    photographer_level VARCHAR(20),
    model_experience VARCHAR(20),
    
    -- 联系方式
    contact_wechat VARCHAR(100),
    contact_phone VARCHAR(20),
    
    -- 统计信息
    following_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    works_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    
    -- 认证和状态
    is_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    
    -- 时间戳
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作品表
CREATE TABLE IF NOT EXISTS works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    images TEXT DEFAULT '[]',
    cover_image TEXT,
    tags TEXT DEFAULT '[]',
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    
    shooting_date TIMESTAMP WITH TIME ZONE,
    shooting_info TEXT DEFAULT '{}',
    
    -- 付费相关
    price DECIMAL(10,2),
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- 统计信息
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE
);

-- 创建约拍表
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    
    scheduled_date TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- 分钟
    price DECIMAL(10,2),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'open',
    
    -- 要求
    requirements TEXT DEFAULT '{}',
    
    -- 联系信息
    contact_info TEXT DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);

CREATE INDEX IF NOT EXISTS idx_appointments_photographer_id ON appointments(photographer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);

-- 插入测试数据
INSERT INTO users (nickname, platform, is_photographer) VALUES 
('摄影师小王', 'wechat', TRUE),
('模特小李', 'phone', FALSE),
('摄影爱好者', 'wechat', TRUE)
ON CONFLICT DO NOTHING;

-- 创建管理员用户
INSERT INTO users (nickname, email, platform, is_verified, status) VALUES 
('系统管理员', 'admin@dongpaidi.com', 'web', TRUE, 'active')
ON CONFLICT DO NOTHING;

-- 输出初始化完成信息
SELECT 'Database initialization completed successfully!' as message;
EOF

    if [[ -f "$PROJECT_ROOT/scripts/init-db.sql" ]]; then
        log "SUCCESS" "数据库初始化脚本创建成功"
    else
        log "ERROR" "数据库初始化脚本创建失败"
        return 1
    fi
}

# 启动数据库服务
start_database_services() {
    log "INFO" "启动数据库服务..."
    
    # 启动PostgreSQL和Redis
    if docker-compose up -d postgres redis; then
        log "SUCCESS" "数据库服务启动命令执行成功"
    else
        log "ERROR" "数据库服务启动失败"
        return 1
    fi
}

# 等待PostgreSQL启动
wait_for_postgres() {
    local check_cmd="docker exec dongpaidi-postgres pg_isready -U $DB_USER -d $DB_NAME"
    wait_for_service "PostgreSQL" "$check_cmd"
}

# 等待Redis启动
wait_for_redis() {
    local check_cmd="docker exec dongpaidi-redis redis-cli -a $REDIS_PASSWORD ping"
    wait_for_service "Redis" "$check_cmd"
}

# 执行数据库迁移
run_database_migration() {
    log "INFO" "执行数据库迁移..."
    
    # 检查初始化脚本是否已执行
    local check_query="SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users';"
    local table_count=$(docker exec dongpaidi-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "$check_query" | tr -d ' ')
    
    if [[ "$table_count" -gt 0 ]]; then
        log "INFO" "数据库表已存在，跳过初始化"
    else
        log "INFO" "执行数据库初始化..."
        if docker exec dongpaidi-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/init-db.sql; then
            log "SUCCESS" "数据库初始化完成"
        else
            log "ERROR" "数据库初始化失败"
            return 1
        fi
    fi
}

# 测试数据库连接
test_database_connections() {
    log "INFO" "测试数据库连接..."
    
    # 测试PostgreSQL连接
    if docker exec dongpaidi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >/dev/null 2>&1; then
        log "SUCCESS" "PostgreSQL连接测试成功"
    else
        log "ERROR" "PostgreSQL连接测试失败"
        return 1
    fi
    
    # 测试Redis连接
    if docker exec dongpaidi-redis redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
        log "SUCCESS" "Redis连接测试成功"
    else
        log "ERROR" "Redis连接测试失败"
        return 1
    fi
}

# 显示数据库信息
show_database_info() {
    echo
    echo -e "${WHITE}==================== 数据库信息 ====================${NC}"
    echo -e "${CYAN}PostgreSQL:${NC}"
    echo -e "  容器名称: dongpaidi-postgres"
    echo -e "  数据库名: $DB_NAME"
    echo -e "  用户名: $DB_USER"
    echo -e "  端口: 5432"
    echo -e "  连接字符串: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    echo
    echo -e "${CYAN}Redis:${NC}"
    echo -e "  容器名称: dongpaidi-redis"
    echo -e "  端口: 6379"
    echo -e "  密码: $REDIS_PASSWORD"
    echo -e "  连接字符串: redis://:$REDIS_PASSWORD@localhost:6379"
    echo -e "${WHITE}=================================================${NC}"
    echo
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 执行数据库初始化
initialize_databases() {
    echo -e "${WHITE}==================== 数据库初始化 ====================${NC}"
    echo -e "${CYAN}开始初始化数据库...${NC}"
    echo
    
    # 创建初始化脚本
    create_init_sql
    
    # 启动数据库服务
    start_database_services
    
    # 等待服务启动
    wait_for_postgres
    wait_for_redis
    
    # 执行数据库迁移
    run_database_migration
    
    # 测试连接
    test_database_connections
    
    # 显示数据库信息
    show_database_info
    
    log "SUCCESS" "数据库初始化完成"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    log "INFO" "开始数据库初始化..."
    
    # 检查Docker Compose文件是否存在
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log "ERROR" "Docker Compose文件不存在，请先运行setup-docker.sh"
        return 1
    fi
    
    # 执行数据库初始化
    initialize_databases
    
    log "INFO" "数据库初始化完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
