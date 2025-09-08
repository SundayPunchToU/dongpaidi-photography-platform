# 懂拍帝 Supabase 后端搭建完整指导

## 🚀 第一步：Supabase账号注册和项目创建

### 1.1 注册账号
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **"Start your project"**
3. 选择 **"Sign in with GitHub"**（推荐）或使用邮箱注册
4. 如果使用GitHub，授权Supabase访问您的GitHub账号

### 1.2 创建新项目
1. 登录后点击 **"New Project"**
2. 选择组织（通常是您的个人账号）
3. 填写项目信息：
   ```
   Name: dongpaidi-backend
   Database Password: 设置强密码（至少12位，包含大小写字母、数字、特殊字符）
   Region: Southeast Asia (Singapore) - 离中国大陆最近
   ```
4. 点击 **"Create new project"**
5. 等待2-3分钟项目初始化完成

### 1.3 获取API配置信息
项目创建完成后：
1. 进入项目Dashboard
2. 左侧菜单 → **Settings** → **API**
3. 记录以下重要信息：
   ```
   Project URL: https://your-project-id.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🗄️ 第二步：数据库设计和创建

### 2.1 执行数据库脚本
1. 左侧菜单 → **SQL Editor**
2. 点击 **"New query"**
3. 复制 `supabase-schema.sql` 文件中的所有内容
4. 粘贴到SQL编辑器中
5. 点击 **"Run"** 执行脚本
6. 确认所有表都创建成功（无错误提示）

### 2.2 验证表结构
1. 左侧菜单 → **Table Editor**
2. 确认以下表已创建：
   - ✅ users（用户表）
   - ✅ works（作品表）
   - ✅ comments（评论表）
   - ✅ likes（点赞表）
   - ✅ follows（关注表）
   - ✅ collections（收藏表）
   - ✅ appointments（约拍表）
   - ✅ appointment_applications（约拍申请表）
   - ✅ messages（消息表）
   - ✅ notifications（通知表）

### 2.3 设置行级安全策略（RLS）
1. 在SQL编辑器中执行以下安全策略：

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户表策略：用户只能查看和修改自己的信息
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- 作品表策略：所有人可查看已发布作品，用户只能修改自己的作品
CREATE POLICY "Anyone can view published works" ON works FOR SELECT USING (status = 'published');
CREATE POLICY "Users can insert own works" ON works FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own works" ON works FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 评论表策略：所有人可查看评论，登录用户可发表评论
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 点赞表策略：用户只能管理自己的点赞
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid()::text = user_id::text);

-- 关注表策略：用户只能管理自己的关注关系
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid()::text = follower_id::text);
```

## 🔐 第三步：认证系统配置

### 3.1 配置微信小程序认证
1. 左侧菜单 → **Authentication** → **Settings**
2. 滚动到 **"External OAuth Providers"**
3. 暂时跳过微信配置（需要企业认证）
4. 我们将使用自定义认证方案

### 3.2 创建自定义认证函数
在SQL编辑器中创建认证函数：

```sql
-- 创建自定义用户认证函数
CREATE OR REPLACE FUNCTION authenticate_wechat_user(
  openid TEXT,
  user_info JSONB
)
RETURNS TABLE(user_data JSONB) AS $$
DECLARE
  existing_user RECORD;
  new_user_id UUID;
BEGIN
  -- 查找现有用户
  SELECT * INTO existing_user FROM users WHERE users.openid = authenticate_wechat_user.openid;
  
  IF existing_user IS NULL THEN
    -- 创建新用户
    INSERT INTO users (openid, nickname, avatar_url, gender)
    VALUES (
      authenticate_wechat_user.openid,
      user_info->>'nickName',
      user_info->>'avatarUrl',
      CASE 
        WHEN (user_info->>'gender')::int = 1 THEN 'male'
        WHEN (user_info->>'gender')::int = 2 THEN 'female'
        ELSE 'other'
      END
    )
    RETURNING id INTO new_user_id;
    
    -- 返回新用户信息
    RETURN QUERY
    SELECT to_jsonb(users.*) FROM users WHERE id = new_user_id;
  ELSE
    -- 更新最后活跃时间
    UPDATE users SET last_active_at = NOW() WHERE id = existing_user.id;
    
    -- 返回现有用户信息
    RETURN QUERY
    SELECT to_jsonb(users.*) FROM users WHERE id = existing_user.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📦 第四步：存储服务设置

### 4.1 创建存储桶
1. 左侧菜单 → **Storage**
2. 点击 **"Create a new bucket"**
3. 创建以下存储桶：
   ```
   Bucket Name: images
   Public: true（允许公开访问）
   File size limit: 10MB
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

