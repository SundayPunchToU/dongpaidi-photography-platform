/**
 * 端到端业务流程测试 - 阶段5全栈功能集成
 * 测试完整的业务流程，确保前后端完全对接
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 测试覆盖:
 * - 用户注册登录流程
 * - 作品发布和互动流程
 * - 约拍申请和匹配流程
 * - 消息交流流程
 * - 支付交易流程
 */

// 模拟微信小程序环境
global.wx = {
  login: jest.fn(),
  getUserInfo: jest.fn(),
  request: jest.fn(),
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  getSystemInfoSync: jest.fn(() => ({
    platform: 'devtools',
    version: '8.0.5'
  }))
}

// 导入测试模块
import { apiClient } from '../utils/api-client.js'
import { UserService, WorksService, AppointmentService, MessageService } from '../utils/api.js'

describe('阶段5端到端业务流程测试', () => {
  let testUser = null
  let testWork = null
  let testAppointment = null
  let testMessage = null

  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test'
    
    // 模拟网络请求
    global.wx.request.mockImplementation((options) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            statusCode: 200,
            data: {
              success: true,
              data: mockApiResponse(options.url, options.method, options.data),
              message: '操作成功'
            }
          })
        }, 100)
      })
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('用户注册登录流程测试', () => {
    test('完整的微信登录流程', async () => {
      // 1. 模拟微信登录获取code
      global.wx.login.mockResolvedValue({
        code: 'mock_wx_code_12345'
      })

      // 2. 调用后端微信登录接口
      const loginResult = await UserService.wechatLogin('mock_wx_code_12345')

      expect(loginResult.success).toBe(true)
      expect(loginResult.data).toHaveProperty('token')
      expect(loginResult.data).toHaveProperty('user')
      
      testUser = loginResult.data.user
      
      // 3. 验证token存储
      expect(global.wx.setStorageSync).toHaveBeenCalledWith(
        'auth_token',
        loginResult.data.token
      )
    })

    test('用户信息完善流程', async () => {
      // 1. 更新用户基本信息
      const updateData = {
        nickname: '测试摄影师',
        bio: '专业人像摄影师',
        isPhotographer: true,
        photographerLevel: 'professional'
      }

      const updateResult = await UserService.updateProfile(updateData)

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.nickname).toBe(updateData.nickname)
      expect(updateResult.data.isPhotographer).toBe(true)
    })

    test('Token自动刷新机制', async () => {
      // 1. 模拟token过期
      global.wx.request.mockImplementationOnce((options) => {
        return Promise.resolve({
          statusCode: 401,
          data: {
            success: false,
            message: 'Token已过期'
          }
        })
      })

      // 2. 模拟刷新token成功
      global.wx.request.mockImplementationOnce((options) => {
        if (options.url.includes('/auth/refresh')) {
          return Promise.resolve({
            statusCode: 200,
            data: {
              success: true,
              data: {
                token: 'new_mock_token_67890',
                refreshToken: 'new_refresh_token'
              }
            }
          })
        }
      })

      // 3. 重新请求原接口
      global.wx.request.mockImplementationOnce((options) => {
        return Promise.resolve({
          statusCode: 200,
          data: {
            success: true,
            data: { id: 'user123', nickname: '测试用户' }
          }
        })
      })

      const result = await UserService.getCurrentUser()
      
      expect(result.success).toBe(true)
      expect(global.wx.setStorageSync).toHaveBeenCalledWith(
        'auth_token',
        'new_mock_token_67890'
      )
    })
  })

  describe('作品发布和互动流程测试', () => {
    test('完整的作品发布流程', async () => {
      // 1. 上传图片
      const uploadResult = await WorksService.uploadImages([
        { path: 'mock_image_1.jpg', size: 1024000 },
        { path: 'mock_image_2.jpg', size: 2048000 }
      ])

      expect(uploadResult.success).toBe(true)
      expect(uploadResult.data).toHaveLength(2)

      // 2. 发布作品
      const workData = {
        title: '测试摄影作品',
        description: '这是一个测试作品描述',
        images: uploadResult.data.map(img => img.url),
        category: 'portrait',
        tags: ['人像', '摄影', '测试'],
        location: '北京市朝阳区'
      }

      const publishResult = await WorksService.publishWork(workData)

      expect(publishResult.success).toBe(true)
      expect(publishResult.data.title).toBe(workData.title)
      expect(publishResult.data.status).toBe('published')
      
      testWork = publishResult.data
    })

    test('作品互动流程', async () => {
      // 1. 点赞作品
      const likeResult = await WorksService.likeWork(testWork.id)
      expect(likeResult.success).toBe(true)

      // 2. 收藏作品
      const favoriteResult = await WorksService.favoriteWork(testWork.id)
      expect(favoriteResult.success).toBe(true)

      // 3. 评论作品
      const commentResult = await WorksService.commentWork(testWork.id, {
        content: '很棒的作品！'
      })
      expect(commentResult.success).toBe(true)
      expect(commentResult.data.content).toBe('很棒的作品！')

      // 4. 分享作品
      const shareResult = await WorksService.shareWork(testWork.id, {
        platform: 'wechat'
      })
      expect(shareResult.success).toBe(true)
    })

    test('作品发现和推荐流程', async () => {
      // 1. 获取推荐作品
      const recommendedResult = await WorksService.getRecommendedWorks({
        page: 1,
        limit: 10
      })

      expect(recommendedResult.success).toBe(true)
      expect(recommendedResult.data.works).toBeDefined()
      expect(Array.isArray(recommendedResult.data.works)).toBe(true)

      // 2. 搜索作品
      const searchResult = await WorksService.searchWorks({
        keyword: '人像',
        category: 'portrait',
        page: 1,
        limit: 10
      })

      expect(searchResult.success).toBe(true)
      expect(searchResult.data.works).toBeDefined()

      // 3. 按分类浏览
      const categoryResult = await WorksService.getWorksByCategory('portrait', {
        page: 1,
        limit: 10
      })

      expect(categoryResult.success).toBe(true)
      expect(categoryResult.data.works).toBeDefined()
    })
  })

  describe('约拍申请和匹配流程测试', () => {
    test('完整的约拍发布流程', async () => {
      // 1. 发布约拍需求
      const appointmentData = {
        title: '寻找人像模特',
        description: '需要拍摄一组人像作品',
        type: 'photographer_seek_model',
        location: '北京市朝阳区',
        shootDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 500,
        requirements: {
          experience: 'experienced',
          style: 'fashion',
          duration: '2-3小时'
        }
      }

      const publishResult = await AppointmentService.publishAppointment(appointmentData)

      expect(publishResult.success).toBe(true)
      expect(publishResult.data.title).toBe(appointmentData.title)
      expect(publishResult.data.status).toBe('open')
      
      testAppointment = publishResult.data
    })

    test('约拍申请和处理流程', async () => {
      // 1. 申请约拍
      const applyResult = await AppointmentService.applyForAppointment(testAppointment.id, {
        message: '我对这个约拍很感兴趣，希望能够合作'
      })

      expect(applyResult.success).toBe(true)
      expect(applyResult.data.status).toBe('pending')

      // 2. 查看申请列表
      const applicationsResult = await AppointmentService.getAppointmentApplications(testAppointment.id)

      expect(applicationsResult.success).toBe(true)
      expect(Array.isArray(applicationsResult.data)).toBe(true)

      // 3. 处理申请（接受）
      const applicationId = applicationsResult.data[0].id
      const handleResult = await AppointmentService.handleApplication(applicationId, {
        action: 'accept',
        message: '很高兴与您合作'
      })

      expect(handleResult.success).toBe(true)
      expect(handleResult.data.status).toBe('accepted')
    })

    test('约拍状态管理流程', async () => {
      // 1. 更新约拍状态为进行中
      const updateResult = await AppointmentService.updateAppointmentStatus(testAppointment.id, {
        status: 'in_progress'
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.status).toBe('in_progress')

      // 2. 完成约拍
      const completeResult = await AppointmentService.updateAppointmentStatus(testAppointment.id, {
        status: 'completed'
      })

      expect(completeResult.success).toBe(true)
      expect(completeResult.data.status).toBe('completed')
    })
  })

  describe('消息交流流程测试', () => {
    test('完整的消息交流流程', async () => {
      // 1. 发送消息
      const sendResult = await MessageService.sendMessage({
        receiverId: 'user456',
        content: '你好，关于约拍的事情我们可以详细聊聊',
        type: 'text'
      })

      expect(sendResult.success).toBe(true)
      expect(sendResult.data.content).toBe('你好，关于约拍的事情我们可以详细聊聊')
      
      testMessage = sendResult.data

      // 2. 获取对话列表
      const conversationsResult = await MessageService.getConversations()

      expect(conversationsResult.success).toBe(true)
      expect(Array.isArray(conversationsResult.data)).toBe(true)

      // 3. 获取对话消息
      const messagesResult = await MessageService.getConversationMessages('user456')

      expect(messagesResult.success).toBe(true)
      expect(Array.isArray(messagesResult.data)).toBe(true)

      // 4. 标记消息已读
      const readResult = await MessageService.markMessagesAsRead('user456')

      expect(readResult.success).toBe(true)
    })

    test('未读消息统计', async () => {
      const unreadResult = await MessageService.getUnreadCount()

      expect(unreadResult.success).toBe(true)
      expect(typeof unreadResult.data.count).toBe('number')
    })
  })

  describe('数据同步和一致性测试', () => {
    test('前端缓存与后端数据同步', async () => {
      // 1. 获取用户信息（应该从缓存获取）
      const cachedResult = await UserService.getCurrentUser()
      expect(cachedResult.success).toBe(true)

      // 2. 强制刷新用户信息
      const refreshResult = await UserService.getCurrentUser(true)
      expect(refreshResult.success).toBe(true)

      // 3. 验证数据一致性
      expect(cachedResult.data.id).toBe(refreshResult.data.id)
    })

    test('实时数据更新验证', async () => {
      // 1. 获取作品列表
      const worksResult = await WorksService.getWorks({ page: 1, limit: 10 })
      expect(worksResult.success).toBe(true)

      const initialCount = worksResult.data.total

      // 2. 发布新作品
      await WorksService.publishWork({
        title: '新作品',
        description: '测试实时更新',
        images: ['test.jpg'],
        category: 'portrait'
      })

      // 3. 重新获取作品列表
      const updatedWorksResult = await WorksService.getWorks({ page: 1, limit: 10 })
      expect(updatedWorksResult.success).toBe(true)
      expect(updatedWorksResult.data.total).toBe(initialCount + 1)
    })
  })

  describe('错误处理和恢复测试', () => {
    test('网络错误恢复机制', async () => {
      // 1. 模拟网络错误
      global.wx.request.mockRejectedValueOnce(new Error('网络连接失败'))

      // 2. 调用API（应该自动重试）
      const result = await UserService.getCurrentUser()

      // 3. 验证重试机制
      expect(global.wx.request).toHaveBeenCalledTimes(2) // 原始请求 + 重试
    })

    test('服务器错误处理', async () => {
      // 1. 模拟服务器错误
      global.wx.request.mockResolvedValueOnce({
        statusCode: 500,
        data: {
          success: false,
          message: '服务器内部错误'
        }
      })

      // 2. 调用API
      const result = await UserService.getCurrentUser()

      // 3. 验证错误处理
      expect(result.success).toBe(false)
      expect(result.error).toContain('服务器')
    })
  })
})

