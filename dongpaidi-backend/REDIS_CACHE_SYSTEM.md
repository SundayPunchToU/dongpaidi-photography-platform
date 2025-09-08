# Redis缓存系统文档

## 概述

懂拍帝后端系统集成了完整的Redis缓存解决方案，提供高性能的数据缓存、会话管理、热门内容排行等功能。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API请求       │    │   缓存中间件     │    │   Redis服务     │
│                 │───▶│                 │───▶│                 │
│ Express Routes  │    │ Cache Middleware│    │ Redis/Mock Redis│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   业务逻辑       │    │   缓存服务       │    │   数据存储       │
│                 │    │                 │    │                 │
│ Service Layer   │    │ CacheService    │    │ Memory/Redis DB │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 核心组件

### 1. Redis配置 (`src/config/redis.ts`)

- **RedisClient**: Redis客户端封装
- **连接管理**: 自动重连、错误处理
- **配置选项**: 主机、端口、密码、数据库等

### 2. 缓存服务 (`src/services/cache.ts`)

- **CacheService**: 统一的缓存操作接口
- **支持数据类型**: 字符串、对象、哈希表、列表
- **过期管理**: TTL设置、自动清理

### 3. 缓存键管理 (`src/services/cacheKeys.ts`)

- **CacheKeys**: 统一的缓存键命名规范
- **分类管理**: 用户、作品、约拍、消息等
- **键生成器**: 动态生成缓存键

### 4. 会话管理 (`src/services/sessionManager.ts`)

- **SessionManager**: 用户会话管理
- **多设备支持**: 同一用户多个会话
- **活跃度跟踪**: 最后活跃时间更新

### 5. 热门内容缓存 (`src/services/hotContentCache.ts`)

- **HotContentCache**: 热门内容排行
- **实时统计**: 浏览、点赞、评论等
- **分数计算**: 基于多维度的热度算法

### 6. 缓存中间件 (`src/middleware/cache.ts`)

- **自动缓存**: API响应自动缓存
- **条件缓存**: 基于条件的缓存策略
- **缓存清除**: 数据更新后自动清除

### 7. 缓存装饰器 (`src/decorators/cache.ts`)

- **@Cache**: 方法级别的缓存装饰器
- **@CacheEvict**: 缓存清除装饰器
- **@CachePut**: 缓存更新装饰器

## 功能特性

### 🚀 高性能缓存

- **内存缓存**: 基于Redis的高速内存存储
- **智能过期**: 自动TTL管理和清理
- **批量操作**: 支持批量读写操作
- **压缩存储**: JSON序列化优化

### 🔐 会话管理

- **多设备登录**: 支持同一用户多设备会话
- **会话跟踪**: 实时跟踪用户活跃状态
- **安全管理**: 会话过期和强制下线
- **设备识别**: 设备ID和平台信息记录

### 📊 热门内容

- **实时排行**: 基于用户行为的实时排行
- **多维度统计**: 浏览、点赞、评论、分享等
- **分类排行**: 支持按分类的热门内容
- **时间衰减**: 考虑时间因素的热度算法

### 🎯 智能缓存

- **自动缓存**: API响应自动缓存
- **条件缓存**: 基于请求条件的缓存策略
- **用户缓存**: 个性化用户数据缓存
- **搜索缓存**: 搜索结果缓存优化

## 使用示例

### 基础缓存操作

```typescript
import { cacheService } from '@/services/cache';

// 设置缓存
await cacheService.set('user:123', userData, 3600); // 1小时过期

// 获取缓存
const userData = await cacheService.get('user:123');

// 删除缓存
await cacheService.del('user:123');

// 哈希表操作
await cacheService.hset('user:123:profile', 'name', '张三');
const name = await cacheService.hget('user:123:profile', 'name');
```

### 会话管理

```typescript
import { sessionManager } from '@/services/sessionManager';

// 创建会话
const session = await sessionManager.createSession('user123', {
  deviceId: 'device001',
  platform: 'mobile',
  ip: '192.168.1.100'
});

// 检查用户是否在线
const isOnline = await sessionManager.isUserOnline('user123');

// 销毁会话
await sessionManager.destroySession(session.sessionId);
```

