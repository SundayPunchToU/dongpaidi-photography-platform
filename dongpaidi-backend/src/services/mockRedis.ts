/**
 * Mock Redis服务
 * 用于在没有Redis服务器的情况下提供内存缓存功能
 */
export class MockRedisService {
  private store: Map<string, { value: any; expireAt?: number }> = new Map();
  private hashStore: Map<string, Map<string, any>> = new Map();
  private listStore: Map<string, any[]> = new Map();

  /**
   * 设置键值对
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const item: { value: any; expireAt?: number } = { value };
    if (ttl) {
      item.expireAt = Date.now() + (ttl * 1000);
    }
    this.store.set(key, item);
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.hashStore.delete(key);
    this.listStore.delete(key);
  }

  /**
   * 批量删除
   */
  async delMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const item = this.store.get(key);
    
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expireAt = Date.now() + (ttl * 1000);
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    
    if (!item) {
      return -2; // 键不存在
    }

    if (!item.expireAt) {
      return -1; // 永不过期
    }

    const remaining = Math.ceil((item.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  /**
   * 递增
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    const current = await this.get(key) || 0;
    const newValue = Number(current) + increment;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * 递减
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    return await this.incr(key, -decrement);
  }

  /**
   * 哈希表设置字段
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map());
    }
    this.hashStore.get(key)!.set(field, value);
  }

  /**
   * 哈希表获取字段
   */
  async hget(key: string, field: string): Promise<any> {
    const hash = this.hashStore.get(key);
    return hash ? hash.get(field) || null : null;
  }

  /**
   * 哈希表删除字段
   */
  async hdel(key: string, field: string): Promise<void> {
    const hash = this.hashStore.get(key);
    if (hash) {
      hash.delete(field);
    }
  }

  /**
   * 哈希表获取所有字段
   */
  async hgetall(key: string): Promise<Record<string, any>> {
    const hash = this.hashStore.get(key);
    if (!hash) {
      return {};
    }

    const result: Record<string, any> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    return result;
  }

  /**
   * 列表左侧推入
   */
  async lpush(key: string, value: any): Promise<void> {
    if (!this.listStore.has(key)) {
      this.listStore.set(key, []);
    }
    this.listStore.get(key)!.unshift(value);
  }

  /**
   * 列表右侧推入
   */
  async rpush(key: string, value: any): Promise<void> {
    if (!this.listStore.has(key)) {
      this.listStore.set(key, []);
    }
    this.listStore.get(key)!.push(value);
  }

  /**
   * 列表左侧弹出
   */
  async lpop(key: string): Promise<any> {
    const list = this.listStore.get(key);
    return list && list.length > 0 ? list.shift() : null;
  }

  /**
   * 列表右侧弹出
   */
  async rpop(key: string): Promise<any> {
    const list = this.listStore.get(key);
    return list && list.length > 0 ? list.pop() : null;
  }

  /**
   * 列表获取范围
   */
  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    const list = this.listStore.get(key);
    if (!list) {
      return [];
    }

    if (stop === -1) {
      return list.slice(start);
    }
    return list.slice(start, stop + 1);
  }

  /**
   * 列表长度
   */
  async llen(key: string): Promise<number> {
    const list = this.listStore.get(key);
    return list ? list.length : 0;
  }

  /**
   * 获取所有匹配的键
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchingKeys: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    for (const key of this.hashStore.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    for (const key of this.listStore.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    return [...new Set(matchingKeys)]; // 去重
  }

  /**
   * 获取数据库大小
   */
  async dbsize(): Promise<number> {
    return this.store.size + this.hashStore.size + this.listStore.size;
  }

  /**
   * 清空数据库
   */
  async flushdb(): Promise<void> {
    this.store.clear();
    this.hashStore.clear();
    this.listStore.clear();
  }

  /**
   * Ping测试
   */
  async ping(): Promise<string> {
    return 'PONG';
  }

  /**
   * 获取信息
   */
  async info(): Promise<string> {
    const uptime = Math.floor(process.uptime());
    const memoryUsage = process.memoryUsage();
    
    return [
      '# Server',
      'redis_version:mock-1.0.0',
      'redis_mode:standalone',
      `uptime_in_seconds:${uptime}`,
      '',
      '# Memory',
      `used_memory:${memoryUsage.heapUsed}`,
      `used_memory_human:${Math.round(memoryUsage.heapUsed / 1024 / 1024)}M`,
      '',
      '# Keyspace',
      `db0:keys=${this.store.size},expires=0,avg_ttl=0`,
    ].join('\n');
  }

  /**
   * 清理过期键
   */
  private cleanupExpiredKeys(): void {
    const now = Date.now();
    
    for (const [key, item] of this.store.entries()) {
      if (item.expireAt && now > item.expireAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 启动清理定时器
   */
  startCleanupTimer(): void {
    // 每分钟清理一次过期键
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, 60 * 1000);
  }
}

// 创建Mock Redis服务实例
export const mockRedisService = new MockRedisService();

// 启动清理定时器
mockRedisService.startCleanupTimer();

export default mockRedisService;
