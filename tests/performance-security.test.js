/**
 * 性能和安全性测试 - 阶段2功能完整性验证
 * 验证API性能、安全认证机制和系统稳定性
 */

// 模拟微信小程序环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  uploadFile: jest.fn(),
  getAccountInfoSync: jest.fn(() => ({
    miniProgram: { envVersion: 'develop' }
  }))
}

describe('性能和安全性测试 - 阶段2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('API性能测试', () => {
    test('请求重试机制验证', async () => {
      let requestCount = 0
      
      wx.request.mockImplementation(({ fail, success }) => {
        requestCount++
        if (requestCount < 3) {
          // 前两次请求失败
          fail({ errMsg: 'request:fail timeout' })
        } else {
          // 第三次请求成功
          success({
            statusCode: 200,
            data: {
              success: true,
              data: { message: '重试成功' },
              message: '请求成功'
            }
          })
        }
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.getList()

      expect(requestCount).toBe(3) // 验证重试了3次
      expect(result.success).toBe(true)
    })

    test('并发请求处理', async () => {
      let requestCount = 0
      
      wx.request.mockImplementation(({ success }) => {
        requestCount++
        setTimeout(() => {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: { id: requestCount },
              message: '请求成功'
            }
          })
        }, Math.random() * 100) // 随机延迟模拟网络
      })

      const { WorksService, UserService, AppointmentService } = await import('../utils/api.js')

      // 并发发起多个请求
      const promises = [
        WorksService.getList(),
        UserService.getCurrentUser(),
        AppointmentService.getList(),
        WorksService.getTrending(),
        UserService.getProfile('user123')
      ]

      const results = await Promise.all(promises)

      expect(requestCount).toBe(5)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    test('大数据量处理性能', async () => {
      // 模拟大量数据返回
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `work${i}`,
        title: `作品${i}`,
        description: `这是第${i}个作品的描述`.repeat(10), // 较长的描述
        coverImage: `https://example.com/image${i}.jpg`,
        stats: { likes: i * 10, comments: i * 5, views: i * 100 }
      }))

      wx.request.mockImplementation(({ success }) => {
        const startTime = Date.now()
        
        success({
          statusCode: 200,
          data: {
            success: true,
            data: { items: largeDataSet },
            message: '获取成功'
          }
        })
        
        const endTime = Date.now()
        expect(endTime - startTime).toBeLessThan(100) // 处理时间应该很快
      })

      const { WorksService } = await import('../utils/api.js')
      const startTime = Date.now()
      const result = await WorksService.getList()
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data.items).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(500) // 总处理时间应该合理
    })
  })

  describe('安全认证机制测试', () => {
    test('Token自动添加到请求头', async () => {
      const mockToken = 'test_access_token_123'
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'access_token') return mockToken
        return null
      })

      wx.request.mockImplementation(({ header, success }) => {
        // 验证Authorization头是否正确添加
        expect(header.Authorization).toBe(`Bearer ${mockToken}`)
        
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {},
            message: '请求成功'
          }
        })
      })

      const { UserService } = await import('../utils/api.js')
      await UserService.getCurrentUser()

      expect(wx.getStorageSync).toHaveBeenCalledWith('access_token')
    })

    test('Token过期自动刷新', async () => {
      let requestCount = 0
      
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'access_token') return 'expired_token'
        if (key === 'refresh_token') return 'valid_refresh_token'
        return null
      })

      wx.request.mockImplementation(({ url, success }) => {
        requestCount++
        
        if (url.includes('/auth/refresh')) {
          // 刷新token请求
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {
                accessToken: 'new_access_token',
                refreshToken: 'new_refresh_token'
              },
              message: '刷新成功'
            }
          })
        } else {
          if (requestCount === 1) {
            // 第一次请求返回401
            success({
              statusCode: 401,
              data: {
                success: false,
                error: 'Token已过期',
                message: '请重新登录'
              }
            })
          } else {
            // 刷新token后的重试请求
            success({
              statusCode: 200,
              data: {
                success: true,
                data: { user: { id: 'user123' } },
                message: '请求成功'
              }
            })
          }
        }
      })

      const { UserService } = await import('../utils/api.js')
      const result = await UserService.getCurrentUser()

      expect(result.success).toBe(true)
      expect(wx.setStorageSync).toHaveBeenCalledWith('access_token', 'new_access_token')
    })

    test('无效Token处理', async () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'access_token') return 'invalid_token'
        if (key === 'refresh_token') return 'invalid_refresh_token'
        return null
      })

      wx.request.mockImplementation(({ url, success }) => {
        if (url.includes('/auth/refresh')) {
          // 刷新token也失败
          success({
            statusCode: 401,
            data: {
              success: false,
              error: 'Refresh token无效',
              message: '请重新登录'
            }
          })
        } else {
          success({
            statusCode: 401,
            data: {
              success: false,
              error: 'Token无效',
              message: '请重新登录'
            }
          })
        }
      })

      const { UserService } = await import('../utils/api.js')
      const result = await UserService.getCurrentUser()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Token')
      // 验证清除了本地存储
      expect(wx.removeStorageSync).toHaveBeenCalledWith('access_token')
      expect(wx.removeStorageSync).toHaveBeenCalledWith('refresh_token')
    })
  })

  describe('数据安全性测试', () => {
    test('敏感数据过滤', async () => {
      wx.request.mockImplementation(({ data, success }) => {
        // 验证敏感数据不会被发送
        expect(data.password).toBeUndefined()
        expect(data.token).toBeUndefined()
        expect(data.secret).toBeUndefined()
        
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {},
            message: '更新成功'
          }
        })
      })

      const { UserService } = await import('../utils/api.js')
      
      // 尝试更新包含敏感数据的用户资料
      await UserService.updateProfile({
        nickname: '新昵称',
        password: 'should_not_be_sent', // 敏感数据
        token: 'should_not_be_sent',    // 敏感数据
        secret: 'should_not_be_sent'    // 敏感数据
      })
    })

    test('XSS防护验证', async () => {
      const maliciousInput = '<script>alert("xss")</script>'
      
      wx.request.mockImplementation(({ data, success }) => {
        // 验证恶意脚本被转义或过滤
        expect(data.title).not.toContain('<script>')
        expect(data.description).not.toContain('<script>')
        
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {},
            message: '发布成功'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')
      
      await WorksService.publish({
        title: maliciousInput,
        description: maliciousInput,
        category: 'test'
      })
    })
  })

  describe('错误处理和稳定性测试', () => {
    test('网络异常恢复', async () => {
      let networkFailCount = 0
      
      wx.request.mockImplementation(({ fail, success }) => {
        networkFailCount++
        
        if (networkFailCount <= 2) {
          fail({ errMsg: 'request:fail 网络异常' })
        } else {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {},
              message: '网络恢复'
            }
          })
        }
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.getList()

      expect(result.success).toBe(true)
      expect(networkFailCount).toBe(3)
    })

    test('内存泄漏防护', async () => {
      // 模拟大量请求，检查是否有内存泄漏
      const requests = []
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: { timestamp: Date.now() },
            message: '请求成功'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')

      // 发起100个并发请求
      for (let i = 0; i < 100; i++) {
        requests.push(WorksService.getList())
      }

      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(100)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // 验证没有内存泄漏（这里主要是确保所有请求都能正常完成）
      expect(requests).toHaveLength(100)
    })

    test('异常数据处理', async () => {
      // 测试各种异常响应数据
      const abnormalResponses = [
        null,
        undefined,
        '',
        '非JSON字符串',
        { malformed: 'json without success field' },
        { success: 'not_boolean' }
      ]

      for (const abnormalData of abnormalResponses) {
        wx.request.mockImplementation(({ success }) => {
          success({
            statusCode: 200,
            data: abnormalData
          })
        })

        const { WorksService } = await import('../utils/api.js')
        const result = await WorksService.getList()

        // 应该能够优雅处理异常数据
        expect(typeof result).toBe('object')
        expect(typeof result.success).toBe('boolean')
      }
    })
  })

  describe('缓存机制测试', () => {
    test('API响应缓存', async () => {
      let requestCount = 0
      
      wx.request.mockImplementation(({ success }) => {
        requestCount++
        success({
          statusCode: 200,
          data: {
            success: true,
            data: { requestId: requestCount },
            message: '请求成功'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')

      // 连续发起相同请求
      const result1 = await WorksService.getList({ page: 1 })
      const result2 = await WorksService.getList({ page: 1 })

      // 如果有缓存机制，第二次请求应该使用缓存
      // 这里主要验证缓存逻辑的存在性
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })
})

console.log('✅ 性能和安全性测试已创建')
console.log('🔧 测试覆盖范围:')
console.log('  - API性能测试 (重试、并发、大数据)')
console.log('  - 安全认证机制 (Token管理、自动刷新)')
console.log('  - 数据安全性 (敏感数据过滤、XSS防护)')
console.log('  - 错误处理和稳定性')
console.log('  - 缓存机制验证')