### 热门内容

```typescript
import { hotContentCache } from '@/services/hotContentCache';

// 更新内容统计
await hotContentCache.updateContentStats('work001', 'work', {
  views: 1000,
  likes: 150,
  comments: 25
});

// 获取热门内容
const hotWorks = await hotContentCache.getHotContent('work', 10);
```

### 缓存中间件

```typescript
import { cacheMiddleware, userCacheMiddleware } from '@/middleware/cache';

// 通用缓存中间件
app.get('/api/works', cacheMiddleware({ ttl: 300 }), getWorksHandler);

// 用户相关缓存
app.get('/api/user/profile', userCacheMiddleware({ ttl: 600 }), getUserProfileHandler);

// 热门内容缓存
app.get('/api/works/hot', hotContentCacheMiddleware('works'), getHotWorksHandler);
```

### 缓存装饰器

```typescript
import { Cache, CacheEvict } from '@/decorators/cache';

class UserService {
  @Cache({ key: 'user:profile', ttl: 3600, serializeArgs: true })
  async getUserProfile(userId: string) {
    // 方法结果会自动缓存
    return await this.database.findUser(userId);
  }

  @CacheEvict(['user:profile:*', 'user:list:*'])
  async updateUser(userId: string, data: any) {
    // 更新后自动清除相关缓存
    return await this.database.updateUser(userId, data);
  }
}
```

## 配置说明

### 环境变量

```bash
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=dongpaidi:
REDIS_URL=redis://localhost:6379
```

### 缓存策略

| 数据类型 | TTL | 说明 |
|---------|-----|------|
| 用户信息 | 1小时 | 用户基本信息缓存 |
| 作品列表 | 5分钟 | 作品列表页面缓存 |
| 热门内容 | 30分钟 | 热门排行榜缓存 |
| 搜索结果 | 10分钟 | 搜索结果缓存 |
| 统计数据 | 1小时 | 系统统计数据缓存 |
| 用户会话 | 7天 | 用户登录会话 |

## 监控和维护

### 缓存统计

```typescript
// 获取缓存命中率
const stats = await cacheService.get('cache:stats');

// 获取Redis状态
const status = await RedisInitializer.getRedisStatus();

// 健康检查
const health = await RedisInitializer.healthCheck();
```

### 定时任务

- **会话清理**: 每5分钟清理过期会话
- **热门内容刷新**: 每30分钟刷新热门排行
- **缓存统计**: 每小时更新缓存统计数据

### 故障处理

1. **Redis连接失败**: 自动切换到Mock Redis服务
2. **缓存穿透**: 使用空值缓存防止穿透
3. **缓存雪崩**: 随机TTL防止同时过期
4. **缓存击穿**: 分布式锁防止并发重建

## 性能优化

### 缓存预热

```typescript
// 应用启动时预热常用数据
await RedisInitializer.initialize();
```

### 批量操作

```typescript
// 批量获取用户数据
const userIds = ['1', '2', '3'];
const users = await cacheService.getBatchContentStats(userIds, 'user');
```

### 内存优化

- 使用合适的数据结构（哈希表 vs 字符串）
- 设置合理的TTL避免内存泄漏
- 定期清理过期键

## 最佳实践

1. **键命名规范**: 使用CacheKeys统一管理
2. **TTL设置**: 根据数据更新频率设置合理TTL
3. **缓存层级**: 多级缓存策略（内存 + Redis）
4. **错误处理**: 缓存失败不影响业务逻辑
5. **监控告警**: 监控缓存命中率和性能指标

## 测试

```bash
# 运行缓存系统测试
npm run test:cache

# 或者直接运行测试脚本
npx ts-node src/test-cache-simple.ts
```

## 部署说明

### 开发环境

- 使用Mock Redis服务，无需安装Redis
- 自动内存清理和过期处理

### 生产环境

- 部署Redis服务器或使用云Redis服务
- 配置Redis持久化和高可用
- 监控Redis性能和内存使用

---

**注意**: 本缓存系统支持在没有Redis服务器的情况下使用Mock Redis服务，确保开发环境的便利性。
