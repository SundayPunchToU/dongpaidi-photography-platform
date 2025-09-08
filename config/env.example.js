// 环境配置示例文件
// 复制此文件为 env.js 并填入真实的配置信息
// 注意：env.js 文件不会被提交到版本控制系统

export const ENV_CONFIG = {
  // Supabase 配置
  SUPABASE_URL: 'your-supabase-url-here',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
  
  // 微信小程序配置
  WECHAT_APP_ID: 'your-wechat-app-id',
  WECHAT_APP_SECRET: 'your-wechat-app-secret',
  
  // 短信服务配置
  SMS_ACCESS_KEY_ID: 'your-sms-access-key-id',
  SMS_ACCESS_KEY_SECRET: 'your-sms-access-key-secret',
  SMS_SIGN_NAME: '懂拍帝',
  SMS_TEMPLATE_CODE: 'your-sms-template-code',
  
  // API 配置
  API_BASE_URL: 'https://your-api-domain.com',
  
  // 其他敏感配置
  JWT_SECRET: 'your-jwt-secret',
  ENCRYPTION_KEY: 'your-encryption-key'
};

// 开发环境默认配置
export const DEV_CONFIG = {
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_ANON_KEY: 'demo-key',
  API_BASE_URL: 'http://localhost:3000',
  // 其他开发环境配置...
};
