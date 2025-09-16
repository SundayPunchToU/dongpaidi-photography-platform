/**
 * API集成测试 - 阶段2功能完整性验证
 * 验证前端API客户端与后端API的对接情况
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
  getAccountInfoSync: jest.fn(() => ({
    miniProgram: { envVersion: 'develop' }
  }))
}

describe('API集成测试 - 阶段2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('认证API对接测试', () => {
    test('微信登录API路径应该正确', async () => {
      const { authAPI } = await import('../utils/api-client.js')
      
      // 模拟成功响应
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              user: { id: '1', nickname: '测试用户' },
              tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
            },
            message: '登录成功'
          }
        })
      })

      const result = await authAPI.wechatLogin('code123', { nickname: '测试用户' })
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/auth/wechat/login'),
          method: 'POST',
          data: {
            code: 'code123',
            userInfo: { nickname: '测试用户' }
          }
        })
      )
      
      expect(result.success).toBe(true)
      expect(result.data.user.nickname).toBe('测试用户')
    })

    test('手机号登录API路径应该正确', async () => {
      const { authAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              user: { id: '1', phone: '13800138000' },
              tokens: { accessToken: 'token123', refreshToken: 'refresh123' }
            },
            message: '登录成功'
          }
        })
      })

      await authAPI.phoneLogin('13800138000', '123456')
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/auth/phone/login')
        })
      )
    })
  })

  describe('作品API对接测试', () => {
    test('获取作品列表API应该正确', async () => {
      const { worksAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              items: [{ id: '1', title: '测试作品' }],
              pagination: { page: 1, limit: 20, total: 1 }
            },
            message: '获取成功'
          }
        })
      })

      await worksAPI.getList({ page: 1, limit: 20 })
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/works'),
          method: 'GET'
        })
      )
    })

    test('获取热门作品API路径应该正确', async () => {
      const { worksAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: { success: true, data: [], message: '获取成功' }
        })
      })

      await worksAPI.getTrending()
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/works/trending')
        })
      )
    })
  })

  describe('约拍API对接测试', () => {
    test('获取约拍列表API应该正确', async () => {
      const { appointmentAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: [{ id: '1', title: '测试约拍' }],
            message: '获取成功'
          }
        })
      })

      await appointmentAPI.getList()
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/appointments'),
          method: 'GET'
        })
      )
    })

    test('获取我的约拍API路径应该正确', async () => {
      const { appointmentAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: { success: true, data: [], message: '获取成功' }
        })
      })

      await appointmentAPI.getMyPublished()
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/appointments/my/published')
        })
      )
    })
  })

  describe('用户API对接测试', () => {
    test('搜索用户API应该正确', async () => {
      const { userAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: [{ id: '1', nickname: '用户1' }],
            message: '搜索成功'
          }
        })
      })

      await userAPI.searchUsers({ keyword: '测试' })
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/users/search')
        })
      )
    })

    test('更新用户资料API路径应该正确', async () => {
      const { userAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: { success: true, data: {}, message: '更新成功' }
        })
      })

      await userAPI.updateProfile({ nickname: '新昵称' })
      
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/users/me/profile'),
          method: 'PUT'
        })
      )
    })
  })

  describe('响应格式处理测试', () => {
    test('应该正确处理后端ResponseUtil格式', async () => {
      const { authAPI } = await import('../utils/api-client.js')
      
      // 模拟后端标准响应格式
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: { user: { id: '1' }, tokens: { accessToken: 'token' } },
            message: '登录成功'
          }
        })
      })

      const result = await authAPI.wechatLogin('code', {})
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.message).toBe('登录成功')
    })

    test('应该正确处理错误响应', async () => {
      const { authAPI } = await import('../utils/api-client.js')
      
      wx.request.mockImplementation(({ success }) => {
        success({
          statusCode: 400,
          data: {
            success: false,
            error: '验证码错误',
            message: '登录失败'
          }
        })
      })

      const result = await authAPI.wechatLogin('invalid_code', {})
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('验证码错误')
    })
  })
})

console.log('✅ API集成测试已创建')
console.log('🔧 测试覆盖范围:')
console.log('  - 认证API路径验证')
console.log('  - 作品API路径验证')
console.log('  - 约拍API路径验证')
console.log('  - 用户API路径验证')
console.log('  - 响应格式处理验证')
