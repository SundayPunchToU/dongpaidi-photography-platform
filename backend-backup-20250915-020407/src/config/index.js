/**
 * 应用配置文件
 * 统一管理所有配置项，支持环境变量覆盖
 */

require('dotenv').config();

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // 管理员账户配置
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin@dongpaidi.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
    email: process.env.ADMIN_EMAIL || 'admin@dongpaidi.com'
  },

  // 安全配置
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'dongpaidi-secret-key',
    tokenExpiry: process.env.TOKEN_EXPIRY || '24h',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG === 'true',
    logDir: process.env.LOG_DIR || './logs'
  },

  // API配置
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
    timeout: parseInt(process.env.API_TIMEOUT) || 10000,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // 最大请求数
    }
  },

  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif').split(','),
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },

  // 数据库配置（为将来扩展准备）
  database: {
    type: process.env.DB_TYPE || 'memory', // memory, mysql, postgresql, mongodb
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'dongpaidi',
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  }
};

// 验证必要的配置项
function validateConfig() {
  const required = [
    'server.port',
    'admin.username',
    'admin.password'
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
}

// 导出配置和验证函数
module.exports = {
  ...config,
  validateConfig
};
