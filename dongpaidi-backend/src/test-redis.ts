import RedisInitializer from './scripts/initRedis';
import { cacheService } from './services/cache';
import { sessionManager } from './services/sessionManager';
import { hotContentCache } from './services/hotContentCache';

/**
 * Redis缓存系统测试脚本
 */
async function testRedisSystem() {
  console.log('🧪 开始测试Redis缓存系统...\n');

  try {
    // 1. 初始化Redis
    console.log('1️⃣ 初始化Redis连接...');
    await RedisInitializer.initialize();
    console.log('✅ Redis初始化成功\n');

    // 2. 测试基础缓存操作
    console.log('2️⃣ 测试基础缓存操作...');
    await testBasicCacheOperations();
    console.log('✅ 基础缓存操作测试通过\n');

    // 3. 测试会话管理
    console.log('3️⃣ 测试会话管理...');
    await testSessionManagement();
    console.log('✅ 会话管理测试通过\n');

    // 4. 测试热门内容缓存
    console.log('4️⃣ 测试热门内容缓存...');
    await testHotContentCache();
    console.log('✅ 热门内容缓存测试通过\n');

    // 5. 测试Redis状态
    console.log('5️⃣ 获取Redis状态信息...');
    const status = await RedisInitializer.getRedisStatus();
    console.log('Redis状态:', status);
    console.log('✅ Redis状态获取成功\n');

    // 6. 健康检查
    console.log('6️⃣ 执行健康检查...');
    const healthCheck = await RedisInitializer.healthCheck();
    console.log('健康检查结果:', healthCheck);
    console.log('✅ 健康检查完成\n');

    console.log('🎉 Redis缓存系统测试全部通过！');

  } catch (error) {
    console.error('❌ Redis缓存系统测试失败:', error);
  } finally {
    // 关闭连接
    console.log('\n🔌 关闭Redis连接...');
    await RedisInitializer.shutdown();
    console.log('✅ Redis连接已关闭');
  }
}

/**
 * 测试基础缓存操作
 */
async function testBasicCacheOperations() {
  // 测试字符串缓存
  await cacheService.set('test:string', 'Hello Redis!', 60);
  const stringValue = await cacheService.get('test:string');
  console.log('字符串缓存测试:', stringValue);

  // 测试对象缓存
  const testObject = { id: 1, name: '测试用户', email: 'test@example.com' };
  await cacheService.set('test:object', testObject, 60);
  const objectValue = await cacheService.get('test:object');
  console.log('对象缓存测试:', objectValue);

  // 测试数组缓存
  const testArray = [1, 2, 3, 4, 5];
  await cacheService.set('test:array', testArray, 60);
  const arrayValue = await cacheService.get('test:array');
  console.log('数组缓存测试:', arrayValue);

  // 测试哈希表操作
  await cacheService.hset('test:hash', 'field1', 'value1');
  await cacheService.hset('test:hash', 'field2', { nested: 'object' });
  const hashValue1 = await cacheService.hget('test:hash', 'field1');
  const hashValue2 = await cacheService.hget('test:hash', 'field2');
  console.log('哈希表缓存测试:', { field1: hashValue1, field2: hashValue2 });

  // 测试列表操作
  await cacheService.lpush('test:list', 'item1');
  await cacheService.rpush('test:list', 'item2');
  await cacheService.lpush('test:list', 'item3');
  const listItems = await cacheService.lrange('test:list', 0, -1);
  console.log('列表缓存测试:', listItems);

  // 测试递增操作
  await cacheService.incr('test:counter', 5);
  await cacheService.incr('test:counter', 3);
  const counterValue = await cacheService.get('test:counter');
  console.log('计数器测试:', counterValue);

  // 测试过期时间
  await cacheService.set('test:ttl', 'will expire', 2);
  const ttlBefore = await cacheService.ttl('test:ttl');
  console.log('TTL测试 - 设置后:', ttlBefore, '秒');
  
  // 等待3秒
  await new Promise(resolve => setTimeout(resolve, 3000));
  const expiredValue = await cacheService.get('test:ttl');
  console.log('TTL测试 - 过期后:', expiredValue);

  // 清理测试数据
  await cacheService.delMany([
    'test:string', 'test:object', 'test:array', 
    'test:hash', 'test:list', 'test:counter'
  ]);
}

