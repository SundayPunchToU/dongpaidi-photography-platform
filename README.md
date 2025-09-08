# 🎯 懂拍帝摄影平台 (Dongpaidi Photography Platform)

<div align="center">

![Platform](https://img.shields.io/badge/Platform-WeChat%20MiniProgram-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node.js-16%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-4.5%2B-blue)

**一个基于微信小程序的专业摄影作品分享和约拍平台**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发指南](#-开发指南) • [部署](#-部署) • [贡献](#-贡献指南)

</div>

---

## ✨ 功能特性

### 🎨 核心功能
- **📱 微信小程序原生开发** - 流畅的用户体验
- **🔐 多平台登录系统** - 支持微信登录、手机号登录
- **📸 作品发布与浏览** - 高质量摄影作品展示
- **💬 实时聊天功能** - WebSocket实时通信
- **📅 约拍预约系统** - 智能匹配摄影师与客户
- **🛒 摄影服务市场** - 专业摄影服务交易平台
- **👤 个人中心管理** - 完整的用户资料管理

### 🛠️ 技术亮点
- **现代化UI设计** - 基于TDesign设计系统
- **响应式布局** - 适配各种屏幕尺寸
- **离线开发支持** - 完整的Mock数据系统
- **类型安全** - TypeScript后端开发
- **实时通信** - WebSocket消息推送
- **云端存储** - Supabase数据库集成

---

## 🚀 快速开始

### 📋 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 16.0.0 | JavaScript运行环境 |
| 微信开发者工具 | 最新版 | 小程序开发IDE |
| Git | >= 2.0 | 版本控制工具 |

### 🔧 安装步骤

#### 1️⃣ 克隆项目
```bash
git clone https://github.com/your-username/dongpaidi-photography-platform.git
cd dongpaidi-photography-platform
```

#### 2️⃣ 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖 (可选)
cd dongpaidi-backend
npm install
cd ..
```

#### 3️⃣ 环境配置
```bash
# 复制环境配置模板
cp config/env.example.js config/env.js

# 编辑配置文件，填入你的配置信息
# 包括: Supabase URL、API密钥、微信AppID等
```

#### 4️⃣ 启动开发
1. 打开微信开发者工具
2. 导入项目目录
3. 配置AppID (测试号或正式AppID)
4. 点击编译，开始开发！

### 🎯 快速体验 (Mock模式)
```javascript
// 在 config.js 中设置
export default {
  isMock: true,  // 启用Mock模式，无需后端服务
  // ... 其他配置
}
```

---

## 📁 项目结构

```
dongpaidi-photography-platform/
├── 📱 pages/                    # 小程序页面
│   ├── discover/               # 发现页面
│   ├── works/                  # 作品相关页面
│   ├── chat/                   # 聊天页面
│   ├── appointment/            # 约拍页面
│   └── my/                     # 个人中心
├── 🧩 components/              # 自定义组件
│   ├── work-card/             # 作品卡片组件
│   ├── photo-grid/            # 照片网格组件
│   └── smart-loading/         # 智能加载组件
├── 🛠️ utils/                   # 工具函数
│   ├── auth.js                # 认证工具
│   ├── api.js                 # API封装
│   └── eventBus.js            # 事件总线
├── 🌐 api/                     # API接口
│   ├── request.js             # 请求封装
│   ├── works.js               # 作品API
│   └── appointments.js        # 约拍API
├── 🎭 mock/                    # 模拟数据
│   ├── works/                 # 作品模拟数据
│   ├── appointments/          # 约拍模拟数据
│   └── index.js               # Mock入口
├── ⚙️ config/                  # 配置文件
│   ├── env.example.js         # 环境配置模板
│   ├── env-loader.js          # 配置加载器
│   └── index.js               # 主配置文件
├── 🖥️ dongpaidi-backend/       # 后端服务
│   ├── src/                   # TypeScript源码
│   ├── prisma/                # 数据库模型
│   └── admin-panel/           # 管理后台
├── 📚 docs/                    # 项目文档
│   ├── api/                   # API文档
│   ├── architecture/          # 架构文档
│   └── standards/             # 开发规范
└── 🎨 styles/                  # 样式文件
    └── theme-photography.less  # 摄影主题样式
```

---

## 🔧 开发指南

### 🎯 开发模式

#### Mock模式 (推荐用于前端开发)
```javascript
// config.js
export default {
  isMock: true,
  baseUrl: '', // Mock模式下不需要
  // 完整的模拟数据，支持所有功能开发
}
```

**优势:**
- ✅ 无需后端服务即可开发
- ✅ 完整的功能模拟
- ✅ 快速原型开发
- ✅ 离线开发支持

#### API模式 (用于联调测试)
```javascript
// config.js
export default {
  isMock: false,
  baseUrl: 'https://your-api-domain.com',
  // 连接真实后端服务
}
```

### 📝 代码规范

#### JavaScript/ES6+
```javascript
// ✅ 推荐写法
import { worksAPI } from '../utils/supabase-client.js';

const fetchWorks = async () => {
  try {
    const response = await worksAPI.getWorks();
    return response.data;
  } catch (error) {
    console.error('获取作品失败:', error);
    throw error;
  }
};
```

---

## 🚀 部署

### 📱 前端部署 (微信小程序)

#### 1️⃣ 准备发布
```bash
# 1. 确保代码已提交
git add .
git commit -m "准备发布版本 v1.0.0"

# 2. 切换到生产配置
# 在 config.js 中设置 isMock: false
# 配置正确的 baseUrl
```

#### 2️⃣ 上传代码
1. 打开微信开发者工具
2. 点击工具栏"上传"按钮
3. 填写版本号 (如: 1.0.0)
4. 填写项目备注
5. 点击上传

#### 3️⃣ 提交审核
1. 登录微信公众平台
2. 进入"版本管理"
3. 选择刚上传的版本
4. 点击"提交审核"
5. 填写审核信息

### 🖥️ 后端部署

详细部署指南请参考: [`dongpaidi-backend/README.md`](./dongpaidi-backend/README.md)

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 🔄 贡献流程

#### 1️⃣ Fork项目
```bash
# 在GitHub上点击Fork按钮
# 然后克隆你的Fork
git clone https://github.com/your-username/dongpaidi-photography-platform.git
```

#### 2️⃣ 创建特性分支
```bash
# 创建并切换到新分支
git checkout -b feature/amazing-feature

# 或者修复bug
git checkout -b fix/bug-description
```

#### 3️⃣ 提交更改
```bash
# 添加更改
git add .

# 提交 (使用规范的提交信息)
git commit -m "✨ feat: 添加作品收藏功能"
```

#### 4️⃣ 推送和PR
```bash
# 推送到你的Fork
git push origin feature/amazing-feature

# 在GitHub上创建Pull Request
```

---

## 📄 许可证

本项目采用 **MIT 许可证** - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 📞 联系我们

### 🌟 如果这个项目对你有帮助，请给我们一个Star！

**📧 邮箱**: your-email@example.com
**🐛 问题反馈**: [GitHub Issues](https://github.com/your-username/dongpaidi-photography-platform/issues)
**💬 讨论交流**: [GitHub Discussions](https://github.com/your-username/dongpaidi-photography-platform/discussions)

**Made with ❤️ by Dongpaidi Team**
