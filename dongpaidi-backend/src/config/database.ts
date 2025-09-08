import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { connectionPool } from '@/services/connectionPool';
import { dbMonitoring } from '@/services/databaseMonitoring';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: config.server.isDevelopment
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

// 数据库连接管理
export class DatabaseManager {
  private static instance: DatabaseManager;
  private _prisma: PrismaClient;
  private _isConnected = false;

  private constructor() {
    this._prisma = prisma;
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  public get isConnected(): boolean {
    return this._isConnected;
  }

  // 连接数据库
  public async connect(): Promise<void> {
    try {
      await this._prisma.$connect();
      this._isConnected = true;

      // 启动数据库监控
      if (config.server.isDevelopment) {
        dbMonitoring.startMonitoring(60000); // 每分钟收集一次指标
      }

      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // 断开数据库连接
  public async disconnect(): Promise<void> {
    try {
      // 停止数据库监控
      dbMonitoring.stopMonitoring();

      // 关闭连接池
      await connectionPool.shutdown();

      await this._prisma.$disconnect();
      this._isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  // 健康检查
  public async healthCheck(): Promise<boolean> {
    try {
      await this._prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  // 执行事务
  public async transaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this._prisma.$transaction(fn);
  }
}

// 导出单例实例
export const db = DatabaseManager.getInstance();
export { prisma };

// 优雅关闭处理
process.on('beforeExit', async () => {
  await db.disconnect();
});

process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.disconnect();
  process.exit(0);
});
