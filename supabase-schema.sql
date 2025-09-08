-- 懂拍帝摄影社交App数据库设计
-- 在Supabase SQL编辑器中执行此脚本

-- 1. 用户表（支持多平台）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 多平台用户标识
  openid TEXT UNIQUE, -- 微信小程序openid（可为空，兼容其他平台）
  phone TEXT UNIQUE, -- 手机号（主要用于App平台）
  email TEXT UNIQUE, -- 邮箱（可选）
  -- 平台信息
  platform TEXT NOT NULL DEFAULT 'wechat' CHECK (platform IN ('wechat', 'ios', 'android', 'web')),
  platform_user_id TEXT, -- 各平台的用户ID
  -- 基本信息
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  location TEXT,
  -- 角色信息
  is_photographer BOOLEAN DEFAULT false,
  is_model BOOLEAN DEFAULT false,
  photographer_level TEXT CHECK (photographer_level IN ('beginner', 'intermediate', 'professional', 'master')),
  model_experience TEXT CHECK (model_experience IN ('new', 'experienced', 'professional')),
  -- 联系方式
  contact_wechat TEXT,
  contact_phone TEXT,
  -- 作品集和技能
  portfolio_images JSONB DEFAULT '[]'::jsonb,
  specialties TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  -- 统计信息
  following_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  works_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  -- 认证和状态
  is_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false, -- 手机号验证状态
  email_verified BOOLEAN DEFAULT false, -- 邮箱验证状态
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  -- 时间戳
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 约束：至少要有一种登录方式
  CONSTRAINT users_login_method_check CHECK (
    openid IS NOT NULL OR phone IS NOT NULL OR email IS NOT NULL
  )
);

-- 2. 作品表
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('portrait', 'landscape', 'street', 'commercial', 'art', 'wedding', 'fashion', 'nature', 'architecture', 'food')),
  location TEXT,
  shooting_date DATE,
  shooting_info JSONB DEFAULT '{}'::jsonb, -- 相机、镜头、参数等
  price DECIMAL(10,2), -- 如果是付费作品
  is_premium BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  collect_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'reviewing', 'published', 'rejected', 'deleted')),
  featured_at TIMESTAMP WITH TIME ZONE, -- 精选时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 回复评论的父评论ID
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb, -- 评论可以包含图片
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false, -- 是否置顶
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 点赞表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL, -- 可以是作品ID或评论ID
  target_type TEXT NOT NULL CHECK (target_type IN ('work', 'comment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- 5. 关注表
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 6. 收藏表
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

-- 7. 约拍表
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photographer_seek_model', 'model_seek_photographer', 'collaboration')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_type TEXT CHECK (budget_type IN ('hourly', 'daily', 'project', 'tfp')), -- TFP = Time For Print
  location TEXT NOT NULL,
  preferred_date DATE,
  duration_hours INTEGER,
  requirements TEXT,
  portfolio_required BOOLEAN DEFAULT false,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'professional')),
  contact_method TEXT CHECK (contact_method IN ('wechat', 'phone', 'platform')),
  applicant_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 约拍申请表
CREATE TABLE appointment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  portfolio_images JSONB DEFAULT '[]'::jsonb,
  proposed_budget DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, applicant_id)
);

-- 9. 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  images JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- 关联约拍
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 系统通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'appointment', 'system')),
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}'::jsonb, -- 额外数据
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 验证码表（支持手机号登录）
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'register', 'reset_password')),
  platform TEXT NOT NULL CHECK (platform IN ('wechat', 'ios', 'android', 'web')),
  attempts INTEGER DEFAULT 0, -- 验证尝试次数
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 用户平台关联表（支持一个用户多平台登录）
CREATE TABLE user_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('wechat', 'ios', 'android', 'web')),
  platform_user_id TEXT NOT NULL, -- 平台特定的用户ID（如openid）
  platform_data JSONB DEFAULT '{}'::jsonb, -- 平台特定数据
  is_primary BOOLEAN DEFAULT false, -- 是否为主要登录方式
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform),
  UNIQUE(platform, platform_user_id)
);

-- 13. 约拍订单表
CREATE TABLE appointment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL, -- 订单号
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 下单用户（客户）
  photographer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 摄影师
  amount DECIMAL(10,2) NOT NULL, -- 订单金额
  appointment_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 约拍时间
  location TEXT NOT NULL, -- 拍摄地点
  description TEXT NOT NULL, -- 拍摄需求描述
  requirements TEXT, -- 具体要求
  status TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'confirmed', 'in_progress', 'completed',
    'cancelled', 'refund_requested', 'refunded'
  )),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'paid', 'refunded', 'partial_refunded'
  )),
  transaction_id TEXT, -- 微信支付交易ID
  paid_at TIMESTAMP WITH TIME ZONE, -- 支付时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 退款申请表
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES appointment_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL, -- 退款金额
  reason TEXT NOT NULL, -- 退款原因
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'processed'
  )),
  admin_note TEXT, -- 管理员备注
  processed_at TIMESTAMP WITH TIME ZONE, -- 处理时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform ON users(platform);
CREATE INDEX idx_users_status ON users(status);

-- 作品表索引
CREATE INDEX idx_works_user_id ON works(user_id);
CREATE INDEX idx_works_category ON works(category);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
CREATE INDEX idx_works_status ON works(status);

