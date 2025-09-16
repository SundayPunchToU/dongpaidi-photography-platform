/**
 * 懂拍帝摄影平台 - API辅助工具
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 主要功能:
 * - API响应数据格式化
 * - 错误信息标准化
 * - 请求参数验证
 * - 缓存管理
 * - 性能监控
 */

/**
 * API响应格式标准化
 * @param {Object} response - 原始响应数据
 * @returns {Object} 标准化后的响应
 */
export function normalizeApiResponse(response) {
  // 确保响应格式一致
  if (!response) {
    return {
      success: false,
      error: '无响应数据',
      data: null
    }
  }

  // 如果已经是标准格式，直接返回
  if (typeof response.success === 'boolean') {
    return response
  }

  // 兼容不同的响应格式
  if (response.data && !response.error) {
    return {
      success: true,
      data: response.data,
      error: null
    }
  }

  if (response.error) {
    return {
      success: false,
      error: response.error,
      data: null
    }
  }

  // 默认成功格式
  return {
    success: true,
    data: response,
    error: null
  }
}

/**
 * 错误信息标准化
 * @param {Error|string} error - 错误对象或错误信息
 * @returns {string} 用户友好的错误信息
 */
export function normalizeErrorMessage(error) {
  if (!error) return '未知错误'

  if (typeof error === 'string') {
    return error
  }

  if (error.message) {
    // 网络错误
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return '网络连接失败，请检查网络后重试'
    }
    
    // 认证错误
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return '登录已过期，请重新登录'
    }
    
    // 权限错误
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return '权限不足，无法执行此操作'
    }
    
    // 服务器错误
    if (error.message.includes('500') || error.message.includes('server')) {
      return '服务器繁忙，请稍后重试'
    }

    return error.message
  }

  return '操作失败，请重试'
}

/**
 * 请求参数验证
 * @param {Object} params - 请求参数
 * @param {Array} requiredFields - 必填字段列表
 * @returns {Object} 验证结果
 */
export function validateRequestParams(params, requiredFields = []) {
  const errors = []

  // 检查必填字段
  requiredFields.forEach(field => {
    if (!params || params[field] === undefined || params[field] === null || params[field] === '') {
      errors.push(`${field} 是必填字段`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 简单的内存缓存管理
 */
class SimpleCache {
  constructor() {
    this.cache = new Map()
    this.ttl = new Map() // Time To Live
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttlMs - 过期时间(毫秒)
   */
  set(key, value, ttlMs = 5 * 60 * 1000) { // 默认5分钟
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + ttlMs)
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存值或null
   */
  get(key) {
    const expireTime = this.ttl.get(key)
    
    if (!expireTime || Date.now() > expireTime) {
      // 缓存已过期
      this.delete(key)
      return null
    }

    return this.cache.get(key)
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key)
    this.ttl.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear()
    this.ttl.clear()
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now()
    for (const [key, expireTime] of this.ttl.entries()) {
      if (now > expireTime) {
        this.delete(key)
      }
    }
  }
}

// 创建全局缓存实例
export const apiCache = new SimpleCache()

// 定期清理过期缓存
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 60000) // 每分钟清理一次
}

/**
 * 生成缓存键
 * @param {string} endpoint - API端点
 * @param {Object} params - 请求参数
 * @returns {string} 缓存键
 */
export function generateCacheKey(endpoint, params = {}) {
  const paramStr = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${endpoint}?${paramStr}`
}

/**
 * 性能监控辅助函数
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
  }

  /**
   * 开始监控
   * @param {string} name - 监控名称
   */
  start(name) {
    this.metrics.set(name, {
      startTime: Date.now(),
      endTime: null,
      duration: null
    })
  }

  /**
   * 结束监控
   * @param {string} name - 监控名称
   * @returns {number} 耗时(毫秒)
   */
  end(name) {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`性能监控: 未找到 ${name} 的开始时间`)
      return 0
    }

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime

    console.log(`🚀 性能监控 [${name}]: ${metric.duration}ms`)
    return metric.duration
  }

  /**
   * 获取监控结果
   * @param {string} name - 监控名称
   * @returns {Object} 监控数据
   */
  getMetric(name) {
    return this.metrics.get(name)
  }

  /**
   * 获取所有监控结果
   * @returns {Map} 所有监控数据
   */
  getAllMetrics() {
    return this.metrics
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔(毫秒)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

console.log('✅ API辅助工具已加载')
console.log('🔧 包含功能: 响应格式化、错误处理、参数验证、缓存管理、性能监控')
