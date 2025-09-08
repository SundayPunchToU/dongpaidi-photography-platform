import { EventEmitter } from 'events';
import os from 'os';
import { performanceMonitoringConfig, getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 性能指标类型
 */
export enum MetricType {
  HTTP_REQUEST = 'http_request',
  DATABASE_QUERY = 'database_query',
  SYSTEM_RESOURCE = 'system_resource',
  CACHE_OPERATION = 'cache_operation',
  BUSINESS_METRIC = 'business_metric',
  ERROR_EVENT = 'error_event',
}

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  id: string;
  type: MetricType;
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * HTTP请求指标
 */
export interface HttpRequestMetric extends PerformanceMetric {
  type: MetricType.HTTP_REQUEST;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * 数据库查询指标
 */
export interface DatabaseQueryMetric extends PerformanceMetric {
  type: MetricType.DATABASE_QUERY;
  query: string;
  model: string;
  action: string;
  executionTime: number;
  rowsAffected?: number;
  parameters?: any;
  error?: string;
}

/**
 * 系统资源指标
 */
export interface SystemResourceMetric extends PerformanceMetric {
  type: MetricType.SYSTEM_RESOURCE;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage?: number;
  networkIn?: number;
  networkOut?: number;
  loadAverage: number[];
  uptime: number;
}

/**
 * 缓存操作指标
 */
export interface CacheOperationMetric extends PerformanceMetric {
  type: MetricType.CACHE_OPERATION;
  operation: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  hit: boolean;
  executionTime: number;
  size?: number;
}

/**
 * 业务指标
 */
export interface BusinessMetric extends PerformanceMetric {
  type: MetricType.BUSINESS_METRIC;
  category: string;
  action: string;
  count: number;
  duration?: number;
  success: boolean;
}

/**
 * 聚合统计
 */
export interface AggregatedStats {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private config = getPerformanceMonitoringConfig();
  private metricsQueue: PerformanceMetric[] = [];
  private isProcessing = false;
  private lastFlush = Date.now();
  
  // 内存存储
  private metricsStore = new Map<string, PerformanceMetric[]>();
  private aggregatedStats = new Map<string, AggregatedStats>();
  
  // 系统监控定时器
  private systemMonitorTimer?: NodeJS.Timeout;
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    super();
    this.initializeMonitor();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 初始化监控器
   */
  private async initializeMonitor(): Promise<void> {
    if (!this.config.enabled) {
      log.info('Performance monitoring is disabled');
      return;
    }

    try {
      // 启动系统资源监控
      if (this.config.metrics.system.enabled) {
        this.startSystemMonitoring();
      }

      // 启动定期刷新
      this.startPeriodicFlush();

      // 设置清理任务
      this.setupCleanupTasks();

      log.info('Performance monitor initialized successfully');
    } catch (error) {
      log.error('Failed to initialize performance monitor', { error });
    }
  }

  /**
   * 记录HTTP请求指标
   */
  public recordHttpRequest(metric: Omit<HttpRequestMetric, 'id' | 'timestamp' | 'type' | 'name' | 'value' | 'unit' | 'tags'>): void {
    if (!this.shouldSample()) return;

    const httpMetric: HttpRequestMetric = {
      id: SecurityUtil.generateUUID(),
      type: MetricType.HTTP_REQUEST,
      timestamp: new Date(),
      name: 'http_request',
      value: metric.responseTime,
      unit: 'ms',
      tags: {
        method: metric.method,
        path: metric.path,
        status: metric.statusCode.toString(),
      },
      ...metric,
    };

    this.addMetric(httpMetric);
  }

  /**
   * 记录数据库查询指标
   */
  public recordDatabaseQuery(metric: Omit<DatabaseQueryMetric, 'id' | 'timestamp' | 'type' | 'name' | 'value' | 'unit' | 'tags'>): void {
    if (!this.shouldSample()) return;

    const dbMetric: DatabaseQueryMetric = {
      id: SecurityUtil.generateUUID(),
      type: MetricType.DATABASE_QUERY,
      timestamp: new Date(),
      name: 'database_query',
      value: metric.executionTime,
      unit: 'ms',
      tags: {
        model: metric.model,
        action: metric.action,
        slow: (metric.executionTime > this.config.metrics.database.slowQueryThreshold).toString(),
      },
      ...metric,
    };

    this.addMetric(dbMetric);
  }

  /**
   * 记录缓存操作指标
   */
  public recordCacheOperation(metric: Omit<CacheOperationMetric, 'id' | 'timestamp' | 'type' | 'name' | 'value' | 'unit' | 'tags'>): void {
    if (!this.shouldSample()) return;

    const cacheMetric: CacheOperationMetric = {
      id: SecurityUtil.generateUUID(),
      type: MetricType.CACHE_OPERATION,
      timestamp: new Date(),
      name: 'cache_operation',
      value: metric.executionTime,
      unit: 'ms',
      tags: {
        operation: metric.operation,
        hit: metric.hit.toString(),
      },
      ...metric,
    };

    this.addMetric(cacheMetric);
  }

  /**
   * 记录业务指标
   */
  public recordBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'timestamp' | 'type' | 'name' | 'value' | 'unit' | 'tags'>): void {
    if (!this.shouldSample()) return;

    const businessMetric: BusinessMetric = {
      id: SecurityUtil.generateUUID(),
      type: MetricType.BUSINESS_METRIC,
      timestamp: new Date(),
      name: 'business_metric',
      value: metric.count,
      unit: 'count',
      tags: {
        category: metric.category,
        action: metric.action,
        success: metric.success.toString(),
      },
      ...metric,
    };

    this.addMetric(businessMetric);
  }

  /**
   * 添加指标到队列
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metricsQueue.push(metric);

    // 检查是否需要立即刷新
    if (this.shouldFlush()) {
      this.flushMetrics();
    }

    // 发出事件
    this.emit('metric_recorded', metric);
  }

  /**
   * 检查是否应该采样
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.collection.samplingRate;
  }

  /**
   * 检查是否需要刷新
   */
  private shouldFlush(): boolean {
    const now = Date.now();
    const timeSinceLastFlush = now - this.lastFlush;
    
    return (
      this.metricsQueue.length >= this.config.collection.batchSize ||
      timeSinceLastFlush >= this.config.collection.flushInterval ||
      this.metricsQueue.length >= this.config.collection.maxQueueSize
    );
  }

  /**
   * 刷新指标队列
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const batch = this.metricsQueue.splice(0, this.config.collection.batchSize);

    try {
      // 存储到内存
      if (this.config.storage.memory.enabled) {
        this.storeToMemory(batch);
      }

      // 存储到文件
      if (this.config.storage.file.enabled) {
        await this.storeToFile(batch);
      }

      // 存储到数据库
      if (this.config.storage.database.enabled) {
        await this.storeToDatabase(batch);
      }

      // 存储到外部系统
      if (this.config.storage.external.enabled) {
        await this.storeToExternal(batch);
      }

      // 更新聚合统计
      this.updateAggregatedStats(batch);

      this.lastFlush = Date.now();
      this.emit('metrics_flushed', { count: batch.length });

      log.debug(`Flushed ${batch.length} performance metrics`);

    } catch (error) {
      log.error('Failed to flush performance metrics', { error, batchSize: batch.length });
      // 将失败的批次重新加入队列
      this.metricsQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 存储到内存
   */
  private storeToMemory(metrics: PerformanceMetric[]): void {
    for (const metric of metrics) {
      const key = `${metric.type}:${metric.name}`;
      
      if (!this.metricsStore.has(key)) {
        this.metricsStore.set(key, []);
      }

      const store = this.metricsStore.get(key)!;
      store.push(metric);

      // 保持存储大小限制
      if (store.length > this.config.storage.memory.maxEntries) {
        store.splice(0, store.length - this.config.storage.memory.maxEntries);
      }
    }
  }

  /**
   * 存储到文件
   */
  private async storeToFile(metrics: PerformanceMetric[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // 确保目录存在
      await fs.mkdir(this.config.storage.file.path, { recursive: true });

      // 按日期分组
      const dateGroups = new Map<string, PerformanceMetric[]>();

      for (const metric of metrics) {
        const dateKey = metric.timestamp.toISOString().split('T')[0];
        if (dateKey) {
          if (!dateGroups.has(dateKey)) {
            dateGroups.set(dateKey, []);
          }
          dateGroups.get(dateKey)!.push(metric);
        }
      }

      // 写入文件
      for (const [date, dateMetrics] of dateGroups.entries()) {
        const fileName = `performance-${date}.jsonl`;
        const filePath = path.join(this.config.storage.file.path, fileName);
        
        const lines = dateMetrics.map(metric => JSON.stringify(metric)).join('\n') + '\n';
        await fs.appendFile(filePath, lines, 'utf8');
      }

    } catch (error) {
      log.error('Failed to store metrics to file', { error });
      throw error;
    }
  }

  /**
   * 存储到数据库
   */
  private async storeToDatabase(metrics: PerformanceMetric[]): Promise<void> {
    // 这里应该实现数据库存储逻辑
    // 由于当前schema中没有performance_metrics表，暂时跳过
    log.debug('Database storage not implemented yet', { count: metrics.length });
  }

  /**
   * 存储到外部系统
   */
  private async storeToExternal(metrics: PerformanceMetric[]): Promise<void> {
    // 这里应该实现外部系统存储逻辑（如Prometheus、InfluxDB）
    log.debug('External storage not implemented yet', { count: metrics.length });
  }

  /**
   * 更新聚合统计
   */
  private updateAggregatedStats(metrics: PerformanceMetric[]): void {
    const groups = new Map<string, number[]>();

    // 按类型和名称分组
    for (const metric of metrics) {
      const key = `${metric.type}:${metric.name}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric.value);
    }

    // 计算统计信息
    for (const [key, values] of groups.entries()) {
      if (values.length === 0) continue;

      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      const stats: AggregatedStats = {
        count: values.length,
        sum,
        avg: sum / values.length,
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
      };

      this.aggregatedStats.set(key, stats);
    }
  }

  /**
   * 启动系统资源监控
   */
  private startSystemMonitoring(): void {
    const collectSystemMetrics = () => {
      try {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        // 计算CPU使用率
        let totalIdle = 0;
        let totalTick = 0;
        
        for (const cpu of cpus) {
          for (const type in cpu.times) {
            totalTick += (cpu.times as any)[type];
          }
          totalIdle += cpu.times.idle;
        }
        
        const cpuUsage = 100 - (totalIdle / totalTick * 100);

        const systemMetric: SystemResourceMetric = {
          id: SecurityUtil.generateUUID(),
          type: MetricType.SYSTEM_RESOURCE,
          timestamp: new Date(),
          name: 'system_resource',
          value: cpuUsage,
          unit: 'percent',
          tags: {
            resource: 'system',
          },
          cpuUsage,
          memoryUsage: (usedMem / totalMem) * 100,
          memoryTotal: totalMem,
          loadAverage: os.loadavg(),
          uptime: os.uptime(),
        };

        this.addMetric(systemMetric);

      } catch (error) {
        log.error('Failed to collect system metrics', { error });
      }
    };

    // 立即收集一次
    collectSystemMetrics();

    // 定期收集
    this.systemMonitorTimer = setInterval(
      collectSystemMetrics,
      this.config.metrics.system.collectInterval
    );
  }

  /**
   * 启动定期刷新
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.metricsQueue.length > 0) {
        await this.flushMetrics();
      }
    }, this.config.collection.flushInterval);
  }

  /**
   * 设置清理任务
   */
  private setupCleanupTasks(): void {
    // 每小时清理一次过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000);
  }

  /**
   * 清理过期数据
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    const ttl = this.config.storage.memory.ttl;

    for (const [key, metrics] of this.metricsStore.entries()) {
      const filtered = metrics.filter(metric => 
        now - metric.timestamp.getTime() < ttl
      );
      
      if (filtered.length !== metrics.length) {
        this.metricsStore.set(key, filtered);
      }
    }

    log.debug('Cleaned up expired performance metrics');
  }

  /**
   * 获取指标统计
   */
  public getMetricsStats(): {
    queueSize: number;
    isProcessing: boolean;
    lastFlush: Date;
    totalMetrics: number;
    aggregatedStats: Map<string, AggregatedStats>;
  } {
    let totalMetrics = 0;
    for (const metrics of this.metricsStore.values()) {
      totalMetrics += metrics.length;
    }

    return {
      queueSize: this.metricsQueue.length,
      isProcessing: this.isProcessing,
      lastFlush: new Date(this.lastFlush),
      totalMetrics,
      aggregatedStats: this.aggregatedStats,
    };
  }

  /**
   * 获取指定类型的指标
   */
  public getMetrics(type: MetricType, limit: number = 100): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];
    
    for (const [key, metrics] of this.metricsStore.entries()) {
      if (key.startsWith(type)) {
        allMetrics.push(...metrics);
      }
    }

    return allMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 获取聚合统计
   */
  public getAggregatedStats(key?: string): Map<string, AggregatedStats> | AggregatedStats | undefined {
    if (key) {
      return this.aggregatedStats.get(key);
    }
    return this.aggregatedStats;
  }

  /**
   * 关闭监控器
   */
  public async shutdown(): Promise<void> {
    log.info('Shutting down performance monitor...');

    // 清除定时器
    if (this.systemMonitorTimer) {
      clearInterval(this.systemMonitorTimer);
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // 刷新剩余指标
    if (this.metricsQueue.length > 0) {
      await this.flushMetrics();
    }

    // 清除事件监听器
    this.removeAllListeners();

    log.info('Performance monitor shut down successfully');
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();
