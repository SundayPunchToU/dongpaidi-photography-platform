-- 懂拍帝数据库表结构
-- 用于Supabase数据库初始化

-- 作品表 (works)
CREATE TABLE IF NOT EXISTS works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  category VARCHAR(50) DEFAULT 'photography',
  tags TEXT[] DEFAULT '{}',
  location VARCHAR(255),
  camera_params JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"likes": 0, "comments": 0, "views": 0, "shares": 0}',
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);

-- 用户表 (users) - 可选，如果需要完整的用户系统
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  nickname VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  stats JSONB DEFAULT '{"works": 0, "followers": 0, "following": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 点赞表 (likes)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

-- 评论表 (comments)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建评论索引
CREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments(work_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 约拍表 (appointments) - 如果需要约拍功能
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  date_time TIMESTAMP WITH TIME ZONE,
  budget_min INTEGER,
  budget_max INTEGER,
  photographer_id VARCHAR(255),
  model_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'open',
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建约拍索引
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type);
CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(location);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_time);

-- 启用行级安全策略 (RLS)
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 创建基本的安全策略
-- 作品：所有人可读，只有作者可写
CREATE POLICY "作品公开可读" ON works FOR SELECT USING (true);
CREATE POLICY "作者可管理自己的作品" ON works FOR ALL USING (auth.uid()::text = user_id);

-- 点赞：用户可管理自己的点赞
CREATE POLICY "用户可管理自己的点赞" ON likes FOR ALL USING (auth.uid()::text = user_id);

-- 评论：所有人可读，用户可管理自己的评论
CREATE POLICY "评论公开可读" ON comments FOR SELECT USING (true);
CREATE POLICY "用户可管理自己的评论" ON comments FOR ALL USING (auth.uid()::text = user_id);

-- 插入一些示例数据（可选）
INSERT INTO works (title, description, cover_image, user_id, user_name, user_avatar, category, tags) VALUES
('城市夜景', '繁华都市的夜晚灯火', 'https://picsum.photos/400/600?random=1', 'demo_user_1', '夜景摄影师', 'https://i.pravatar.cc/100?img=1', 'landscape', ARRAY['夜景', '城市', '灯光']),
('人像写真', '自然光下的人像摄影', 'https://picsum.photos/400/700?random=2', 'demo_user_2', '人像摄影师', 'https://i.pravatar.cc/100?img=2', 'portrait', ARRAY['人像', '自然光', '写真']),
('街头摄影', '捕捉城市生活的瞬间', 'https://picsum.photos/400/500?random=3', 'demo_user_3', '街拍达人', 'https://i.pravatar.cc/100?img=3', 'street', ARRAY['街拍', '生活', '瞬间'])
ON CONFLICT DO NOTHING;
