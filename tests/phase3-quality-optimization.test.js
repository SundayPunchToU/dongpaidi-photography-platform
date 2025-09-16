/**
 * 阶段3代码质量优化测试
 * 测试错误处理、性能优化、代码规范等功能
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 */

// 模拟微信小程序环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  getSystemInfoSync: jest.fn(() => ({
    platform: 'devtools',
    version: '8.0.5'
  }))
}

// 导入测试模块
import { 
  errorHandler, 
  ErrorTypes, 
  ErrorSeverity, 
  AppError,
  createError 
} from '../utils/error-handler.js'

import { 
  cacheManager, 
  requestDeduplicator, 
  performanceMonitor 
} from '../utils/performance-optimizer.js'

import { 
  naming, 
  validator, 
  qualityChecker,
  validateAndThrow 
} from '../utils/code-standards.js'

describe('阶段3代码质量优化测试', () => {
  
  beforeEach(() => {
    // 清理测试环境
    jest.clearAllMocks()
    errorHandler.clearLogs()
    cacheManager.clear()
    requestDeduplicator.clear()
    performanceMonitor.clear()
  })

  describe('错误处理系统测试', () => {
    test('应该正确创建标准化错误', () => {
      const error = createError(
        '测试错误',
        ErrorTypes.NETWORK,
        ErrorSeverity.HIGH,
        'TEST_001'
      )

      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('测试错误')
      expect(error.type).toBe(ErrorTypes.NETWORK)
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.code).toBe('TEST_001')
    })

    test('应该正确处理网络错误', () => {
      const networkError = new Error('network timeout')
      const result = errorHandler.handle(networkError, { operation: 'test_api' })

      expect(result.error.type).toBe(ErrorTypes.NETWORK)
      expect(result.error.severity).toBe(ErrorSeverity.HIGH)
      expect(result.userMessage).toContain('网络')
      expect(result.canRetry).toBe(true)
    })

    test('应该正确处理认证错误', () => {
      const authError = new Error('unauthorized access')
      const result = errorHandler.handle(authError, { operation: 'test_auth' })

      expect(result.error.type).toBe(ErrorTypes.AUTH)
      expect(result.error.severity).toBe(ErrorSeverity.HIGH)
      expect(result.userMessage).toContain('登录')
      expect(result.canRetry).toBe(false)
    })

    test('应该记录错误统计', () => {
      errorHandler.handle(new Error('test error 1'))
      errorHandler.handle(new Error('network error'))
      errorHandler.handle(new Error('unauthorized'))

      const stats = errorHandler.getStats()
      expect(stats.total).toBe(3)
      expect(stats.byType[ErrorTypes.NETWORK]).toBe(1)
      expect(stats.byType[ErrorTypes.AUTH]).toBe(1)
    })

    test('应该显示用户友好的错误信息', () => {
      const error = createError('测试错误', ErrorTypes.BUSINESS, ErrorSeverity.MEDIUM)
      errorHandler.handle(error)

      expect(wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('操作'),
          icon: 'error'
        })
      )
    })
  })

  describe('缓存管理测试', () => {
    test('应该正确设置和获取缓存', () => {
      const testData = { id: 1, name: 'test' }
      
      cacheManager.set('test_key', testData, 1000)
      const result = cacheManager.get('test_key')

      expect(result).toEqual(testData)
    })

    test('应该正确处理缓存过期', (done) => {
      const testData = { id: 1, name: 'test' }
      
      cacheManager.set('test_key', testData, 100) // 100ms过期
      
      setTimeout(() => {
        const result = cacheManager.get('test_key')
        expect(result).toBeNull()
        done()
      }, 150)
    })

    test('应该正确统计缓存命中率', () => {
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      
      // 命中
      cacheManager.get('key1')
      cacheManager.get('key2')
      
      // 未命中
      cacheManager.get('key3')
      
      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe('66.67%')
    })

    test('应该正确清理过期缓存', () => {
      // 设置多个缓存项，部分过期
      cacheManager.set('key1', 'value1', 100)
      cacheManager.set('key2', 'value2', 10000)
      
      setTimeout(() => {
        cacheManager.cleanupMemoryCache()
        expect(cacheManager.get('key1')).toBeNull()
        expect(cacheManager.get('key2')).toBe('value2')
      }, 150)
    })
  })

  describe('请求去重测试', () => {
    test('应该正确去重相同请求', async () => {
      let callCount = 0
      const mockRequest = () => {
        callCount++
        return Promise.resolve(`result_${callCount}`)
      }

      // 同时发起多个相同请求
      const promises = [
        requestDeduplicator.execute('test_key', mockRequest),
        requestDeduplicator.execute('test_key', mockRequest),
        requestDeduplicator.execute('test_key', mockRequest)
      ]

      const results = await Promise.all(promises)
      
      // 应该只调用一次实际请求
      expect(callCount).toBe(1)
      // 所有请求应该返回相同结果
      expect(results).toEqual(['result_1', 'result_1', 'result_1'])
    })

    test('应该正确处理不同的请求', async () => {
      let callCount = 0
      const mockRequest = () => {
        callCount++
        return Promise.resolve(`result_${callCount}`)
      }

      const result1 = await requestDeduplicator.execute('key1', mockRequest)
      const result2 = await requestDeduplicator.execute('key2', mockRequest)

      expect(callCount).toBe(2)
      expect(result1).toBe('result_1')
      expect(result2).toBe('result_2')
    })
  })

  describe('性能监控测试', () => {
    test('应该正确记录API调用性能', () => {
      const startTime = Date.now()
      const endTime = startTime + 1000

      performanceMonitor.recordApiCall(
        '/api/test',
        'GET',
        startTime,
        endTime,
        true
      )

      const stats = performanceMonitor.getStats()
      expect(stats.api.count).toBe(1)
      expect(stats.api.avgDuration).toBe(1000)
      expect(stats.api.successRate).toBe(100)
    })

    test('应该正确记录页面加载性能', () => {
      const startTime = Date.now()
      const endTime = startTime + 2000

      performanceMonitor.recordPageLoad('test_page', startTime, endTime)

      const stats = performanceMonitor.getStats()
      expect(stats.page.count).toBe(1)
      expect(stats.page.avgDuration).toBe(2000)
    })

    test('应该正确识别慢请求', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const startTime = Date.now()
      const endTime = startTime + 5000 // 5秒，超过3秒阈值

      performanceMonitor.recordApiCall(
        '/api/slow',
        'GET',
        startTime,
        endTime,
        true
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        '慢API请求:',
        expect.objectContaining({
          url: '/api/slow',
          duration: 5000
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('数据验证测试', () => {
    test('应该正确验证必填字段', () => {
      const data = { name: 'test' }
      const result = validator.validateRequired(data, ['name', 'email'])

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('email')
    })

    test('应该正确验证字符串长度', () => {
      const result1 = validator.validateStringLength('test', 2, 10)
      const result2 = validator.validateStringLength('a', 2, 10)
      const result3 = validator.validateStringLength('very long string', 2, 10)

      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(false)
      expect(result3.isValid).toBe(false)
    })

    test('应该正确验证邮箱格式', () => {
      const validEmail = validator.validateEmail('test@example.com')
      const invalidEmail = validator.validateEmail('invalid-email')

      expect(validEmail.isValid).toBe(true)
      expect(invalidEmail.isValid).toBe(false)
    })

    test('应该正确验证手机号格式', () => {
      const validPhone = validator.validatePhone('13812345678')
      const invalidPhone = validator.validatePhone('12345')

      expect(validPhone.isValid).toBe(true)
      expect(invalidPhone.isValid).toBe(false)
    })

    test('应该正确进行综合验证', () => {
      const data = {
        name: 'test',
        email: 'test@example.com',
        age: 25,
        phone: '13812345678'
      }

      const rules = {
        name: { required: true, type: 'string', minLength: 2, maxLength: 20 },
        email: { required: true, format: 'email' },
        age: { required: true, type: 'number', min: 18, max: 100 },
        phone: { required: true, format: 'phone' }
      }

      const result = validator.validate(data, rules)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('应该在验证失败时抛出错误', () => {
      const data = { name: '' }
      const rules = { name: { required: true } }

      expect(() => {
        validateAndThrow(data, rules)
      }).toThrow()
    })
  })

  describe('命名规范测试', () => {
    test('应该正确转换命名格式', () => {
      expect(naming.toCamelCase('user_name')).toBe('userName')
      expect(naming.toSnakeCase('userName')).toBe('user_name')
      expect(naming.toKebabCase('userName')).toBe('user-name')
    })

    test('应该正确验证变量名', () => {
      expect(naming.validateVariableName('userName')).toBe(true)
      expect(naming.validateVariableName('UserName')).toBe(false)
      expect(naming.validateVariableName('user_name')).toBe(false)
    })

    test('应该正确验证常量名', () => {
      expect(naming.validateConstantName('MAX_SIZE')).toBe(true)
      expect(naming.validateConstantName('maxSize')).toBe(false)
    })
  })

  describe('代码质量检查测试', () => {
    test('应该正确检查函数复杂度', () => {
      const simpleFunction = 'function test() { return true; }'
      const complexFunction = `
        function test() {
          if (a) {
            if (b) {
              for (let i = 0; i < 10; i++) {
                if (c) {
                  while (d) {
                    switch (e) {
                      case 1:
                        return 1;
                      case 2:
                        return 2;
                    }
                  }
                }
              }
            }
          }
        }
      `

      const simple = qualityChecker.checkFunctionComplexity(simpleFunction)
      const complex = qualityChecker.checkFunctionComplexity(complexFunction)

      expect(simple.level).toBe('low')
      expect(complex.level).toBe('high')
      expect(complex.suggestion).toContain('拆分函数')
    })

    test('应该正确检查注释覆盖率', () => {
      const wellCommentedCode = `
        // This is a comment
        function test() {
          // Another comment
          return true;
        }
      `

      const poorlyCommentedCode = `
        function test() {
          const a = 1;
          const b = 2;
          const c = 3;
          return a + b + c;
        }
      `

      const wellCommented = qualityChecker.checkCommentCoverage(wellCommentedCode)
      const poorlyCommented = qualityChecker.checkCommentCoverage(poorlyCommentedCode)

      expect(wellCommented.level).toBe('good')
      expect(poorlyCommented.level).toBe('poor')
    })
  })
})

console.log('✅ 阶段3代码质量优化测试已加载')
console.log('🧪 测试覆盖:')
console.log('  - 错误处理系统')
console.log('  - 缓存管理')
console.log('  - 请求去重')
console.log('  - 性能监控')
console.log('  - 数据验证')
console.log('  - 命名规范')
console.log('  - 代码质量检查')
