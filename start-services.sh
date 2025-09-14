#!/bin/bash

# ============================================================================
# 懂拍帝摄影平台 - 服务启动脚本
# ============================================================================
# 版本: 1.0.0
# 描述: 启动所有应用服务并进行健康检查
# 使用: ./start-services.sh
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

# 服务配置
readonly SERVICES=("postgres" "redis" "backend" "nginx")
readonly MAX_WAIT_TIME=300  # 5分钟
readonly CHECK_INTERVAL=10  # 10秒

# ============================================================================
# 工具函数
# ============================================================================

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [START-SERVICES] $message" | sudo tee -a "$LOG_FILE" >/dev/null
    
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

# 进度条函数
show_progress() {
    local current=$1
    local total=$2
    local message="$3"
    local width=40
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

# ============================================================================
# 服务管理函数
# ============================================================================

# 创建后端应用代码
create_backend_app() {
    log "INFO" "创建后端应用代码..."
    
    mkdir -p "$PROJECT_ROOT/backend/src"
    
    # 创建package.json
    cat > "$PROJECT_ROOT/backend/package.json" << 'EOF'
{
  "name": "dongpaidi-backend",
  "version": "1.0.0",
  "description": "懂拍帝摄影平台后端API服务",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.0",
    "redis": "^4.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

    # 创建主应用文件
    cat > "$PROJECT_ROOT/backend/src/index.js" << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.get('/api/v1', (req, res) => {
  res.json({
    message: '懂拍帝摄影平台API服务',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      users: '/api/v1/users',
      works: '/api/v1/works',
      appointments: '/api/v1/appointments'
    }
  });
});

// 用户相关路由
app.get('/api/v1/users', (req, res) => {
  res.json({
    message: '用户列表',
    data: [],
    total: 0
  });
});

// 作品相关路由
app.get('/api/v1/works', (req, res) => {
  res.json({
    message: '作品列表',
    data: [],
    total: 0
  });
});

// 约拍相关路由
app.get('/api/v1/appointments', (req, res) => {
  res.json({
    message: '约拍列表',
    data: [],
    total: 0
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 懂拍帝后端服务启动成功`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📖 API文档: http://0.0.0.0:${PORT}/api/v1`);
  console.log(`❤️  健康检查: http://0.0.0.0:${PORT}/api/v1/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});
EOF

    if [[ -f "$PROJECT_ROOT/backend/src/index.js" ]]; then
        log "SUCCESS" "后端应用代码创建成功"
    else
        log "ERROR" "后端应用代码创建失败"
        return 1
    fi
}

# 构建Docker镜像
build_docker_images() {
    log "INFO" "构建Docker镜像..."
    
    # 安装后端依赖
    if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
        log "INFO" "安装后端依赖..."
        cd "$PROJECT_ROOT/backend"
        if command -v npm >/dev/null 2>&1; then
            npm install --production
        else
            log "WARN" "npm未安装，将在Docker容器中安装依赖"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # 构建后端镜像
    log "INFO" "构建后端Docker镜像..."
    if docker-compose build backend; then
        log "SUCCESS" "后端镜像构建成功"
    else
        log "ERROR" "后端镜像构建失败"
        return 1
    fi
}

# 启动所有服务
start_all_services() {
    log "INFO" "启动所有服务..."
    
    # 启动服务
    if docker-compose up -d; then
        log "SUCCESS" "服务启动命令执行成功"
    else
        log "ERROR" "服务启动失败"
        return 1
    fi
}

# 等待服务健康
wait_for_service_health() {
    local service_name="$1"
    local health_check="$2"
    local wait_time=0
    
    log "INFO" "等待 $service_name 服务健康..."
    
    while [[ $wait_time -lt $MAX_WAIT_TIME ]]; do
        if eval "$health_check" >/dev/null 2>&1; then
            log "SUCCESS" "$service_name 服务健康检查通过"
            return 0
        fi
        
        echo -n "."
        sleep $CHECK_INTERVAL
        wait_time=$((wait_time + CHECK_INTERVAL))
    done
    
    echo
    log "ERROR" "$service_name 服务健康检查超时"
    return 1
}

# 检查所有服务状态
check_services_status() {
    log "INFO" "检查服务状态..."
    
    local all_healthy=true
    
    # 检查PostgreSQL
    if wait_for_service_health "PostgreSQL" "docker exec dongpaidi-postgres pg_isready -U dongpaidi_user -d dongpaidi_prod"; then
        :
    else
        all_healthy=false
    fi
    
    # 检查Redis
    if wait_for_service_health "Redis" "docker exec dongpaidi-redis redis-cli -a redis_password_2024 ping"; then
        :
    else
        all_healthy=false
    fi
    
    # 检查后端API
    if wait_for_service_health "Backend API" "curl -f http://localhost:3000/api/v1/health"; then
        :
    else
        all_healthy=false
    fi
    
    # 检查Nginx
    if wait_for_service_health "Nginx" "curl -f http://localhost:80/health"; then
        :
    else
        all_healthy=false
    fi
    
    if [[ "$all_healthy" == "true" ]]; then
        log "SUCCESS" "所有服务健康检查通过"
        return 0
    else
        log "ERROR" "部分服务健康检查失败"
        return 1
    fi
}

# 显示服务状态
show_services_status() {
    echo
    echo -e "${WHITE}==================== 服务状态 ====================${NC}"
    
    # 显示容器状态
    echo -e "${CYAN}容器状态:${NC}"
    docker-compose ps
    
    echo
    echo -e "${CYAN}服务端点:${NC}"
    local server_ip=$(hostname -I | awk '{print $1}')
    echo -e "  🌐 主页面: http://$server_ip"
    echo -e "  🔧 API服务: http://$server_ip:3000/api/v1"
    echo -e "  ❤️  健康检查: http://$server_ip:3000/api/v1/health"
    echo -e "  📊 Nginx状态: http://$server_ip/health"
    
    echo
    echo -e "${CYAN}数据库连接:${NC}"
    echo -e "  🐘 PostgreSQL: $server_ip:5432"
    echo -e "  🔴 Redis: $server_ip:6379"
    
    echo -e "${WHITE}=================================================${NC}"
    echo
}

# ============================================================================
# 主要功能函数
# ============================================================================

# 启动所有服务
start_services() {
    echo -e "${WHITE}==================== 启动服务 ====================${NC}"
    echo -e "${CYAN}开始启动所有服务...${NC}"
    echo
    
    local total_steps=4
    local current_step=0
    
    # 步骤1: 创建后端应用
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "创建后端应用代码"
    create_backend_app
    
    # 步骤2: 构建镜像
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "构建Docker镜像"
    build_docker_images
    
    # 步骤3: 启动服务
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "启动所有服务"
    start_all_services
    
    # 步骤4: 健康检查
    current_step=$((current_step + 1))
    show_progress $current_step $total_steps "服务健康检查"
    check_services_status
    
    # 显示服务状态
    show_services_status
    
    log "SUCCESS" "所有服务启动完成"
}

# ============================================================================
# 主程序入口
# ============================================================================

main() {
    log "INFO" "开始启动服务..."
    
    # 检查Docker Compose文件是否存在
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log "ERROR" "Docker Compose文件不存在，请先运行setup-docker.sh"
        return 1
    fi
    
    # 检查数据库是否已初始化
    if ! docker ps | grep -q dongpaidi-postgres; then
        log "ERROR" "数据库服务未运行，请先运行init-database.sh"
        return 1
    fi
    
    # 启动服务
    start_services
    
    log "INFO" "服务启动完成"
}

# 如果脚本被直接执行，则运行main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
