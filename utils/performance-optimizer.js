/**
 * 性能优化工具 - 阶段3代码质量优化
 * 提供缓存管理、请求优化、性能监控等功能
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 主要功能:
 * - 智能缓存管理
 * - 请求去重和合并
 * - 性能监控和统计
 * - 资源预加载
 * - 内存优化
 */

import { errorHandler, ErrorTypes, ErrorSeverity } from './error-handler.js'

/**
 * 缓存管理器
 */
export class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.storageCache = new Map()
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    }
    this.maxMemorySize = 50 // 最大内存缓存条目数
    this.defaultTTL = 5 * 60 * 1000 // 默认5分钟过期
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.defaultTTL, persistent = false) {
    try {
      const cacheItem = {
        value,
        timestamp: Date.now(),
        ttl,
        persistent
      }

      // 内存缓存
      this.memoryCache.set(key, cacheItem)
      
      // 清理过期的内存缓存
      this.cleanupMemoryCache()

      // 持久化缓存
      if (persistent) {
        try {
          wx.setStorageSync(`cache_${key}`, cacheItem)
          this.storageCache.set(key, cacheItem)
        } catch (e) {
          console.warn('持久化缓存失败:', e)
        }
      }

      this.cacheStats.sets++
      return true
    } catch (error) {
      errorHandler.handle(error, { operation: 'cache_set', key })
      return false
    }
  }

  /**
   * 获取缓存
   */
  get(key) {
    try {
      // 先检查内存缓存
      let cacheItem = this.memoryCache.get(key)
      
      // 如果内存中没有，检查持久化缓存
      if (!cacheItem && this.storageCache.has(key)) {
        try {
          cacheItem = wx.getStorageSync(`cache_${key}`)
          if (cacheItem) {
            // 恢复到内存缓存
            this.memoryCache.set(key, cacheItem)
          }
        } catch (e) {
          console.warn('读取持久化缓存失败:', e)
        }
      }

      // 检查是否过期
      if (cacheItem) {
        const now = Date.now()
        if (now - cacheItem.timestamp > cacheItem.ttl) {
          this.delete(key)
          this.cacheStats.misses++
          return null
        }
        
        this.cacheStats.hits++
        return cacheItem.value
      }

      this.cacheStats.misses++
      return null
    } catch (error) {
      errorHandler.handle(error, { operation: 'cache_get', key })
      this.cacheStats.misses++
      return null
    }
  }

  /**
   * 删除缓存
   */
  delete(key) {
    try {
      this.memoryCache.delete(key)
      
      if (this.storageCache.has(key)) {
        this.storageCache.delete(key)
        try {
          wx.removeStorageSync(`cache_${key}`)
        } catch (e) {
          console.warn('删除持久化缓存失败:', e)
        }
      }

      this.cacheStats.deletes++
      return true
    } catch (error) {
      errorHandler.handle(error, { operation: 'cache_delete', key })
      return false
    }
  }

  /**
   * 清理过期的内存缓存
   */
  cleanupMemoryCache() {
    const now = Date.now()
    const toDelete = []

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.memoryCache.delete(key))

    // 如果内存缓存过多，删除最旧的
    if (this.memoryCache.size > this.maxMemorySize) {
      const entries = Array.from(this.memoryCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, entries.length - this.maxMemorySize)
      toRemove.forEach(([key]) => this.memoryCache.delete(key))
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.memoryCache.clear()
    
    for (const key of this.storageCache.keys()) {
      try {
        wx.removeStorageSync(`cache_${key}`)
      } catch (e) {
        console.warn('清除持久化缓存失败:', e)
      }
    }
    
    this.storageCache.clear()
    this.cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : 0

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      storageSize: this.storageCache.size
    }
  }
}

