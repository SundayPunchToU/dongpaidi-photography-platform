# 🌿 分支策略指南

本文档定义了懂拍帝摄影平台项目的Git分支管理策略，确保团队协作的高效性和代码质量。

## 🎯 分支策略概述

我们采用 **GitHub Flow** 的简化版本，结合项目特点进行调整：

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/user-auth (功能分支)
│   ├── feature/photo-upload (功能分支)
│   └── fix/chat-bug (修复分支)
└── hotfix/critical-security (热修复分支)
```

## 📋 分支类型说明

### 🌟 主要分支

#### `main` - 生产分支
- **用途**: 生产环境代码，随时可部署
- **保护**: 受分支保护规则保护
- **合并**: 只能通过PR合并
- **部署**: 自动部署到生产环境

#### `develop` - 开发分支
- **用途**: 集成开发中的功能
- **来源**: 从 `main` 分支创建
- **合并**: 功能完成后合并到此分支
- **部署**: 自动部署到测试环境

### 🔧 辅助分支

#### `feature/*` - 功能分支
- **命名**: `feature/功能描述`
- **来源**: 从 `develop` 分支创建
- **用途**: 开发新功能
- **生命周期**: 功能完成后删除

#### `fix/*` - 修复分支
- **命名**: `fix/问题描述`
- **来源**: 从 `develop` 分支创建
- **用途**: 修复非紧急Bug
- **生命周期**: 修复完成后删除

#### `hotfix/*` - 热修复分支
- **命名**: `hotfix/紧急问题描述`
- **来源**: 从 `main` 分支创建
- **用途**: 修复生产环境紧急问题
- **合并**: 同时合并到 `main` 和 `develop`

## 🔄 工作流程

### 1️⃣ 功能开发流程

```bash
# 1. 切换到develop分支并更新
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/user-profile-edit

# 3. 开发功能...
# 进行代码开发和测试

# 4. 提交代码
git add .
git commit -m "✨ feat: 添加用户资料编辑功能"

# 5. 推送分支
git push origin feature/user-profile-edit

# 6. 创建Pull Request
# 在GitHub上创建PR，目标分支为develop

# 7. 代码审查和合并
# 审查通过后合并到develop分支

# 8. 删除功能分支
git branch -d feature/user-profile-edit
git push origin --delete feature/user-profile-edit
```

### 2️⃣ Bug修复流程

```bash
# 1. 从develop创建修复分支
git checkout develop
git pull origin develop
git checkout -b fix/chat-message-duplicate

# 2. 修复Bug...
# 进行问题定位和修复

# 3. 提交修复
git add .
git commit -m "🐛 fix: 修复聊天消息重复显示问题"

# 4. 推送和创建PR
git push origin fix/chat-message-duplicate
# 在GitHub上创建PR到develop分支
```

### 3️⃣ 热修复流程

```bash
# 1. 从main创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/security-vulnerability

# 2. 修复紧急问题...
# 快速修复生产环境问题

# 3. 提交修复
git add .
git commit -m "🔒 hotfix: 修复用户认证安全漏洞"

# 4. 合并到main
git checkout main
git merge hotfix/security-vulnerability
git push origin main

# 5. 合并到develop
git checkout develop
git merge hotfix/security-vulnerability
git push origin develop

# 6. 删除热修复分支
git branch -d hotfix/security-vulnerability
git push origin --delete hotfix/security-vulnerability
```

### 4️⃣ 发布流程

```bash
# 1. 从develop创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 准备发布...
# 更新版本号、文档等

# 3. 测试和修复
# 在发布分支上进行最后的测试和小修复

# 4. 合并到main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# 5. 合并回develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 6. 删除发布分支
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

## 📝 分支命名规范

### 功能分支
- `feature/user-authentication` - 用户认证功能
- `feature/photo-upload` - 照片上传功能
- `feature/chat-system` - 聊天系统
- `feature/appointment-booking` - 约拍预订

### 修复分支
- `fix/login-error` - 登录错误修复
- `fix/image-loading` - 图片加载问题
- `fix/memory-leak` - 内存泄漏修复

### 热修复分支
- `hotfix/security-patch` - 安全补丁
- `hotfix/critical-bug` - 严重Bug修复
- `hotfix/performance-issue` - 性能问题

## 🔒 分支保护规则

### `main` 分支保护
- ✅ 禁止直接推送
- ✅ 要求PR审查
- ✅ 要求状态检查通过
- ✅ 要求分支为最新
- ✅ 包括管理员

### `develop` 分支保护
- ✅ 禁止直接推送
- ✅ 要求PR审查
- ✅ 要求状态检查通过

## 📋 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能开发
git commit -m "✨ feat(auth): 添加微信登录功能"

# Bug修复
git commit -m "🐛 fix(chat): 修复消息发送失败问题"

# 文档更新
git commit -m "📝 docs: 更新API使用说明"

# 样式调整
git commit -m "💄 style(ui): 优化按钮样式"

# 重构代码
git commit -m "♻️ refactor(api): 重构用户API接口"

# 性能优化
git commit -m "⚡ perf(image): 优化图片加载性能"

# 测试相关
git commit -m "✅ test(auth): 添加登录功能测试"

# 构建相关
git commit -m "🔧 chore(deps): 更新依赖包版本"
```

## 🚀 自动化集成

### GitHub Actions触发
- **Push到main**: 部署到生产环境
- **Push到develop**: 部署到测试环境
- **创建PR**: 运行CI检查
- **创建Tag**: 创建发布版本

### 状态检查
- ✅ 代码质量检查 (ESLint)
- ✅ 构建测试
- ✅ 单元测试
- ✅ 安全扫描

## 📊 分支管理最佳实践

### ✅ 推荐做法
- 保持分支名称简洁明了
- 及时删除已合并的分支
- 定期同步develop分支
- 小而频繁的提交
- 详细的提交信息
- 充分的代码审查

### ❌ 避免做法
- 长期存在的功能分支
- 直接在main分支开发
- 跳过代码审查
- 模糊的提交信息
- 大而复杂的PR
- 忽略冲突解决

## 🔄 分支同步

### 定期同步develop分支
```bash
# 每天开始工作前
git checkout develop
git pull origin develop

# 在功能分支中同步最新代码
git checkout feature/your-feature
git merge develop
```

### 解决合并冲突
```bash
# 1. 合并时出现冲突
git merge develop

# 2. 手动解决冲突文件
# 编辑冲突文件，解决冲突标记

# 3. 标记冲突已解决
git add .
git commit -m "🔀 merge: 解决与develop分支的冲突"
```

## 📞 获取帮助

如果对分支策略有疑问：
1. 查看本文档
2. 在团队群中询问
3. 创建GitHub Discussion
4. 联系项目负责人

---

**遵循分支策略，让团队协作更高效！** 🌟
