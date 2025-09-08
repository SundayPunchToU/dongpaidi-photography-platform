import { Request, Response, NextFunction } from 'express';
import { performanceMonitor, MetricType } from '@/services/performanceMonitor';
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { log } from '@/config/logger';

/**
 * 扩展Request接口以包含性能监控数据
 */
declare global {
  namespace Express {
    interface Request {
      performanceStart?: number;
      performanceMetrics?: {
        requestSize?: number;
        userId?: string;
        sessionId?: string;
      };
    }
  }
}

/**
 * HTTP请求性能监控中间件
 */
export function httpPerformanceMiddleware() {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.http.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // 检查是否应该排除此路径
    const shouldExclude = config.metrics.http.excludePaths.some(path => 
      req.path.startsWith(path)
    );
    
    if (shouldExclude) {
      return next();
    }

    // 记录开始时间
    req.performanceStart = Date.now();
    
    // 初始化性能指标对象
    req.performanceMetrics = {};

    // 记录请求大小
    if (config.metrics.http.trackRequestSize) {
      const contentLength = req.get('content-length');
      if (contentLength) {
        req.performanceMetrics.requestSize = parseInt(contentLength, 10);
      }
    }

    // 记录用户信息
    if ((req as any).user) {
      req.performanceMetrics.userId = (req as any).user.id;
    }

    // 监听响应完成事件
    res.on('finish', () => {
      try {
        const responseTime = Date.now() - (req.performanceStart || Date.now());
        
        // 获取响应大小
        let responseSize: number | undefined;
        if (config.metrics.http.trackResponseSize) {
          const contentLength = res.get('content-length');
          if (contentLength) {
            responseSize = parseInt(contentLength, 10);
          }
        }

        // 记录HTTP请求指标
        performanceMonitor.recordHttpRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestSize: req.performanceMetrics?.requestSize,
          responseSize,
          userAgent: req.get('user-agent'),
          ip: req.ip,
          userId: req.performanceMetrics?.userId,
          metadata: {
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            headers: {
              'content-type': req.get('content-type'),
              'accept': req.get('accept'),
            },
          },
        });

        // 记录慢请求
        if (responseTime > config.metrics.http.slowRequestThreshold) {
          log.warn('Slow HTTP request detected', {
            method: req.method,
            path: req.path,
            responseTime,
            statusCode: res.statusCode,
            userId: req.performanceMetrics?.userId,
            ip: req.ip,
          });
        }

        // 记录错误请求
        if (res.statusCode >= 400) {
          performanceMonitor.recordBusinessMetric({
            category: 'http_error',
            action: `${req.method}_${req.path}`,
            count: 1,
            duration: responseTime,
            success: false,
            metadata: {
              statusCode: res.statusCode,
              method: req.method,
              path: req.path,
              userId: req.performanceMetrics?.userId,
            },
          });
        }

      } catch (error) {
        log.error('Error in HTTP performance monitoring', { error });
      }
    });

    next();
  };
}

/**
 * 数据库查询性能监控中间件工厂
 * 用于包装数据库操作
 */
export function createDatabasePerformanceWrapper() {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.database.enabled) {
    return {
      wrapQuery: <T>(operation: () => Promise<T>) => operation,
    };
  }

  return {
    wrapQuery: async <T>(
      operation: () => Promise<T>,
      metadata: {
        model: string;
        action: string;
        query?: string;
        parameters?: any;
      }
    ): Promise<T> => {
      const startTime = Date.now();
      let error: Error | undefined;
      let result: T;

      try {
        result = await operation();
        return result;
      } catch (e) {
        error = e as Error;
        throw e;
      } finally {
        const executionTime = Date.now() - startTime;

        // 记录数据库查询指标
        performanceMonitor.recordDatabaseQuery({
          query: metadata.query || `${metadata.model}.${metadata.action}`,
          model: metadata.model,
          action: metadata.action,
          executionTime,
          parameters: config.metrics.database.trackQueryParams ? metadata.parameters : undefined,
          error: error?.message,
          metadata: {
            success: !error,
            timestamp: new Date(),
          },
        });

        // 记录慢查询
        if (executionTime > config.metrics.database.slowQueryThreshold) {
          log.warn('Slow database query detected', {
            model: metadata.model,
            action: metadata.action,
            executionTime,
            query: metadata.query,
            error: error?.message,
          });
        }
      }
    },
  };
}

/**
 * 缓存操作性能监控装饰器
 */
