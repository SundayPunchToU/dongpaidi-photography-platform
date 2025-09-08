-- 懂拍帝数据库初始化脚本

-- 创建生产环境数据库和用户
CREATE DATABASE dongpaidi_prod;
CREATE USER dongpaidi_prod WITH PASSWORD 'prod_password';
GRANT ALL PRIVILEGES ON DATABASE dongpaidi_prod TO dongpaidi_prod;

-- 创建必要的扩展
\c dongpaidi_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c dongpaidi_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 返回到默认数据库
\c dongpaidi_dev;
