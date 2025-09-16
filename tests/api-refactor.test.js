/**
 * API重构验证测试
 * 验证新的API客户端和服务类是否正常工作
 */

// 模拟微信小程序环境
global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showToast: jest.fn(),
  request: jest.fn(),
  login: jest.fn(),
  getUserProfile: jest.fn(),
  chooseImage: jest.fn(),
  reLaunch: jest.fn(),
  getAccountInfoSync: jest.fn(() => ({
    miniProgram: { envVersion: 'develop' }
  }))
}

// 模拟环境变量
process.env.ENABLE_MOCK = 'false'

describe('API重构验证测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('API客户端基础功能', () => {
    test('应该能够正确导入API客户端', async () => {
      const { apiClient } = await import('../utils/api-client.js')
      expect(apiClient).toBeDefined()
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
      expect(typeof apiClient.put).toBe('function')
      expect(typeof apiClient.delete).toBe('function')
    })

    test('应该能够正确导入业务API', async () => {
      const { 
        authAPI, 
        userAPI, 
        worksAPI, 
        appointmentAPI, 
        messageAPI, 
        uploadAPI, 
        socialAPI 
      } = await import('../utils/api-client.js')
      
      expect(authAPI).toBeDefined()
      expect(userAPI).toBeDefined()
      expect(worksAPI).toBeDefined()
      expect(appointmentAPI).toBeDefined()
      expect(messageAPI).toBeDefined()
      expect(uploadAPI).toBeDefined()
      expect(socialAPI).toBeDefined()
    })
  })

  describe('服务类功能验证', () => {
    test('应该能够正确导入所有服务类', async () => {
      const {
        UserService,
        WorksService,
        SocialService,
        AppointmentService,
        FileService,
        MessageService
      } = await import('../utils/api.js')
      
      expect(UserService).toBeDefined()
      expect(WorksService).toBeDefined()
      expect(SocialService).toBeDefined()
      expect(AppointmentService).toBeDefined()
      expect(FileService).toBeDefined()
      expect(MessageService).toBeDefined()
    })

    test('UserService应该有正确的方法', async () => {
      const { UserService } = await import('../utils/api.js')
      
      expect(typeof UserService.login).toBe('function')
      expect(typeof UserService.loginWithPhone).toBe('function')
      expect(typeof UserService.updateProfile).toBe('function')
      expect(typeof UserService.getCurrentUser).toBe('function')
      expect(typeof UserService.logout).toBe('function')
      expect(typeof UserService.checkLoginStatus).toBe('function')
      expect(typeof UserService.refreshToken).toBe('function')
    })

    test('WorksService应该有正确的方法', async () => {
      const { WorksService } = await import('../utils/api.js')
      
      expect(typeof WorksService.publish).toBe('function')
      expect(typeof WorksService.getList).toBe('function')
      expect(typeof WorksService.getDetail).toBe('function')
      expect(typeof WorksService.toggleLike).toBe('function')
      expect(typeof WorksService.toggleCollection).toBe('function')
      expect(typeof WorksService.getCommentList).toBe('function')
      expect(typeof WorksService.addComment).toBe('function')
    })
  })

  describe('环境配置验证', () => {
    test('生产环境应该禁用Mock数据', async () => {
      const { config } = await import('../config/index.js')
      
      // 在测试环境中，Mock应该被禁用
      expect(config.useMock).toBe(false)
    })
  })

  describe('认证服务验证', () => {
    test('SimpleAuthService应该正确初始化', async () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'userInfo') return null
        if (key === 'isLoggedIn') return false
        if (key === 'access_token') return null
        return null
      })

      const { default: SimpleAuthService } = await import('../utils/simple-auth.js')
      const authService = new SimpleAuthService()
      
      expect(authService.isAuthenticated()).toBe(false)
      expect(authService.getUserInfo()).toBe(null)
    })

    test('SimpleAuthService应该有正确的方法', async () => {
      const { default: SimpleAuthService } = await import('../utils/simple-auth.js')
      const authService = new SimpleAuthService()
      
      expect(typeof authService.loginWithWechat).toBe('function')
      expect(typeof authService.loginWithPhone).toBe('function')
      expect(typeof authService.login).toBe('function')
      expect(typeof authService.logout).toBe('function')
      expect(typeof authService.checkLoginStatus).toBe('function')
      expect(typeof authService.getCurrentUser).toBe('function')
    })
  })

  describe('错误处理验证', () => {
    test('应该能够正确导入错误处理函数', async () => {
      const { handleApiError } = await import('../utils/api.js')
      expect(typeof handleApiError).toBe('function')
    })

    test('错误处理函数应该正确工作', async () => {
      const { handleApiError } = await import('../utils/api.js')
      
      const networkError = { message: 'network error' }
      const result = handleApiError(networkError)
      
      expect(result).toBe('网络连接失败')
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '网络连接失败',
        icon: 'error',
        duration: 2000
      })
    })
  })
})

console.log('✅ API重构验证测试已创建')
console.log('📝 测试覆盖范围:')
console.log('  - API客户端基础功能')
console.log('  - 业务API导入验证')
console.log('  - 服务类方法验证')
console.log('  - 环境配置验证')
console.log('  - 认证服务验证')
console.log('  - 错误处理验证')
