import { config } from './index';

/**
 * 日志分析配置
 */
export const logAnalysisConfig = {
  // 日志收集配置
  collection: {
    enabled: process.env.LOG_ANALYSIS_ENABLED === 'true' || true,
    batchSize: parseInt(process.env.LOG_BATCH_SIZE || '100', 10),
    flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL || '5000', 10), // 5秒
    maxQueueSize: parseInt(process.env.LOG_MAX_QUEUE_SIZE || '10000', 10),
    compressionEnabled: process.env.LOG_COMPRESSION_ENABLED === 'true' || true,
  },

  // 日志存储配置
  storage: {
    // 文件存储
    file: {
      enabled: true,
      basePath: process.env.LOG_ANALYSIS_PATH || './logs/analysis',
      maxFileSize: process.env.LOG_MAX_FILE_SIZE || '100MB',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '30', 10), // 保留30天
      compression: true,
      format: 'json', // json, csv, parquet
    },
    // 数据库存储
    database: {
      enabled: process.env.LOG_DB_ENABLED === 'true' || false,
      tableName: 'log_entries',
      batchInsert: true,
      indexFields: ['timestamp', 'level', 'service', 'userId', 'ip'],
    },
    // 外部存储（如Elasticsearch）
    external: {
      enabled: process.env.LOG_EXTERNAL_ENABLED === 'true' || false,
      type: process.env.LOG_EXTERNAL_TYPE || 'elasticsearch', // elasticsearch, splunk, datadog
      endpoint: process.env.LOG_EXTERNAL_ENDPOINT,
      apiKey: process.env.LOG_EXTERNAL_API_KEY,
      index: process.env.LOG_EXTERNAL_INDEX || 'dongpaidi-logs',
    },
  },

  // 日志解析配置
  parsing: {
    // 字段提取规则
    fieldExtraction: {
      timestamp: {
        formats: ['YYYY-MM-DD HH:mm:ss', 'ISO8601'],
        timezone: 'Asia/Shanghai',
      },
      level: {
        mapping: {
          'error': 'ERROR',
          'warn': 'WARN',
          'info': 'INFO',
          'debug': 'DEBUG',
          'http': 'HTTP',
        },
      },
      ip: {
        anonymize: process.env.LOG_ANONYMIZE_IP === 'true' || false,
        geoLocation: process.env.LOG_GEO_LOCATION === 'true' || false,
      },
      userAgent: {
        parse: true,
        extractBrowser: true,
        extractOS: true,
        extractDevice: true,
      },
    },
    // 结构化数据提取
    structuredData: {
      jsonFields: ['meta', 'details', 'metadata'],
      arrayFields: ['tags', 'categories'],
      numericFields: ['duration', 'responseTime', 'statusCode'],
    },
  },

  // 日志分析配置
  analysis: {
    // 实时分析
    realtime: {
      enabled: true,
      windowSize: 60000, // 1分钟窗口
      alertThresholds: {
        errorRate: 0.05, // 5%错误率告警
        responseTime: 5000, // 5秒响应时间告警
        requestRate: 1000, // 每分钟1000请求告警
      },
    },
    // 批量分析
    batch: {
      enabled: true,
      schedule: '0 */5 * * * *', // 每5分钟执行一次
      analysisTypes: [
        'error_analysis',
        'performance_analysis',
        'user_behavior_analysis',
        'security_analysis',
        'business_metrics',
      ],
    },
    // 趋势分析
    trends: {
      enabled: true,
      timeWindows: ['1h', '6h', '24h', '7d', '30d'],
      metrics: [
        'request_count',
        'error_rate',
        'response_time',
        'user_activity',
        'api_usage',
      ],
    },
  },

  // 告警配置
  alerting: {
    enabled: process.env.LOG_ALERTING_ENABLED === 'true' || true,
    channels: {
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true' || false,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      webhook: {
        enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true' || false,
        url: process.env.ALERT_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.ALERT_WEBHOOK_TOKEN,
        },
      },
      slack: {
        enabled: process.env.ALERT_SLACK_ENABLED === 'true' || false,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts',
      },
    },
    rules: [
      {
        name: 'high_error_rate',
        condition: 'error_rate > 0.05',
        severity: 'high',
        cooldown: 300000, // 5分钟冷却期
      },
      {
        name: 'slow_response',
        condition: 'avg_response_time > 5000',
        severity: 'medium',
        cooldown: 600000, // 10分钟冷却期
      },
      {
        name: 'security_incident',
        condition: 'security_events > 10',
        severity: 'critical',
        cooldown: 60000, // 1分钟冷却期
      },
    ],
  },

  // 报告配置
  reporting: {
    enabled: true,
    schedule: {
      daily: '0 8 * * *', // 每天8点
      weekly: '0 8 * * 1', // 每周一8点
      monthly: '0 8 1 * *', // 每月1号8点
    },
    formats: ['html', 'pdf', 'json'],
    recipients: process.env.REPORT_RECIPIENTS?.split(',') || [],
    templates: {
      daily: 'daily_log_report',
      weekly: 'weekly_log_report',
      monthly: 'monthly_log_report',
    },
  },

  // 数据保留配置
  retention: {
    // 原始日志保留期
    rawLogs: {
      days: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
      compressionAfterDays: 7,
      archiveAfterDays: 30,
    },
    // 分析结果保留期
    analysisResults: {
      days: parseInt(process.env.ANALYSIS_RETENTION_DAYS || '90', 10),
      aggregationLevels: {
        hourly: 7, // 小时级数据保留7天
        daily: 30, // 日级数据保留30天
        weekly: 90, // 周级数据保留90天
        monthly: 365, // 月级数据保留1年
      },
    },
  },

  // 性能配置
  performance: {
    // 并发处理
    concurrency: {
      maxWorkers: parseInt(process.env.LOG_MAX_WORKERS || '4', 10),
      queueConcurrency: parseInt(process.env.LOG_QUEUE_CONCURRENCY || '10', 10),
    },
    // 缓存配置
    cache: {
      enabled: true,
      ttl: 300000, // 5分钟TTL
      maxSize: 1000, // 最大缓存条目数
    },
    // 采样配置
    sampling: {
      enabled: process.env.LOG_SAMPLING_ENABLED === 'true' || false,
      rate: parseFloat(process.env.LOG_SAMPLING_RATE || '0.1'), // 10%采样率
      preserveErrors: true, // 始终保留错误日志
    },
  },

  // 隐私和安全配置
  privacy: {
    // 数据脱敏
    anonymization: {
      enabled: true,
      fields: ['ip', 'email', 'phone', 'userId'],
      methods: {
        ip: 'mask_last_octet', // 192.168.1.xxx
        email: 'mask_domain', // user@xxx.com
        phone: 'mask_middle', // 138****5678
        userId: 'hash', // SHA256哈希
      },
    },
    // 敏感数据过滤
    sensitiveDataFilter: {
      enabled: true,
      patterns: [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /authorization/i,
        /cookie/i,
      ],
      replacement: '[REDACTED]',
    },
  },

  // 集成配置
  integrations: {
    // 监控系统集成
    monitoring: {
      prometheus: {
        enabled: process.env.PROMETHEUS_ENABLED === 'true' || false,
        endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
        prefix: 'dongpaidi_logs_',
      },
      grafana: {
        enabled: process.env.GRAFANA_ENABLED === 'true' || false,
        dashboardId: process.env.GRAFANA_DASHBOARD_ID,
      },
    },
    // APM集成
    apm: {
      enabled: process.env.APM_ENABLED === 'true' || false,
      service: process.env.APM_SERVICE || 'dongpaidi-backend',
      environment: config.server.env,
    },
  },

  // 调试配置
  debug: {
    enabled: config.server.isDevelopment,
    logLevel: 'debug',
    showStackTrace: true,
    detailedMetrics: true,
  },
} as const;

/**
 * 获取环境特定的日志分析配置
 */
export function getLogAnalysisConfig() {
  const env = config.server.env;
  
  // 生产环境配置调整
  if (env === 'production') {
    return {
      ...logAnalysisConfig,
      collection: {
        ...logAnalysisConfig.collection,
        batchSize: 500, // 生产环境增大批次
        flushInterval: 10000, // 10秒刷新间隔
      },
      storage: {
        ...logAnalysisConfig.storage,
        file: {
          ...logAnalysisConfig.storage.file,
          maxFileSize: '500MB',
          maxFiles: 90, // 保留90天
        },
      },
      performance: {
        ...logAnalysisConfig.performance,
        sampling: {
          ...logAnalysisConfig.performance.sampling,
          enabled: true,
          rate: 0.1, // 生产环境10%采样
        },
      },
      privacy: {
        ...logAnalysisConfig.privacy,
        anonymization: {
          ...logAnalysisConfig.privacy.anonymization,
          enabled: true, // 生产环境强制启用匿名化
        },
      },
    };
  }

  return logAnalysisConfig;
}

export default logAnalysisConfig;
