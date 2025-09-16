/**
 * 数据同步机制验证测试 - 阶段2功能完整性验证
 * 验证前后端数据同步的一致性，确保数据格式转换正确
 */

// 模拟微信小程序环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  getAccountInfoSync: jest.fn(() => ({
    miniProgram: { envVersion: 'develop' }
  }))
}

describe('数据同步机制验证测试 - 阶段2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('用户数据同步验证', () => {
    test('后端用户数据格式转换', async () => {
      // 模拟后端返回的用户数据格式
      const backendUserData = {
        success: true,
        data: {
          id: 'user123',
          nickname: '测试用户',
          avatar_url: 'https://example.com/avatar.jpg',
          phone: '13800138000',
          email: 'test@example.com',
          location: '北京',
          specialties: ['人像摄影', '风景摄影'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-15T12:00:00Z',
          works_count: 15,
          followers_count: 100,
          following_count: 50
        },
        message: '获取成功'
      }

      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: backendUserData
        })
      })

      const { UserService } = await import('../utils/api.js')
      const result = await UserService.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user123',
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.jpg', // 注意：avatar_url -> avatar
        phone: '13800138000',
        email: 'test@example.com',
        location: '北京',
        specialties: ['人像摄影', '风景摄影'],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T12:00:00Z',
        worksCount: 15,
        followersCount: 100,
        followingCount: 50
      })
    })

    test('用户资料更新数据同步', async () => {
      const updateData = {
        nickname: '新昵称',
        location: '上海',
        specialties: ['商业摄影']
      }

      wx.request.mockImplementation(({ data, success }) => {
        // 验证发送到后端的数据格式
        expect(data).toEqual({
          nickname: '新昵称',
          location: '上海',
          specialties: ['商业摄影']
        })

        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              id: 'user123',
              nickname: '新昵称',
              location: '上海',
              specialties: ['商业摄影']
            },
            message: '更新成功'
          }
        })
      })

      const { UserService } = await import('../utils/api.js')
      const result = await UserService.updateProfile(updateData)

      expect(result.success).toBe(true)
      expect(result.data.nickname).toBe('新昵称')
    })
  })

  describe('作品数据同步验证', () => {
    test('作品列表数据格式转换', async () => {
      const backendWorksData = {
        success: true,
        data: {
          items: [
            {
              id: 'work123',
              title: '测试作品',
              description: '作品描述',
              cover_image: 'https://example.com/cover.jpg',
              images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
              category: 'portrait',
              tags: ['人像', '摄影'],
              location: '北京',
              user_id: 'user123',
              user: {
                nickname: '摄影师A',
                avatar_url: 'https://example.com/avatar.jpg'
              },
              like_count: 10,
              comment_count: 5,
              view_count: 100,
              created_at: '2025-01-15T10:00:00Z',
              updated_at: '2025-01-15T10:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        },
        message: '获取成功'
      }

      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: backendWorksData
        })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.getList({ page: 1, limit: 20 })

      expect(result.success).toBe(true)
      expect(result.data.items[0]).toEqual({
        id: 'work123',
        title: '测试作品',
        description: '作品描述',
        coverImage: 'https://example.com/cover.jpg', // cover_image -> coverImage
        images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        category: 'portrait',
        tags: ['人像', '摄影'],
        location: '北京',
        userId: 'user123', // user_id -> userId
        user: {
          nickname: '摄影师A',
          avatar: 'https://example.com/avatar.jpg' // avatar_url -> avatar
        },
        stats: {
          likes: 10,    // like_count -> stats.likes
          comments: 5,  // comment_count -> stats.comments
          views: 100    // view_count -> stats.views
        },
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z'
      })
    })

    test('作品发布数据格式验证', async () => {
      const publishData = {
        title: '新作品',
        description: '作品描述',
        images: ['https://example.com/img1.jpg'],
        category: 'landscape',
        tags: ['风景', '自然'],
        location: '杭州'
      }

      wx.request.mockImplementation(({ data, success }) => {
        // 验证发送到后端的数据格式
        expect(data).toEqual({
          title: '新作品',
          description: '作品描述',
          images: ['https://example.com/img1.jpg'],
          category: 'landscape',
          tags: ['风景', '自然'],
          location: '杭州'
        })

        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              id: 'work456',
              title: '新作品',
              status: 'published'
            },
            message: '发布成功'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.publish(publishData)

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('新作品')
    })
  })

  describe('约拍数据同步验证', () => {
    test('约拍列表数据格式转换', async () => {
      const backendAppointmentData = {
        success: true,
        data: [
          {
            id: 'appointment123',
            title: '人像摄影约拍',
            description: '寻找模特拍摄人像作品',
            category: 'portrait',
            location: '北京',
            date: '2025-02-01',
            time: '14:00',
            duration: 2,
            budget: 500,
            requirements: '有拍摄经验优先',
            status: 'open',
            publisher_id: 'user123',
            publisher: {
              nickname: '摄影师A',
              avatar_url: 'https://example.com/avatar.jpg'
            },
            application_count: 3,
            created_at: '2025-01-15T09:00:00Z'
          }
        ],
        message: '获取成功'
      }

      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: backendAppointmentData
        })
      })

      const { AppointmentService } = await import('../utils/api.js')
      const result = await AppointmentService.getList()

      expect(result.success).toBe(true)
      expect(result.data[0]).toEqual({
        id: 'appointment123',
        title: '人像摄影约拍',
        description: '寻找模特拍摄人像作品',
        category: 'portrait',
        location: '北京',
        date: '2025-02-01',
        time: '14:00',
        duration: 2,
        budget: 500,
        requirements: '有拍摄经验优先',
        status: 'open',
        publisherId: 'user123', // publisher_id -> publisherId
        publisher: {
          nickname: '摄影师A',
          avatar: 'https://example.com/avatar.jpg' // avatar_url -> avatar
        },
        applicationCount: 3, // application_count -> applicationCount
        createdAt: '2025-01-15T09:00:00Z'
      })
    })
  })

  describe('消息数据同步验证', () => {
    test('对话列表数据格式转换', async () => {
      const backendConversationData = {
        success: true,
        data: [
          {
            id: 'conv123',
            participant_id: 'user456',
            participant: {
              nickname: '用户B',
              avatar_url: 'https://example.com/avatar2.jpg'
            },
            last_message: {
              content: '你好，关于约拍的事情...',
              created_at: '2025-01-15T15:30:00Z'
            },
            unread_count: 2,
            updated_at: '2025-01-15T15:30:00Z'
          }
        ],
        message: '获取成功'
      }

      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: backendConversationData
        })
      })

      const { MessageService } = await import('../utils/api.js')
      const result = await MessageService.getConversations()

      expect(result.success).toBe(true)
      expect(result.data[0]).toEqual({
        id: 'conv123',
        participantId: 'user456', // participant_id -> participantId
        participant: {
          nickname: '用户B',
          avatar: 'https://example.com/avatar2.jpg' // avatar_url -> avatar
        },
        lastMessage: { // last_message -> lastMessage
          content: '你好，关于约拍的事情...',
          createdAt: '2025-01-15T15:30:00Z' // created_at -> createdAt
        },
        unreadCount: 2, // unread_count -> unreadCount
        updatedAt: '2025-01-15T15:30:00Z'
      })
    })
  })

  describe('分页数据同步验证', () => {
    test('分页参数和响应格式验证', async () => {
      wx.request.mockImplementation(({ data, success }) => {
        // 验证分页参数格式
        expect(data).toEqual({
          page: 2,
          limit: 10,
          category: 'portrait'
        })

        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              items: [],
              pagination: {
                page: 2,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: true
              }
            },
            message: '获取成功'
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.getList({
        page: 2,
        limit: 10,
        category: 'portrait'
      })

      expect(result.success).toBe(true)
      expect(result.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      })
    })
  })

  describe('错误响应数据同步验证', () => {
    test('标准错误响应格式处理', async () => {
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 400,
          data: {
            success: false,
            error: '参数验证失败',
            message: '标题不能为空',
            details: {
              field: 'title',
              code: 'REQUIRED'
            }
          }
        })
      })

      const { WorksService } = await import('../utils/api.js')
      const result = await WorksService.publish({ description: '只有描述' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('参数验证失败')
      expect(result.message).toBe('标题不能为空')
    })
  })
})

console.log('✅ 数据同步机制验证测试已创建')
console.log('🔧 测试覆盖范围:')
console.log('  - 用户数据格式转换验证')
console.log('  - 作品数据格式转换验证')
console.log('  - 约拍数据格式转换验证')
console.log('  - 消息数据格式转换验证')
console.log('  - 分页数据同步验证')
console.log('  - 错误响应格式验证')
