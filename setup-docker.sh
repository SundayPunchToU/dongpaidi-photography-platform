#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - Docker设置脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 配置Docker环境，创建配置文件和网络
# 使用: ./setup-docker.sh
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

# Docker配置
readonly NETWORK_NAME="dongpaidi-network"
readonly COMPOSE_FILE="docker-compose.yml"

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [DOCKER-SETUP] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
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

# ============================================================================
# Docker配置函数
# ============================================================================

# 创建Docker网络
create_docker_network() {
    log "INFO" "创建Docker网络: $NETWORK_NAME"
    
    if docker network ls | grep -q "$NETWORK_NAME"; then
        log "INFO" "Docker网络已存在: $NETWORK_NAME"
    else
        if docker network create "$NETWORK_NAME" --driver bridge; then
            log "SUCCESS" "Docker网络创建成功: $NETWORK_NAME"
        else
            log "ERROR" "Docker网络创建失败: $NETWORK_NAME"
            return 1
        fi
    fi
}

# 创建必要的目录
create_directories() {
    log "INFO" "创建项目目录结构..."
    
    local directories=(
        "data/postgres"
        "data/redis"
        "logs"
        "backups"
        "ssl"
        "config"
        "scripts"
        "backend"
        "backend/admin-panel"
    )
    
    for dir in "${directories[@]}"; do
        if mkdir -p "$PROJECT_ROOT/$dir"; then
            log "SUCCESS" "目录创建成功: $dir"
        else
            log "ERROR" "目录创建失败: $dir"
            return 1
        fi
    done
    
    # 设置正确的权限
    chmod -R 755 "$PROJECT_ROOT"/{logs,backups,ssl,config,scripts}
    chmod -R 777 "$PROJECT_ROOT"/data  # 数据目录需要容器写权限
}

# 创建Docker Compose配置文件
create_docker_compose() {
    log "INFO" "创建Docker Compose配置文件..."
    
    cat > "$PROJECT_ROOT/$COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: dongpaidi-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: dongpaidi_prod
      POSTGRES_USER: dongpaidi_user
      POSTGRES_PASSWORD: dongpaidi_password_2024
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - dongpaidi-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dongpaidi_user -d dongpaidi_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: dongpaidi-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis_password_2024
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    networks:
      - dongpaidi-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password_2024", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # 后端API服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dongpaidi-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://dongpaidi_user:dongpaidi_password_2024@postgres:5432/dongpaidi_prod
      - REDIS_URL=redis://:redis_password_2024@redis:6379
      - JWT_SECRET=your_jwt_secret_key_2024_dongpaidi_very_secure
      - PORT=3000
      - UPLOAD_PATH=/app/uploads
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
      - ./data/uploads:/app/uploads
    networks:
      - dongpaidi-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: dongpaidi-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
      - ./data/uploads:/var/www/uploads
    networks:
      - dongpaidi-network
    depends_on:
      - backend

networks:
  dongpaidi-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF

    if [[ -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log "SUCCESS" "Docker Compose配置文件创建成功"
    else
        log "ERROR" "Docker Compose配置文件创建失败"
        return 1
    fi
}

# 创建后端Dockerfile
create_backend_dockerfile() {
    log "INFO" "创建后端Dockerfile..."
    
    cat > "$PROJECT_ROOT/backend/Dockerfile" << 'EOF'
# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用（如果有构建步骤）
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# 生产阶段
FROM node:18-alpine AS production

# 安装必要的系统包
RUN apk add --no-cache curl dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# 复制应用文件
COPY --chown=nextjs:nodejs . .

# 创建必要的目录
RUN mkdir -p logs uploads && \
    chown -R nextjs:nodejs logs uploads

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
EOF

    if [[ -f "$PROJECT_ROOT/backend/Dockerfile" ]]; then
        log "SUCCESS" "后端Dockerfile创建成功"
    else
        log "ERROR" "后端Dockerfile创建失败"
        return 1
    fi
}

# 创建Nginx配置文件
create_nginx_config() {
    log "INFO" "创建Nginx配置文件..."
    
    cat > "$PROJECT_ROOT/config/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基本设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # 后端API代理
    upstream backend {
        server backend:3000;
    }

    # 主服务器配置
    server {
        listen 80;
        server_name _;

        # API代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket支持
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 静态文件
        location /uploads/ {
            alias /var/www/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 默认页面
        location / {
            return 200 '{"message":"懂拍帝API服务运行正常","timestamp":"$time_iso8601","server":"$hostname"}';
            add_header Content-Type application/json;
        }
    }
}
EOF

    if [[ -f "$PROJECT_ROOT/config/nginx.conf" ]]; then
        log "SUCCESS" "Nginx配置文件创建成功"
    else
        log "ERROR" "Nginx配置文件创建失败"
        return 1
    fi
}

# 创建环境变量文件
create_env_file() {
    log "INFO" "创建环境变量文件..."
    
    cat > "$PROJECT_ROOT/.env" << 'EOF'
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://dongpaidi_user:dongpaidi_password_2024@postgres:5432/dongpaidi_prod

# Redis配置
REDIS_URL=redis://:redis_password_2024@redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024

# JWT配置
JWT_SECRET=your_jwt_secret_key_2024_dongpaidi_very_secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 管理员配置
ADMIN_EMAIL=admin@dongpaidi.com
ADMIN_PASSWORD=admin123456

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=/app/uploads

# API配置
API_PREFIX=/api/v1
CORS_ORIGIN=*

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs
EOF

    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        log "SUCCESS" "环境变量文件创建成功"
    else
        log "ERROR" "环境变量文件创建失败"
        return 1
    fi
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 执行所有Docker设置
setup_docker_environment() {
    echo -e "${WHITE}==================== Docker设置 ====================${NC}"
    echo -e "${CYAN}开始配置Docker环境...${NC}"
    echo
    
    # 创建目录结构
    create_directories
    
    # 创建Docker网络
    create_docker_network
    
    # 创建配置文件
    create_docker_compose
    create_backend_dockerfile
    create_nginx_config
    create_env_file
    
    echo
    log "SUCCESS" "Docker环境设置完成"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    log "INFO" "开始Docker环境设置..."
    
    # 检查Docker是否运行
    if ! systemctl is-active --quiet docker; then
        log "ERROR" "Docker服务未运行，请先启动Docker"
        return 1
    fi
    
    # 执行Docker设置
    setup_docker_environment
    
    log "INFO" "Docker环境设置完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
