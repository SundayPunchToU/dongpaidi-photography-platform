// 多平台登录认证服务
import { supabase } from './supabase-client.js'
import { smsService } from './sms-service.js'
import { getEnvConfig, getPlatformConfig } from '../config/index.js'

class AuthService {
  constructor() {
    this.isLoggedIn = false
    this.userInfo = null
    this.currentPlatform = this.detectPlatform()
    this.envConfig = getEnvConfig()
    this.platformConfig = getPlatformConfig(this.currentPlatform)
    this.debugMode = this.envConfig.debugMode
    this.init()
  }

  // 检测当前运行平台
  detectPlatform() {
    // 微信小程序环境
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      return 'wechat'
    }

    // React Native环境检测（安全检查）
    try {
      if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
        // 可以通过Platform API进一步区分iOS和Android
        if (typeof Platform !== 'undefined') {
          return Platform.OS === 'ios' ? 'ios' : 'android'
        }
        return 'mobile' // 通用移动端
      }
    } catch (error) {
      console.warn('Platform detection error:', error)
    }

    // Web环境 - 简化处理
    return 'wechat'
  }

  // 初始化认证状态
  init() {
    const userInfo = this.getStorage('userInfo')
    const isLoggedIn = this.getStorage('isLoggedIn')

    if (userInfo && isLoggedIn) {
      this.userInfo = userInfo
      this.isLoggedIn = true
    }
  }

  // 平台无关的存储方法
  setStorage(key, value) {
    try {
      if (this.currentPlatform === 'wechat') {
        wx.setStorageSync(key, value)
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value))
      } else {
        // React Native AsyncStorage 或其他存储方案
        console.warn('存储方法未实现，请在具体平台中实现')
      }
    } catch (error) {
      console.error('存储失败:', error)
    }
  }

  getStorage(key) {
    try {
      if (this.currentPlatform === 'wechat') {
        return wx.getStorageSync(key)
      } else if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : null
      } else {
        console.warn('获取存储方法未实现，请在具体平台中实现')
        return null
      }
    } catch (error) {
      console.error('获取存储失败:', error)
      return null
    }
  }

  removeStorage(key) {
    try {
      if (this.currentPlatform === 'wechat') {
        wx.removeStorageSync(key)
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      } else {
        console.warn('删除存储方法未实现，请在具体平台中实现')
      }
    } catch (error) {
      console.error('删除存储失败:', error)
    }
  }

  // 统一登录入口 - 根据平台自动选择登录方式
  async login(options = {}) {
    const { method, phone, code, ...otherOptions } = options

    // 如果指定了登录方式，使用指定的方式
    if (method === 'phone') {
      return await this.loginWithPhone(phone, code)
    } else if (method === 'wechat') {
      return await this.loginWithWechat()
    }

    // 根据平台自动选择登录方式
    if (this.currentPlatform === 'wechat') {
      return await this.loginWithWechat()
    } else {
      // 移动端App默认使用手机号登录
      if (phone && code) {
        return await this.loginWithPhone(phone, code)
      } else {
        throw new Error('移动端需要提供手机号和验证码')
      }
    }
  }

  // 手机号验证码登录
  async loginWithPhone(phone, code) {
    try {
      console.log('📱 开始手机号验证码登录...', { phone, platform: this.currentPlatform })

      // 1. 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new Error('手机号格式不正确')
      }

      // 2. 验证验证码
      const verifyResult = await this.verifyCode(phone, code)
      if (!verifyResult.success) {
        throw new Error(verifyResult.message)
      }

      // 3. 查找或创建用户
      const userResult = await this.findOrCreateUserByPhone(phone)
      if (!userResult.success) {
        throw new Error(userResult.message)
      }

      // 4. 保存登录状态
      this.saveLoginState(userResult.user)

      console.log('✅ 手机号登录成功:', userResult.user.nickname)

      return {
        success: true,
        user: userResult.user,
        message: '登录成功',
        isNewUser: userResult.isNewUser
      }

    } catch (error) {
      console.error('❌ 手机号登录失败:', error)
      return {
        success: false,
        user: null,
        message: error.message || '登录失败'
      }
    }
  }

  // 微信登录主流程（真机环境优化）
  async loginWithWechat() {
    try {
      console.log('🔐 开始微信登录流程...')
      console.log('📱 运行环境:', wx.getSystemInfoSync())

      // 第一步：获取微信登录code
      console.log('📞 第一步：获取微信登录code...')
      const loginCode = await this.getWechatLoginCode()
      console.log('✅ 获取微信code成功:', loginCode)

      // 第二步：获取用户信息
      console.log('👤 第二步：获取用户信息...')
      const userProfile = await this.getUserProfile()
      console.log('✅ 获取用户信息成功:', {
        nickName: userProfile.nickName,
        avatarUrl: userProfile.avatarUrl ? '有头像' : '无头像',
        gender: userProfile.gender,
        city: userProfile.city,
        province: userProfile.province
      })

      // 第三步：生成用户标识（真机环境优化）
      console.log('🔑 第三步：生成用户标识...')
      const openid = await this.getOpenId(loginCode)
      console.log('✅ 用户标识生成成功:', openid)

      // 第四步：同步用户信息到Supabase
      console.log('💾 第四步：同步到数据库...')
      const user = await this.syncUserToSupabase(openid, userProfile)
      console.log('✅ 用户信息同步成功:', {
        id: user.id,
        nickname: user.nickname,
        openid: user.openid
      })

      // 第五步：保存登录状态
      console.log('💾 第五步：保存登录状态...')
      this.saveLoginState(user)

      return {
        success: true,
        user: user,
        message: '登录成功'
      }

    } catch (error) {
      console.error('❌ 微信登录失败:', error)
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      return {
        success: false,
        user: null,
        message: error.message || '登录失败'
      }
    }
  }

  // 获取微信登录code
  getWechatLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code)
          } else {
            reject(new Error('获取微信登录code失败'))
          }
        },
        fail: (error) => {
          reject(new Error(`微信登录失败: ${error.errMsg}`))
        }
      })
    })
  }

  // 获取用户信息（真机环境优化）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      // 真机环境下需要用户主动触发
      wx.getUserProfile({
        desc: '用于完善会员资料', // 更明确的用途说明
        lang: 'zh_CN', // 指定语言
        success: (res) => {
          console.log('✅ 获取用户信息成功:', res.userInfo)
          resolve(res.userInfo)
        },
        fail: (error) => {
          console.error('❌ 获取用户信息失败:', error)
          // 真机环境下用户可能拒绝授权
          if (error.errMsg.includes('deny') || error.errMsg.includes('cancel')) {
            reject(new Error('用户拒绝授权'))
          } else {
            reject(new Error(`获取用户信息失败: ${error.errMsg}`))
          }
        }
      })
    })
  }

  // 获取openid（真机环境优化）
  async getOpenId(code) {
    try {
      // 真机环境下的处理方案
      console.log('🔑 处理用户标识...')

      // 方案1：尝试使用设备信息生成唯一标识
      const systemInfo = wx.getSystemInfoSync()
      const deviceId = systemInfo.deviceId || systemInfo.system || 'unknown'

      // 方案2：结合时间戳和随机数生成稳定标识
      let storedOpenId = wx.getStorageSync('user_openid')

      if (!storedOpenId) {
        // 生成新的用户标识
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        const deviceHash = this.simpleHash(deviceId)
        storedOpenId = `user_${timestamp}_${deviceHash}_${random}`

        // 持久化存储
        wx.setStorageSync('user_openid', storedOpenId)
        console.log('✅ 生成新用户标识:', storedOpenId)
      } else {
        console.log('✅ 使用已存储的用户标识:', storedOpenId)
      }

      return storedOpenId

    } catch (error) {
      console.error('❌ 生成用户标识失败:', error)
      // 最后的备用方案
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // 简单哈希函数
  simpleHash(str) {
    let hash = 0
    if (str.length === 0) return hash.toString(36)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  // 发送验证码
  async sendVerificationCode(phone, type = 'login') {
    try {
      console.log('📤 发送验证码:', { phone, type, platform: this.currentPlatform })

      // 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new Error('手机号格式不正确')
      }

      // 从配置获取验证码长度和过期时间
      const codeLength = this.envConfig?.sms?.codeLength || 6
      const expireMinutes = this.envConfig?.sms?.expireTime || 5

      // 生成指定位数的数字验证码
      const code = Math.random().toString().slice(2, 2 + codeLength).padStart(codeLength, '0')

      // 设置过期时间
      const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000).toISOString()

      // 保存验证码到数据库
      const { error } = await supabase.insert('verification_codes', {
        phone,
        code,
        type,
        platform: this.currentPlatform,
        expires_at: expiresAt
      })

      if (error) {
        throw new Error(`保存验证码失败: ${error.message}`)
      }

      // 调用短信服务发送验证码
      const smsResult = await this.sendSMS(phone, code, type)
      if (!smsResult.success) {
        throw new Error(smsResult.message)
      }

      console.log('✅ 验证码发送成功')
      return {
        success: true,
        message: '验证码已发送'
      }

    } catch (error) {
      console.error('❌ 发送验证码失败:', error)
      return {
        success: false,
        message: error.message || '发送验证码失败'
      }
    }
  }

  // 验证验证码
  async verifyCode(phone, code, type = 'login') {
    try {
      console.log('🔍 验证验证码:', { phone, type })

      // 调用数据库函数验证
      const { data, error } = await supabase.rpc('verify_code', {
        p_phone: phone,
        p_code: code,
        p_type: type
      })

      if (error) {
        throw new Error(`验证失败: ${error.message}`)
      }

      const result = data[0]
      return {
        success: result.is_valid,
        message: result.message
      }

    } catch (error) {
      console.error('❌ 验证码验证失败:', error)
      return {
        success: false,
        message: error.message || '验证失败'
      }
    }
  }

  // 通过手机号查找或创建用户
  async findOrCreateUserByPhone(phone) {
    try {
      console.log('👤 查找或创建用户:', { phone, platform: this.currentPlatform })

      // 调用数据库函数
      const { data, error } = await supabase.rpc('find_or_create_user', {
        p_platform: this.currentPlatform,
        p_phone: phone,
        p_nickname: `用户${phone.slice(-4)}`
      })

      if (error) {
        throw new Error(`用户操作失败: ${error.message}`)
      }

      const result = data[0]
      return {
        success: true,
        user: result.user_data,
        isNewUser: result.is_new_user
      }

    } catch (error) {
      console.error('❌ 用户操作失败:', error)
      return {
        success: false,
        message: error.message || '用户操作失败'
      }
    }
  }

  // 发送短信（集成短信服务）
  async sendSMS(phone, code, type = 'login') {
    try {
      // 使用短信服务发送验证码
      return await smsService.sendVerificationCode(phone, code, type)
    } catch (error) {
      console.error('❌ 短信发送失败:', error)
      return {
        success: false,
        message: error.message || '短信发送失败'
      }
    }
  }

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 同步用户信息到Supabase（兼容旧版本）
  async syncUserToSupabase(openid, userProfile) {
    try {
      // 查找现有用户
      const { data: existingUsers } = await supabase.select('users', {
        eq: { openid: openid },
        select: '*'
      })

      if (existingUsers && existingUsers.length > 0) {
        // 用户已存在，更新最后活跃时间
        const user = existingUsers[0]
        await supabase.update('users', 
          { 
            last_active_at: new Date().toISOString(),
            nickname: userProfile.nickName, // 更新昵称
            avatar_url: userProfile.avatarUrl // 更新头像
          },
          { eq: { id: user.id } }
        )
        
        console.log('✅ 现有用户信息已更新')
        return user
      } else {
        // 创建新用户
        const newUserData = {
          openid: openid,
          nickname: userProfile.nickName,
          avatar_url: userProfile.avatarUrl,
          gender: this.mapWechatGender(userProfile.gender)
        }
        
        const result = await supabase.insert('users', newUserData)
        
        if (result.error) {
          throw new Error(`创建用户失败: ${result.error.message}`)
        }
        
        // 查询刚创建的用户
        const { data: newUsers } = await supabase.select('users', {
          eq: { openid: openid },
          select: '*'
        })
        
        console.log('✅ 新用户创建成功')
        return newUsers[0]
      }
    } catch (error) {
      throw new Error(`用户同步失败: ${error.message}`)
    }
  }

  // 映射微信性别
  mapWechatGender(gender) {
    switch (gender) {
      case 1: return 'male'
      case 2: return 'female'
      default: return 'other'
    }
  }

  // 保存登录状态
  saveLoginState(user) {
    this.userInfo = user
    this.isLoggedIn = true

    this.setStorage('userInfo', user)
    this.setStorage('isLoggedIn', true)
    this.setStorage('currentUserId', user.id)
    this.setStorage('currentPlatform', this.currentPlatform)

    console.log('✅ 登录状态已保存')
  }

  // 登出
  logout() {
    this.userInfo = null
    this.isLoggedIn = false

    this.removeStorage('userInfo')
    this.removeStorage('isLoggedIn')
    this.removeStorage('currentUserId')
    this.removeStorage('currentPlatform')

    console.log('✅ 已登出')

    // 平台特定的跳转逻辑
    if (this.currentPlatform === 'wechat') {
      wx.reLaunch({
        url: '/pages/discover/index'
      })
    } else {
      // 其他平台的跳转逻辑可以在这里实现
      console.log('请在具体平台中实现登出后的跳转逻辑')
    }
  }

  // 检查登录状态
  checkLoginStatus() {
    return this.isLoggedIn && this.userInfo
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.userInfo
  }

  // 强制登录检查（真机环境优化）
  async requireLogin() {
    if (!this.checkLoginStatus()) {
      const result = await this.showLoginModal()
      if (result.confirm) {
        // 真机环境下提供多种登录选择
        return await this.loginWithOptions()
      } else {
        throw new Error('用户取消登录')
      }
    }
    return { success: true, user: this.userInfo }
  }

  // 🎯 多平台登录选择
  async loginWithOptions() {
    if (this.currentPlatform === 'wechat') {
      // 微信小程序环境
      return new Promise((resolve) => {
        wx.showActionSheet({
          itemList: ['微信授权登录', '游客模式登录'],
          success: async (res) => {
            if (res.tapIndex === 0) {
              // 微信授权登录
              const result = await this.loginWithWechat()
              resolve(result)
            } else {
              // 游客模式登录
              const result = await this.guestLogin()
              resolve(result)
            }
          },
          fail: () => {
            resolve({ success: false, message: '用户取消登录' })
          }
        })
      })
    } else {
      // 移动端App环境 - 跳转到登录页面
      console.log('请跳转到登录页面进行手机号登录')
      return { success: false, message: '请使用手机号登录' }
    }
  }

  // 🎭 游客模式登录（备用方案）
  async guestLogin() {
    try {
      console.log('🎭 启用游客模式登录...')

      // 生成游客用户信息
      const guestOpenId = wx.getStorageSync('guest_openid') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      wx.setStorageSync('guest_openid', guestOpenId)

      // 从配置获取游客前缀
      const guestPrefix = this.envConfig?.login?.guestPrefix || '游客'

      const guestProfile = {
        nickName: `${guestPrefix}${guestOpenId.substr(-6)}`,
        avatarUrl: '/static/default-avatar.png',
        gender: 0,
        city: '未知',
        province: '未知'
      }

      console.log('👤 游客信息:', guestProfile)

      // 同步到Supabase
      const user = await this.syncUserToSupabase(guestOpenId, guestProfile)

      // 保存登录状态
      this.saveLoginState(user)

      return {
        success: true,
        user: user,
        message: '游客登录成功'
      }

    } catch (error) {
      console.error('❌ 游客登录失败:', error)
      return {
        success: false,
        user: null,
        message: '游客登录失败'
      }
    }
  }

  // 显示登录提示（多平台适配）
  showLoginModal() {
    if (this.currentPlatform === 'wechat') {
      return new Promise((resolve) => {
        wx.showModal({
          title: '需要登录',
          content: '登录后可发布作品、点赞评论，享受完整功能',
          confirmText: '立即登录',
          cancelText: '稍后再说',
          success: resolve
        })
      })
    } else {
      // 其他平台可以使用原生弹窗或自定义弹窗
      return Promise.resolve({ confirm: true })
    }
  }

  // 获取当前平台信息
  getPlatformInfo() {
    return {
      platform: this.currentPlatform,
      supportedLoginMethods: this.getSupportedLoginMethods(),
      isWechatMiniProgram: this.currentPlatform === 'wechat',
      isMobileApp: ['ios', 'android', 'mobile'].includes(this.currentPlatform)
    }
  }

  // 获取支持的登录方式
  getSupportedLoginMethods() {
    const methods = []

    if (this.currentPlatform === 'wechat') {
      methods.push('wechat', 'guest')
    } else {
      methods.push('phone', 'guest')
    }

    return methods
  }

  // 检查是否支持指定的登录方式
  supportsLoginMethod(method) {
    return this.getSupportedLoginMethods().includes(method)
  }
}

// 创建全局认证服务实例
export const authService = new AuthService()

// 导出便捷方法
export const {
  login,
  loginWithPhone,
  loginWithWechat,
  sendVerificationCode,
  logout,
  checkLoginStatus,
  getCurrentUser,
  requireLogin,
  getPlatformInfo,
  supportsLoginMethod
} = authService
