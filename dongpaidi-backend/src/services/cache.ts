import { redisClient } from '@/config/redis';
import { Redis } from 'ioredis';

// 修复模块别名问题的临时解决方案
const redisClientInstance = redisClient;

/**
 * 缓存服务类
 */
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = redisClientInstance.getClient();
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await this.redis.setex(key, ttl, serializedValue);
    } else {
      await this.redis.set(key, serializedValue);
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('缓存值解析失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * 批量删除缓存
   * @param keys 缓存键数组
   */
  async delMany(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * 设置缓存过期时间
   * @param key 缓存键
   * @param ttl 过期时间（秒）
   */
  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  /**
   * 获取缓存剩余过期时间
   * @param key 缓存键
   * @returns 剩余时间（秒），-1表示永不过期，-2表示不存在
   */
  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  /**
   * 模糊匹配删除缓存
   * @param pattern 匹配模式
   */
  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * 原子性递增
   * @param key 缓存键
   * @param increment 递增值，默认为1
   * @returns 递增后的值
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    return await this.redis.incrby(key, increment);
  }

  /**
   * 原子性递减
   * @param key 缓存键
   * @param decrement 递减值，默认为1
   * @returns 递减后的值
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    return await this.redis.decrby(key, decrement);
  }

  /**
   * 哈希表操作 - 设置字段
   * @param key 哈希表键
   * @param field 字段名
   * @param value 字段值
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redis.hset(key, field, serializedValue);
  }

  /**
   * 哈希表操作 - 获取字段
   * @param key 哈希表键
   * @param field 字段名
   * @returns 字段值
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.redis.hget(key, field);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('哈希表值解析失败:', error);
      return null;
    }
  }

  /**
   * 哈希表操作 - 删除字段
   * @param key 哈希表键
   * @param field 字段名
   */
  async hdel(key: string, field: string): Promise<void> {
    await this.redis.hdel(key, field);
  }

  /**
   * 哈希表操作 - 获取所有字段
   * @param key 哈希表键
   * @returns 所有字段和值
   */
  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    const result = await this.redis.hgetall(key);
    const parsed: Record<string, T> = {};

    for (const [field, value] of Object.entries(result)) {
      try {
        parsed[field] = JSON.parse(value) as T;
      } catch (error) {
        console.error(`哈希表字段 ${field} 值解析失败:`, error);
      }
    }

    return parsed;
  }

  /**
   * 列表操作 - 左侧推入
   * @param key 列表键
   * @param value 值
   */
  async lpush(key: string, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redis.lpush(key, serializedValue);
  }

  /**
   * 列表操作 - 右侧推入
   * @param key 列表键
   * @param value 值
   */
  async rpush(key: string, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redis.rpush(key, serializedValue);
  }

  /**
   * 列表操作 - 左侧弹出
   * @param key 列表键
   * @returns 弹出的值
   */
  async lpop<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.lpop(key);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('列表值解析失败:', error);
      return null;
    }
  }

  /**
   * 列表操作 - 右侧弹出
   * @param key 列表键
   * @returns 弹出的值
   */
  async rpop<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.rpop(key);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('列表值解析失败:', error);
      return null;
    }
  }

  /**
   * 列表操作 - 获取范围内的元素
   * @param key 列表键
   * @param start 开始索引
   * @param stop 结束索引
   * @returns 元素数组
   */
  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const values = await this.redis.lrange(key, start, stop);
    const parsed: T[] = [];

    for (const value of values) {
      try {
        parsed.push(JSON.parse(value) as T);
      } catch (error) {
        console.error('列表元素解析失败:', error);
      }
    }

    return parsed;
  }

  /**
   * 获取列表长度
   * @param key 列表键
   * @returns 列表长度
   */
  async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }
}

// 创建缓存服务实例
export const cacheService = new CacheService();

export default cacheService;
