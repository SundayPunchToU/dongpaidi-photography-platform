# 懂拍帝后端数据库迁移指南

## 概述

本指南详细说明如何将懂拍帝后端系统从SQLite迁移到PostgreSQL数据库。

## 迁移优势

### PostgreSQL相比SQLite的优势：
- ✅ **更好的并发性能**：支持多用户同时访问
- ✅ **完整的JSON支持**：原生JSON字段和查询功能
- ✅ **数组类型支持**：直接支持字符串数组等复杂类型
- ✅ **高级索引**：支持GIN、GiST等高级索引类型
- ✅ **全文搜索**：内置全文搜索功能
- ✅ **扩展性**：支持各种扩展和插件
- ✅ **生产环境适用**：适合高并发生产环境

## 迁移方案

### 方案一：使用Docker（推荐）

#### 1. 启动PostgreSQL服务
```bash
# 启动PostgreSQL和Redis服务
npm run docker:start

# 查看服务状态
npm run docker:dev status
```

#### 2. 运行数据库迁移
```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 初始化种子数据
npm run db:seed
```

#### 3. 测试PostgreSQL连接
```bash
# 测试PostgreSQL功能
npm run test-postgresql
```

### 方案二：本地PostgreSQL安装

#### 1. 安装PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib

# macOS
brew install postgresql
```

#### 2. 设置数据库
```bash
# 运行数据库设置脚本
npm run db:setup
```

#### 3. 配置环境变量
更新 `.env.development` 文件中的数据库连接字符串：
```env
DATABASE_URL="postgresql://dongpaidi_dev:dev_password@localhost:5432/dongpaidi_dev?schema=public"
```

## 数据迁移

### 从SQLite迁移现有数据
如果您已有SQLite数据库中的数据，可以使用迁移脚本：

```bash
# 备份并迁移SQLite数据到PostgreSQL
npm run db:migrate-from-sqlite
```

### 手动数据迁移
1. **备份SQLite数据**
   ```bash
   cp dev.db dev.db.backup
   ```

2. **导出SQLite数据**
   ```bash
   sqlite3 dev.db .dump > sqlite_backup.sql
   ```

3. **清理并导入PostgreSQL**
   - 手动清理SQL语法差异
   - 转换数据类型
   - 导入到PostgreSQL

## 配置说明

### 环境配置文件

#### 开发环境 (`.env.development`)
```env
NODE_ENV=development
DATABASE_URL="postgresql://dongpaidi_dev:dev_password@localhost:5432/dongpaidi_dev?schema=public"
REDIS_URL=redis://localhost:6379
```

#### 生产环境 (`.env.production`)
```env
NODE_ENV=production
DATABASE_URL="postgresql://dongpaidi_prod:prod_password@localhost:5432/dongpaidi_prod?schema=public"
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### Prisma Schema更新

主要更新内容：
- 数据源从 `sqlite` 改为 `postgresql`
- 恢复JSON字段支持
- 恢复数组类型支持
- 添加数据库索引优化
- 恢复Decimal类型用于价格字段

## 性能优化

### 数据库索引
已添加的索引：
- 用户表：`nickname`, `platform`, `createdAt`, `isVerified`
- 作品表：`userId`, `category`, `status`, `createdAt`, `likeCount`, `viewCount`

### 查询优化
- 使用适当的`include`和`select`减少数据传输
- 利用PostgreSQL的JSON查询功能
- 实现分页查询避免大量数据加载

## 测试验证

### 功能测试
```bash
# 测试PostgreSQL连接和基本功能
npm run test-postgresql

# 启动API测试服务器
npm run test-api

# 运行完整的API测试
node test-api.js
```

### 性能测试
```bash
# 启动开发服务器
npm run dev

# 使用压力测试工具测试API性能
# 例如：ab, wrk, 或 artillery
```

## 故障排除

### 常见问题

#### 1. 连接失败
```
Error: P1001: Can't reach database server
```
**解决方案**：
- 检查PostgreSQL服务是否运行
- 验证连接字符串是否正确
- 检查防火墙设置

#### 2. 权限错误
```
Error: P3000: Failed to create database
```
**解决方案**：
- 确保数据库用户有足够权限
- 运行 `npm run db:setup` 重新设置权限

#### 3. 迁移失败
```
Error: P3009: migrate found failed migration
```
**解决方案**：
- 重置迁移：`npm run db:reset`
- 重新运行迁移：`npm run db:migrate`

### 日志调试
启用详细日志：
```env
LOG_LEVEL=debug
DATABASE_LOGGING=true
```

## 回滚方案

如果需要回滚到SQLite：

1. **恢复配置**
   ```bash
   # 恢复.env文件
   cp .env .env.postgresql.backup
   cp .env.sqlite.backup .env
   ```

2. **恢复Schema**
   ```bash
   # 恢复Prisma schema
   git checkout HEAD -- prisma/schema.prisma
   ```

3. **重新生成客户端**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 监控和维护

### 数据库监控
- 使用PgAdmin进行可视化管理：http://localhost:5050
- 监控连接数、查询性能、存储使用情况
- 定期备份数据库

### 定期维护
```bash
# 数据库统计信息更新
ANALYZE;

# 清理无用数据
VACUUM;

# 重建索引
REINDEX DATABASE dongpaidi_dev;
```

## 下一步

完成PostgreSQL迁移后，您可以：
1. 开始开发后端管理界面
2. 实现Redis缓存系统
3. 添加更多高级功能（全文搜索、地理位置查询等）
4. 进行性能优化和监控设置
