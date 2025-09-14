# 懂拍帝后端服务

重构后的模块化后端服务，提供清晰的代码组织和可扩展性。

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   └── index.js      # 主配置文件
│   ├── middleware/       # 中间件
│   │   ├── auth.js       # 认证中间件
│   │   └── errorHandler.js # 错误处理中间件
│   ├── models/           # 数据模型
│   │   └── index.js      # 数据模型定义
│   ├── routes/           # 路由模块
│   │   ├── auth.js       # 认证路由
│   │   ├── users.js      # 用户管理路由
│   │   ├── works.js      # 作品管理路由
│   │   ├── appointments.js # 约拍管理路由
│   │   ├── messages.js   # 消息管理路由
│   │   ├── payments.js   # 支付管理路由
│   │   └── stats.js      # 统计数据路由
│   ├── utils/            # 工具函数
│   │   ├── logger.js     # 日志工具
│   │   └── response.js   # 响应处理工具
│   └── index.js          # 主入口文件
├── .env.example          # 环境变量示例
├── package.json          # 项目依赖
└── README.md            # 项目文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，根据实际情况修改配置
```

### 3. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start

# 使用PM2启动
pm2 start src/index.js --name dongpaidi-api
```

## 📡 API 端点

### 认证相关
- `POST /api/v1/admin/login` - 管理员登录
- `GET /api/v1/admin/profile` - 获取用户信息
- `POST /api/v1/admin/logout` - 管理员登出
- `POST /api/v1/admin/change-password` - 修改密码

### 用户管理
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/stats` - 获取用户统计
- `GET /api/v1/users/:id` - 获取用户详情
- `PUT /api/v1/users/:id` - 更新用户信息
- `DELETE /api/v1/users/:id` - 删除用户

### 作品管理
- `GET /api/v1/works` - 获取作品列表
- `GET /api/v1/works/stats` - 获取作品统计
- `GET /api/v1/works/:id` - 获取作品详情
- `PUT /api/v1/works/:id/status` - 更新作品状态
- `DELETE /api/v1/works/:id` - 删除作品

### 约拍管理
- `GET /api/v1/appointments` - 获取约拍列表
- `GET /api/v1/appointments/stats` - 获取约拍统计
- `GET /api/v1/appointments/:id` - 获取约拍详情
- `PUT /api/v1/appointments/:id/status` - 更新约拍状态
- `DELETE /api/v1/appointments/:id` - 删除约拍

### 消息管理
- `GET /api/v1/messages/unread-count` - 获取未读消息数量
- `GET /api/v1/messages/conversations` - 获取对话列表

### 支付管理
- `GET /api/v1/payments/admin/stats` - 获取支付统计
- `GET /api/v1/payments/admin/orders` - 获取订单列表

### 统计数据
- `GET /api/v1/stats` - 获取系统总体统计
- `GET /api/v1/stats/trend` - 获取趋势数据

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 运行环境 | development |
| `ADMIN_USERNAME` | 管理员用户名 | admin@dongpaidi.com |
| `ADMIN_PASSWORD` | 管理员密码 | admin123456 |
| `SESSION_SECRET` | 会话密钥 | dongpaidi-secret-key |
| `LOG_LEVEL` | 日志级别 | info |

### 配置文件

主配置文件位于 `src/config/index.js`，包含：
- 服务器配置
- 管理员账户配置
- 安全配置
- 日志配置
- API配置
- 数据库配置（为将来扩展准备）

## 🛡️ 安全特性

- 会话管理和认证中间件
- 请求参数验证
- 错误处理和日志记录
- CORS配置
- 请求体大小限制

## 📊 日志系统

支持多级别日志记录：
- `ERROR` - 错误信息
- `WARN` - 警告信息
- `INFO` - 一般信息
- `DEBUG` - 调试信息

日志可以输出到控制台和文件，通过环境变量控制。

## 🔄 数据模型

采用模块化的数据模型设计：
- `BaseModel` - 基础模型类，提供通用CRUD操作
- `UserModel` - 用户模型
- `WorkModel` - 作品模型
- `AppointmentModel` - 约拍模型
- `MessageModel` - 消息模型
- `PaymentModel` - 支付模型
- `StatsModel` - 统计模型

## 🚀 部署说明

### 使用PM2部署

```bash
# 启动服务
pm2 start src/index.js --name dongpaidi-api

# 查看状态
pm2 status

# 查看日志
pm2 logs dongpaidi-api

# 重启服务
pm2 restart dongpaidi-api
```

### Nginx配置

确保Nginx配置正确代理API请求到后端服务。

## 🔮 未来扩展

- 数据库集成（MySQL/PostgreSQL/MongoDB）
- Redis缓存支持
- 文件上传功能
- 邮件通知系统
- 实时消息推送
- API限流和防护
- 单元测试和集成测试

## 📝 开发指南

### 添加新的API端点

1. 在相应的路由文件中添加路由处理函数
2. 使用统一的响应格式（`res.success()` 或 `res.error()`）
3. 添加适当的JSDoc注释
4. 更新本文档

### 错误处理

使用统一的错误处理机制：
- 抛出 `AppError` 实例
- 使用 `asyncHandler` 包装异步路由处理函数
- 记录详细的错误日志

### 日志记录

使用统一的日志工具：
```javascript
const logger = require('../utils/logger');

logger.info('操作成功', { userId: 123 });
logger.error('操作失败', { error: error.message });
```