/**
 * 测试会话管理
 */
async function testSessionManagement() {
  // 创建用户会话
  const session1 = await sessionManager.createSession('user123', {
    deviceId: 'device001',
    platform: 'mobile',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
  });
  console.log('创建会话1:', session1.sessionId);

  const session2 = await sessionManager.createSession('user123', {
    deviceId: 'device002',
    platform: 'web',
    ip: '192.168.1.101',
  });
  console.log('创建会话2:', session2.sessionId);

  // 获取用户会话列表
  const userSessions = await sessionManager.getUserSessions('user123');
  console.log('用户会话列表:', userSessions);

  // 检查用户是否在线
  const isOnline = await sessionManager.isUserOnline('user123');
  console.log('用户是否在线:', isOnline);

  // 更新会话活跃时间
  await sessionManager.updateSessionActivity(session1.sessionId);
  console.log('会话活跃时间已更新');

  // 获取会话信息
  const retrievedSession = await sessionManager.getSession(session1.sessionId);
  console.log('获取会话信息:', retrievedSession?.lastActiveTime);

  // 销毁单个会话
  await sessionManager.destroySession(session2.sessionId);
  console.log('会话2已销毁');

  // 检查剩余会话
  const remainingSessions = await sessionManager.getUserSessions('user123');
  console.log('剩余会话:', remainingSessions);

  // 销毁用户所有会话
  await sessionManager.destroyUserSessions('user123');
  console.log('用户所有会话已销毁');

  // 验证会话已清空
  const finalSessions = await sessionManager.getUserSessions('user123');
  console.log('最终会话列表:', finalSessions);
}

/**
 * 测试热门内容缓存
 */
async function testHotContentCache() {
  // 更新作品统计数据
  await hotContentCache.updateContentStats('work001', 'work', {
    views: 1000,
    likes: 150,
    comments: 25,
    shares: 10,
    favorites: 80,
  });
  console.log('作品统计数据已更新');

  // 增加浏览量
  await hotContentCache.incrementViews('work001', 'work', 50);
  await hotContentCache.incrementLikes('work001', 'work', 10);
  await hotContentCache.incrementComments('work001', 'work', 5);
  console.log('作品互动数据已增加');

  // 获取内容统计
  const stats = await hotContentCache.getContentStats('work001', 'work');
  console.log('作品统计数据:', stats);

  // 更新更多作品数据
  await hotContentCache.updateContentStats('work002', 'work', {
    views: 800,
    likes: 120,
    comments: 20,
    shares: 8,
    favorites: 60,
  });

  await hotContentCache.updateContentStats('work003', 'work', {
    views: 1200,
    likes: 200,
    comments: 35,
    shares: 15,
    favorites: 100,
  });

  // 刷新热门排行
  await hotContentCache.refreshHotRanking('work');
  console.log('热门排行已刷新');

  // 获取热门内容
  const hotWorks = await hotContentCache.getHotContent('work', 5);
  console.log('热门作品列表:', hotWorks);

  // 批量获取统计数据
  const batchStats = await hotContentCache.getBatchContentStats(
    ['work001', 'work002', 'work003'], 
    'work'
  );
  console.log('批量统计数据:', batchStats);

  // 清理测试数据
  await hotContentCache.clearContentCache('work001', 'work');
  await hotContentCache.clearContentCache('work002', 'work');
  await hotContentCache.clearContentCache('work003', 'work');
  console.log('测试数据已清理');
}

// 运行测试
if (require.main === module) {
  testRedisSystem().catch(console.error);
}

export { testRedisSystem };