export function cachePerformanceDecorator<T extends (...args: any[]) => Promise<any>>(
  originalMethod: T,
  operation: 'get' | 'set' | 'delete' | 'clear',
  keyExtractor?: (...args: Parameters<T>) => string
): T {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.cache.enabled) {
    return originalMethod;
  }

  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let hit = false;
    let error: Error | undefined;
    let result: any;

    try {
      result = await originalMethod(...args);
      
      // 对于get操作，检查是否命中
      if (operation === 'get') {
        hit = result !== null && result !== undefined;
      } else {
        hit = true; // 其他操作默认为成功
      }
      
      return result;
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const executionTime = Date.now() - startTime;
      const key = keyExtractor ? keyExtractor(...args) : undefined;

      // 记录缓存操作指标
      performanceMonitor.recordCacheOperation({
        operation,
        key: config.metrics.cache.trackKeys ? key : undefined,
        hit,
        executionTime,
        size: typeof result === 'string' ? result.length : undefined,
        metadata: {
          success: !error,
          error: error?.message,
          timestamp: new Date(),
        },
      });
    }
  }) as T;
}

/**
 * 业务操作性能监控装饰器
 */
export function businessMetricDecorator<T extends (...args: any[]) => Promise<any>>(
  originalMethod: T,
  category: string,
  action: string,
  metadataExtractor?: (...args: Parameters<T>) => Record<string, any>
): T {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled || !config.metrics.business.enabled) {
    return originalMethod;
  }

  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;
    let result: any;

    try {
      result = await originalMethod(...args);
      success = true;
      return result;
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      const metadata = metadataExtractor ? metadataExtractor(...args) : {};

      // 记录业务指标
      performanceMonitor.recordBusinessMetric({
        category,
        action,
        count: 1,
        duration,
        success,
        metadata: {
          ...metadata,
          error: error?.message,
          timestamp: new Date(),
        },
      });
    }
  }) as T;
}

/**
 * 错误监控中间件
 */
export function errorPerformanceMiddleware() {
  const config = getPerformanceMonitoringConfig();
  
  if (!config.enabled) {
    return (error: any, req: Request, res: Response, next: NextFunction) => next(error);
  }

  return (error: any, req: Request, res: Response, next: NextFunction) => {
    try {
      // 记录错误指标
      performanceMonitor.recordBusinessMetric({
        category: 'error',
        action: 'unhandled_error',
        count: 1,
        success: false,
        metadata: {
          errorName: error.name,
          errorMessage: error.message,
          statusCode: error.statusCode || 500,
          method: req.method,
          path: req.path,
          userId: req.performanceMetrics?.userId,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          stack: error.stack,
          timestamp: new Date(),
        },
      });

    } catch (monitoringError) {
      log.error('Error in error performance monitoring', { 
        error: monitoringError,
        originalError: error.message 
      });
    }

    next(error);
  };
}

/**
 * 性能监控健康检查中间件
 */
export function performanceHealthMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/metrics') {
      try {
        const stats = performanceMonitor.getMetricsStats();
        
        // 将性能统计添加到响应中
        const originalSend = res.send;
        res.send = function(data) {
          if (typeof data === 'string') {
            try {
              const jsonData = JSON.parse(data);
              if (jsonData && typeof jsonData === 'object') {
                jsonData.performance = {
                  queueSize: stats.queueSize,
                  isProcessing: stats.isProcessing,
                  lastFlush: stats.lastFlush,
                  totalMetrics: stats.totalMetrics,
                };
                data = JSON.stringify(jsonData);
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
          return originalSend.call(this, data);
        };
      } catch (error) {
        log.error('Error in performance health middleware', { error });
      }
    }
    
    next();
  };
}

/**
 * 自定义指标记录函数
 */
export const recordCustomMetric = {
  /**
   * 记录计数指标
   */
  counter: (name: string, value: number = 1, tags: Record<string, string> = {}) => {
    performanceMonitor.recordBusinessMetric({
      category: 'custom',
      action: name,
      count: value,
      success: true,
      metadata: { tags },
    });
  },

  /**
   * 记录计时指标
   */
  timing: (name: string, duration: number, tags: Record<string, string> = {}) => {
    performanceMonitor.recordBusinessMetric({
      category: 'custom',
      action: name,
      count: 1,
      duration,
      success: true,
      metadata: { tags },
    });
  },

  /**
   * 记录仪表指标
   */
  gauge: (name: string, value: number, tags: Record<string, string> = {}) => {
    performanceMonitor.recordBusinessMetric({
      category: 'custom',
      action: name,
      count: value,
      success: true,
      metadata: { tags, type: 'gauge' },
    });
  },
};

/**
 * 性能监控装饰器工厂
 */
export function performanceDecorator(
  category: string,
  action?: string
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value;
    if (!method) return;

    descriptor.value = businessMetricDecorator(
      method,
      category,
      action || propertyName
    ) as T;
  };
}
