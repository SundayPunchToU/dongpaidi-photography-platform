/**
 * 统一错误处理系统 - 阶段3代码质量优化
 * 提供统一的错误处理、用户友好的错误提示和完善的日志记录
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 主要功能:
 * - 统一错误分类和处理
 * - 用户友好的错误提示
 * - 完善的错误日志记录
 * - 错误恢复机制
 * - 错误监控和统计
 */

// 错误类型枚举
export const ErrorTypes = {
  NETWORK: 'NETWORK',           // 网络错误
  AUTH: 'AUTH',                 // 认证错误
  PERMISSION: 'PERMISSION',     // 权限错误
  VALIDATION: 'VALIDATION',     // 验证错误
  BUSINESS: 'BUSINESS',         // 业务逻辑错误
  SYSTEM: 'SYSTEM',             // 系统错误
  UNKNOWN: 'UNKNOWN'            // 未知错误
}

// 错误严重级别
export const ErrorSeverity = {
  LOW: 'LOW',                   // 低级别：不影响核心功能
  MEDIUM: 'MEDIUM',             // 中级别：影响部分功能
  HIGH: 'HIGH',                 // 高级别：影响核心功能
  CRITICAL: 'CRITICAL'          // 严重：系统不可用
}

/**
 * 标准化错误类
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.MEDIUM, code = null, details = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
    this.userAgent = wx.getSystemInfoSync ? wx.getSystemInfoSync() : null
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = []
    this.maxLogSize = 100
    this.retryAttempts = new Map() // 记录重试次数
    this.errorStats = {
      total: 0,
      byType: {},
      bySeverity: {}
    }
  }

  /**
   * 处理错误的主要方法
   * @param {Error|AppError|string} error - 错误对象
   * @param {Object} context - 错误上下文信息
   * @param {boolean} showToUser - 是否向用户显示错误
   * @returns {Object} 处理结果
   */
  handle(error, context = {}, showToUser = true) {
    // 标准化错误对象
    const standardError = this.standardizeError(error, context)
    
    // 记录错误日志
    this.logError(standardError, context)
    
    // 更新错误统计
    this.updateStats(standardError)
    
    // 获取用户友好的错误信息
    const userMessage = this.getUserFriendlyMessage(standardError)
    
    // 显示错误给用户
    if (showToUser) {
      this.showErrorToUser(userMessage, standardError.severity)
    }
    
    // 尝试错误恢复
    const recoveryAction = this.getRecoveryAction(standardError)
    
    return {
      error: standardError,
      userMessage,
      recoveryAction,
      canRetry: this.canRetry(standardError, context)
    }
  }

  /**
   * 标准化错误对象
   */
  standardizeError(error, context) {
    if (error instanceof AppError) {
      return error
    }

    let type = ErrorTypes.UNKNOWN
    let severity = ErrorSeverity.MEDIUM
    let message = '未知错误'
    let code = null

    if (typeof error === 'string') {
      message = error
    } else if (error instanceof Error) {
      message = error.message
      
      // 根据错误信息判断类型
      if (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('连接')) {
        type = ErrorTypes.NETWORK
        severity = ErrorSeverity.HIGH
      } else if (error.message.includes('unauthorized') || error.message.includes('401') || error.message.includes('登录')) {
        type = ErrorTypes.AUTH
        severity = ErrorSeverity.HIGH
      } else if (error.message.includes('forbidden') || error.message.includes('403') || error.message.includes('权限')) {
        type = ErrorTypes.PERMISSION
        severity = ErrorSeverity.MEDIUM
      } else if (error.message.includes('validation') || error.message.includes('验证') || error.message.includes('格式')) {
        type = ErrorTypes.VALIDATION
        severity = ErrorSeverity.LOW
      } else if (error.message.includes('500') || error.message.includes('server') || error.message.includes('服务器')) {
        type = ErrorTypes.SYSTEM
        severity = ErrorSeverity.HIGH
      }
    }

    return new AppError(message, type, severity, code, { originalError: error, context })
  }

  /**
   * 记录错误日志
   */
  logError(error, context) {
    const logEntry = {
      timestamp: error.timestamp,
      type: error.type,
      severity: error.severity,
      message: error.message,
      code: error.code,
      context,
      userAgent: error.userAgent,
      stack: error.stack
    }

    // 添加到内存日志
    this.errorLog.unshift(logEntry)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop()
    }

    // 控制台输出
    const logLevel = this.getLogLevel(error.severity)
    console[logLevel](`[${error.type}] ${error.message}`, logEntry)

    // 尝试持久化存储重要错误
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      this.persistError(logEntry)
    }
  }

  /**
   * 获取日志级别
   */
  getLogLevel(severity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'error'
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'info'
      default:
        return 'log'
    }
  }

  /**
   * 持久化存储错误
   */
  persistError(logEntry) {
    try {
      const storedErrors = wx.getStorageSync('error_logs') || []
      storedErrors.unshift(logEntry)
      
      // 只保留最近50条重要错误
      if (storedErrors.length > 50) {
        storedErrors.splice(50)
      }
      
      wx.setStorageSync('error_logs', storedErrors)
    } catch (e) {
      console.warn('无法持久化错误日志:', e)
    }
  }

  /**
   * 更新错误统计
   */
  updateStats(error) {
    this.errorStats.total++
    this.errorStats.byType[error.type] = (this.errorStats.byType[error.type] || 0) + 1
    this.errorStats.bySeverity[error.severity] = (this.errorStats.bySeverity[error.severity] || 0) + 1
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserFriendlyMessage(error) {
    const messageMap = {
      [ErrorTypes.NETWORK]: {
        [ErrorSeverity.HIGH]: '网络连接不稳定，请检查网络后重试',
        [ErrorSeverity.MEDIUM]: '网络请求失败，请稍后重试',
        [ErrorSeverity.LOW]: '网络响应较慢，请耐心等待'
      },
      [ErrorTypes.AUTH]: {
        [ErrorSeverity.HIGH]: '登录已过期，请重新登录',
        [ErrorSeverity.MEDIUM]: '身份验证失败，请重新登录',
        [ErrorSeverity.LOW]: '登录状态异常，建议重新登录'
      },
      [ErrorTypes.PERMISSION]: {
        [ErrorSeverity.HIGH]: '权限不足，无法执行此操作',
        [ErrorSeverity.MEDIUM]: '当前用户权限不够，请联系管理员',
        [ErrorSeverity.LOW]: '部分功能需要更高权限'
      },
      [ErrorTypes.VALIDATION]: {
        [ErrorSeverity.MEDIUM]: '输入信息有误，请检查后重试',
        [ErrorSeverity.LOW]: '请检查输入格式是否正确'
      },
      [ErrorTypes.BUSINESS]: {
        [ErrorSeverity.HIGH]: '操作失败，请稍后重试',
        [ErrorSeverity.MEDIUM]: '当前操作无法完成，请稍后重试',
        [ErrorSeverity.LOW]: '操作未完成，请重试'
      },
      [ErrorTypes.SYSTEM]: {
        [ErrorSeverity.CRITICAL]: '系统维护中，请稍后访问',
        [ErrorSeverity.HIGH]: '服务器繁忙，请稍后重试',
        [ErrorSeverity.MEDIUM]: '系统异常，请稍后重试'
      }
    }

    const typeMessages = messageMap[error.type]
    if (typeMessages && typeMessages[error.severity]) {
      return typeMessages[error.severity]
    }

    // 默认消息
    return error.message || '操作失败，请重试'
  }

  /**
   * 向用户显示错误
   */
  showErrorToUser(message, severity) {
    const config = {
      title: message,
      duration: this.getToastDuration(severity)
    }

    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      // 严重错误使用模态框
      wx.showModal({
        title: '操作失败',
        content: message,
        showCancel: false,
        confirmText: '我知道了'
      })
    } else {
      // 一般错误使用Toast
      wx.showToast({
        ...config,
        icon: severity === ErrorSeverity.LOW ? 'none' : 'error'
      })
    }
  }

  /**
   * 获取Toast显示时长
   */
  getToastDuration(severity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 5000
      case ErrorSeverity.HIGH:
        return 3000
      case ErrorSeverity.MEDIUM:
        return 2000
      case ErrorSeverity.LOW:
        return 1500
      default:
        return 2000
    }
  }

  /**
   * 获取错误恢复建议
   */
  getRecoveryAction(error) {
    switch (error.type) {
      case ErrorTypes.NETWORK:
        return {
          action: 'retry',
          message: '检查网络连接后重试',
          autoRetry: true,
          retryDelay: 3000
        }
      case ErrorTypes.AUTH:
        return {
          action: 'relogin',
          message: '请重新登录',
          autoRetry: false
        }
      case ErrorTypes.PERMISSION:
        return {
          action: 'contact',
          message: '请联系管理员获取权限',
          autoRetry: false
        }
      case ErrorTypes.VALIDATION:
        return {
          action: 'correct',
          message: '请修正输入信息',
          autoRetry: false
        }
      default:
        return {
          action: 'retry',
          message: '请稍后重试',
          autoRetry: false
        }
    }
  }

  /**
   * 判断是否可以重试
   */
  canRetry(error, context) {
    const key = `${error.type}_${context.operation || 'unknown'}`
    const attempts = this.retryAttempts.get(key) || 0
    
    // 网络错误和系统错误可以重试，最多3次
    if (error.type === ErrorTypes.NETWORK || error.type === ErrorTypes.SYSTEM) {
      return attempts < 3
    }
    
    // 其他错误一般不重试
    return false
  }

  /**
   * 记录重试次数
   */
  recordRetry(error, context) {
    const key = `${error.type}_${context.operation || 'unknown'}`
    const attempts = this.retryAttempts.get(key) || 0
    this.retryAttempts.set(key, attempts + 1)
  }

  /**
   * 清除重试记录
   */
  clearRetryRecord(error, context) {
    const key = `${error.type}_${context.operation || 'unknown'}`
    this.retryAttempts.delete(key)
  }

  /**
   * 获取错误统计信息
   */
  getStats() {
    return {
      ...this.errorStats,
      recentErrors: this.errorLog.slice(0, 10)
    }
  }

  /**
   * 清除错误日志
   */
  clearLogs() {
    this.errorLog = []
    this.retryAttempts.clear()
    try {
      wx.removeStorageSync('error_logs')
    } catch (e) {
      console.warn('清除持久化错误日志失败:', e)
    }
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler()

// 便捷方法
export const handleError = (error, context, showToUser = true) => {
  return errorHandler.handle(error, context, showToUser)
}

export const createError = (message, type, severity, code, details) => {
  return new AppError(message, type, severity, code, details)
}

console.log('✅ 统一错误处理系统已初始化')
console.log('🔧 支持功能:')
console.log('  - 错误分类和标准化')
console.log('  - 用户友好的错误提示')
console.log('  - 完善的错误日志记录')
console.log('  - 智能错误恢复机制')
console.log('  - 错误统计和监控')
