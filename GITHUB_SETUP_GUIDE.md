# 🚀 GitHub仓库设置指南

本指南将帮助您将懂拍帝摄影平台项目推送到GitHub并设置团队协作环境。

## 📋 前置条件

- ✅ 已安装Git并配置用户信息
- ✅ 拥有GitHub账号
- ✅ 本地项目已完成Git初始化和提交

## 🔧 第一步：创建GitHub仓库

### 1️⃣ 登录GitHub
访问 [GitHub.com](https://github.com) 并登录您的账号

### 2️⃣ 创建新仓库
1. 点击右上角的 "+" 按钮
2. 选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `dongpaidi-photography-platform`
   - **Description**: `🎯 懂拍帝摄影平台 - 基于微信小程序的专业摄影作品分享和约拍平台`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
   - **不要**添加 .gitignore 或 license (我们已经有了)

### 3️⃣ 创建仓库
点击 "Create repository" 按钮

## 🔗 第二步：连接本地仓库到GitHub

### 1️⃣ 添加远程仓库
```bash
# 添加GitHub远程仓库
git remote add origin https://github.com/your-username/dongpaidi-photography-platform.git

# 验证远程仓库
git remote -v
```

### 2️⃣ 推送代码到GitHub
```bash
# 推送主分支到GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ 验证推送成功
刷新GitHub仓库页面，确认代码已成功推送

## ⚙️ 第三步：配置仓库设置

### 1️⃣ 仓库基本设置
1. 进入仓库的 "Settings" 标签页
2. 在 "General" 部分：
   - 确认仓库名称和描述
   - 设置默认分支为 `main`
   - 启用 "Issues" 和 "Projects"
   - 启用 "Discussions" (可选)

### 2️⃣ 分支保护规则
1. 在 "Settings" → "Branches" 中
2. 点击 "Add rule" 添加分支保护规则
3. 配置 `main` 分支保护：
   - **Branch name pattern**: `main`
   - ✅ **Require pull request reviews before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Include administrators**

### 3️⃣ 配置GitHub Pages (可选)
1. 在 "Settings" → "Pages" 中
2. 选择 "Deploy from a branch"
3. 选择 `main` 分支的 `/docs` 文件夹
4. 点击 "Save"

## 👥 第四步：团队协作设置

### 1️⃣ 添加协作者
1. 在 "Settings" → "Collaborators" 中
2. 点击 "Add people"
3. 输入团队成员的GitHub用户名或邮箱
4. 选择适当的权限级别：
   - **Read**: 只读权限
   - **Triage**: 可以管理Issues和PR
   - **Write**: 可以推送代码
   - **Maintain**: 可以管理仓库设置
   - **Admin**: 完全管理权限

### 2️⃣ 创建团队 (组织账号)
如果使用GitHub组织账号：
1. 在组织设置中创建团队
2. 将团队成员添加到相应团队
3. 为团队分配仓库权限

### 3️⃣ 设置标签 (Labels)
在 "Issues" → "Labels" 中添加项目标签：

```
🐛 bug - Bug报告
✨ enhancement - 功能增强
📝 documentation - 文档相关
🎨 design - 设计相关
⚡ performance - 性能优化
🔒 security - 安全相关
🧪 testing - 测试相关
🔧 maintenance - 维护相关
❓ question - 问题咨询
💡 idea - 想法建议
```

## 🔄 第五步：建立分支策略

### 推荐的Git Flow策略

```bash
# 创建开发分支
git checkout -b develop
git push -u origin develop

# 创建功能分支示例
git checkout develop
git checkout -b feature/user-authentication
# 开发完成后
git checkout develop
git merge feature/user-authentication
git push origin develop

# 创建发布分支
git checkout develop
git checkout -b release/v1.0.0
# 测试和修复
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags
```

### 分支命名规范
- `main` - 生产分支
- `develop` - 开发分支
- `feature/功能名` - 功能分支
- `fix/问题描述` - 修复分支
- `release/版本号` - 发布分支
- `hotfix/紧急修复` - 热修复分支

## 🚀 第六步：配置自动化

### 1️⃣ GitHub Actions
我们已经创建了 `.github/workflows/ci.yml` 文件，它将自动：
- 代码质量检查
- 构建测试
- 安全扫描
- 自动部署

### 2️⃣ 配置Secrets
在 "Settings" → "Secrets and variables" → "Actions" 中添加：
```
SUPABASE_URL - Supabase项目URL
SUPABASE_ANON_KEY - Supabase匿名密钥
WECHAT_APP_ID - 微信小程序AppID
WECHAT_APP_SECRET - 微信小程序密钥
```

### 3️⃣ 配置环境
在 "Settings" → "Environments" 中创建：
- `development` - 开发环境
- `staging` - 测试环境
- `production` - 生产环境

## 📋 第七步：项目管理

### 1️⃣ 创建项目看板
1. 在 "Projects" 标签页中点击 "New project"
2. 选择 "Board" 模板
3. 创建列：
   - 📋 Backlog (待办)
   - 🔄 In Progress (进行中)
   - 👀 In Review (审查中)
   - ✅ Done (完成)

### 2️⃣ 设置里程碑
在 "Issues" → "Milestones" 中创建：
- `v1.0.0 - MVP版本` - 基础功能实现
- `v1.1.0 - 功能增强` - 用户体验优化
- `v2.0.0 - 重大更新` - 新功能模块

### 3️⃣ 创建Issue模板
我们已经创建了Issue模板，位于：
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

## 🔒 第八步：安全设置

### 1️⃣ 启用安全功能
在 "Settings" → "Security" 中启用：
- ✅ **Dependency graph**
- ✅ **Dependabot alerts**
- ✅ **Dependabot security updates**
- ✅ **Code scanning alerts**

### 2️⃣ 配置代码扫描
GitHub会自动使用我们在CI中配置的CodeQL扫描

### 3️⃣ 设置访问权限
- 定期审查协作者权限
- 使用最小权限原则
- 启用双因素认证

## 📊 第九步：监控和分析

### 1️⃣ 启用Insights
查看仓库的 "Insights" 标签页了解：
- 代码提交频率
- 贡献者活动
- 流量统计
- 依赖关系

### 2️⃣ 设置通知
在个人设置中配置GitHub通知偏好

## ✅ 完成检查清单

- [ ] GitHub仓库已创建
- [ ] 本地代码已推送到GitHub
- [ ] 分支保护规则已设置
- [ ] 团队成员已添加
- [ ] 标签和里程碑已创建
- [ ] GitHub Actions已配置
- [ ] 安全功能已启用
- [ ] 项目看板已创建
- [ ] 文档已完善

## 🎉 恭喜！

您的懂拍帝摄影平台项目现在已经成功设置在GitHub上，具备了：

- ✅ 专业的项目展示
- ✅ 完整的团队协作流程
- ✅ 自动化的CI/CD流水线
- ✅ 标准化的贡献指南
- ✅ 安全的代码管理

## 📞 获取帮助

如果在设置过程中遇到问题：
1. 查看GitHub官方文档
2. 在项目Discussions中提问
3. 联系项目维护者

---

**祝您的项目开发顺利！** 🚀
