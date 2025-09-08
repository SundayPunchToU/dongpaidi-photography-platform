import { mockRedisService } from './services/mockRedis';

/**
 * 简化的缓存系统测试
 * 使用Mock Redis服务，不需要实际的Redis服务器
 */
async function testCacheSystem() {
  console.log('🧪 开始测试缓存系统（使用Mock Redis）...\n');

  try {
    // 1. 测试基础缓存操作
    console.log('1️⃣ 测试基础缓存操作...');
    await testBasicOperations();
    console.log('✅ 基础缓存操作测试通过\n');

    // 2. 测试哈希表操作
    console.log('2️⃣ 测试哈希表操作...');
    await testHashOperations();
    console.log('✅ 哈希表操作测试通过\n');

    // 3. 测试列表操作
    console.log('3️⃣ 测试列表操作...');
    await testListOperations();
    console.log('✅ 列表操作测试通过\n');

    // 4. 测试过期时间
    console.log('4️⃣ 测试过期时间...');
    await testExpiration();
    console.log('✅ 过期时间测试通过\n');

    // 5. 测试模式匹配
    console.log('5️⃣ 测试模式匹配...');
    await testPatternMatching();
    console.log('✅ 模式匹配测试通过\n');

    console.log('🎉 缓存系统测试全部通过！');

  } catch (error) {
    console.error('❌ 缓存系统测试失败:', error);
  }
}

/**
 * 测试基础操作
 */
async function testBasicOperations() {
  // 测试字符串
  await mockRedisService.set('test:string', 'Hello Cache!');
  const stringValue = await mockRedisService.get('test:string');
  console.log('字符串缓存:', stringValue);

  // 测试数字
  await mockRedisService.set('test:number', 42);
  const numberValue = await mockRedisService.get('test:number');
  console.log('数字缓存:', numberValue);

  // 测试对象
  const testObject = { id: 1, name: '测试用户', active: true };
  await mockRedisService.set('test:object', testObject);
  const objectValue = await mockRedisService.get('test:object');
  console.log('对象缓存:', objectValue);

  // 测试数组
  const testArray = [1, 2, 3, 'test', { nested: true }];
  await mockRedisService.set('test:array', testArray);
  const arrayValue = await mockRedisService.get('test:array');
  console.log('数组缓存:', arrayValue);

  // 测试存在性检查
  const exists = await mockRedisService.exists('test:string');
  console.log('键存在性检查:', exists);

  // 测试递增操作
  await mockRedisService.set('test:counter', 10);
  const incr1 = await mockRedisService.incr('test:counter', 5);
  const incr2 = await mockRedisService.incr('test:counter', 3);
  console.log('递增操作:', { incr1, incr2 });

  // 测试递减操作
  const decr1 = await mockRedisService.decr('test:counter', 2);
  console.log('递减操作:', decr1);
}

/**
 * 测试哈希表操作
 */
async function testHashOperations() {
  // 设置哈希字段
  await mockRedisService.hset('test:user:1', 'name', '张三');
  await mockRedisService.hset('test:user:1', 'age', 25);
  await mockRedisService.hset('test:user:1', 'email', 'zhangsan@example.com');
  await mockRedisService.hset('test:user:1', 'profile', { city: '北京', hobby: '摄影' });

  // 获取单个字段
  const name = await mockRedisService.hget('test:user:1', 'name');
  const age = await mockRedisService.hget('test:user:1', 'age');
  const profile = await mockRedisService.hget('test:user:1', 'profile');
  console.log('哈希字段获取:', { name, age, profile });

  // 获取所有字段
  const allFields = await mockRedisService.hgetall('test:user:1');
  console.log('哈希所有字段:', allFields);

  // 删除字段
  await mockRedisService.hdel('test:user:1', 'email');
  const afterDelete = await mockRedisService.hgetall('test:user:1');
  console.log('删除字段后:', afterDelete);
}

