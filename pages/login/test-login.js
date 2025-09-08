// 多平台登录测试页面
import { simpleAuthService } from '../../utils/simple-auth.js'

Page({
  data: {
    platformInfo: {},
    testPhone: '13800138000',
    testCode: '',
    testResults: [],
    loading: false,
    currentUser: null,
    isLoggedIn: false
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.updateLoginStatus()
  },

  // 初始化页面
  initPage() {
    const platformInfo = simpleAuthService.getPlatformInfo()

    this.setData({
      platformInfo
    })

    this.updateLoginStatus()
  },

  // 更新登录状态
  updateLoginStatus() {
    const isLoggedIn = simpleAuthService.checkLoginStatus()
    const currentUser = simpleAuthService.getCurrentUser()

    this.setData({
      isLoggedIn,
      currentUser
    })
  },

  // 测试手机号输入
  onPhoneInput(e) {
    this.setData({
      testPhone: e.detail.value
    })
  },

  // 测试验证码输入
  onCodeInput(e) {
    this.setData({
      testCode: e.detail.value
    })
  },

  // 测试发送验证码
  async onTestSendCode() {
    const { testPhone } = this.data
    
    if (!testPhone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      
      const result = await simpleAuthService.sendVerificationCode(testPhone, 'login')
      
      if (result.success) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 测试手机号登录
  async onTestPhoneLogin() {
    const { testPhone, testCode } = this.data
    
    if (!testPhone || !testCode) {
      wx.showToast({
        title: '请输入手机号和验证码',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      
      const result = await simpleAuthService.loginWithPhone(testPhone, testCode)
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        this.updateLoginStatus()
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('手机号登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 测试微信登录
  async onTestWechatLogin() {
    try {
      this.setData({ loading: true })

      const result = await simpleAuthService.loginWithWechat()
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        this.updateLoginStatus()
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 测试游客登录
  async onTestGuestLogin() {
    try {
      this.setData({ loading: true })
      
      const result = await simpleAuthService.guestLogin()
      
      if (result.success) {
        wx.showToast({
          title: '游客登录成功',
          icon: 'success'
        })
        this.updateLoginStatus()
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('游客登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 测试登出
  onTestLogout() {
    try {
      simpleAuthService.logout()
      wx.showToast({
        title: '已登出',
        icon: 'success'
      })
      this.updateLoginStatus()
    } catch (error) {
      console.error('登出失败:', error)
      wx.showToast({
        title: '登出失败',
        icon: 'error'
      })
    }
  },

  // 运行简单测试
  async onRunTests() {
    try {
      this.setData({ loading: true })
      wx.showLoading({ title: '运行测试...' })

      // 简单的功能测试
      const results = await this.runSimpleTests()

      wx.hideLoading()
      this.setData({
        testResults: results,
        loading: false
      })

      const passedCount = results.filter(r => r.success).length
      const totalCount = results.length

      wx.showModal({
        title: '测试完成',
        content: `通过: ${passedCount}/${totalCount}\n成功率: ${((passedCount/totalCount)*100).toFixed(1)}%`,
        showCancel: false
      })

    } catch (error) {
      wx.hideLoading()
      console.error('测试运行失败:', error)
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  // 简单测试套件
  async runSimpleTests() {
    try {
      // 使用导入的测试函数
      const results = runSimpleTests()

      // 转换格式以匹配页面期望的结构
      return results.map(result => ({
        testName: result.test,
        success: result.success,
        message: result.message
      }))
    } catch (error) {
      return [{
        testName: '测试执行',
        success: false,
        message: error.message
      }]
    }
  },

  // 查看测试结果详情
  onViewTestResults() {
    const { testResults } = this.data
    
    if (testResults.length === 0) {
      wx.showToast({
        title: '请先运行测试',
        icon: 'none'
      })
      return
    }

    const failedTests = testResults.filter(r => !r.success)
    
    if (failedTests.length === 0) {
      wx.showModal({
        title: '测试结果',
        content: '所有测试都通过了！🎉',
        showCancel: false
      })
    } else {
      const failedList = failedTests.map(t => `${t.testName}: ${t.message}`).join('\n')
      wx.showModal({
        title: '失败的测试',
        content: failedList,
        showCancel: false
      })
    }
  },

  // 查看平台信息
  onViewPlatformInfo() {
    const { platformInfo } = this.data

    wx.showModal({
      title: '平台信息',
      content: `平台: ${platformInfo.platform}\n支持登录方式: ${platformInfo.supportedLoginMethods.join(', ')}\n微信小程序: ${platformInfo.isWechatMiniProgram}\n移动App: ${platformInfo.isMobileApp}`,
      showCancel: false
    })
  },

  // 返回登录页面
  onGoBack() {
    wx.navigateBack()
  }
})