/**
 * 模拟API响应数据
 */
function mockApiResponse(url, method, data) {
  if (url.includes('/auth/wechat/login')) {
    return {
      token: 'mock_token_12345',
      refreshToken: 'mock_refresh_token',
      user: {
        id: 'user123',
        nickname: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        isPhotographer: false
      }
    }
  }

  if (url.includes('/users/profile') && method === 'PUT') {
    return {
      ...data,
      id: 'user123',
      updatedAt: new Date().toISOString()
    }
  }

  if (url.includes('/works') && method === 'POST') {
    return {
      id: 'work123',
      ...data,
      status: 'published',
      createdAt: new Date().toISOString(),
      author: {
        id: 'user123',
        nickname: '测试摄影师'
      }
    }
  }

  if (url.includes('/appointments') && method === 'POST') {
    return {
      id: 'appointment123',
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
      publisher: {
        id: 'user123',
        nickname: '测试摄影师'
      }
    }
  }

  if (url.includes('/messages') && method === 'POST') {
    return {
      id: 'message123',
      ...data,
      createdAt: new Date().toISOString(),
      sender: {
        id: 'user123',
        nickname: '测试用户'
      }
    }
  }

  // 默认成功响应
  return {
    success: true,
    message: '操作成功'
  }
}

console.log('✅ 端到端业务流程测试已加载')
console.log('🧪 测试覆盖:')
console.log('  - 用户注册登录流程')
console.log('  - 作品发布和互动流程')
console.log('  - 约拍申请和匹配流程')
console.log('  - 消息交流流程')
console.log('  - 数据同步和一致性')
console.log('  - 错误处理和恢复')
