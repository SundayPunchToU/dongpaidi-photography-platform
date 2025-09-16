/**
 * 端到端业务流程测试 - 阶段2功能完整性验证
 * 验证核心业务流程的完整性：用户登录 → 作品发布 → 约拍申请 → 消息交流
 */

// 模拟微信小程序环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  request: jest.fn(),
  uploadFile: jest.fn(),
  login: jest.fn(),
  getUserProfile: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  getAccountInfoSync: jest.fn(() => ({
    miniProgram: { envVersion: 'develop' }
  }))
}

describe('端到端业务流程测试 - 阶段2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('用户认证流程测试', () => {
    test('完整的微信登录流程', async () => {
      // 模拟微信登录成功
      wx.login.mockImplementation(({ success }) => {
        success({ code: 'wx_code_123' })
      })

      wx.getUserProfile.mockImplementation(({ success }) => {
        success({
          userInfo: {
            nickName: '测试用户',
            avatarUrl: 'https://example.com/avatar.jpg'
          }
        })
      })

      // 模拟后端登录API响应
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              user: {
                id: 'user123',
                nickname: '测试用户',
                avatar: 'https://example.com/avatar.jpg'
              },
              tokens: {
                accessToken: 'access_token_123',
                refreshToken: 'refresh_token_123'
              }
            },
            message: '登录成功'
          }
        })
      })

      // 导入并测试UserService
      const { UserService } = await import('../utils/api.js')
      const result = await UserService.login()

      expect(result.success).toBe(true)
      expect(result.user.nickname).toBe('测试用户')
      expect(wx.setStorageSync).toHaveBeenCalledWith('access_token', 'access_token_123')
      expect(wx.setStorageSync).toHaveBeenCalledWith('isLoggedIn', true)
    })

    test('Token自动刷新流程', async () => {
      // 模拟存储中的refresh token
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'refresh_token') return 'refresh_token_123'
        return null
      })

      // 模拟刷新token API响应
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              accessToken: 'new_access_token_123',
              refreshToken: 'new_refresh_token_123'
            },
            message: '令牌刷新成功'
          }
        })
      })

      const { UserService } = await import('../utils/api.js')
      const result = await UserService.refreshToken()

      expect(result.success).toBe(true)
      expect(wx.setStorageSync).toHaveBeenCalledWith('access_token', 'new_access_token_123')
      expect(wx.setStorageSync).toHaveBeenCalledWith('refresh_token', 'new_refresh_token_123')
    })
  })

  describe('作品发布流程测试', () => {
    test('完整的作品发布流程', async () => {
      // 模拟用户已登录
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'access_token') return 'access_token_123'
        if (key === 'isLoggedIn') return true
        return null
      })

      // 模拟文件上传成功
      wx.uploadFile.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: JSON.stringify({
            success: true,
            data: {
              url: 'https://example.com/uploaded-image.jpg'
            },
            message: '上传成功'
          })
        })
      })

      // 模拟作品发布API响应
      wx.request.mockImplementation(({ url, success }) => {
        if (url.includes('/works')) {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {
                id: 'work123',
                title: '测试作品',
                description: '这是一个测试作品',
                coverImage: 'https://example.com/uploaded-image.jpg',
                status: 'published'
              },
              message: '作品发布成功'
            }
          })
        }
      })

      const { WorksService, FileService } = await import('../utils/api.js')

      // 1. 上传图片
      const uploadResult = await FileService.uploadImage('/temp/test-image.jpg')
      expect(uploadResult.success).toBe(true)
      expect(uploadResult.data.url).toBe('https://example.com/uploaded-image.jpg')

      // 2. 发布作品
      const publishResult = await WorksService.publish({
        title: '测试作品',
        description: '这是一个测试作品',
        images: [uploadResult.data.url],
        category: 'portrait',
        tags: ['人像', '摄影']
      })

      expect(publishResult.success).toBe(true)
      expect(publishResult.data.title).toBe('测试作品')
      expect(publishResult.data.status).toBe('published')
    })
  })

  describe('约拍申请流程测试', () => {
    test('完整的约拍申请流程', async () => {
      // 模拟用户已登录
      wx.getStorageSync.mockReturnValue('access_token_123')

      // 模拟获取约拍列表
      wx.request.mockImplementation(({ url, success }) => {
        if (url.includes('/appointments') && !url.includes('/apply')) {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {
                items: [
                  {
                    id: 'appointment123',
                    title: '人像摄影约拍',
                    description: '寻找模特拍摄人像作品',
                    location: '北京',
                    date: '2025-02-01',
                    status: 'open'
                  }
                ]
              },
              message: '获取成功'
            }
          })
        } else if (url.includes('/apply')) {
          // 模拟申请约拍
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {
                applicationId: 'app123',
                status: 'pending'
              },
              message: '申请成功'
            }
          })
        }
      })

      const { AppointmentService } = await import('../utils/api.js')

      // 1. 获取约拍列表
      const listResult = await AppointmentService.getList()
      expect(listResult.success).toBe(true)
      expect(listResult.data.items).toHaveLength(1)

      // 2. 申请约拍
      const applyResult = await AppointmentService.apply('appointment123', '我对这个约拍很感兴趣')
      expect(applyResult.success).toBe(true)
      expect(applyResult.data.status).toBe('pending')
    })
  })

  describe('消息交流流程测试', () => {
    test('完整的消息交流流程', async () => {
      wx.getStorageSync.mockReturnValue('access_token_123')

      wx.request.mockImplementation(({ url, success }) => {
        if (url.includes('/messages/conversations')) {
          // 获取对话列表
          success({
            statusCode: 200,
            data: {
              success: true,
              data: [
                {
                  id: 'conv123',
                  participantId: 'user456',
                  participantName: '摄影师A',
                  lastMessage: '你好，关于约拍的事情...',
                  unreadCount: 2
                }
              ],
              message: '获取成功'
            }
          })
        } else if (url.includes('/messages') && !url.includes('conversations')) {
          // 发送消息
          success({
            statusCode: 200,
            data: {
              success: true,
              data: {
                id: 'msg123',
                content: '你好，我想了解一下约拍的详情',
                timestamp: new Date().toISOString()
              },
              message: '发送成功'
            }
          })
        }
      })

      const { MessageService } = await import('../utils/api.js')

      // 1. 获取对话列表
      const conversationsResult = await MessageService.getConversations()
      expect(conversationsResult.success).toBe(true)
      expect(conversationsResult.data).toHaveLength(1)

      // 2. 发送消息
      const sendResult = await MessageService.sendMessage('user456', '你好，我想了解一下约拍的详情')
      expect(sendResult.success).toBe(true)
      expect(sendResult.data.content).toBe('你好，我想了解一下约拍的详情')
    })
  })

  describe('社交功能流程测试', () => {
    test('关注和点赞流程', async () => {
      wx.getStorageSync.mockReturnValue('access_token_123')

      wx.request.mockImplementation(({ url, method, success }) => {
        if (url.includes('/follow')) {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: { isFollowing: true },
              message: '关注成功'
            }
          })
        } else if (url.includes('/like')) {
          success({
            statusCode: 200,
            data: {
              success: true,
              data: { isLiked: true, likeCount: 11 },
              message: '点赞成功'
            }
          })
        }
      })

      const { SocialService, WorksService } = await import('../utils/api.js')

      // 1. 关注用户
      const followResult = await SocialService.toggleFollow('user456')
      expect(followResult.success).toBe(true)
      expect(followResult.data.isFollowing).toBe(true)

      // 2. 点赞作品
      const likeResult = await WorksService.toggleLike('work123')
      expect(likeResult.success).toBe(true)
      expect(likeResult.data.isLiked).toBe(true)
    })
  })

  describe('错误处理和边界情况测试', () => {
    test('网络错误处理', async () => {
      wx.request.mockImplementation(({ fail }) => {
        fail({ errMsg: 'request:fail timeout' })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.getList()

      expect(result.success).toBe(false)
      expect(result.error).toContain('网络')
    })

    test('未登录状态处理', async () => {
      wx.getStorageSync.mockReturnValue(null) // 没有token

      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 401,
          data: {
            success: false,
            error: '用户未登录',
            message: '请先登录'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.publish({ title: '测试' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('用户未登录')
    })
  })
})

console.log('✅ 端到端业务流程测试已创建')
console.log('🔧 测试覆盖范围:')
console.log('  - 用户认证流程 (登录、Token刷新)')
console.log('  - 作品发布流程 (上传、发布)')
console.log('  - 约拍申请流程 (浏览、申请)')
console.log('  - 消息交流流程 (对话、发送)')
console.log('  - 社交功能流程 (关注、点赞)')
console.log('  - 错误处理和边界情况')
