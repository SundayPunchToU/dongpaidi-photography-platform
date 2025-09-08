# 懂拍帝管理系统

基于React + Ant Design的后端管理界面，提供用户管理、作品审核、数据统计等功能。

## 功能特性

### ✅ 已实现功能
- 🔐 **管理员登录认证**
  - JWT token认证
  - 自动token刷新
  - 权限验证

- 📊 **仪表盘**
  - 系统概览统计
  - 数据趋势图表
  - 快速操作入口
  - 系统状态监控

- 👥 **用户管理**
  - 用户列表查看
  - 用户搜索和筛选
  - 用户认证状态管理
  - 用户删除功能
  - 用户统计数据

### 🚧 开发中功能
- 🖼️ **作品管理**
  - 作品列表和详情
  - 作品审核功能
  - 作品分类管理
  - 作品统计分析

- 📅 **约拍管理**
  - 约拍信息管理
  - 状态跟踪
  - 纠纷处理

- ⚙️ **系统设置**
  - 系统参数配置
  - 权限管理
  - 操作日志

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x
- **路由管理**: React Router 6
- **状态管理**: Zustand
- **数据请求**: React Query + Axios
- **图表组件**: Recharts
- **表单处理**: React Hook Form + Yup
- **构建工具**: Vite

## 快速开始

### 1. 安装依赖
```bash
# 在项目根目录
npm run admin:install
```

### 2. 启动开发服务器
```bash
# 确保后端API服务已启动（端口3000）
npm run dev

# 启动管理界面开发服务器
npm run admin:dev
```

### 3. 访问管理界面
打开浏览器访问：http://localhost:3001

### 4. 登录管理系统
```
邮箱：admin@dongpaidi.com
密码：admin123456
```

## 项目结构

```
admin-panel/
├── src/
│   ├── components/          # 公共组件
│   │   └── Layout/         # 布局组件
│   ├── pages/              # 页面组件
│   │   ├── Login.tsx       # 登录页面
│   │   ├── Dashboard.tsx   # 仪表盘
│   │   ├── UserManagement.tsx    # 用户管理
│   │   ├── WorkManagement.tsx    # 作品管理
│   │   ├── AppointmentManagement.tsx  # 约拍管理
│   │   └── SystemSettings.tsx    # 系统设置
│   ├── services/           # API服务
│   │   └── api.ts         # API接口定义
│   ├── stores/            # 状态管理
│   │   └── authStore.ts   # 认证状态
│   ├── utils/             # 工具函数
│   ├── hooks/             # 自定义Hooks
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 应用入口
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── index.html            # HTML模板
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
└── package.json          # 项目配置
```

## API接口

管理界面通过以下API与后端通信：

### 认证接口
- `POST /api/v1/admin/auth/admin/login` - 管理员登录
- `GET /api/v1/auth/me` - 获取当前用户信息
- `POST /api/v1/auth/refresh` - 刷新token

### 统计接口
- `GET /api/v1/admin/stats` - 获取总体统计
- `GET /api/v1/admin/stats/trend` - 获取趋势数据

### 用户管理接口
- `GET /api/v1/admin/users` - 获取用户列表
- `GET /api/v1/admin/users/stats` - 获取用户统计
- `PATCH /api/v1/admin/users/:id/status` - 更新用户状态
- `DELETE /api/v1/admin/users/:id` - 删除用户

## 开发指南

### 添加新页面
1. 在 `src/pages/` 目录创建新的页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/Layout/AdminLayout.tsx` 中添加菜单项

### 添加新API接口
1. 在 `src/services/api.ts` 中定义API接口
2. 使用React Query进行数据管理
3. 在组件中调用API接口

### 状态管理
使用Zustand进行状态管理，主要状态包括：
- 用户认证状态（authStore）
- 其他业务状态可根据需要添加

## 部署

### 构建生产版本
```bash
npm run admin:build
```

### 部署到服务器
构建完成后，将 `dist/` 目录的内容部署到Web服务器即可。

建议配置：
- 使用Nginx作为Web服务器
- 配置反向代理到后端API
- 启用Gzip压缩
- 配置缓存策略

## 注意事项

1. **权限控制**: 所有管理功能都需要管理员权限
2. **数据安全**: 敏感操作会记录操作日志
3. **响应式设计**: 支持桌面和移动设备访问
4. **错误处理**: 统一的错误处理和用户提示
5. **性能优化**: 使用React Query进行数据缓存和优化

## 故障排除

### 常见问题

1. **登录失败**
   - 检查后端API服务是否启动
   - 确认管理员账号是否已创建
   - 查看浏览器控制台错误信息

2. **API请求失败**
   - 检查网络连接
   - 确认API接口地址是否正确
   - 查看后端服务日志

3. **页面加载异常**
   - 清除浏览器缓存
   - 检查JavaScript控制台错误
   - 确认依赖是否正确安装

### 开发调试
- 使用浏览器开发者工具调试
- 查看Network面板检查API请求
- 使用React Developer Tools调试组件状态
