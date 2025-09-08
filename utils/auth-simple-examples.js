// 多平台认证系统简化使用示例（微信小程序兼容版）
import { authService } from './auth.js'

/**
 * 示例1: 检查登录状态
 */
export function checkLoginStatus() {
  try {
    const isLoggedIn = authService.checkLoginStatus()
    const currentUser = authService.getCurrentUser()
    const platformInfo = authService.getPlatformInfo()

    console.log('🔍 登录状态检查:', {
      isLoggedIn,
      user: currentUser,
      platform: platformInfo.platform
    })

    return {
      isLoggedIn,
      user: currentUser,
      platform: platformInfo.platform,
      supportedMethods: platformInfo.supportedLoginMethods
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
 * 示例2: 微信小程序快速登录
 */
export async function quickWechatLogin() {
  try {
    console.log('🚀 开始微信快速登录...')

    // 检查是否支持微信登录
    if (!authService.supportsLoginMethod('wechat')) {
      throw new Error('当前平台不支持微信登录')
    }

    // 检查是否已经登录
    if (authService.checkLoginStatus()) {
      const currentUser = authService.getCurrentUser()
      console.log('✅ 用户已登录:', currentUser.nickname)
      return { success: true, user: currentUser, alreadyLoggedIn: true }
    }

    // 执行微信登录
    const result = await authService.loginWithWechat()

    if (result.success) {
      console.log('✅ 微信登录成功:', result.user.nickname)
      
      // 显示欢迎消息
      if (typeof wx !== 'undefined') {
        wx.showToast({
          title: result.isNewUser ? '欢迎加入！' : '欢迎回来！',
          icon: 'success'
        })
      }
    }

    return result
  } catch (error) {
    console.error('❌ 微信登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例3: 手机号登录流程
 */
export async function phoneLoginFlow(phone, code) {
  try {
    console.log('📱 开始手机号登录流程...')

    // 检查是否支持手机号登录
    if (!authService.supportsLoginMethod('phone')) {
      throw new Error('当前平台不支持手机号登录')
    }

    // 验证手机号格式
    if (!authService.validatePhone(phone)) {
      throw new Error('手机号格式不正确')
    }

    // 如果没有验证码，发送验证码
    if (!code) {
      console.log('📤 发送验证码...')
      const sendResult = await authService.sendVerificationCode(phone, 'login')
      
      if (sendResult.success) {
        return {
          success: true,
          step: 'code_sent',
          message: '验证码已发送，请输入验证码'
        }
      } else {
        throw new Error(sendResult.message)
      }
    }

    // 使用手机号和验证码登录
    const result = await authService.loginWithPhone(phone, code)

    if (result.success) {
      console.log('✅ 手机号登录成功:', result.user.nickname)
      
      // 显示欢迎消息
      if (typeof wx !== 'undefined') {
        wx.showToast({
          title: result.isNewUser ? '注册成功！' : '登录成功！',
          icon: 'success'
        })
      }
    }

    return result
  } catch (error) {
    console.error('❌ 手机号登录失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例4: 游客模式登录
 */
export async function guestModeLogin() {
  try {
    console.log('👤 开始游客模式登录...')

    // 检查是否支持游客模式
    if (!authService.supportsLoginMethod('guest')) {
      throw new Error('当前平台不支持游客模式')
    }

    const result = await authService.guestLogin()

    if (result.success) {
      console.log('✅ 游客登录成功:', result.user.nickname)
      
      // 提示游客模式限制
      if (typeof wx !== 'undefined') {
        wx.showModal({
          title: '游客模式',
          content: '您正在使用游客模式，部分功能可能受限。建议注册账号以获得完整体验。',
          showCancel: false,
          confirmText: '知道了'
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
 * 示例5: 安全登出
 */
export function secureLogout() {
  try {
    console.log('🚪 开始登出...')

    const currentUser = authService.getCurrentUser()
    
    if (currentUser) {
      console.log('👋 用户登出:', currentUser.nickname)
    }

    // 执行登出
    authService.logout()

    // 显示登出成功消息
    if (typeof wx !== 'undefined') {
      wx.showToast({
        title: '已登出',
        icon: 'success'
      })
    }

    console.log('✅ 登出成功')
    return { success: true, message: '登出成功' }

  } catch (error) {
    console.error('❌ 登出失败:', error)
    return { success: false, message: error.message }
  }
}

/**
 * 示例6: 获取平台适配的登录选项
 */
export function getLoginOptions() {
  try {
    const platformInfo = authService.getPlatformInfo()
    const options = []

    // 微信登录选项
    if (platformInfo.supportedLoginMethods.includes('wechat')) {
      options.push({
        method: 'wechat',
        title: '微信登录',
        description: '使用微信账号快速登录',
        icon: 'logo-wechat',
        color: '#07c160',
        primary: true
      })
    }

    // 手机号登录选项
    if (platformInfo.supportedLoginMethods.includes('phone')) {
      options.push({
        method: 'phone',
        title: '手机号登录',
        description: '使用手机号验证码登录',
        icon: 'mobile',
        color: '#1890ff',
        primary: !platformInfo.isWechatMiniProgram
      })
    }

    // 游客模式选项
    if (platformInfo.supportedLoginMethods.includes('guest')) {
      options.push({
        method: 'guest',
        title: '游客模式',
        description: '快速体验，功能有限',
        icon: 'user',
        color: '#8c8c8c',
        primary: false
      })
    }

    return {
      platform: platformInfo.platform,
      isWechatMiniProgram: platformInfo.isWechatMiniProgram,
      isMobileApp: platformInfo.isMobileApp,
      options: options
    }
  } catch (error) {
    console.error('❌ 获取登录选项失败:', error)
    return {
      platform: 'unknown',
      options: []
    }
  }
}

/**
 * 示例7: 页面登录状态检查中间件
 */
export function requireLogin(showModal = true) {
  return new Promise((resolve, reject) => {
    try {
      const isLoggedIn = authService.checkLoginStatus()
      
      if (isLoggedIn) {
        const currentUser = authService.getCurrentUser()
        console.log('✅ 用户已登录，允许访问:', currentUser.nickname)
        resolve(currentUser)
        return
      }

      console.log('❌ 用户未登录，需要登录')

      if (showModal && typeof wx !== 'undefined') {
        wx.showModal({
          title: '需要登录',
          content: '请先登录以使用此功能',
          confirmText: '去登录',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              // 跳转到登录页面
              wx.navigateTo({
                url: '/pages/login/login'
              })
            }
            reject(new Error('用户未登录'))
          },
          fail: () => {
            reject(new Error('用户未登录'))
          }
        })
      } else {
        reject(new Error('用户未登录'))
      }
    } catch (error) {
      console.error('❌ 登录状态检查失败:', error)
      reject(error)
    }
  })
}

/**
 * 示例8: 简单的功能测试
 */
export function runSimpleTests() {
  const results = []

  try {
    // 测试平台检测
    const platformInfo = authService.getPlatformInfo()
    results.push({
      test: '平台检测',
      success: !!platformInfo.platform,
      message: `平台: ${platformInfo.platform}`
    })

    // 测试存储功能
    const testKey = 'test_storage_key'
    const testValue = 'test_value_' + Date.now()
    
    authService.setStorage(testKey, testValue)
    const retrievedValue = authService.getStorage(testKey)
    authService.removeStorage(testKey)
    
    results.push({
      test: '存储功能',
      success: retrievedValue === testValue,
      message: retrievedValue === testValue ? '存储功能正常' : '存储功能异常'
    })

    // 测试手机号验证
    const validPhone = authService.validatePhone('13800138000')
    const invalidPhone = authService.validatePhone('1234567890')
    
    results.push({
      test: '手机号验证',
      success: validPhone && !invalidPhone,
      message: validPhone && !invalidPhone ? '手机号验证正常' : '手机号验证异常'
    })

    // 测试登录方式检测
    const supportedMethods = authService.getSupportedLoginMethods()
    results.push({
      test: '登录方式检测',
      success: supportedMethods.length > 0,
      message: `支持: ${supportedMethods.join(', ')}`
    })

    console.log('🧪 简单测试完成:', results)
    return results

  } catch (error) {
    console.error('❌ 测试执行失败:', error)
    results.push({
      test: '测试执行',
      success: false,
      message: error.message
    })
    return results
  }
}
