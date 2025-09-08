import { config } from './index';

/**
 * 安全配置
 */
export const securityConfig = {
  // 密码策略
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    saltRounds: 12,
  },

  // JWT安全配置
  jwt: {
    algorithm: 'HS256' as const,
    issuer: 'dongpaidi-api',
    audience: 'dongpaidi-client',
    clockTolerance: 30, // 30秒时钟偏差容忍
    maxAge: '15m', // 访问令牌最大有效期
    refreshMaxAge: '7d', // 刷新令牌最大有效期
    blacklistEnabled: true,
  },

  // 会话安全
  session: {
    maxConcurrentSessions: 5, // 每个用户最大并发会话数
    sessionTimeout: 30 * 60 * 1000, // 30分钟无活动超时
    renewThreshold: 5 * 60 * 1000, // 5分钟内自动续期
    ipBinding: true, // IP绑定
    userAgentBinding: true, // User-Agent绑定
  },

  // 速率限制
  rateLimit: {
    // 全局限制
    global: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 每个IP最多1000个请求
      message: 'Too many requests from this IP',
    },
    // 登录限制
    auth: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 10, // 每个IP最多10次登录尝试
      skipSuccessfulRequests: true,
    },
    // API限制
    api: {
      windowMs: 1 * 60 * 1000, // 1分钟
      max: 100, // 每个用户最多100个API请求
    },
    // 文件上传限制
    upload: {
      windowMs: 60 * 60 * 1000, // 1小时
      max: 50, // 每个用户最多50次上传
    },
  },

  // 输入验证
  validation: {
    // 字符串长度限制
    maxStringLength: 10000,
    maxArrayLength: 1000,
    maxObjectDepth: 10,
    // 文件上传限制
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    // SQL注入防护
    sqlInjectionPatterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i,
    ],
    // XSS防护
    xssPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ],
  },

  // CORS配置
  cors: {
    origin: config.server.isDevelopment 
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
      : process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24小时预检缓存
  },

  // 安全头配置
  headers: {
    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HSTS
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true,
    },
    // 其他安全头
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
  },

  // 加密配置
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    iterations: 100000, // PBKDF2迭代次数
  },

  // 审计日志
  audit: {
    enabled: true,
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
    ],
    logLevel: 'info',
    retention: 90, // 保留90天
  },

  // IP白名单/黑名单
  ipFilter: {
    enabled: false,
    whitelist: [],
    blacklist: [],
    trustProxy: true,
  },

  // API密钥管理
  apiKey: {
    enabled: false,
    headerName: 'X-API-Key',
    queryParam: 'api_key',
    length: 32,
    prefix: 'dpd_',
  },

  // 数据脱敏
  dataMasking: {
    enabled: true,
    patterns: {
      phone: /(\d{3})\d{4}(\d{4})/,
      email: /(.{2}).*@(.*)\.(.{2,})/,
      idCard: /(\d{4})\d{10}(\d{4})/,
      bankCard: /(\d{4})\d{8,12}(\d{4})/,
    },
    replacement: {
      phone: '$1****$2',
      email: '$1***@$2.$3',
      idCard: '$1**********$2',
      bankCard: '$1********$2',
    },
  },

  // 威胁检测
  threatDetection: {
    enabled: true,
    // 异常登录检测
    anomalyDetection: {
      enabled: true,
      maxLocationChanges: 3, // 24小时内最多3次地理位置变化
      maxDeviceChanges: 5, // 24小时内最多5次设备变化
      suspiciousPatterns: [
        /bot|crawler|spider/i, // 爬虫检测
        /curl|wget|postman/i, // 工具检测
      ],
    },
    // 暴力破解检测
    bruteForceDetection: {
      enabled: true,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15分钟
      blockDuration: 60 * 60 * 1000, // 1小时
    },
  },

  // 数据备份和恢复
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // 每天凌晨2点
    retention: 30, // 保留30天
    encryption: true,
    compression: true,
  },

  // 安全事件通知
  notification: {
    enabled: true,
    channels: ['email', 'webhook'],
    events: [
      'login_failure',
      'suspicious_activity',
      'data_breach',
      'system_error',
    ],
    recipients: process.env.SECURITY_ALERT_EMAILS?.split(',') || [],
    webhook: process.env.SECURITY_WEBHOOK_URL,
  },
} as const;

/**
 * 获取环境特定的安全配置
 */
export function getSecurityConfig() {
  const env = config.server.env;
  
  // 生产环境加强安全配置
  if (env === 'production') {
    return {
      ...securityConfig,
      jwt: {
        ...securityConfig.jwt,
        maxAge: '5m', // 生产环境缩短访问令牌有效期
      },
      session: {
        ...securityConfig.session,
        sessionTimeout: 15 * 60 * 1000, // 15分钟超时
        ipBinding: true,
        userAgentBinding: true,
      },
      headers: {
        ...securityConfig.headers,
        csp: {
          ...securityConfig.headers.csp,
          directives: {
            ...securityConfig.headers.csp.directives,
            scriptSrc: ["'self'"], // 生产环境禁用unsafe-inline
            styleSrc: ["'self'"],
          },
        },
      },
    };
  }

  return securityConfig;
}

export default securityConfig;