/**
 * 请求去重管理器
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * 执行去重请求
   */
  async execute(key, requestFn) {
    // 如果已有相同请求在进行中，返回相同的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // 创建新请求
    const promise = requestFn()
      .finally(() => {
        // 请求完成后清理
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * 取消请求
   */
  cancel(key) {
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.delete(key)
      return true
    }
    return false
  }

  /**
   * 获取待处理请求数量
   */
  getPendingCount() {
    return this.pendingRequests.size
  }

  /**
   * 清空所有待处理请求
   */
  clear() {
    this.pendingRequests.clear()
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      pageLoads: [],
      userActions: []
    }
    this.maxMetrics = 100 // 最大保留指标数量
  }

  /**
   * 记录API调用性能
   */
  recordApiCall(url, method, startTime, endTime, success = true, error = null) {
    const metric = {
      url,
      method,
      duration: endTime - startTime,
      success,
      error: error?.message,
      timestamp: startTime
    }

    this.metrics.apiCalls.unshift(metric)
    if (this.metrics.apiCalls.length > this.maxMetrics) {
      this.metrics.apiCalls.pop()
    }

    // 记录慢请求
    if (metric.duration > 3000) {
      console.warn('慢API请求:', metric)
    }
  }

  /**
   * 记录页面加载性能
   */
  recordPageLoad(page, startTime, endTime) {
    const metric = {
      page,
      duration: endTime - startTime,
      timestamp: startTime
    }

    this.metrics.pageLoads.unshift(metric)
    if (this.metrics.pageLoads.length > this.maxMetrics) {
      this.metrics.pageLoads.pop()
    }
  }

  /**
   * 记录用户操作性能
   */
  recordUserAction(action, startTime, endTime, details = {}) {
    const metric = {
      action,
      duration: endTime - startTime,
      details,
      timestamp: startTime
    }

    this.metrics.userActions.unshift(metric)
    if (this.metrics.userActions.length > this.maxMetrics) {
      this.metrics.userActions.pop()
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const apiStats = this.calculateStats(this.metrics.apiCalls)
    const pageStats = this.calculateStats(this.metrics.pageLoads)
    const actionStats = this.calculateStats(this.metrics.userActions)

    return {
      api: apiStats,
      page: pageStats,
      userAction: actionStats,
      summary: {
        totalApiCalls: this.metrics.apiCalls.length,
        totalPageLoads: this.metrics.pageLoads.length,
        totalUserActions: this.metrics.userActions.length,
        avgApiDuration: apiStats.avgDuration,
        avgPageDuration: pageStats.avgDuration
      }
    }
  }

  /**
   * 计算统计数据
   */
  calculateStats(metrics) {
    if (metrics.length === 0) {
      return { count: 0, avgDuration: 0, maxDuration: 0, minDuration: 0 }
    }

    const durations = metrics.map(m => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      count: metrics.length,
      avgDuration: Math.round(sum / metrics.length),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      successRate: metrics.filter(m => m.success !== false).length / metrics.length * 100
    }
  }

  /**
   * 清空性能数据
   */
  clear() {
    this.metrics = {
      apiCalls: [],
      pageLoads: [],
      userActions: []
    }
  }
}

// 创建全局实例
export const cacheManager = new CacheManager()
export const requestDeduplicator = new RequestDeduplicator()
export const performanceMonitor = new PerformanceMonitor()

// 便捷方法
export const cache = {
  set: (key, value, ttl, persistent) => cacheManager.set(key, value, ttl, persistent),
  get: (key) => cacheManager.get(key),
  delete: (key) => cacheManager.delete(key),
  clear: () => cacheManager.clear(),
  stats: () => cacheManager.getStats()
}

export const dedupe = {
  execute: (key, requestFn) => requestDeduplicator.execute(key, requestFn),
  cancel: (key) => requestDeduplicator.cancel(key),
  clear: () => requestDeduplicator.clear()
}

export const perf = {
  recordApi: (url, method, start, end, success, error) => 
    performanceMonitor.recordApiCall(url, method, start, end, success, error),
  recordPage: (page, start, end) => 
    performanceMonitor.recordPageLoad(page, start, end),
  recordAction: (action, start, end, details) => 
    performanceMonitor.recordUserAction(action, start, end, details),
  stats: () => performanceMonitor.getStats(),
  clear: () => performanceMonitor.clear()
}

console.log('✅ 性能优化工具已初始化')
console.log('🔧 支持功能:')
console.log('  - 智能缓存管理')
console.log('  - 请求去重和合并')
console.log('  - 性能监控和统计')
console.log('  - 内存优化')
