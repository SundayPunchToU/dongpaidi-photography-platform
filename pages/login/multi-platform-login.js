// 多平台登录页面逻辑
import { authService } from '../../utils/auth.js'

Page({
  data: {
    // 平台信息
    platformInfo: {},
    
    // 登录方式
    loginMethod: 'auto', // auto, wechat, phone, guest
    
    // 手机号登录相关
    phone: '',
    verificationCode: '',
    sendCodeText: '发送验证码',
    sendCodeDisabled: false,
    countdown: 0,
    
    // UI状态
    loading: false,
    agreementChecked: false,
    
    // 表单验证
    phoneError: '',
    codeError: ''
  },

  onLoad(options) {
    // 获取平台信息
    const platformInfo = authService.getPlatformInfo()
    console.log('🔍 平台信息:', platformInfo)
    
    // 根据平台设置默认登录方式
    let defaultMethod = 'auto'
    if (platformInfo.isWechatMiniProgram) {
      defaultMethod = 'wechat'
    } else if (platformInfo.isMobileApp) {
      defaultMethod = 'phone'
    }
    
    this.setData({
      platformInfo,
      loginMethod: options.method || defaultMethod
    })
  },

  // 切换登录方式
  onLoginMethodChange(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      loginMethod: method,
      phoneError: '',
      codeError: ''
    })
  },

  // 手机号输入
  onPhoneInput(e) {
    const phone = e.detail.value
    this.setData({
      phone,
      phoneError: this.validatePhone(phone) ? '' : '手机号格式不正确'
    })
  },

  // 验证码输入
  onCodeInput(e) {
    const code = e.detail.value
    this.setData({
      verificationCode: code,
      codeError: code.length === 6 ? '' : '请输入6位验证码'
    })
  },

  // 发送验证码
  async onSendCode() {
    if (this.data.sendCodeDisabled) return
    
    const { phone } = this.data
    if (!this.validatePhone(phone)) {
      this.setData({ phoneError: '请输入正确的手机号' })
      return
    }

    try {
      this.setData({ loading: true })
      
      const result = await authService.sendVerificationCode(phone, 'login')
      
      if (result.success) {
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        })
        
        // 开始倒计时
        this.startCountdown()
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 开始倒计时
  startCountdown() {
    let countdown = 60
    this.setData({
      countdown,
      sendCodeDisabled: true,
      sendCodeText: `${countdown}秒后重发`
    })

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          countdown: 0,
          sendCodeDisabled: false,
          sendCodeText: '发送验证码'
        })
      } else {
        this.setData({
          countdown,
          sendCodeText: `${countdown}秒后重发`
        })
      }
    }, 1000)
  },

  // 协议勾选
  onAgreementChange(e) {
    this.setData({
      agreementChecked: e.detail.value.length > 0
    })
  },

  // 执行登录
  async onLogin() {
    if (!this.data.agreementChecked) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      })
      return
    }

    const { loginMethod } = this.data

    try {
      this.setData({ loading: true })
      let result

      switch (loginMethod) {
        case 'wechat':
          result = await this.loginWithWechat()
          break
        case 'phone':
          result = await this.loginWithPhone()
          break
        case 'guest':
          result = await this.loginWithGuest()
          break
        default:
          result = await authService.login()
      }

      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 登录成功后的跳转逻辑
        setTimeout(() => {
          this.handleLoginSuccess(result)
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录
  async loginWithWechat() {
    return await authService.loginWithWechat()
  },

  // 手机号登录
  async loginWithPhone() {
    const { phone, verificationCode } = this.data

    if (!this.validatePhone(phone)) {
      this.setData({ phoneError: '请输入正确的手机号' })
      return { success: false, message: '手机号格式不正确' }
    }

    if (!verificationCode || verificationCode.length !== 6) {
      this.setData({ codeError: '请输入6位验证码' })
      return { success: false, message: '验证码格式不正确' }
    }

    return await authService.loginWithPhone(phone, verificationCode)
  },

  // 游客登录
  async loginWithGuest() {
    return await authService.guestLogin()
  },

  // 处理登录成功
  handleLoginSuccess(result) {
    const pages = getCurrentPages()
    
    if (pages.length > 1) {
      // 从其他页面跳转过来的，返回上一页
      wx.navigateBack()
    } else {
      // 直接打开登录页，跳转到首页
      wx.switchTab({
        url: '/pages/discover/index'
      })
    }

    // 触发全局登录成功事件
    const app = getApp()
    if (app.eventBus) {
      app.eventBus.emit('login-success', result.user)
    }
  },

  // 验证手机号
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },

  // 查看用户协议
  onViewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index'
    })
  },

  // 查看隐私政策
  onViewPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/index'
    })
  }
})
