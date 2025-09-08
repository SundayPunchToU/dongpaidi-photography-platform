import { performanceMonitor } from './performanceMonitor';
import { performanceAnalyzer } from './performanceAnalyzer';
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { log } from '@/config/logger';

/**
 * 性能监控系统初始化器
 */
export class PerformanceMonitoringInitializer {
  private static instance: PerformanceMonitoringInitializer;
  private config = getPerformanceMonitoringConfig();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): PerformanceMonitoringInitializer {
    if (!PerformanceMonitoringInitializer.instance) {
      PerformanceMonitoringInitializer.instance = new PerformanceMonitoringInitializer();
    }
    return PerformanceMonitoringInitializer.instance;
  }

  /**
   * 初始化性能监控系统
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.warn('Performance monitoring system is already initialized');
      return;
    }

    if (!this.config.enabled) {
      log.info('Performance monitoring is disabled');
      return;
    }

    try {
      log.info('Initializing performance monitoring system...');

      // 初始化性能监控器
      await this.initializePerformanceMonitor();

      // 初始化性能分析器
      await this.initializePerformanceAnalyzer();

      // 设置事件监听器
      this.setupEventListeners();

      // 设置清理任务
      this.setupCleanupTasks();

      this.isInitialized = true;

      log.info('Performance monitoring system initialized successfully', {
        config: {
          enabled: this.config.enabled,
          samplingRate: this.config.collection.samplingRate,
          batchSize: this.config.collection.batchSize,
          flushInterval: this.config.collection.flushInterval,
        },
      });

    } catch (error) {
      log.error('Failed to initialize performance monitoring system', { error });
      throw error;
    }
  }

  /**
   * 初始化性能监控器
   */
  private async initializePerformanceMonitor(): Promise<void> {
    try {
      // 性能监控器会在getInstance时自动初始化
      const stats = performanceMonitor.getMetricsStats();
      
      log.debug('Performance monitor initialized', {
        queueSize: stats.queueSize,
        isProcessing: stats.isProcessing,
        totalMetrics: stats.totalMetrics,
      });

    } catch (error) {
      log.error('Failed to initialize performance monitor', { error });
      throw error;
    }
  }

  /**
   * 初始化性能分析器
   */
  private async initializePerformanceAnalyzer(): Promise<void> {
    try {
      // 性能分析器会在getInstance时自动初始化
      log.debug('Performance analyzer initialized');

    } catch (error) {
      log.error('Failed to initialize performance analyzer', { error });
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    try {
      // 监听性能监控器事件
      performanceMonitor.on('metric_recorded', (metric) => {
        log.debug('Performance metric recorded', {
          type: metric.type,
          name: metric.name,
          value: metric.value,
          timestamp: metric.timestamp,
        });
      });

      performanceMonitor.on('metrics_flushed', (data) => {
        log.debug('Performance metrics flushed', {
          count: data.count,
        });
      });

      // 监听性能分析器事件
      performanceAnalyzer.on('analysis_completed', (result) => {
        log.info('Performance analysis completed', {
          analysisId: result.id,
          totalRequests: result.summary.totalRequests,
          avgResponseTime: result.summary.avgResponseTime,
          errorRate: result.summary.errorRate,
          alertCount: result.alerts.length,
        });

        // 如果有严重告警，记录警告日志
        const criticalAlerts = result.alerts.filter(alert => alert.severity === 'critical');
        if (criticalAlerts.length > 0) {
          log.warn('Critical performance alerts detected', {
            alertCount: criticalAlerts.length,
            alerts: criticalAlerts.map(alert => ({
              metric: alert.metric,
              value: alert.value,
              threshold: alert.threshold,
              message: alert.message,
            })),
          });
        }
      });

      log.debug('Performance monitoring event listeners set up');

    } catch (error) {
      log.error('Failed to setup event listeners', { error });
      throw error;
    }
  }

  /**
   * 设置清理任务
   */
  private setupCleanupTasks(): void {
    try {
      // 每天凌晨2点执行清理任务
      const cleanupInterval = 24 * 60 * 60 * 1000; // 24小时
      
      setInterval(async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          log.error('Performance monitoring cleanup failed', { error });
        }
      }, cleanupInterval);

      // 立即执行一次清理
      setTimeout(async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          log.error('Initial performance monitoring cleanup failed', { error });
        }
      }, 60000); // 1分钟后执行

      log.debug('Performance monitoring cleanup tasks set up');

    } catch (error) {
      log.error('Failed to setup cleanup tasks', { error });
      throw error;
    }
  }

  /**
   * 执行清理任务
   */
  private async performCleanup(): Promise<void> {
    try {
      log.info('Starting performance monitoring cleanup...');

      // 清理过期的性能报告文件
      await this.cleanupReportFiles();

      // 清理过期的日志文件
      await this.cleanupLogFiles();

      log.info('Performance monitoring cleanup completed');

    } catch (error) {
      log.error('Performance monitoring cleanup failed', { error });
      throw error;
    }
  }

  /**
   * 清理过期的报告文件
   */
  private async cleanupReportFiles(): Promise<void> {
    try {
      if (!this.config.storage.file.enabled) {
        return;
      }

      const fs = await import('fs/promises');
      const path = await import('path');
      
      const reportPath = path.join(this.config.storage.file.path, 'reports');
      
      try {
        const files = await fs.readdir(reportPath);
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天

        for (const file of files) {
          const filePath = path.join(reportPath, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            log.debug('Deleted old performance report file', { file });
          }
        }
      } catch (error) {
        // 目录不存在或其他错误，忽略
        log.debug('Report cleanup skipped', { error: (error as Error).message });
      }

    } catch (error) {
      log.error('Failed to cleanup report files', { error });
    }
  }

  /**
   * 清理过期的日志文件
   */
  private async cleanupLogFiles(): Promise<void> {
    try {
      if (!this.config.storage.file.enabled) {
        return;
      }

      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logPath = this.config.storage.file.path;
      
      try {
        const files = await fs.readdir(logPath);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

        for (const file of files) {
          if (!file.startsWith('performance-') || !file.endsWith('.jsonl')) {
            continue;
          }

          const filePath = path.join(logPath, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            log.debug('Deleted old performance log file', { file });
          }
        }
      } catch (error) {
        // 目录不存在或其他错误，忽略
        log.debug('Log cleanup skipped', { error: (error as Error).message });
      }

    } catch (error) {
      log.error('Failed to cleanup log files', { error });
    }
  }

  /**
   * 获取系统状态
   */
  public getSystemStatus(): {
    initialized: boolean;
    enabled: boolean;
    monitor: any;
    analyzer: any;
  } {
    const monitorStats = performanceMonitor.getMetricsStats();
    
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      monitor: {
        queueSize: monitorStats.queueSize,
        isProcessing: monitorStats.isProcessing,
        lastFlush: monitorStats.lastFlush,
        totalMetrics: monitorStats.totalMetrics,
      },
      analyzer: {
        // 分析器状态信息
        available: true,
      },
    };
  }

  /**
   * 关闭性能监控系统
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      log.info('Shutting down performance monitoring system...');

      // 关闭性能监控器
      await performanceMonitor.shutdown();

      // 关闭性能分析器
      await performanceAnalyzer.shutdown();

      this.isInitialized = false;

      log.info('Performance monitoring system shut down successfully');

    } catch (error) {
      log.error('Failed to shutdown performance monitoring system', { error });
      throw error;
    }
  }
}

// 导出单例实例
export const performanceMonitoringInit = PerformanceMonitoringInitializer.getInstance();

/**
 * 初始化性能监控系统
 */
export async function initializePerformanceMonitoring(): Promise<void> {
  await performanceMonitoringInit.initialize();
}

/**
 * 获取性能监控系统状态
 */
export function getPerformanceMonitoringStatus() {
  return performanceMonitoringInit.getSystemStatus();
}

/**
 * 关闭性能监控系统
 */
export async function shutdownPerformanceMonitoring(): Promise<void> {
  await performanceMonitoringInit.shutdown();
}
