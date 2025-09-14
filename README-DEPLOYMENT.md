# 懂拍帝摄影平台 - 自动化部署指南

## 🚀 快速开始

### 一键自动部署（推荐）

```bash
# 完全自动化部署，无需人工干预
sudo ./auto-deploy.sh
```

### 分步部署（适合调试）

```bash
# 1. 主部署脚本（交互式）
sudo ./deploy.sh

# 2. 强制执行，跳过确认
sudo ./deploy.sh --force

# 3. 分步执行，每步确认
sudo ./deploy.sh --step-by-step

# 4. 演练模式，查看执行计划
sudo ./deploy.sh --dry-run
```

## 📋 脚本说明

### 核心部署脚本

| 脚本名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| `auto-deploy.sh` | 完全自动化部署 | 生产环境一键部署 |
| `deploy.sh` | 主部署脚本 | 交互式部署，支持多种模式 |
| `check-environment.sh` | 环境检查 | 部署前验证系统环境 |
| `setup-docker.sh` | Docker配置 | 创建容器配置和网络 |
| `init-database.sh` | 数据库初始化 | 设置PostgreSQL和Redis |
| `start-services.sh` | 服务启动 | 启动所有容器服务 |
| `health-check.sh` | 健康检查 | 验证服务状态和性能 |

### 运维管理脚本

| 脚本名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| `monitor.sh` | 系统监控 | 实时查看系统和服务状态 |
| `backup.sh` | 数据备份 | 备份数据库和配置文件 |
| `rollback.sh` | 系统回滚 | 回滚到之前的备份状态 |

## 🛠️ 详细使用说明

### 1. 环境检查

```bash
# 检查系统环境和依赖
sudo ./check-environment.sh
```

**检查项目：**
- 操作系统版本（Ubuntu 20.04+）
- CPU资源（2核+，使用率<80%）
- 内存资源（4GB+，可用>1GB）
- 磁盘空间（可用>10GB）
- 端口占用（3000, 5432, 6379, 80, 443）
- Docker服务状态
- 网络连接

### 2. Docker设置

```bash
# 配置Docker环境
sudo ./setup-docker.sh
```

**创建内容：**
- Docker网络：dongpaidi-network
- 目录结构：data, logs, backups, ssl, config
- Docker Compose配置文件
- Nginx配置文件
- 环境变量文件

### 3. 数据库初始化

```bash
# 初始化数据库
sudo ./init-database.sh
```

**执行操作：**
- 启动PostgreSQL和Redis容器
- 创建数据库表结构
- 插入初始数据
- 验证数据库连接

### 4. 服务启动

```bash
# 启动所有服务
sudo ./start-services.sh
```

**启动服务：**
- PostgreSQL数据库（端口5432）
- Redis缓存（端口6379）
- 后端API服务（端口3000）
- Nginx反向代理（端口80）

### 5. 健康检查

```bash
# 执行健康检查
sudo ./health-check.sh
```

**检查内容：**
- 容器运行状态
- 服务响应时间
- 数据库连接
- API端点可用性
- 系统资源使用

## 📊 监控和运维

### 实时监控

```bash
# 单次监控
sudo ./monitor.sh

# 连续监控（每5秒刷新）
sudo ./monitor.sh --continuous

# 仅显示服务状态
sudo ./monitor.sh --services
```

### 数据备份

```bash
# 完整备份
sudo ./backup.sh

# 仅备份数据库
sudo ./backup.sh --type database

# 部署前备份
sudo ./backup.sh --pre-deploy
```

### 系统回滚

```bash
# 自动回滚到最新预部署备份
sudo ./rollback.sh --auto

# 回滚到指定备份
sudo ./rollback.sh --backup backup-20240914-143022

# 列出可用备份
sudo ./rollback.sh --list
```

## 🔧 常用命令

### Docker管理

```bash
# 查看容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 服务访问

- **主页面**: http://YOUR_SERVER_IP
- **API服务**: http://YOUR_SERVER_IP:3000/api/v1
- **健康检查**: http://YOUR_SERVER_IP:3000/api/v1/health
- **系统状态**: http://YOUR_SERVER_IP/health

### 数据库连接

```bash
# 连接PostgreSQL
docker exec -it dongpaidi-postgres psql -U dongpaidi_user -d dongpaidi_prod

# 连接Redis
docker exec -it dongpaidi-redis redis-cli -a redis_password_2024
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tulpn | grep :3000
   
   # 停止占用进程
   sudo kill -9 PID
   ```

2. **Docker服务未启动**
   ```bash
   # 启动Docker服务
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **权限问题**
   ```bash
   # 确保脚本有执行权限
   chmod +x *.sh
   
   # 使用root权限运行
   sudo ./script-name.sh
   ```

4. **磁盘空间不足**
   ```bash
   # 清理Docker镜像
   docker system prune -a
   
   # 清理日志文件
   sudo journalctl --vacuum-time=7d
   ```

### 日志查看

```bash
# 部署日志
sudo tail -f /var/log/dongpaidi-deploy.log

# 应用日志
docker-compose logs -f backend

# 数据库日志
docker-compose logs -f postgres

# Nginx日志
docker-compose logs -f nginx
```

## 📁 目录结构

```
dongpaidi-photography-platform/
├── deploy.sh                 # 主部署脚本
├── auto-deploy.sh            # 自动部署脚本
├── check-environment.sh      # 环境检查脚本
├── setup-docker.sh           # Docker设置脚本
├── init-database.sh          # 数据库初始化脚本
├── start-services.sh         # 服务启动脚本
├── health-check.sh           # 健康检查脚本
├── monitor.sh                # 监控脚本
├── backup.sh                 # 备份脚本
├── rollback.sh               # 回滚脚本
├── docker-compose.yml        # Docker Compose配置
├── .env                      # 环境变量
├── data/                     # 数据目录
│   ├── postgres/            # PostgreSQL数据
│   ├── redis/               # Redis数据
│   └── uploads/             # 上传文件
├── logs/                     # 日志目录
├── backups/                  # 备份目录
├── config/                   # 配置文件
│   └── nginx.conf           # Nginx配置
├── scripts/                  # 脚本目录
│   └── init-db.sql          # 数据库初始化SQL
└── backend/                  # 后端代码
    ├── src/                 # 源代码
    ├── Dockerfile           # Docker构建文件
    └── package.json         # 依赖配置
```

## 🎯 部署成功标志

部署成功后，您应该看到：

1. ✅ 所有容器状态为"Up"
2. ✅ API健康检查返回200状态码
3. ✅ 数据库连接正常
4. ✅ Nginx代理工作正常
5. ✅ 系统资源使用正常

## 📞 技术支持

如果遇到问题，请：

1. 查看部署日志：`sudo tail -f /var/log/dongpaidi-deploy.log`
2. 运行健康检查：`sudo ./health-check.sh`
3. 检查容器状态：`docker-compose ps`
4. 查看服务日志：`docker-compose logs -f`

---

**祝您部署成功！** 🎉
