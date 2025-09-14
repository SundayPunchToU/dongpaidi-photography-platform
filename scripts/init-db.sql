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