### 4.2 设置存储策略
在SQL编辑器中执行：

```sql
-- 允许所有人查看图片
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- 允许认证用户上传图片
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- 允许用户删除自己上传的图片
CREATE POLICY "Users can delete own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = owner::text);
```

## 💻 第五步：小程序集成代码

### 5.1 安装Supabase SDK
由于小程序环境限制，我们需要使用适配版本：

1. 下载Supabase JS SDK的小程序适配版本
2. 将SDK文件放入 `utils/supabase-sdk/` 目录
3. 或者使用CDN方式引入

### 5.2 创建配置文件
创建 `config/supabase.js`：

```javascript
// Supabase配置文件
export const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co', // 替换为您的项目URL
  anonKey: 'your-anon-key', // 替换为您的anon key
  serviceKey: 'your-service-key' // 替换为您的service key（仅后端使用）
}

// 小程序环境检测
export const isWechatMiniProgram = typeof wx !== 'undefined'

// API基础配置
export const API_CONFIG = {
  timeout: 10000,
  retryTimes: 3,
  baseHeaders: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
  }
}
```

### 5.3 修改现有页面集成Supabase

#### 修改发现页面 (pages/discover/index.js)
```javascript
// 在文件顶部添加导入
import { WorksService, UserService } from '../../utils/api.js'

// 修改loadWorks方法
async loadWorks(loadMore = false) {
  if (this.data.loading) return;
  
  this.setData({ loading: true });
  
  try {
    const { page, pageSize, selectedCategory } = this.data;
    const currentPage = loadMore ? page + 1 : 1;
    
    // 使用Supabase API
    const result = await WorksService.getList({
      page: currentPage,
      limit: pageSize,
      category: selectedCategory === 'all' ? null : selectedCategory
    });
    
    if (result.error) {
      throw result.error;
    }
    
    const newWorks = result.data || [];
    
    this.setData({
      works: loadMore ? [...this.data.works, ...newWorks] : newWorks,
      page: currentPage,
      hasMore: newWorks.length >= pageSize,
      loading: false
    });
  } catch (error) {
    console.error('加载作品失败:', error);
    this.setData({ loading: false });
    wx.showToast({
      title: '加载失败，请重试',
      icon: 'error'
    });
  }
}

// 修改点赞方法
async onWorkLike(e) {
  const { work } = e.detail;
  
  try {
    const result = await WorksService.like(work.id);
    
    if (result.error) {
      throw result.error;
    }
    
    // 更新本地数据
    const works = this.data.works.map(item => {
      if (item.id === work.id) {
        return {
          ...item,
          isLiked: result.isLiked,
          stats: {
            ...item.stats,
            likes: result.isLiked ? item.stats.likes + 1 : item.stats.likes - 1
          }
        };
      }
      return item;
    });
    
    this.setData({ works });
    
    // 触觉反馈
    wx.vibrateShort({ type: 'light' });
    
  } catch (error) {
    console.error('点赞失败:', error);
    wx.showToast({
      title: '操作失败',
      icon: 'error'
    });
  }
}
```

## 📱 第六步：完整集成示例

### 6.1 修改app.js
```javascript
// app.js
import { UserService } from './utils/api.js'

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  async onLaunch() {
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (isLoggedIn && userInfo) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo
    }
  },

  async login() {
    try {
      const result = await UserService.login()
      
      if (result.user) {
        this.globalData.isLoggedIn = true
        this.globalData.userInfo = result.user
        return result.user
      } else {
        throw result.error
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
      return null
    }
  }
})
```

