# 懂拍帝多平台登录系统使用指南

## 概述

懂拍帝应用现已支持多平台部署，包括微信小程序、iOS App和Android App。本指南详细介绍了如何使用新的多平台登录系统。

## 支持的平台和登录方式

| 平台 | 支持的登录方式 | 主要登录方式 |
|------|---------------|-------------|
| 微信小程序 | 微信登录、游客模式 | 微信登录 |
| iOS App | 手机号登录、游客模式 | 手机号登录 |
| Android App | 手机号登录、游客模式 | 手机号登录 |
| Web | 手机号登录、游客模式 | 手机号登录 |

## 核心功能

### 1. 平台自动检测
系统会自动检测当前运行环境，并提供相应的登录选项：

```javascript
import { authService } from './utils/auth.js'

// 获取平台信息
const platformInfo = authService.getPlatformInfo()
console.log('当前平台:', platformInfo.platform)
console.log('支持的登录方式:', platformInfo.supportedLoginMethods)
```

### 2. 统一登录接口
提供统一的登录入口，自动选择最适合的登录方式：

```javascript
// 自动选择登录方式
const result = await authService.login()

// 指定登录方式
const result = await authService.login({ method: 'phone', phone: '13800138000', code: '123456' })
```

### 3. 手机号验证码登录
完整的手机号验证码登录流程：

```javascript
// 发送验证码
const sendResult = await authService.sendVerificationCode('13800138000', 'login')

// 验证码登录
const loginResult = await authService.loginWithPhone('13800138000', '123456')
```

### 4. 微信登录（小程序专用）
针对微信小程序优化的登录流程：

```javascript
const result = await authService.loginWithWechat()
```

### 5. 游客模式
快速体验功能，无需注册：

```javascript
const result = await authService.guestLogin()
```

## 数据库更新

### 新增表结构

1. **用户表扩展** - 支持多平台用户标识
2. **验证码表** - 存储手机验证码
3. **用户平台关联表** - 支持一个用户多平台登录

### 执行数据库迁移

在Supabase SQL编辑器中执行 `supabase-schema.sql` 文件中的更新语句。

## 短信服务配置

### 支持的短信服务商

- 阿里云短信服务
- 腾讯云短信服务  
- 华为云短信服务

### 配置环境变量

```javascript
// 阿里云短信配置
process.env.SMS_PROVIDER = 'aliyun'
process.env.ALIYUN_ACCESS_KEY_ID = 'your-access-key-id'
process.env.ALIYUN_ACCESS_KEY_SECRET = 'your-access-key-secret'
process.env.ALIYUN_SMS_SIGN_NAME = '懂拍帝'
process.env.ALIYUN_SMS_TEMPLATE_CODE = 'SMS_123456789'
```

## 页面集成示例

### 1. 登录页面

```javascript
// pages/login/login.js
import { authService } from '../../utils/auth.js'

Page({
  data: {
    platformInfo: {},
    phone: '',
    code: ''
  },

  onLoad() {
    this.setData({
      platformInfo: authService.getPlatformInfo()
    })
  },

  async onLogin() {
    const { phone, code } = this.data
    const result = await authService.loginWithPhone(phone, code)
    
    if (result.success) {
      wx.switchTab({ url: '/pages/discover/index' })
    }
  }
})
```

### 2. 个人中心页面

```javascript
// pages/profile/index.js
import { authService } from '../../utils/auth.js'

Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const isLoggedIn = authService.checkLoginStatus()
    const userInfo = authService.getCurrentUser()
    
    this.setData({
      isLoggedIn,
      userInfo
    })
  },

  onLogout() {
    authService.logout()
    this.checkLoginStatus()
  }
})
```

## 测试功能

### 运行测试套件

```javascript
import { runAuthTests } from './utils/auth-test.js'

// 运行所有测试
const results = await runAuthTests()
console.log('测试结果:', results)
```

### 测试覆盖范围

- ✅ 平台检测功能
- ✅ 存储方法测试
- ✅ 手机号验证
- ✅ 验证码流程
- ✅ 各种登录方式
- ✅ 登录状态管理

## 最佳实践

### 1. 错误处理

```javascript
try {
  const result = await authService.login()
  if (!result.success) {
    wx.showToast({ title: result.message, icon: 'error' })
  }
} catch (error) {
  console.error('登录失败:', error)
  wx.showToast({ title: '网络错误，请重试', icon: 'error' })
}
```

### 2. 登录状态监听

```javascript
// 在app.js中监听登录状态变化
const app = getApp()
app.eventBus.on('login-success', (data) => {
  console.log('用户登录成功:', data.user)
  // 更新全局状态
  app.globalData.userInfo = data.user
})

app.eventBus.on('logout', () => {
  console.log('用户已登出')
  // 清理全局状态
  app.globalData.userInfo = null
})
```

### 3. 权限检查

```javascript
// 需要登录的页面
Page({
  async onLoad() {
    try {
      await authService.requireLogin()
      // 用户已登录，继续执行
    } catch (error) {
      // 用户取消登录，跳转到首页
      wx.switchTab({ url: '/pages/discover/index' })
    }
  }
})
```

## 部署注意事项

### 1. 环境配置
- 确保在不同环境中正确配置短信服务
- 检查Supabase连接配置
- 验证平台检测逻辑

### 2. 安全考虑
- 验证码有效期设置为5分钟
- 限制验证码尝试次数
- 使用HTTPS传输敏感数据

### 3. 用户体验
- 提供清晰的错误提示
- 支持登录状态持久化
- 优化网络异常处理

## 故障排除

### 常见问题

1. **平台检测错误**
   - 检查运行环境
   - 确认平台检测逻辑

2. **验证码发送失败**
   - 检查短信服务配置
   - 验证手机号格式

3. **登录状态丢失**
   - 检查存储方法实现
   - 确认数据持久化

### 调试工具

```javascript
// 启用调试模式
authService.debugMode = true

// 查看平台信息
console.log(authService.getPlatformInfo())

// 检查存储状态
console.log('用户信息:', authService.getStorage('userInfo'))
console.log('登录状态:', authService.getStorage('isLoggedIn'))
```

## 更新日志

### v2.0.0 (当前版本)
- ✅ 新增多平台支持
- ✅ 实现手机号验证码登录
- ✅ 优化微信登录流程
- ✅ 添加游客模式
- ✅ 完善错误处理
- ✅ 增加测试套件

### 后续计划
- 🔄 支持邮箱登录
- 🔄 添加第三方登录（QQ、微博等）
- 🔄 实现单点登录(SSO)
- 🔄 增加生物识别登录

## 技术支持

如有问题，请查看：
1. 本文档的故障排除部分
2. 运行测试套件检查系统状态
3. 查看控制台日志获取详细错误信息

---

**注意**: 本系统向后兼容，现有的登录功能不会受到影响。建议逐步迁移到新的多平台登录系统。
