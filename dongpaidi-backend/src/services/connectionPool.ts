import { PrismaClient } from '@prisma/client';
import { config } from '@/config';

/**
 * 连接池配置接口
 */
export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  log: boolean;
}

/**
 * 连接状态枚举
 */
enum ConnectionStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  PENDING = 'pending',
  DESTROYED = 'destroyed',
}

/**
 * 连接对象接口
 */
interface PoolConnection {
  id: string;
  client: PrismaClient;
  status: ConnectionStatus;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

/**
 * 连接池统计信息
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingConnections: number;
  waitingRequests: number;
  totalCreated: number;
  totalDestroyed: number;
  totalAcquired: number;
  totalReleased: number;
  averageUseTime: number;
  maxUseTime: number;
  minUseTime: number;
}

/**
 * 数据库连接池管理器
 */
export class ConnectionPoolManager {
  private config: ConnectionPoolConfig;
  private connections: Map<string, PoolConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PoolConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private stats = {
    totalCreated: 0,
    totalDestroyed: 0,
    totalAcquired: 0,
    totalReleased: 0,
    useTimes: [] as number[],
  };

  private cleanupInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 10,
      minConnections: config.minConnections || 2,
      acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000, // 5分钟
      reapIntervalMillis: config.reapIntervalMillis || 60000, // 1分钟
      createRetryIntervalMillis: config.createRetryIntervalMillis || 1000,
      createTimeoutMillis: config.createTimeoutMillis || 10000,
      destroyTimeoutMillis: config.destroyTimeoutMillis || 5000,
      log: config.log !== undefined ? config.log : false,
    };

    this.startCleanupInterval();
    this.initializeMinConnections();
  }

  /**
   * 获取连接
   */
  async acquire(): Promise<PrismaClient> {
    if (this.isShuttingDown) {
      throw new Error('连接池正在关闭中');
    }

    // 尝试获取空闲连接
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      this.activateConnection(idleConnection);
      this.stats.totalAcquired++;
      return idleConnection.client;
    }

    // 如果没有空闲连接且未达到最大连接数，创建新连接
    if (this.connections.size < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection();
        this.activateConnection(newConnection);
        this.stats.totalAcquired++;
        return newConnection.client;
      } catch (error) {
        this.log('创建新连接失败:', error);
      }
    }

    // 等待连接可用
    return this.waitForConnection();
  }

  /**
   * 释放连接
   */
  async release(client: PrismaClient): Promise<void> {
    const connection = this.findConnectionByClient(client);
    if (!connection) {
      this.log('警告: 尝试释放未知连接');
      return;
    }

    if (connection.status !== ConnectionStatus.ACTIVE) {
      this.log('警告: 尝试释放非活跃连接');
      return;
    }

    // 更新连接状态
    connection.status = ConnectionStatus.IDLE;
    connection.lastUsedAt = Date.now();
    connection.useCount++;

    this.stats.totalReleased++;

    // 如果有等待的请求，立即分配连接
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      this.activateConnection(connection);
      waiter.resolve(connection);
      return;
    }

    this.log(`连接已释放: ${connection.id}`);
  }

  /**
   * 获取连接池统计信息
   */
  getStats(): PoolStats {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === ConnectionStatus.ACTIVE).length;
    
    const idleConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === ConnectionStatus.IDLE).length;
    
    const pendingConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === ConnectionStatus.PENDING).length;

    const useTimes = this.stats.useTimes;
    const averageUseTime = useTimes.length > 0 
      ? useTimes.reduce((sum, time) => sum + time, 0) / useTimes.length 
      : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections,
      pendingConnections,
      waitingRequests: this.waitingQueue.length,
      totalCreated: this.stats.totalCreated,
      totalDestroyed: this.stats.totalDestroyed,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      averageUseTime,
      maxUseTime: useTimes.length > 0 ? Math.max(...useTimes) : 0,
      minUseTime: useTimes.length > 0 ? Math.min(...useTimes) : 0,
    };
  }

  /**
   * 关闭连接池
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // 停止清理定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 拒绝所有等待的请求
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      waiter.reject(new Error('连接池正在关闭'));
    }

    // 关闭所有连接
    const closePromises = Array.from(this.connections.values()).map(conn => 
      this.destroyConnection(conn)
    );

    await Promise.all(closePromises);
    this.connections.clear();
    
    this.log('连接池已关闭');
  }

  /**
   * 获取空闲连接
   */
  private getIdleConnection(): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.status === ConnectionStatus.IDLE) {
        return connection;
      }
    }
    return null;
  }

  /**
   * 激活连接
   */
  private activateConnection(connection: PoolConnection): void {
    connection.status = ConnectionStatus.ACTIVE;
    connection.lastUsedAt = Date.now();
  }

  /**
   * 创建新连接
   */
  private async createConnection(): Promise<PoolConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const client = new PrismaClient({
      log: this.config.log ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
      errorFormat: 'pretty',
    });

    const connection: PoolConnection = {
      id: connectionId,
      client,
      status: ConnectionStatus.PENDING,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };

    this.connections.set(connectionId, connection);

    try {
      await client.$connect();
      connection.status = ConnectionStatus.IDLE;
      this.stats.totalCreated++;
      this.log(`新连接已创建: ${connectionId}`);
      return connection;
    } catch (error) {
      this.connections.delete(connectionId);
      throw error;
    }
  }

  /**
   * 销毁连接
   */
  private async destroyConnection(connection: PoolConnection): Promise<void> {
    try {
      connection.status = ConnectionStatus.DESTROYED;
      await connection.client.$disconnect();
      this.connections.delete(connection.id);
      this.stats.totalDestroyed++;
      this.log(`连接已销毁: ${connection.id}`);
    } catch (error) {
      this.log(`销毁连接失败: ${connection.id}`, error);
    }
  }

  /**
   * 等待连接可用
   */
  private waitForConnection(): Promise<PrismaClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(w => w.resolve === waiterResolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('获取连接超时'));
      }, this.config.acquireTimeoutMillis);

      const waiterResolve = (connection: PoolConnection) => {
        clearTimeout(timeout);
        resolve(connection.client);
      };

      this.waitingQueue.push({
        resolve: waiterResolve,
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * 根据客户端查找连接
   */
  private findConnectionByClient(client: PrismaClient): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        return connection;
      }
    }
    return null;
  }

  /**
   * 初始化最小连接数
   */
  private async initializeMinConnections(): Promise<void> {
    const promises = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection().catch(error => {
        this.log('初始化连接失败:', error);
      }));
    }
    await Promise.all(promises);
  }

  /**
   * 启动清理定时器
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.reapIntervalMillis);
  }

  /**
   * 清理空闲连接
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToDestroy: PoolConnection[] = [];

    for (const connection of this.connections.values()) {
      if (
        connection.status === ConnectionStatus.IDLE &&
        now - connection.lastUsedAt > this.config.idleTimeoutMillis &&
        this.connections.size > this.config.minConnections
      ) {
        connectionsToDestroy.push(connection);
      }
    }

    connectionsToDestroy.forEach(connection => {
      this.destroyConnection(connection);
    });

    if (connectionsToDestroy.length > 0) {
      this.log(`清理了 ${connectionsToDestroy.length} 个空闲连接`);
    }
  }

  /**
   * 日志输出
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.log) {
      console.log(`[ConnectionPool] ${message}`, ...args);
    }
  }
}

// 创建全局连接池实例
export const connectionPool = new ConnectionPoolManager({
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
  log: config.server.isDevelopment,
});

export default connectionPool;
