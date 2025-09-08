import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache';
import { CacheKeys } from '../services/cacheKeys';

/**
 * 缓存中间件选项
 */
export interface CacheMiddlewareOptions {
  /** 缓存时间（秒），默认300秒（5分钟） */
  ttl?: number;
  /** 自定义缓存键生成函数 */
  keyGenerator?: (req: Request) => string;
  /** 缓存条件函数 */
  condition?: (req: Request, res: Response) => boolean;
  /** 是否缓存错误响应 */
  cacheErrors?: boolean;
  /** 需要包含在缓存键中的查询参数 */
  includeQuery?: string[];
  /** 需要排除的查询参数 */
  excludeQuery?: string[];
  /** 是否包含用户ID在缓存键中 */
  includeUserId?: boolean;
}

/**
 * API响应缓存中间件
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300, // 默认5分钟
    keyGenerator,
    condition,
    cacheErrors = false,
    includeQuery = [],
    excludeQuery = [],
    includeUserId = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }

      // 检查缓存条件
      if (condition && !condition(req, res)) {
        return next();
      }

      // 生成缓存键
      const cacheKey = keyGenerator ? 
        keyGenerator(req) : 
        generateDefaultCacheKey(req, { includeQuery, excludeQuery, includeUserId });

      // 尝试从缓存获取响应
      const cachedResponse = await cacheService.get(cacheKey);
      if (cachedResponse) {
        console.log(`缓存命中: ${cacheKey}`);
        
        // 设置缓存头
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        return res.json(cachedResponse);
      }

      // 缓存未命中，继续处理请求
      console.log(`缓存未命中: ${cacheKey}`);
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // 拦截响应
      const originalJson = res.json;
      res.json = function(data: any) {
        // 检查是否应该缓存响应
        const shouldCache = cacheErrors || res.statusCode < 400;
        
        if (shouldCache) {
          // 异步存储到缓存，不阻塞响应
          cacheService.set(cacheKey, data, ttl).catch(error => {
            console.error(`缓存存储失败: ${cacheKey}`, error);
          });
          
          console.log(`缓存存储: ${cacheKey}`);
        }

        // 调用原始的json方法
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('缓存中间件错误:', error);
      next();
    }
  };
}

/**
 * 用户相关数据缓存中间件
 */
export function userCacheMiddleware(options: Omit<CacheMiddlewareOptions, 'includeUserId'> = {}) {
  return cacheMiddleware({
    ...options,
    includeUserId: true,
    condition: (req) => {
      // 只有认证用户才使用用户缓存
      return !!(req as any).user?.id;
    },
  });
}

/**
 * 热门内容缓存中间件
 */
export function hotContentCacheMiddleware(contentType: 'works' | 'users' | 'appointments') {
  return cacheMiddleware({
    ttl: 1800, // 30分钟
    keyGenerator: (req) => {
      const { page = 1, limit = 20, category, status } = req.query;
      const filters = [category, status].filter(Boolean).join(':');
      return CacheKeys.work.list(Number(page), Number(limit), filters);
    },
  });
}

/**
 * 搜索结果缓存中间件
 */
export function searchCacheMiddleware() {
  return cacheMiddleware({
    ttl: 600, // 10分钟
    keyGenerator: (req) => {
      const { q: query, type = 'all', page = 1 } = req.query;
      return CacheKeys.search.results(String(query), String(type), Number(page));
    },
    condition: (req) => {
      // 只缓存有搜索关键词的请求
      return !!(req.query.q && String(req.query.q).trim());
    },
  });
}

/**
 * 统计数据缓存中间件
 */
export function statsCacheMiddleware() {
  return cacheMiddleware({
    ttl: 3600, // 1小时
    keyGenerator: (req) => {
      const { type = 'general', period = 'day' } = req.query;
      return CacheKeys.system.stats(`${type}:${period}`);
    },
  });
}

/**
 * 缓存清除中间件
 * 在数据更新后清除相关缓存
 */
export function cacheInvalidationMiddleware(patterns: string | string[] | ((req: Request) => string | string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 先执行原始请求
      const originalJson = res.json;
      res.json = async function(data: any) {
        try {
          // 如果请求成功，清除相关缓存
          if (res.statusCode < 400) {
            let cachePatterns: string[];
            
            if (typeof patterns === 'function') {
              const result = patterns(req);
              cachePatterns = Array.isArray(result) ? result : [result];
            } else {
              cachePatterns = Array.isArray(patterns) ? patterns : [patterns];
            }

            // 清除匹配的缓存
            for (const pattern of cachePatterns) {
              await cacheService.delByPattern(pattern);
              console.log(`缓存已清除: ${pattern}`);
            }
          }
        } catch (error) {
          console.error('缓存清除失败:', error);
        }

        // 调用原始的json方法
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('缓存清除中间件错误:', error);
      next();
    }
  };
}

/**
 * 生成默认缓存键
 */
function generateDefaultCacheKey(
  req: Request, 
  options: {
    includeQuery: string[];
    excludeQuery: string[];
    includeUserId: boolean;
  }
): string {
  const { includeQuery, excludeQuery, includeUserId } = options;
  
  // 基础路径
  let key = `api:${req.path.replace(/\//g, ':')}`;
  
  // 包含用户ID
  if (includeUserId && (req as any).user?.id) {
    key += `:user:${(req as any).user.id}`;
  }
  
  // 处理查询参数
  const queryParams: string[] = [];
  
  if (includeQuery.length > 0) {
    // 只包含指定的查询参数
    for (const param of includeQuery) {
      if (req.query[param] !== undefined) {
        queryParams.push(`${param}:${req.query[param]}`);
      }
    }
  } else {
    // 包含所有查询参数，除了排除的
    for (const [param, value] of Object.entries(req.query)) {
      if (!excludeQuery.includes(param)) {
        queryParams.push(`${param}:${value}`);
      }
    }
  }
  
  if (queryParams.length > 0) {
    key += `:${queryParams.join(':')}`;
  }
  
  return key;
}

/**
 * 缓存预热中间件
 * 在应用启动时预热常用数据
 */
export function cacheWarmupMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 这个中间件主要用于应用启动时的预热
    // 在实际使用中，预热逻辑应该在应用启动时执行
    next();
  };
}

/**
 * 缓存统计中间件
 * 记录缓存命中率等统计信息
 */
export function cacheStatsMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // 记录请求
    const statsKey = 'cache:stats:requests';
    await cacheService.incr(statsKey);
    
    // 检查是否有缓存头
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const cacheStatus = res.get('X-Cache') || 'NONE';
      
      // 记录缓存统计
      const hitKey = `cache:stats:${cacheStatus.toLowerCase()}`;
      cacheService.incr(hitKey).catch(console.error);
      
      // 记录响应时间
      const timeKey = `cache:stats:response_time:${cacheStatus.toLowerCase()}`;
      cacheService.lpush(timeKey, responseTime).catch(console.error);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

export default cacheMiddleware;
