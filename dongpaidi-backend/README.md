# 懂拍帝摄影平台后端服务

## 🚨 重要提醒

**本项目使用PM2进程管理器运行，修改代码后必须重启PM2服务！**

```bash
# 修改代码后重启服务
pm2 restart dongpaidi-integrated-api

# 查看服务状态
pm2 list

# 查看日志
pm2 logs dongpaidi-integrated-api
```

详细的开发注意事项请查看 [DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)

## 项目结构

```
dongpaidi-backend/
├── start-simple.js          # 主服务文件（PM2启动）
├── controllers/             # 控制器
│   └── BatchUploadController.js
├── services/               # 服务类
│   └── ImageProcessingService.js
├── utils/                  # 工具类
│   └── FileUploadUtils.js
├── uploads/                # 文件上传目录
│   └── images/
├── admin-panel/            # 管理后台前端
└── DEVELOPMENT_NOTES.md    # 开发注意事项
```

## API接口

### 基础接口
- `GET /api/v1/health` - 健康检查
- `GET /api/v1/users` - 用户列表
- `GET /api/v1/works` - 作品列表

### 文件上传接口（新增）
- `GET /api/v1/upload/config` - 获取上传配置
- `POST /api/v1/upload/single-image` - 单图上传
- `POST /api/v1/upload/batch-images` - 批量上传

## 开发环境

- Node.js
- Express.js
- PM2进程管理
- Nginx反向代理
- PostgreSQL数据库

## 快速开始

1. 安装依赖
```bash
npm install
```

2. 启动开发服务（如果PM2未运行）
```bash
pm2 start start-simple.js --name dongpaidi-integrated-api
```

3. 重启服务（修改代码后）
```bash
pm2 restart dongpaidi-integrated-api
```

4. 访问服务
- API: http://152.136.155.183/api/v1/
- 管理后台: http://152.136.155.183/admin/

## 注意事项

- 服务运行在端口3000，通过Nginx代理到80端口
- 所有API都需要会话认证（x-session-id头）
- 文件上传支持JPG、PNG、WebP格式，最大10MB
- 批量上传最多支持9个文件
