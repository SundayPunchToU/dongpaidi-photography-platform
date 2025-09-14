import dotenv from 'dotenv';
import path from 'path';

// 根据环境加载对应的配置文件
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 如果没有找到环境配置文件，则加载默认的.env文件
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

// 验证必需的环境变量
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL!,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'dongpaidi:',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
  },

  // 短信服务配置
  sms: {
    tencentSecretId: process.env.TENCENT_SECRET_ID || '',
    tencentSecretKey: process.env.TENCENT_SECRET_KEY || '',
    sdkAppId: process.env.SMS_SDK_APP_ID || '',
    signName: process.env.SMS_SIGN_NAME || '懂拍帝',
  },

  // 对象存储配置
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    region: process.env.COS_REGION || 'ap-beijing',
    bucket: process.env.COS_BUCKET || 'dongpaidi-images',
  },

  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    path: process.env.UPLOAD_PATH || './uploads',
    tempPath: path.join(process.cwd(), 'uploads', 'temp'),
  },

  // API配置
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP 15分钟内最多100个请求
    },
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
    maxFiles: 5,
    maxSize: '20m',
  },

  // 业务配置
  business: {
    // 验证码配置
    smsCode: {
      length: 6,
      expiresIn: 5 * 60 * 1000, // 5分钟
      maxAttempts: 3,
    },
    // 分页配置
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
    // 图片处理配置
    image: {
      thumbnailSizes: [150, 300, 600],
      quality: 80,
      format: 'webp',
    },
  },

  // 管理员配置
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@dongpaidi.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  },

  // SSL配置
  ssl: {
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },

  // 监控配置
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
  },
} as const;

/**
 * 验证配置项 - 从backend/迁移的功能
 * 确保所有必要的配置项都已设置
 */
export function validateConfig() {
  const required = [
    'server.port',
    'admin.email',
    'admin.password',
    'jwt.secret',
    'database.url'
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj: any, k) => obj && obj[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  // 验证端口号
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('Invalid server port number');
  }

  // 验证上传文件大小
  if (config.upload.maxSize < 1024) {
    throw new Error('Upload max size should be at least 1KB');
  }

  console.log('✅ Configuration validation passed');
}

export default config;