/**
 * 测试列表操作
 */
async function testListOperations() {
  // 左侧推入
  await mockRedisService.lpush('test:list', 'item1');
  await mockRedisService.lpush('test:list', 'item2');
  await mockRedisService.lpush('test:list', 'item3');

  // 右侧推入
  await mockRedisService.rpush('test:list', 'item4');
  await mockRedisService.rpush('test:list', 'item5');

  // 获取列表长度
  const length = await mockRedisService.llen('test:list');
  console.log('列表长度:', length);

  // 获取所有元素
  const allItems = await mockRedisService.lrange('test:list', 0, -1);
  console.log('列表所有元素:', allItems);

  // 获取部分元素
  const partialItems = await mockRedisService.lrange('test:list', 1, 3);
  console.log('列表部分元素 [1-3]:', partialItems);

  // 左侧弹出
  const lpopItem = await mockRedisService.lpop('test:list');
  console.log('左侧弹出:', lpopItem);

  // 右侧弹出
  const rpopItem = await mockRedisService.rpop('test:list');
  console.log('右侧弹出:', rpopItem);

  // 弹出后的列表
  const remainingItems = await mockRedisService.lrange('test:list', 0, -1);
  console.log('弹出后的列表:', remainingItems);
}

/**
 * 测试过期时间
 */
async function testExpiration() {
  // 设置带过期时间的键
  await mockRedisService.set('test:expire', 'will expire soon', 2); // 2秒后过期
  
  // 检查TTL
  const ttlBefore = await mockRedisService.ttl('test:expire');
  console.log('设置后的TTL:', ttlBefore, '秒');

  // 立即获取值
  const valueBefore = await mockRedisService.get('test:expire');
  console.log('过期前的值:', valueBefore);

  // 等待3秒
  console.log('等待3秒...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 检查过期后的状态
  const ttlAfter = await mockRedisService.ttl('test:expire');
  const valueAfter = await mockRedisService.get('test:expire');
  console.log('过期后的TTL:', ttlAfter);
  console.log('过期后的值:', valueAfter);

  // 测试手动设置过期时间
  await mockRedisService.set('test:manual_expire', 'manual expiration');
  await mockRedisService.expire('test:manual_expire', 1); // 1秒后过期
  
  const manualTtl = await mockRedisService.ttl('test:manual_expire');
  console.log('手动设置过期时间:', manualTtl, '秒');
}

/**
 * 测试模式匹配
 */
async function testPatternMatching() {
  // 设置多个测试键
  await mockRedisService.set('user:1:name', '用户1');
  await mockRedisService.set('user:2:name', '用户2');
  await mockRedisService.set('user:1:email', 'user1@example.com');
  await mockRedisService.set('user:2:email', 'user2@example.com');
  await mockRedisService.set('product:1:name', '产品1');
  await mockRedisService.set('product:2:name', '产品2');

  // 查找所有用户相关的键
  const userKeys = await mockRedisService.keys('user:*');
  console.log('用户相关的键:', userKeys);

  // 查找所有名称相关的键
  const nameKeys = await mockRedisService.keys('*:name');
  console.log('名称相关的键:', nameKeys);

  // 查找所有键
  const allKeys = await mockRedisService.keys('*');
  console.log('所有键:', allKeys);

  // 获取数据库大小
  const dbSize = await mockRedisService.dbsize();
  console.log('数据库大小:', dbSize);

  // 批量删除用户键
  await mockRedisService.delMany(userKeys);
  console.log('删除用户键后的数据库大小:', await mockRedisService.dbsize());

  // 测试Ping
  const pingResult = await mockRedisService.ping();
  console.log('Ping测试:', pingResult);

  // 获取信息
  const info = await mockRedisService.info();
  console.log('服务器信息:');
  console.log(info);
}

// 运行测试
if (require.main === module) {
  testCacheSystem().catch(console.error);
}

export { testCacheSystem };
