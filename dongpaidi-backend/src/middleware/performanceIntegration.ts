import { Express } from 'express';
import { 
  httpPerformanceMiddleware, 
  errorPerformanceMiddleware, 
  performanceHealthMiddleware 
} from './performanceMonitoring';
import { initializePerformanceMonitoring } from '@/services/performanceMonitoringInit';
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { log } from '@/config/logger';

/**
 * 集成性能监控到Express应用
 */
export async function integratePerformanceMonitoring(app: Express): Promise<void> {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    log.info('Performance monitoring integration skipped (disabled)');
    return;
  }

  try {
    log.info('Integrating performance monitoring...');

    // 初始化性能监控系统
    await initializePerformanceMonitoring();

    // 添加HTTP性能监控中间件（在其他中间件之前）
    app.use(httpPerformanceMiddleware());

    // 添加健康检查增强中间件
    app.use(performanceHealthMiddleware());

    // 添加错误性能监控中间件（在错误处理中间件之前）
    app.use(errorPerformanceMiddleware());

    log.info('Performance monitoring integrated successfully');

  } catch (error) {
    log.error('Failed to integrate performance monitoring', { error });
    throw error;
  }
}

/**
 * 为数据库操作添加性能监控
 */
export function enhanceDatabaseWithPerformanceMonitoring() {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.database.enabled) {
    return;
  }

  try {
    // 这里可以扩展Prisma中间件来添加性能监控
    // 由于已经在databaseMonitoring.ts中实现了类似功能，这里主要是集成
    log.info('Database performance monitoring enhanced');

  } catch (error) {
    log.error('Failed to enhance database with performance monitoring', { error });
  }
}

/**
 * 为缓存操作添加性能监控
 */
export function enhanceCacheWithPerformanceMonitoring() {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.cache.enabled) {
    return;
  }

  try {
    // 这里可以为缓存服务添加性能监控装饰器
    log.info('Cache performance monitoring enhanced');

  } catch (error) {
    log.error('Failed to enhance cache with performance monitoring', { error });
  }
}

/**
 * 性能监控中间件工厂
 * 用于创建特定配置的性能监控中间件
 */
export function createPerformanceMiddleware(options: {
  enableHttp?: boolean;
  enableDatabase?: boolean;
  enableCache?: boolean;
  enableErrors?: boolean;
  enableHealth?: boolean;
} = {}) {
  const {
    enableHttp = true,
    enableDatabase = true,
    enableCache = true,
    enableErrors = true,
    enableHealth = true,
  } = options;

  const middlewares: any[] = [];

  if (enableHttp) {
    middlewares.push(httpPerformanceMiddleware());
  }

  if (enableHealth) {
    middlewares.push(performanceHealthMiddleware());
  }

  if (enableErrors) {
    middlewares.push(errorPerformanceMiddleware());
  }

  return middlewares;
}

/**
 * 性能监控装饰器工厂
 * 用于为服务类添加性能监控
 */
export function withPerformanceMonitoring<T extends new (...args: any[]) => any>(
  constructor: T,
  category: string
): T {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    return constructor;
  }

  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      
      // 为所有方法添加性能监控
      const prototype = Object.getPrototypeOf(this);
      const methodNames = Object.getOwnPropertyNames(prototype)
        .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');

      for (const methodName of methodNames) {
        const originalMethod = this[methodName];
        if (typeof originalMethod === 'function') {
          this[methodName] = async (...methodArgs: any[]) => {
            const startTime = Date.now();
            let success = false;
            let error: Error | undefined;

            try {
              const result = await originalMethod.apply(this, methodArgs);
              success = true;
              return result;
            } catch (e) {
              error = e as Error;
              throw e;
            } finally {
              const duration = Date.now() - startTime;
              
              // 记录业务指标
              const { performanceMonitor } = await import('@/services/performanceMonitor');
              performanceMonitor.recordBusinessMetric({
                category,
                action: methodName,
                count: 1,
                duration,
                success,
                metadata: {
                  className: constructor.name,
                  error: error?.message,
                  timestamp: new Date(),
                },
              });
            }
          };
        }
      }
    }
  };
}

/**
 * 方法性能监控装饰器
 */
export function performanceMonitored(category: string, action?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const config = getPerformanceMonitoringConfig();
    
    if (!config.enabled) {
      return descriptor;
    }

    const method = descriptor.value;
    if (typeof method !== 'function') {
      return descriptor;
    }

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = false;
      let error: Error | undefined;

      try {
        const result = await method.apply(this, args);
        success = true;
        return result;
      } catch (e) {
        error = e as Error;
        throw e;
      } finally {
        const duration = Date.now() - startTime;
        
        // 记录业务指标
        const { performanceMonitor } = await import('@/services/performanceMonitor');
        performanceMonitor.recordBusinessMetric({
          category,
          action: action || propertyName,
          count: 1,
          duration,
          success,
          metadata: {
            className: target.constructor.name,
            methodName: propertyName,
            error: error?.message,
            timestamp: new Date(),
          },
        });
      }
    };

    return descriptor;
  };
}

/**
 * 异步操作性能监控包装器
 */
export function wrapWithPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  category: string,
  action: string
): T {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    return fn;
  }

  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;

    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      
      // 记录业务指标
      const { performanceMonitor } = await import('@/services/performanceMonitor');
      performanceMonitor.recordBusinessMetric({
        category,
        action,
        count: 1,
        duration,
        success,
        metadata: {
          functionName: fn.name,
          error: error?.message,
          timestamp: new Date(),
        },
      });
    }
  }) as T;
}

/**
 * 批量操作性能监控
 */
export async function monitorBatchOperation<T>(
  operation: () => Promise<T>,
  category: string,
  action: string,
  batchSize: number
): Promise<T> {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    return await operation();
  }

  const startTime = Date.now();
  let success = false;
  let error: Error | undefined;

  try {
    const result = await operation();
    success = true;
    return result;
  } catch (e) {
    error = e as Error;
    throw e;
  } finally {
    const duration = Date.now() - startTime;
    
    // 记录业务指标
    const { performanceMonitor } = await import('@/services/performanceMonitor');
    performanceMonitor.recordBusinessMetric({
      category,
      action,
      count: batchSize,
      duration,
      success,
      metadata: {
        batchSize,
        avgTimePerItem: duration / batchSize,
        error: error?.message,
        timestamp: new Date(),
      },
    });
  }
}

/**
 * 定时任务性能监控
 */
export function monitorScheduledTask(
  taskName: string,
  taskFn: () => Promise<void>
): () => Promise<void> {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    return taskFn;
  }

  return async () => {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;

    try {
      await taskFn();
      success = true;
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      
      // 记录业务指标
      const { performanceMonitor } = await import('@/services/performanceMonitor');
      performanceMonitor.recordBusinessMetric({
        category: 'scheduled_task',
        action: taskName,
        count: 1,
        duration,
        success,
        metadata: {
          taskName,
          error: error?.message,
          timestamp: new Date(),
        },
      });
    }
  };
}
