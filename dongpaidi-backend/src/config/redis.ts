import Redis from 'ioredis';
import { config } from './index';

/**
 * Redis配置选项
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

/**
 * 默认Redis配置
 */
const defaultRedisConfig: RedisConfig = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  db: config.redis?.db || 0,
  keyPrefix: config.redis?.keyPrefix || 'dongpaidi:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

/**
 * Redis客户端实例
 */
class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor(config: RedisConfig = defaultRedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      retryDelayOnFailover: config.retryDelayOnFailover,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      lazyConnect: config.lazyConnect,
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('🔗 Redis连接已建立');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('✅ Redis客户端已就绪');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis连接错误:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis连接已关闭');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis正在重连...');
    });
  }

  /**
   * 连接到Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('🚀 Redis连接成功');
    } catch (error) {
      console.error('❌ Redis连接失败:', error);
      throw error;
    }
  }

  /**
   * 断开Redis连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('👋 Redis连接已断开');
    } catch (error) {
      console.error('❌ Redis断开连接失败:', error);
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * 获取Redis客户端实例
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Ping测试
   */
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  /**
   * 获取Redis信息
   */
  async info(): Promise<string> {
    return await this.client.info();
  }

  /**
   * 清空当前数据库
   */
  async flushdb(): Promise<string> {
    return await this.client.flushdb();
  }

  /**
   * 清空所有数据库
   */
  async flushall(): Promise<string> {
    return await this.client.flushall();
  }
}

// 创建Redis客户端实例
export const redisClient = new RedisClient();

// 导出Redis客户端
export { Redis };
export default redisClient;