-- 评论表索引
CREATE INDEX idx_comments_work_id ON comments(work_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- 点赞表索引
CREATE INDEX idx_likes_target ON likes(target_id, target_type);
CREATE INDEX idx_likes_user ON likes(user_id);

-- 关注表索引
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- 约拍表索引
CREATE INDEX idx_appointments_type ON appointments(type);
CREATE INDEX idx_appointments_location ON appointments(location);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 消息表索引
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- 通知表索引
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 验证码表索引
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX idx_verification_codes_phone_type ON verification_codes(phone, type);

-- 用户平台关联表索引
CREATE INDEX idx_user_platforms_user_id ON user_platforms(user_id);
CREATE INDEX idx_user_platforms_platform ON user_platforms(platform);
CREATE INDEX idx_user_platforms_platform_user_id ON user_platforms(platform_user_id);

-- 约拍订单表索引
CREATE INDEX idx_appointment_orders_order_no ON appointment_orders(order_no);
CREATE INDEX idx_appointment_orders_user_id ON appointment_orders(user_id);
CREATE INDEX idx_appointment_orders_photographer_id ON appointment_orders(photographer_id);
CREATE INDEX idx_appointment_orders_status ON appointment_orders(status);
CREATE INDEX idx_appointment_orders_payment_status ON appointment_orders(payment_status);
CREATE INDEX idx_appointment_orders_created_at ON appointment_orders(created_at DESC);

-- 退款申请表索引
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_works_updated_at BEFORE UPDATE ON works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointment_applications_updated_at BEFORE UPDATE ON appointment_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 多平台认证相关函数 ====================

-- 清理过期验证码
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 验证验证码
CREATE OR REPLACE FUNCTION verify_code(
    p_phone TEXT,
    p_code TEXT,
    p_type TEXT DEFAULT 'login'
)
RETURNS TABLE(is_valid BOOLEAN, message TEXT) AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- 清理过期验证码
    PERFORM cleanup_expired_verification_codes();

    -- 查找有效的验证码
    SELECT * INTO v_record
    FROM verification_codes
    WHERE phone = p_phone
      AND type = p_type
      AND is_used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- 检查验证码是否存在
    IF v_record IS NULL THEN
        RETURN QUERY SELECT false, '验证码不存在或已过期';
        RETURN;
    END IF;

    -- 检查尝试次数
    IF v_record.attempts >= 5 THEN
        RETURN QUERY SELECT false, '验证码尝试次数过多，请重新获取';
        RETURN;
    END IF;

    -- 验证码错误，增加尝试次数
    IF v_record.code != p_code THEN
        UPDATE verification_codes
        SET attempts = attempts + 1
        WHERE id = v_record.id;
        RETURN QUERY SELECT false, '验证码错误';
        RETURN;
    END IF;

    -- 验证成功，标记为已使用
    UPDATE verification_codes
    SET is_used = true
    WHERE id = v_record.id;

    RETURN QUERY SELECT true, '验证成功';
END;
$$ LANGUAGE plpgsql;

-- 查找或创建用户（支持多平台）
CREATE OR REPLACE FUNCTION find_or_create_user(
    p_platform TEXT,
    p_platform_user_id TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_nickname TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT 'other'
)
RETURNS TABLE(user_data JSONB, is_new_user BOOLEAN) AS $$
DECLARE
    v_user_id UUID;
    v_user RECORD;
    v_is_new BOOLEAN := false;
BEGIN
    -- 1. 尝试通过平台用户ID查找
    IF p_platform_user_id IS NOT NULL THEN
        SELECT u.* INTO v_user
        FROM users u
        JOIN user_platforms up ON u.id = up.user_id
        WHERE up.platform = p_platform AND up.platform_user_id = p_platform_user_id;
    END IF;

    -- 2. 如果没找到，尝试通过手机号查找
    IF v_user IS NULL AND p_phone IS NOT NULL THEN
        SELECT * INTO v_user FROM users WHERE phone = p_phone;
    END IF;

    -- 3. 如果没找到，尝试通过邮箱查找
    IF v_user IS NULL AND p_email IS NOT NULL THEN
        SELECT * INTO v_user FROM users WHERE email = p_email;
    END IF;

    -- 4. 如果还是没找到，创建新用户
    IF v_user IS NULL THEN
        INSERT INTO users (
            platform, phone, email, nickname, avatar_url, gender,
            platform_user_id
        ) VALUES (
            p_platform, p_phone, p_email,
            COALESCE(p_nickname, '新用户'),
            p_avatar_url, p_gender, p_platform_user_id
        ) RETURNING * INTO v_user;

        v_is_new := true;

        -- 创建平台关联记录
        IF p_platform_user_id IS NOT NULL THEN
            INSERT INTO user_platforms (user_id, platform, platform_user_id, is_primary)
            VALUES (v_user.id, p_platform, p_platform_user_id, true);
        END IF;
    ELSE
        -- 用户存在，更新最后活跃时间
        UPDATE users SET last_active_at = NOW() WHERE id = v_user.id;

        -- 检查是否需要添加新的平台关联
        IF p_platform_user_id IS NOT NULL THEN
            INSERT INTO user_platforms (user_id, platform, platform_user_id, is_primary)
            VALUES (v_user.id, p_platform, p_platform_user_id, false)
            ON CONFLICT (user_id, platform) DO UPDATE SET
                platform_user_id = EXCLUDED.platform_user_id,
                last_login_at = NOW();
        END IF;
    END IF;

    -- 返回用户数据
    RETURN QUERY SELECT row_to_json(v_user)::JSONB, v_is_new;
END;
$$ LANGUAGE plpgsql;
