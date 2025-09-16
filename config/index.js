/** 应用配置 */
export const config = {
  // API配置 - 根据环境自动判断是否使用Mock
  useMock: (() => {
    // 在微信小程序中判断环境
    if (typeof wx !== 'undefined') {
      const accountInfo = wx.getAccountInfoSync()
      const isDev = accountInfo.miniProgram.envVersion === 'develop'
      // 只有在开发环境且明确启用Mock时才使用
      return isDev && (typeof process !== 'undefined' && process.env.ENABLE_MOCK === 'true')
    }
    // 其他环境默认不使用Mock
    return false
  })(),

  // 多平台登录配置
  auth: {
    // 开发环境配置
    development: {
      enableTestMode: true, // 启用测试模式
      showTestEntry: true,  // 显示测试入口
      mockSMS: true,        // 使用模拟短信服务
      debugMode: true       // 启用调试模式
    },

    // 生产环境配置
    production: {
      enableTestMode: false,
      showTestEntry: false,
      mockSMS: false,
      debugMode: false
    },

    // 短信服务配置
    sms: {
      provider: 'mock',     // 短信服务提供商: mock, aliyun, tencent, huawei
      codeLength: 6,        // 验证码长度
      expireTime: 5,        // 验证码过期时间(分钟)
      maxAttempts: 5        // 最大验证尝试次数
    },

    // 登录配置
    login: {
      guestPrefix: '游客',  // 游客用户昵称前缀
      autoLogin: true,      // 是否自动登录
      rememberLogin: true   // 是否记住登录状态
    }
  },

  // 平台特定配置
  platform: {
    wechat: {
      enableWechatLogin: true,
      enableGuestMode: true
    },
    mobile: {
      enablePhoneLogin: true,
      enableGuestMode: true,
      requirePhoneVerification: true
    },
    web: {
      enablePhoneLogin: true,
      enableEmailLogin: false,
      enableGuestMode: true
    }
  }
};

// 获取当前环境配置
export function getEnvConfig() {
  // 在微信小程序中判断是否为开发环境
  if (typeof wx !== 'undefined') {
    const accountInfo = wx.getAccountInfoSync();
    const isDev = accountInfo.miniProgram.envVersion === 'develop';
    return isDev ? config.auth.development : config.auth.production;
  }

  // 其他环境的判断逻辑
  return config.auth.development; // 默认开发环境
}

// 获取平台配置
export function getPlatformConfig(platform) {
  return config.platform[platform] || config.platform.mobile;
}

export default { config, getEnvConfig, getPlatformConfig };
