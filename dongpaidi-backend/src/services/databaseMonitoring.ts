import { PrismaClient } from '@prisma/client';
import { db } from '@/config/database';
import { connectionPool } from './connectionPool';

/**
 * 数据库性能指标
 */
export interface DatabaseMetrics {
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  queries: {
    totalExecuted: number;
    averageExecutionTime: number;
    slowQueries: number;
    failedQueries: number;
  };
  tables: {
    name: string;
    rowCount: number;
    size: string;
    indexSize: string;
  }[];
  performance: {
    cacheHitRatio: number;
    indexUsage: number;
    deadlocks: number;
    blockedQueries: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: number;
  };
}

/**
 * 慢查询信息
 */
export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters?: any;
  stackTrace?: string;
}

/**
 * 数据库监控服务
 */
export class DatabaseMonitoringService {
  private prisma: PrismaClient;
  private queryMetrics: Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }> = new Map();
  
  private slowQueries: SlowQuery[] = [];
  private slowQueryThreshold = 1000; // 1秒
  private maxSlowQueries = 100;
  
  private monitoringInterval: NodeJS.Timeout | undefined;
  private isMonitoring = false;

  constructor() {
    this.prisma = db.prisma;
    this.setupQueryLogging();
  }

  /**
   * 开始监控
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('数据库监控收集指标失败:', error);
      }
    }, intervalMs);

    console.log('数据库监控已启动');
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('数据库监控已停止');
  }

  /**
   * 获取当前数据库指标
   */
  async getMetrics(): Promise<DatabaseMetrics> {
    const [
      connectionStats,
      queryStats,
      tableStats,
      performanceStats,
      systemStats
    ] = await Promise.all([
      this.getConnectionMetrics(),
      this.getQueryMetrics(),
      this.getTableMetrics(),
      this.getPerformanceMetrics(),
      this.getSystemMetrics(),
    ]);

    return {
      connections: connectionStats,
      queries: queryStats,
      tables: tableStats,
      performance: performanceStats,
      system: systemStats,
    };
  }

  /**
   * 获取慢查询列表
   */
  getSlowQueries(limit: number = 20): SlowQuery[] {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * 清除慢查询记录
   */
  clearSlowQueries(): void {
    this.slowQueries = [];
  }

  /**
   * 设置慢查询阈值
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
  }

  /**
   * 获取查询统计信息
   */
  getQueryStatistics(): Array<{
    query: string;
    count: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
    errorRate: number;
  }> {
    return Array.from(this.queryMetrics.entries()).map(([query, metrics]) => ({
      query,
      count: metrics.count,
      averageTime: metrics.totalTime / metrics.count,
      maxTime: metrics.maxTime,
      minTime: metrics.minTime,
      errorRate: metrics.errors / metrics.count,
    }));
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message: string;
      value?: any;
    }>;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // 数据库连接检查
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      checks.push({
        name: 'database_connection',
        status: responseTime < 1000 ? 'pass' as const : 'fail' as const,
        message: `数据库响应时间: ${responseTime}ms`,
        value: responseTime,
      });

      if (responseTime >= 1000) {
        overallStatus = 'warning';
      }

      // 连接池检查
      const poolStats = connectionPool.getStats();
      const connectionUtilization = poolStats.activeConnections / poolStats.totalConnections;

      checks.push({
        name: 'connection_pool',
        status: connectionUtilization < 0.8 ? 'pass' as const : 'fail' as const,
        message: `连接池使用率: ${(connectionUtilization * 100).toFixed(1)}%`,
        value: connectionUtilization,
      });

      if (connectionUtilization >= 0.8) {
        overallStatus = connectionUtilization >= 0.95 ? 'critical' : 'warning';
      }

      // 慢查询检查
      const recentSlowQueries = this.slowQueries.filter(
        q => Date.now() - q.timestamp.getTime() < 300000 // 最近5分钟
      ).length;

      checks.push({
        name: 'slow_queries',
        status: recentSlowQueries < 10 ? 'pass' as const : 'fail' as const,
        message: `最近5分钟慢查询数量: ${recentSlowQueries}`,
        value: recentSlowQueries,
      });

      if (recentSlowQueries >= 10) {
        overallStatus = recentSlowQueries >= 50 ? 'critical' : 'warning';
      }

    } catch (error) {
      checks.push({
        name: 'database_connection',
        status: 'fail' as const,
        message: `数据库连接失败: ${error instanceof Error ? error.message : String(error)}`,
      });
      overallStatus = 'critical';
    }

    return {
      status: overallStatus,
      checks,
    };
  }

  /**
   * 设置查询日志记录
   */
  private setupQueryLogging(): void {
    // 这里可以扩展Prisma的查询日志功能
    // 由于Prisma的限制，我们使用中间件来记录查询性能
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      let error: Error | null = null;

      try {
        const result = await next(params);
        return result;
      } catch (e) {
        error = e as Error;
        throw e;
      } finally {
        const executionTime = Date.now() - start;
        const queryKey = `${params.model}.${params.action}`;

        // 更新查询指标
        this.updateQueryMetrics(queryKey, executionTime, !!error);

        // 记录慢查询
        if (executionTime > this.slowQueryThreshold) {
          this.recordSlowQuery({
            query: queryKey,
            executionTime,
            timestamp: new Date(),
            parameters: params.args,
          });
        }
      }
    });
  }

  /**
   * 更新查询指标
   */
  private updateQueryMetrics(queryKey: string, executionTime: number, hasError: boolean): void {
    const existing = this.queryMetrics.get(queryKey) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Infinity,
      errors: 0,
    };

    existing.count++;
    existing.totalTime += executionTime;
    existing.maxTime = Math.max(existing.maxTime, executionTime);
    existing.minTime = Math.min(existing.minTime, executionTime);
    
    if (hasError) {
      existing.errors++;
    }

    this.queryMetrics.set(queryKey, existing);
  }

  /**
   * 记录慢查询
   */
  private recordSlowQuery(slowQuery: SlowQuery): void {
    this.slowQueries.push(slowQuery);

    // 保持慢查询列表大小
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries = this.slowQueries
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, this.maxSlowQueries);
    }
  }

  /**
   * 收集指标
   */
  private async collectMetrics(): Promise<void> {
    // 这里可以定期收集和存储指标数据
    const metrics = await this.getMetrics();
    
    // 可以将指标发送到监控系统或存储到数据库
    console.log('数据库指标已收集:', {
      connections: metrics.connections.total,
      activeQueries: metrics.connections.active,
      slowQueries: this.slowQueries.length,
    });
  }

  /**
   * 获取连接指标
   */
  private async getConnectionMetrics(): Promise<DatabaseMetrics['connections']> {
    const poolStats = connectionPool.getStats();
    
    return {
      total: poolStats.totalConnections,
      active: poolStats.activeConnections,
      idle: poolStats.idleConnections,
      waiting: poolStats.waitingRequests,
    };
  }

  /**
   * 获取查询指标
   */
  private getQueryMetrics(): DatabaseMetrics['queries'] {
    const allMetrics = Array.from(this.queryMetrics.values());
    const totalExecuted = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0);
    const slowQueries = this.slowQueries.length;
    const failedQueries = allMetrics.reduce((sum, m) => sum + m.errors, 0);

    return {
      totalExecuted,
      averageExecutionTime: totalExecuted > 0 ? totalTime / totalExecuted : 0,
      slowQueries,
      failedQueries,
    };
  }

  /**
   * 获取表指标
   */
  private async getTableMetrics(): Promise<DatabaseMetrics['tables']> {
    try {
      // 这里应该根据实际数据库类型实现
      // SQLite版本的简化实现
      const tables = ['users', 'works', 'appointments', 'orders', 'payments'];
      const tableStats = [];

      for (const table of tables) {
        try {
          const count = await (this.prisma as any)[table].count();
          tableStats.push({
            name: table,
            rowCount: count,
            size: 'N/A', // SQLite不容易获取表大小
            indexSize: 'N/A',
          });
        } catch (error) {
          // 忽略不存在的表
        }
      }

      return tableStats;
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取性能指标
   */
  private async getPerformanceMetrics(): Promise<DatabaseMetrics['performance']> {
    // 简化的性能指标
    return {
      cacheHitRatio: 0.95, // 模拟值
      indexUsage: 0.85, // 模拟值
      deadlocks: 0,
      blockedQueries: 0,
    };
  }

  /**
   * 获取系统指标
   */
  private getSystemMetrics(): DatabaseMetrics['system'] {
    const memUsage = process.memoryUsage();
    
    return {
      cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      diskUsage: 0, // 需要额外的库来获取磁盘使用情况
      uptime: process.uptime(),
    };
  }
}

// 创建数据库监控服务实例
export const dbMonitoring = new DatabaseMonitoringService();

export default dbMonitoring;
