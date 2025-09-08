import { cacheService } from '@/services/cache';

/**
 * 缓存装饰器选项
 */
export interface CacheOptions {
  /** 缓存键 */
  key?: string;
  /** 过期时间（秒） */
  ttl?: number;
  /** 是否序列化参数作为键的一部分 */
  serializeArgs?: boolean;
  /** 自定义键生成函数 */
  keyGenerator?: (...args: any[]) => string;
  /** 缓存条件函数 */
  condition?: (...args: any[]) => boolean;
  /** 是否在出错时返回缓存值 */
  fallbackToCache?: boolean;
}

/**
 * 缓存装饰器
 * 自动缓存方法的返回值
 */
export function Cache(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      let cacheKey: string;
      
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(...args);
      } else if (options.key) {
        cacheKey = options.key;
        if (options.serializeArgs) {
          const argsHash = JSON.stringify(args);
          cacheKey = `${cacheKey}:${Buffer.from(argsHash).toString('base64')}`;
        }
      } else {
        // 默认键生成策略
        const className = target.constructor.name;
        const argsHash = options.serializeArgs ? 
          `:${Buffer.from(JSON.stringify(args)).toString('base64')}` : '';
        cacheKey = `${className}:${propertyName}${argsHash}`;
      }

      // 检查缓存条件
      if (options.condition && !options.condition(...args)) {
        return await method.apply(this, args);
      }

      try {
        // 尝试从缓存获取
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult !== null) {
          console.log(`缓存命中: ${cacheKey}`);
          return cachedResult;
        }

        // 执行原方法
        const result = await method.apply(this, args);

        // 存储到缓存
        if (result !== null && result !== undefined) {
          await cacheService.set(cacheKey, result, options.ttl);
          console.log(`缓存存储: ${cacheKey}`);
        }

        return result;
      } catch (error) {
        console.error(`缓存装饰器执行失败: ${error}`);
        
        // 如果启用了缓存回退，尝试返回缓存值
        if (options.fallbackToCache) {
          try {
            const cachedResult = await cacheService.get(cacheKey);
            if (cachedResult !== null) {
              console.log(`缓存回退: ${cacheKey}`);
              return cachedResult;
            }
          } catch (cacheError) {
            console.error(`缓存回退失败: ${cacheError}`);
          }
        }

        // 重新抛出原始错误
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 缓存清除装饰器
 * 在方法执行后清除指定的缓存
 */
export function CacheEvict(keys: string | string[] | ((...args: any[]) => string | string[])) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // 执行原方法
        const result = await method.apply(this, args);

        // 清除缓存
        let cacheKeys: string[];
        
        if (typeof keys === 'function') {
          const generatedKeys = keys(...args);
          cacheKeys = Array.isArray(generatedKeys) ? generatedKeys : [generatedKeys];
        } else {
          cacheKeys = Array.isArray(keys) ? keys : [keys];
        }

        for (const key of cacheKeys) {
          await cacheService.del(key);
          console.log(`缓存清除: ${key}`);
        }

        return result;
      } catch (error) {
        console.error(`缓存清除装饰器执行失败: ${error}`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 缓存更新装饰器
 * 在方法执行后更新指定的缓存
 */
export function CachePut(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // 执行原方法
        const result = await method.apply(this, args);

        // 生成缓存键
        let cacheKey: string;
        
        if (options.keyGenerator) {
          cacheKey = options.keyGenerator(...args);
        } else if (options.key) {
          cacheKey = options.key;
          if (options.serializeArgs) {
            const argsHash = JSON.stringify(args);
            cacheKey = `${cacheKey}:${Buffer.from(argsHash).toString('base64')}`;
          }
        } else {
          const className = target.constructor.name;
          const argsHash = options.serializeArgs ? 
            `:${Buffer.from(JSON.stringify(args)).toString('base64')}` : '';
          cacheKey = `${className}:${propertyName}${argsHash}`;
        }

        // 更新缓存
        if (result !== null && result !== undefined) {
          await cacheService.set(cacheKey, result, options.ttl);
          console.log(`缓存更新: ${cacheKey}`);
        }

        return result;
      } catch (error) {
        console.error(`缓存更新装饰器执行失败: ${error}`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 条件缓存装饰器
 * 根据条件决定是否使用缓存
 */
export function CacheConditional(
  condition: (...args: any[]) => boolean,
  cacheOptions: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 检查条件
      if (!condition(...args)) {
        return await method.apply(this, args);
      }

      // 使用缓存装饰器
      const cacheDecorator = Cache(cacheOptions);
      const cachedDescriptor = cacheDecorator(target, propertyName, { value: method });
      
      return await cachedDescriptor.value.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 缓存预热装饰器
 * 在应用启动时预热缓存
 */
export function CacheWarmup(options: {
  keys: string[];
  warmupData: () => Promise<any[]>;
  ttl?: number;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    // 注册预热任务
    process.nextTick(async () => {
      try {
        console.log(`开始预热缓存: ${target.constructor.name}.${propertyName}`);
        
        const data = await options.warmupData();
        
        for (let i = 0; i < options.keys.length && i < data.length; i++) {
          await cacheService.set(options.keys[i], data[i], options.ttl);
          console.log(`缓存预热完成: ${options.keys[i]}`);
        }
      } catch (error) {
        console.error(`缓存预热失败: ${error}`);
      }
    });

    return descriptor;
  };
}

/**
 * 分布式锁装饰器
 * 防止并发执行同一方法
 */
export function DistributedLock(options: {
  key?: string;
  ttl?: number;
  retryDelay?: number;
  maxRetries?: number;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockKey = options.key || `lock:${target.constructor.name}:${propertyName}`;
      const ttl = options.ttl || 30; // 30秒默认锁定时间
      const retryDelay = options.retryDelay || 100; // 100ms重试间隔
      const maxRetries = options.maxRetries || 10; // 最大重试次数

      let retries = 0;
      
      while (retries < maxRetries) {
        try {
          // 尝试获取锁
          const lockAcquired = await cacheService.set(lockKey, '1', ttl);
          
          if (lockAcquired) {
            try {
              // 执行原方法
              const result = await method.apply(this, args);
              return result;
            } finally {
              // 释放锁
              await cacheService.del(lockKey);
            }
          }

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retries++;
        } catch (error) {
          console.error(`分布式锁执行失败: ${error}`);
          throw error;
        }
      }

      throw new Error(`无法获取分布式锁: ${lockKey}`);
    };

    return descriptor;
  };
}
