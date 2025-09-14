// 环境配置加载器
// 安全地加载环境配置，支持开发和生产环境

let envConfig = null;

// 尝试加载本地环境配置
try {
  // 首先尝试加载本地配置文件
  const localEnv = require('./env.js');
  envConfig = localEnv.ENV_CONFIG;
  console.log('✅ 已加载本地环境配置');
} catch (error) {
  console.warn('⚠️ 未找到本地环境配置文件，使用默认配置');
  
  // 如果没有本地配置，使用开发环境默认配置
  envConfig = {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'demo-key',
    API_BASE_URL: '',
    WECHAT_APP_ID: '',
    WECHAT_APP_SECRET: '',
    SMS_ACCESS_KEY_ID: '',
    SMS_ACCESS_KEY_SECRET: '',
    SMS_SIGN_NAME: '懂拍帝',
    SMS_TEMPLATE_CODE: '',
    JWT_SECRET: 'dev-secret',
    ENCRYPTION_KEY: 'dev-key'
  };
}

// 环境检测
function getEnvironment() {
  if (typeof wx !== 'undefined') {
    try {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo.miniProgram.envVersion || 'develop';
    } catch (error) {
      return 'develop';
    }
  }
  return 'develop';
}

// 获取配置
export function getConfig(key) {
  if (!envConfig) {
    throw new Error('环境配置未初始化');
  }
  
  if (key) {
    return envConfig[key];
  }
  
  return envConfig;
}

// 检查配置完整性
export function validateConfig() {
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missingKeys = requiredKeys.filter(key => !envConfig[key]);
  
  if (missingKeys.length > 0) {
    console.warn('⚠️ 缺少必要的配置项:', missingKeys);
    return false;
  }
  
  return true;
}

// 获取当前环境
export function getCurrentEnvironment() {
  return getEnvironment();
}

// 是否为开发环境
export function isDevelopment() {
  return getEnvironment() === 'develop';
}

// 是否为生产环境
export function isProduction() {
  return getEnvironment() === 'release';
}

export default {
  getConfig,
  validateConfig,
  getCurrentEnvironment,
  isDevelopment,
  isProduction
};
