# 懂拍帝 Supabase 快速开始指南

## 🚀 5分钟快速部署

### Step 1: 创建Supabase项目（2分钟）
```bash
1. 访问 https://supabase.com
2. 使用GitHub登录
3. 点击 "New Project"
4. 填写：
   - Name: dongpaidi-backend
   - Password: 设置强密码
   - Region: Southeast Asia (Singapore)
5. 等待项目创建完成
```

### Step 2: 执行数据库脚本（1分钟）
```bash
1. 进入项目 → SQL Editor
2. 复制粘贴 supabase-schema.sql 的全部内容
3. 点击 "Run" 执行
4. 确认所有表创建成功
```

### Step 3: 配置存储服务（1分钟）
```bash
1. Storage → Create bucket
2. Name: images
3. Public: true
4. 点击 Create bucket
```

### Step 4: 获取API配置（30秒）
```bash
1. Settings → API
2. 复制 Project URL 和 anon public key
3. 替换 utils/supabase-client.js 中的配置
```

### Step 5: 测试连接（30秒）
```javascript
// 在小程序任意页面添加测试代码
import { supabase } from '../../utils/supabase-client.js'

// 测试连接
async testConnection() {
  try {
    const { data, error } = await supabase.select('users', { select: 'count(*)' })
    console.log('连接成功:', data)
    wx.showToast({ title: '后端连接成功！', icon: 'success' })
  } catch (error) {
    console.error('连接失败:', error)
    wx.showToast({ title: '连接失败', icon: 'error' })
  }
}
```

## 📱 立即集成到现有页面

### 修改发现页面
在 `pages/discover/index.js` 中：

```javascript
// 1. 导入API
import { worksAPI } from '../../utils/supabase-client.js'

// 2. 修改loadWorks方法
async loadWorks(loadMore = false) {
  if (this.data.loading) return
  
  this.setData({ loading: true })
  
  try {
    const { page, pageSize, selectedCategory } = this.data
    const currentPage = loadMore ? page + 1 : 1
    
    // 使用Supabase API
    const result = await worksAPI.getList(
      currentPage, 
      pageSize, 
      selectedCategory === 'all' ? null : selectedCategory
    )
    
    if (result.error) throw result.error
    
    // 转换数据格式适配现有组件
    const works = (result.data || []).map(work => ({
      id: work.id,
      userId: work.user_id,
      userName: work.users?.nickname || '匿名用户',
      userAvatar: work.users?.avatar_url || '/static/default-avatar.png',
      title: work.title,
      coverImage: work.cover_image,
      imageWidth: 400,
      imageHeight: 400 + Math.random() * 400, // 瀑布流随机高度
      stats: {
        likes: work.like_count || 0,
        comments: work.comment_count || 0,
        views: work.view_count || 0
      },
      isLiked: false // TODO: 查询用户点赞状态
    }))
    
    this.setData({
      works: loadMore ? [...this.data.works, ...works] : works,
      page: currentPage,
      hasMore: works.length >= pageSize,
      loading: false
    })
  } catch (error) {
    console.error('加载失败:', error)
    this.setData({ loading: false })
    wx.showToast({ title: '加载失败', icon: 'error' })
  }
}
```

### 修改发布页面
在 `pages/release/index.js` 中：

```javascript
// 1. 导入API
import { worksAPI, fileAPI } from '../../utils/supabase-client.js'

// 2. 修改发布方法
async onPublish() {
  const { publishType, title, description, selectedImages, tags, location } = this.data
  
  if (!publishType || !title.trim() || selectedImages.length === 0) {
    wx.showToast({ title: '请完善信息', icon: 'none' })
    return
  }
  
  try {
    wx.showLoading({ title: '发布中...' })
    
    // 上传图片
    const imageUrls = await fileAPI.uploadMultiple(selectedImages)
    
    // 发布作品
    const workData = {
      title: title.trim(),
      description: description.trim(),
      images: imageUrls,
      cover_image: imageUrls[0],
      tags: tags.filter(tag => tag.trim()),
      category: this.mapTypeToCategory(publishType),
      location: location.trim(),
      user_id: wx.getStorageSync('userInfo')?.id
    }
    
    const result = await worksAPI.publish(workData)
    
    if (result.error) throw result.error
    
    wx.hideLoading()
    wx.showToast({ title: '发布成功！', icon: 'success' })
    
    // 跳转到详情页
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/detail/index?id=${result.data.id}`
      })
    }, 1500)
    
  } catch (error) {
    wx.hideLoading()
    console.error('发布失败:', error)
    wx.showToast({ title: '发布失败', icon: 'error' })
  }
}

// 类型映射
mapTypeToCategory(type) {
  const map = {
    'photographer': 'portrait',
    'model': 'portrait',
    'works': 'art'
  }
  return map[type] || 'art'
}
```

## 🔧 配置文件更新

### 更新 utils/supabase-client.js 配置
```javascript
// 请将以下配置替换为您的实际配置
const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 在 app.json 中添加网络域名
```json
{
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  },
  "permission": {
    "scope.userLocation": {
      "desc": "您的位置信息将用于展示附近的摄影作品"
    }
  }
}
```

## ✅ 验证部署成功

### 测试清单
- [ ] Supabase项目创建成功
- [ ] 数据库表创建完成（10个表）
- [ ] 存储桶创建成功
- [ ] API配置正确
- [ ] 小程序连接测试通过
- [ ] 用户登录功能正常
- [ ] 作品发布功能正常
- [ ] 图片上传功能正常

### 测试代码
在任意页面添加以下测试按钮：

```javascript
// 测试所有功能
async runAllTests() {
  console.log('开始测试Supabase集成...')
  
  // 1. 测试数据库连接
  try {
    const { data } = await supabase.select('users', { select: 'count(*)' })
    console.log('✅ 数据库连接成功')
  } catch (error) {
    console.log('❌ 数据库连接失败:', error)
    return
  }
  
  // 2. 测试用户创建
  try {
    const testUser = {
      openid: `test_${Date.now()}`,
      nickname: '测试用户',
      avatar_url: 'https://example.com/avatar.jpg'
    }
    const result = await userAPI.login(testUser.openid, testUser)
    console.log('✅ 用户创建成功:', result.data)
  } catch (error) {
    console.log('❌ 用户创建失败:', error)
  }
  
  // 3. 测试作品发布
  try {
    const testWork = {
      title: '测试作品',
      description: '这是一个测试作品',
      images: ['https://picsum.photos/400/600'],
      cover_image: 'https://picsum.photos/400/600',
      category: 'art',
      user_id: 'test-user-id'
    }
    const result = await worksAPI.publish(testWork)
    console.log('✅ 作品发布成功:', result.data)
  } catch (error) {
    console.log('❌ 作品发布失败:', error)
  }
  
  console.log('测试完成！')
  wx.showToast({ title: '测试完成，查看控制台', icon: 'success' })
}
```

## 🎉 恭喜！

完成以上步骤后，您的懂拍帝小程序就拥有了：
- ✅ 完整的用户系统
- ✅ 作品发布和管理
- ✅ 社交互动功能
- ✅ 图片存储服务
- ✅ 实时数据同步
- ✅ 可扩展的架构

现在您可以专注于前端功能开发，后端已经为您准备就绪！

## 📞 需要帮助？

如果在部署过程中遇到任何问题：
1. 检查网络连接
2. 确认API密钥配置正确
3. 查看浏览器/小程序控制台错误信息
4. 参考Supabase官方文档

祝您部署顺利！🎉
