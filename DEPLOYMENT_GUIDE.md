# 懂拍帝多平台登录系统部署指南

## 🚀 快速开始

### 1. 系统要求
- 微信开发者工具 (小程序开发)
- Node.js 16+ (如需本地开发服务)
- Supabase 账号 (后端数据库)

### 2. 环境配置

#### 2.1 配置文件设置
编辑 `config/index.js` 文件：

```javascript
export const config = {
  // 开发环境配置
  auth: {
    development: {
      enableTestMode: true,    // 启用测试模式
      showTestEntry: true,     // 显示测试入口
      mockSMS: true,          // 使用模拟短信
      debugMode: true         // 启用调试模式
    },
    
    // 生产环境配置
    production: {
      enableTestMode: false,
      showTestEntry: false,
      mockSMS: false,
      debugMode: false
    }
  }
};
```

#### 2.2 Supabase 配置
确保 `utils/supabase-client.js` 中的配置正确：

```javascript
const supabaseUrl = 'your-supabase-url'
const supabaseKey = 'your-supabase-anon-key'
```

### 3. 数据库初始化

#### 3.1 执行数据库迁移
在 Supabase SQL 编辑器中执行 `supabase-schema.sql` 文件中的所有 SQL 语句。

#### 3.2 验证表结构
确保以下表已创建：
- `users` - 用户表（支持多平台）
- `verification_codes` - 验证码表
- `user_platforms` - 用户平台关联表
- 其他业务表...

### 4. 短信服务配置（可选）

#### 4.1 阿里云短信服务
```javascript
// 在生产环境中设置环境变量
process.env.SMS_PROVIDER = 'aliyun'
process.env.ALIYUN_ACCESS_KEY_ID = 'your-access-key-id'
process.env.ALIYUN_ACCESS_KEY_SECRET = 'your-access-key-secret'
process.env.ALIYUN_SMS_SIGN_NAME = '懂拍帝'
process.env.ALIYUN_SMS_TEMPLATE_CODE = 'SMS_123456789'
```

#### 4.2 开发环境
开发环境默认使用模拟短信服务，验证码会在控制台显示。

## 📱 平台部署

### 1. 微信小程序部署

#### 1.1 开发环境测试
1. 使用微信开发者工具打开项目
2. 确保 `app.json` 中包含所有必要页面
3. 测试微信登录和游客模式功能

#### 1.2 发布到生产环境
1. 在 `config/index.js` 中切换到生产配置
2. 上传代码并提交审核
3. 发布版本

### 2. 移动App部署

#### 2.1 React Native 集成
```javascript
// 在 React Native 项目中集成
import { authService } from './utils/auth.js'

// 使用手机号登录
const result = await authService.loginWithPhone(phone, code)
```

#### 2.2 原生App集成
可以通过 WebView 或 JSBridge 集成认证服务。

## 🧪 测试验证

### 1. 功能测试

#### 1.1 使用测试页面
1. 在开发环境中，登录页面会显示"多平台登录测试"入口
2. 点击进入测试页面
3. 测试各种登录方式

#### 1.2 手动测试流程
```
1. 微信登录测试
   - 点击微信登录按钮
   - 验证授权流程
   - 检查用户信息同步

2. 手机号登录测试
   - 输入测试手机号：13800138000
   - 点击发送验证码
   - 在弹窗中查看验证码
   - 输入验证码完成登录

3. 游客模式测试
   - 点击游客登录
   - 验证游客用户创建
   - 检查功能限制提示
```

### 2. 自动化测试

#### 2.1 运行测试套件
```javascript
import { runSimpleTests } from './utils/auth-simple-examples.js'

// 运行基础功能测试
const results = runSimpleTests()
console.log('测试结果:', results)
```

#### 2.2 测试覆盖范围
- ✅ 平台检测功能
- ✅ 存储方法测试
- ✅ 手机号验证
- ✅ 登录方式检测
- ✅ 用户状态管理

## 🔧 故障排除

### 1. 常见问题

#### 1.1 编译错误：process is not defined
**解决方案**: 已修复，SMS服务现在兼容微信小程序环境。

#### 1.2 验证码发送失败
**检查项**:
- 短信服务配置是否正确
- 手机号格式是否有效
- 网络连接是否正常

#### 1.3 登录状态丢失
**检查项**:
- 存储方法是否正常工作
- 用户数据是否正确保存
- 平台检测是否准确

### 2. 调试工具

#### 2.1 启用调试模式
```javascript
// 在 config/index.js 中设置
auth: {
  development: {
    debugMode: true
  }
}
```

#### 2.2 查看调试信息
```javascript
// 查看平台信息
console.log(authService.getPlatformInfo())

// 查看当前配置
console.log(authService.envConfig)

// 查看存储状态
console.log(authService.getStorage('userInfo'))
```

## 📊 监控和维护

### 1. 性能监控
- 监控登录成功率
- 跟踪验证码发送成功率
- 记录用户登录方式偏好

### 2. 数据维护
- 定期清理过期验证码
- 监控用户增长趋势
- 分析平台使用情况

### 3. 安全维护
- 定期更新API密钥
- 监控异常登录行为
- 检查数据库安全设置

## 🔄 版本更新

### 当前版本: v2.0.0
- ✅ 多平台登录支持
- ✅ 手机号验证码登录
- ✅ 微信小程序优化
- ✅ 配置化管理
- ✅ 测试工具集成

### 后续计划
- 🔄 邮箱登录支持
- 🔄 第三方登录集成
- 🔄 单点登录(SSO)
- 🔄 生物识别登录

## 📞 技术支持

### 问题反馈
1. 查看本文档的故障排除部分
2. 运行测试套件检查系统状态
3. 查看控制台日志获取详细错误信息

### 联系方式
- 项目文档: `MULTI_PLATFORM_LOGIN_GUIDE.md`
- 使用示例: `utils/auth-simple-examples.js`
- 测试工具: `pages/login/test-login.js`

---

**注意**: 
- 生产环境部署前请务必测试所有功能
- 确保敏感配置信息的安全性
- 定期备份用户数据和配置文件