### 6.2 修改发布页面 (pages/release/index.js)
```javascript
// 在文件顶部添加导入
import { WorksService, FileService } from '../../utils/api.js'

// 修改发布方法
async onPublish() {
  const { publishType, title, description, selectedImages, tags, location } = this.data;
  
  if (!publishType) {
    wx.showToast({ title: '请选择发布类型', icon: 'none' });
    return;
  }
  
  if (!title.trim()) {
    wx.showToast({ title: '请输入标题', icon: 'none' });
    return;
  }
  
  if (selectedImages.length === 0) {
    wx.showToast({ title: '请选择图片', icon: 'none' });
    return;
  }
  
  try {
    wx.showLoading({ title: '发布中...' });
    
    // 上传图片
    const imageUrls = await FileService.uploadMultiple(selectedImages);
    
    if (imageUrls.length === 0) {
      throw new Error('图片上传失败');
    }
    
    // 发布作品
    const workData = {
      title: title.trim(),
      description: description.trim(),
      images: imageUrls,
      cover_image: imageUrls[0],
      tags: tags.filter(tag => tag.trim()),
      category: this.mapPublishTypeToCategory(publishType),
      location: location.trim()
    };
    
    const result = await WorksService.publish(workData);
    
    if (result.error) {
      throw result.error;
    }
    
    wx.hideLoading();
    wx.showToast({
      title: '发布成功！',
      icon: 'success'
    });
    
    // 跳转到作品详情页
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/detail/index?id=${result.data.id}`
      });
    }, 1500);
    
  } catch (error) {
    wx.hideLoading();
    console.error('发布失败:', error);
    wx.showToast({
      title: '发布失败，请重试',
      icon: 'error'
    });
  }
},

// 映射发布类型到分类
mapPublishTypeToCategory(publishType) {
  const typeMap = {
    'photographer': 'portrait',
    'model': 'portrait', 
    'works': 'art'
  };
  return typeMap[publishType] || 'art';
}
```

## 🔧 第七步：测试和验证

### 7.1 测试数据库连接
在小程序中添加测试代码：

```javascript
// 测试Supabase连接
async testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .single()
    
    if (error) throw error
    
    console.log('Supabase连接成功:', data)
    wx.showToast({
      title: 'Supabase连接成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('Supabase连接失败:', error)
    wx.showToast({
      title: 'Supabase连接失败',
      icon: 'error'
    })
  }
}
```

### 7.2 测试用户注册
```javascript
// 测试用户注册
async testUserRegistration() {
  try {
    const result = await UserService.login()
    
    if (result.user) {
      console.log('用户注册/登录成功:', result.user)
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } else {
      throw result.error
    }
  } catch (error) {
    console.error('用户注册失败:', error)
  }
}
```

## 🎯 第八步：部署检查清单

### 8.1 必须完成的配置
- [ ] Supabase项目创建完成
- [ ] 数据库表结构创建完成
- [ ] 行级安全策略设置完成
- [ ] 存储桶创建完成
- [ ] API密钥配置到小程序
- [ ] 测试连接成功

### 8.2 可选的高级配置
- [ ] 配置CDN加速（腾讯云）
- [ ] 设置数据库备份
- [ ] 配置监控和告警
- [ ] 设置API限流

## 🚨 注意事项

### 安全提醒
1. **永远不要**将 `service_role` 密钥暴露在前端代码中
2. **务必启用**行级安全策略（RLS）
3. **定期更换**API密钥
4. **监控**异常访问和API调用

### 性能优化
1. 合理使用数据库索引
2. 避免N+1查询问题
3. 使用分页加载大量数据
4. 图片使用CDN加速

## 📞 下一步行动

完成以上配置后，您就可以：
1. 在小程序中测试Supabase连接
2. 实现用户登录注册功能
3. 测试作品发布和获取
4. 逐步实现所有社交功能

需要我帮您实现任何具体的功能吗？
