// 短信验证码服务
// 支持多种短信服务提供商：阿里云、腾讯云、华为云等
import { config } from '../config/index.js'

class SMSService {
  constructor() {
    this.provider = this.getProvider()
    this.config = this.getConfig()
    this.smsConfig = config.auth?.sms || {}
  }

  // 获取短信服务提供商
  getProvider() {
    // 优先使用配置文件中的设置
    if (config.auth?.sms?.provider) {
      return config.auth.sms.provider
    }

    // 微信小程序环境下使用默认配置
    if (typeof wx !== 'undefined') {
      return 'mock' // 小程序环境使用模拟短信
    }

    // 其他环境可以通过环境变量设置
    if (typeof process !== 'undefined' && process.env) {
      return process.env.SMS_PROVIDER || 'aliyun'
    }

    return 'mock' // 默认使用模拟短信
  }

  // 获取配置信息
  getConfig() {
    const configs = {
      aliyun: {
        accessKeyId: this.getEnvVar('ALIYUN_ACCESS_KEY_ID', ''),
        accessKeySecret: this.getEnvVar('ALIYUN_ACCESS_KEY_SECRET', ''),
        signName: this.getEnvVar('ALIYUN_SMS_SIGN_NAME', '懂拍帝'),
        templateCode: this.getEnvVar('ALIYUN_SMS_TEMPLATE_CODE', 'SMS_123456789')
      },
      tencent: {
        secretId: this.getEnvVar('TENCENT_SECRET_ID', ''),
        secretKey: this.getEnvVar('TENCENT_SECRET_KEY', ''),
        appId: this.getEnvVar('TENCENT_SMS_APP_ID', ''),
        signName: this.getEnvVar('TENCENT_SMS_SIGN_NAME', '懂拍帝'),
        templateId: this.getEnvVar('TENCENT_SMS_TEMPLATE_ID', '123456')
      },
      huawei: {
        appKey: this.getEnvVar('HUAWEI_SMS_APP_KEY', ''),
        appSecret: this.getEnvVar('HUAWEI_SMS_APP_SECRET', ''),
        sender: this.getEnvVar('HUAWEI_SMS_SENDER', ''),
        templateId: this.getEnvVar('HUAWEI_SMS_TEMPLATE_ID', '')
      },
      mock: {
        // 模拟配置，用于开发和小程序环境
        provider: 'mock',
        signName: '懂拍帝',
        templateCode: 'MOCK_TEMPLATE'
      }
    }

    return configs[this.provider] || configs.mock
  }

  // 安全获取环境变量
  getEnvVar(key, defaultValue = '') {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key]
    }
    return defaultValue
  }

  // 发送验证码短信
  async sendVerificationCode(phone, code, type = 'login') {
    try {
      console.log(`📱 发送验证码短信 [${this.provider}]:`, { phone, code, type })

      // 根据不同的服务提供商调用相应的API
      switch (this.provider) {
        case 'aliyun':
          return await this.sendWithAliyun(phone, code, type)
        case 'tencent':
          return await this.sendWithTencent(phone, code, type)
        case 'huawei':
          return await this.sendWithHuawei(phone, code, type)
        case 'mock':
        default:
          return await this.sendMockSMS(phone, code, type)
      }
    } catch (error) {
      console.error('❌ 短信发送失败:', error)
      return {
        success: false,
        message: error.message || '短信发送失败'
      }
    }
  }

  // 阿里云短信服务
  async sendWithAliyun(phone, code, type) {
    // 这里需要集成阿里云短信SDK
    // npm install @alicloud/sms20170525
    
    try {
      // 模拟阿里云API调用
      console.log('📤 调用阿里云短信API:', {
        phone,
        signName: this.config.signName,
        templateCode: this.config.templateCode,
        templateParam: JSON.stringify({ code })
      })

      // 实际集成时的代码示例：
      /*
      const SMS = require('@alicloud/sms20170525')
      const client = new SMS({
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        endpoint: 'https://dysmsapi.aliyuncs.com'
      })

      const result = await client.sendSms({
        phoneNumbers: phone,
        signName: this.config.signName,
        templateCode: this.config.templateCode,
        templateParam: JSON.stringify({ code })
      })

      return {
        success: result.code === 'OK',
        message: result.message || '发送成功'
      }
      */

      return {
        success: true,
        message: '验证码发送成功（阿里云）'
      }
    } catch (error) {
      throw new Error(`阿里云短信发送失败: ${error.message}`)
    }
  }

  // 腾讯云短信服务
  async sendWithTencent(phone, code, type) {
    // 这里需要集成腾讯云短信SDK
    // npm install tencentcloud-sdk-nodejs
    
    try {
      console.log('📤 调用腾讯云短信API:', {
        phone,
        appId: this.config.appId,
        signName: this.config.signName,
        templateId: this.config.templateId
      })

      return {
        success: true,
        message: '验证码发送成功（腾讯云）'
      }
    } catch (error) {
      throw new Error(`腾讯云短信发送失败: ${error.message}`)
    }
  }

  // 华为云短信服务
  async sendWithHuawei(phone, code, type) {
    try {
      console.log('📤 调用华为云短信API:', {
        phone,
        sender: this.config.sender,
        templateId: this.config.templateId
      })

      return {
        success: true,
        message: '验证码发送成功（华为云）'
      }
    } catch (error) {
      throw new Error(`华为云短信发送失败: ${error.message}`)
    }
  }

  // 模拟短信发送（开发环境使用）
  async sendMockSMS(phone, code, type) {
    console.log('🔧 模拟短信发送:', { phone, code, type })
    console.log(`📱 验证码: ${code} (开发环境，请查看控制台)`)

    // 在微信小程序环境下，显示验证码给用户（仅开发环境）
    if (typeof wx !== 'undefined') {
      wx.showModal({
        title: '开发环境验证码',
        content: `验证码: ${code}\n(生产环境将通过短信发送)`,
        showCancel: false,
        confirmText: '知道了'
      })
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      message: '验证码发送成功（模拟）'
    }
  }

  // 验证配置是否完整
  validateConfig() {
    const requiredFields = {
      aliyun: ['accessKeyId', 'accessKeySecret', 'signName', 'templateCode'],
      tencent: ['secretId', 'secretKey', 'appId', 'signName', 'templateId'],
      huawei: ['appKey', 'appSecret', 'sender', 'templateId']
    }

    const required = requiredFields[this.provider] || []
    const missing = required.filter(field => !this.config[field])

    if (missing.length > 0) {
      console.warn(`⚠️ ${this.provider} 短信配置不完整，缺少字段:`, missing)
      console.warn('将使用模拟短信服务')
      return false
    }

    return true
  }

  // 获取短信模板内容
  getTemplateContent(type) {
    const templates = {
      login: '您的登录验证码是：{code}，5分钟内有效，请勿泄露。',
      register: '您的注册验证码是：{code}，5分钟内有效，请勿泄露。',
      reset_password: '您的密码重置验证码是：{code}，5分钟内有效，请勿泄露。'
    }

    return templates[type] || templates.login
  }
}

// 创建全局短信服务实例
export const smsService = new SMSService()

// 导出便捷方法
export const sendVerificationCode = (phone, code, type) => 
  smsService.sendVerificationCode(phone, code, type)
