// 多平台认证系统使用示例
import { authService } from './auth.js'

/**
 * 示例1: 自动检测平台并选择合适的登录方式
 */
export async function autoLogin() {
  try {
    console.log('🚀 开始自动登录...')
    
    // 检查是否已经登录
    if (authService.checkLoginStatus()) {
      console.log('✅ 用户已登录:', authService.getCurrentUser().nickname)
      return { success: true, user: authService.getCurrentUser() }
    }

    // 获取平台信息
    const platformInfo = authService.getPlatformInfo()
    console.log('🔍 平台信息:', platformInfo)

    // 根据平台自动选择登录方式
    if (platformInfo.isWechatMiniProgram) {
      // 微信小程序环境，使用微信登录
      return await authService.loginWithWechat()
    } else if (platformInfo.isMobileApp) {
      // 移动App环境，提示用户使用手机号登录
      console.log('📱 请使用手机号登录')
      return { success: false, message: '请使用手机号登录' }
    } else {
      // 其他环境，使用游客模式
      return await authService.guestLogin()
    }
  } catch (error) {
    console.error('❌ 自动登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例2: 手机号验证码登录完整流程
 */
export async function phoneLoginFlow(phone) {
  try {
    console.log('📱 开始手机号登录流程...')

    // 1. 验证手机号格式
    if (!authService.validatePhone(phone)) {
      throw new Error('手机号格式不正确')
    }

    // 2. 发送验证码
    console.log('📤 发送验证码...')
    const sendResult = await authService.sendVerificationCode(phone, 'login')
    
    if (!sendResult.success) {
      throw new Error(sendResult.message)
    }

    console.log('✅ 验证码发送成功')
    
    // 3. 返回发送成功状态，等待用户输入验证码
    return {
      success: true,
      step: 'code_sent',
      message: '验证码已发送，请输入验证码',
      phone: phone
    }

  } catch (error) {
    console.error('❌ 手机号登录流程失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例3: 验证码验证和登录
 */
export async function verifyCodeAndLogin(phone, code) {
  try {
    console.log('🔑 验证验证码并登录...')

    // 使用手机号和验证码登录
    const result = await authService.loginWithPhone(phone, code)

    if (result.success) {
      console.log('✅ 登录成功:', result.user.nickname)
      
      // 触发登录成功事件
      const app = getApp()
      if (app && app.eventBus) {
        app.eventBus.emit('login-success', result.user)
      }
    }

    return result
  } catch (error) {
    console.error('❌ 验证码登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例4: 微信登录（仅限微信小程序）
 */
export async function wechatLoginFlow() {
  try {
    console.log('🔐 开始微信登录流程...')

    // 检查是否支持微信登录
    if (!authService.supportsLoginMethod('wechat')) {
      throw new Error('当前平台不支持微信登录')
    }

    // 执行微信登录
    const result = await authService.loginWithWechat()

    if (result.success) {
      console.log('✅ 微信登录成功:', result.user.nickname)
      
      // 触发登录成功事件
      const app = getApp()
      if (app && app.eventBus) {
        app.eventBus.emit('login-success', result.user)
      }
    }

    return result
  } catch (error) {
    console.error('❌ 微信登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例5: 游客模式登录
 */
export async function guestLoginFlow() {
  try {
    console.log('👤 开始游客登录流程...')

    const result = await authService.guestLogin()

    if (result.success) {
      console.log('✅ 游客登录成功:', result.user.nickname)
      
      // 提示用户游客模式的限制
      if (typeof wx !== 'undefined') {
        wx.showModal({
          title: '游客模式',
          content: '您正在使用游客模式，部分功能可能受限。建议注册账号以获得完整体验。',
          showCancel: false
        })
      }
    }

    return result
  } catch (error) {
    console.error('❌ 游客登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例6: 统一登录入口（推荐使用）
 */
export async function unifiedLogin(options = {}) {
  try {
    console.log('🎯 统一登录入口...')

    const { method, phone, code, autoDetect = true } = options

    // 检查是否已经登录
    if (authService.checkLoginStatus()) {
      return { success: true, user: authService.getCurrentUser(), alreadyLoggedIn: true }
    }

    // 如果指定了登录方式，直接使用
    if (method) {
      switch (method) {
        case 'wechat':
          return await wechatLoginFlow()
        case 'phone':
          if (phone && code) {
            return await verifyCodeAndLogin(phone, code)
          } else if (phone) {
            return await phoneLoginFlow(phone)
          } else {
            throw new Error('手机号登录需要提供手机号')
          }
        case 'guest':
          return await guestLoginFlow()
        default:
          throw new Error(`不支持的登录方式: ${method}`)
      }
    }

    // 自动检测平台并选择登录方式
    if (autoDetect) {
      return await autoLogin()
    }

    throw new Error('请指定登录方式或启用自动检测')

  } catch (error) {
    console.error('❌ 统一登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例7: 登录状态检查和自动刷新
 */
export function checkLoginStatusWithRefresh() {
  try {
    console.log('🔍 检查登录状态...')

    const isLoggedIn = authService.checkLoginStatus()
    const currentUser = authService.getCurrentUser()

    if (isLoggedIn && currentUser) {
      console.log('✅ 用户已登录:', currentUser.nickname)
      
      // 更新最后活跃时间（如果需要）
      // 这里可以调用API更新用户的最后活跃时间
      
      return {
        isLoggedIn: true,
        user: currentUser,
        platform: authService.currentPlatform
      }
    } else {
      console.log('❌ 用户未登录')
      return {
        isLoggedIn: false,
        user: null,
        platform: authService.currentPlatform
      }
    }
  } catch (error) {
    console.error('❌ 登录状态检查失败:', error)
    return {
      isLoggedIn: false,
      user: null,
      error: error.message
    }
  }
}

/**
 * 示例8: 安全登出
 */
export async function secureLogout() {
  try {
    console.log('🚪 开始安全登出...')

    const currentUser = authService.getCurrentUser()
    
    if (currentUser) {
      console.log('👋 用户登出:', currentUser.nickname)
      
      // 可以在这里调用API通知服务器用户登出
      // await api.logout(currentUser.id)
      
      // 触发登出事件
      const app = getApp()
      if (app && app.eventBus) {
        app.eventBus.emit('logout', currentUser)
      }
    }

    // 执行登出
    authService.logout()

    console.log('✅ 登出成功')
    return { success: true, message: '登出成功' }

  } catch (error) {
    console.error('❌ 登出失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例9: 获取平台特定的登录选项
 */
export function getLoginOptions() {
  const platformInfo = authService.getPlatformInfo()
  
  const options = []

  if (platformInfo.supportedLoginMethods.includes('wechat')) {
    options.push({
      method: 'wechat',
      title: '微信登录',
      description: '使用微信账号快速登录',
      icon: 'wechat',
      primary: true
    })
  }

  if (platformInfo.supportedLoginMethods.includes('phone')) {
    options.push({
      method: 'phone',
      title: '手机号登录',
      description: '使用手机号验证码登录',
      icon: 'phone',
      primary: !platformInfo.isWechatMiniProgram
    })
  }

  if (platformInfo.supportedLoginMethods.includes('guest')) {
    options.push({
      method: 'guest',
      title: '游客模式',
      description: '快速体验，功能有限',
      icon: 'user',
      primary: false
    })
  }

  return {
    platform: platformInfo.platform,
    options: options
  }
}
