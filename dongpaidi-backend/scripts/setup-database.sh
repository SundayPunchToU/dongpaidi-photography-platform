#!/bin/bash

# 懂拍帝后端数据库设置脚本

set -e

echo "🚀 开始设置PostgreSQL数据库..."

# 检查PostgreSQL是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL未安装，请先安装PostgreSQL"
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    echo "macOS: brew install postgresql"
    exit 1
fi

# 检查PostgreSQL服务是否运行
if ! pg_isready -q; then
    echo "❌ PostgreSQL服务未运行，请启动PostgreSQL服务"
    echo "Ubuntu/Debian: sudo systemctl start postgresql"
    echo "CentOS/RHEL: sudo systemctl start postgresql"
    echo "macOS: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL已安装并运行"

# 设置数据库变量
DB_NAME_DEV="dongpaidi_dev"
DB_NAME_PROD="dongpaidi_prod"
DB_USER_DEV="dongpaidi_dev"
DB_USER_PROD="dongpaidi_prod"
DB_PASSWORD_DEV="dev_password"
DB_PASSWORD_PROD="prod_password"

# 创建开发环境数据库
echo "📦 创建开发环境数据库..."

# 创建开发用户
sudo -u postgres psql -c "CREATE USER $DB_USER_DEV WITH PASSWORD '$DB_PASSWORD_DEV';" 2>/dev/null || echo "用户 $DB_USER_DEV 已存在"

# 创建开发数据库
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME_DEV OWNER $DB_USER_DEV;" 2>/dev/null || echo "数据库 $DB_NAME_DEV 已存在"

# 授权
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME_DEV TO $DB_USER_DEV;"
sudo -u postgres psql -c "ALTER USER $DB_USER_DEV CREATEDB;"

echo "✅ 开发环境数据库创建完成"

# 创建生产环境数据库
echo "📦 创建生产环境数据库..."

# 创建生产用户
sudo -u postgres psql -c "CREATE USER $DB_USER_PROD WITH PASSWORD '$DB_PASSWORD_PROD';" 2>/dev/null || echo "用户 $DB_USER_PROD 已存在"

# 创建生产数据库
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME_PROD OWNER $DB_USER_PROD;" 2>/dev/null || echo "数据库 $DB_NAME_PROD 已存在"

# 授权
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME_PROD TO $DB_USER_PROD;"

echo "✅ 生产环境数据库创建完成"

# 显示连接信息
echo ""
echo "🎉 数据库设置完成！"
echo ""
echo "📋 连接信息："
echo "开发环境："
echo "  数据库: $DB_NAME_DEV"
echo "  用户: $DB_USER_DEV"
echo "  密码: $DB_PASSWORD_DEV"
echo "  连接字符串: postgresql://$DB_USER_DEV:$DB_PASSWORD_DEV@localhost:5432/$DB_NAME_DEV"
echo ""
echo "生产环境："
echo "  数据库: $DB_NAME_PROD"
echo "  用户: $DB_USER_PROD"
echo "  密码: $DB_PASSWORD_PROD"
echo "  连接字符串: postgresql://$DB_USER_PROD:$DB_PASSWORD_PROD@localhost:5432/$DB_NAME_PROD"
echo ""
echo "📝 下一步："
echo "1. 更新 .env.development 文件中的 DATABASE_URL"
echo "2. 更新 .env.production 文件中的 DATABASE_URL"
echo "3. 运行 npm run db:migrate 进行数据库迁移"
echo "4. 运行 npm run db:seed 初始化种子数据"
