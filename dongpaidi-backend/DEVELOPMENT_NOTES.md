# 懂拍帝摄影平台开发注意事项

## 🚨 重要发现：服务部署架构

### 问题描述
在开发文件上传功能时，发现修改了 `start-simple.js` 文件后，直接运行 `node start-simple.js` 会报端口3000被占用的错误。

### 根本原因
**当前系统使用PM2进程管理器来管理后端服务，而不是直接运行Node.js进程。**

### 系统架构详情
```
外部访问 (http://152.136.155.183) 
    ↓
Nginx反向代理 (端口80)
    ↓  
PM2管理的Node.js服务 (端口3000)
    ↓
start-simple.js (实际的应用代码)
```

### PM2服务信息
- **服务名称**: `dongpaidi-integrated-api`
- **PM2 ID**: 0
- **脚本路径**: `/home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/start-simple.js`
- **工作目录**: `/home/ubuntu/dongpaidi-photography-platform`
- **端口**: 3000

### 正确的开发流程

#### ❌ 错误做法
```bash
# 这样会报端口被占用错误
node start-simple.js
```

#### ✅ 正确做法
```bash
# 1. 修改代码后，重启PM2服务
pm2 restart dongpaidi-integrated-api

# 或者使用PM2 ID
pm2 restart 0

# 2. 查看服务状态
pm2 list

# 3. 查看服务详情
pm2 show dongpaidi-integrated-api

# 4. 查看日志
pm2 logs dongpaidi-integrated-api
```

### 常用PM2命令

```bash
# 查看所有PM2进程
pm2 list

# 查看特定服务详情
pm2 show dongpaidi-integrated-api

# 重启服务
pm2 restart dongpaidi-integrated-api

# 停止服务
pm2 stop dongpaidi-integrated-api

# 查看实时日志
pm2 logs dongpaidi-integrated-api

# 查看最近1000行日志
pm2 logs dongpaidi-integrated-api --lines 1000

# 监控CPU和内存使用
pm2 monit
```

### 验证服务是否正常

```bash
# 检查健康状态
curl http://152.136.155.183/api/v1/health

# 检查管理后台
curl -I http://152.136.155.183/admin/

# 检查新增的上传配置API
curl http://152.136.155.183/api/v1/upload/config
```

### 调试技巧

#### 1. 查找占用端口的进程
```bash
sudo netstat -tlnp | grep :3000
```

#### 2. 查看进程详情
```bash
ps aux | grep node
sudo cat /proc/[PID]/cmdline
sudo ls -la /proc/[PID]/cwd
```

#### 3. 检查PM2环境变量
```bash
sudo cat /proc/[PID]/environ | tr '\0' '\n'
```

### 开发最佳实践

1. **修改代码后必须重启PM2服务**
   ```bash
   pm2 restart dongpaidi-integrated-api
   ```

2. **测试新功能前先验证现有功能**
   ```bash
   curl http://152.136.155.183/api/v1/health
   ```

3. **查看日志排查问题**
   ```bash
   pm2 logs dongpaidi-integrated-api --lines 100
   ```

4. **监控服务状态**
   ```bash
   pm2 monit
   ```

### 文件上传功能开发记录

#### 已完成的工作
- ✅ 创建文件存储目录结构 (`uploads/`)
- ✅ 创建FileUploadUtils工具类 (`utils/FileUploadUtils.js`)
- ✅ 创建ImageProcessingService服务类 (`services/ImageProcessingService.js`)
- ✅ 创建BatchUploadController控制器 (`controllers/BatchUploadController.js`)
- ✅ 扩展start-simple.js添加上传API路由
- ✅ 配置multer中间件处理文件上传
- ✅ 通过PM2重启服务加载新代码

#### 新增的API接口
- `GET /api/v1/upload/config` - 获取上传配置
- `POST /api/v1/upload/single-image` - 单图上传
- `POST /api/v1/upload/batch-images` - 批量上传

#### 验证结果
```bash
# 上传配置API正常工作
curl http://152.136.155.183/api/v1/upload/config
# 返回: {"success":true,"message":"上传配置获取成功","data":{...}}

# 健康检查API正常工作  
curl http://152.136.155.183/api/v1/health
# 返回: {"success":true,"message":"API服务运行正常",...}
```

### 注意事项

1. **Sharp库问题**: 当前Sharp库未正确安装，使用了模拟版本。生产环境需要安装真实的Sharp库。

2. **文件权限**: 确保uploads目录有正确的读写权限。

3. **Nginx配置**: 文件上传可能需要调整Nginx的client_max_body_size配置。

4. **安全考虑**: 所有上传API都需要认证（requireAuth中间件）。

---

**创建时间**: 2025-09-18  
**创建者**: Augment Agent  
**最后更新**: 2025-09-18  

**重要提醒**: 任何修改start-simple.js后，都必须执行 `pm2 restart dongpaidi-integrated-api` 来重启服务！
