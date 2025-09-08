#!/bin/bash

# 懂拍帝开发环境Docker管理脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

case "$1" in
  "start")
    echo "🚀 启动开发环境..."
    docker-compose up -d postgres redis
    echo "⏳ 等待数据库启动..."
    sleep 10
    echo "✅ 开发环境已启动"
    echo ""
    echo "📋 服务信息："
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    echo ""
    echo "📝 下一步："
    echo "  1. 运行 npm run db:migrate 进行数据库迁移"
    echo "  2. 运行 npm run db:seed 初始化种子数据"
    echo "  3. 运行 npm run dev 启动开发服务器"
    ;;
    
  "stop")
    echo "🛑 停止开发环境..."
    docker-compose down
    echo "✅ 开发环境已停止"
    ;;
    
  "restart")
    echo "🔄 重启开发环境..."
    docker-compose restart postgres redis
    echo "✅ 开发环境已重启"
    ;;
    
  "logs")
    echo "📋 查看日志..."
    docker-compose logs -f postgres redis
    ;;
    
  "clean")
    echo "🧹 清理开发环境..."
    docker-compose down -v
    docker-compose rm -f
    echo "✅ 开发环境已清理"
    ;;
    
  "pgadmin")
    echo "🚀 启动PgAdmin..."
    docker-compose up -d pgadmin
    echo "✅ PgAdmin已启动"
    echo "📋 访问地址: http://localhost:5050"
    echo "📋 登录信息:"
    echo "  邮箱: admin@dongpaidi.com"
    echo "  密码: admin123456"
    ;;
    
  "status")
    echo "📊 服务状态："
    docker-compose ps
    ;;
    
  *)
    echo "懂拍帝开发环境管理脚本"
    echo ""
    echo "用法: $0 {start|stop|restart|logs|clean|pgadmin|status}"
    echo ""
    echo "命令说明："
    echo "  start    - 启动PostgreSQL和Redis服务"
    echo "  stop     - 停止所有服务"
    echo "  restart  - 重启服务"
    echo "  logs     - 查看服务日志"
    echo "  clean    - 清理所有数据和容器"
    echo "  pgadmin  - 启动PgAdmin管理界面"
    echo "  status   - 查看服务状态"
    exit 1
    ;;
esac
