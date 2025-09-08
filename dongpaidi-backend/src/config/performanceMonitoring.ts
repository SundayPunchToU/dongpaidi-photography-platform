import { config } from './index';

/**
 * 性能监控配置
 */
export const performanceMonitoringConfig = {
  // 监控开关
  enabled: process.env.PERFORMANCE_MONITORING_ENABLED === 'true' || true,
  
  // 数据收集配置
  collection: {
    // 采样率 (0-1)
    samplingRate: parseFloat(process.env.PERF_SAMPLING_RATE || '1.0'),
    // 批量大小
    batchSize: parseInt(process.env.PERF_BATCH_SIZE || '100', 10),
    // 刷新间隔 (毫秒)
    flushInterval: parseInt(process.env.PERF_FLUSH_INTERVAL || '10000', 10),
    // 最大队列大小
    maxQueueSize: parseInt(process.env.PERF_MAX_QUEUE_SIZE || '5000', 10),
  },

  // 指标配置
  metrics: {
    // HTTP请求指标
    http: {
      enabled: true,
      // 响应时间阈值 (毫秒)
      slowRequestThreshold: parseInt(process.env.PERF_SLOW_REQUEST_THRESHOLD || '1000', 10),
      // 记录请求体大小
      trackRequestSize: process.env.PERF_TRACK_REQUEST_SIZE === 'true' || false,
      // 记录响应体大小
      trackResponseSize: process.env.PERF_TRACK_RESPONSE_SIZE === 'true' || false,
      // 排除的路径
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
    },
    
    // 数据库指标
    database: {
      enabled: true,
      // 慢查询阈值 (毫秒)
      slowQueryThreshold: parseInt(process.env.PERF_SLOW_QUERY_THRESHOLD || '500', 10),
      // 记录查询参数
      trackQueryParams: process.env.PERF_TRACK_QUERY_PARAMS === 'true' || false,
      // 连接池监控
      trackConnectionPool: true,
    },

    // 系统资源指标
    system: {
      enabled: true,
      // 收集间隔 (毫秒)
      collectInterval: parseInt(process.env.PERF_SYSTEM_COLLECT_INTERVAL || '30000', 10),
      // CPU使用率阈值
      cpuThreshold: parseFloat(process.env.PERF_CPU_THRESHOLD || '80.0'),
      // 内存使用率阈值
      memoryThreshold: parseFloat(process.env.PERF_MEMORY_THRESHOLD || '85.0'),
    },

    // 缓存指标
    cache: {
      enabled: true,
      // 命中率阈值
      hitRateThreshold: parseFloat(process.env.PERF_CACHE_HIT_RATE_THRESHOLD || '80.0'),
      // 记录缓存键
      trackKeys: process.env.PERF_TRACK_CACHE_KEYS === 'true' || false,
    },

    // 业务指标
    business: {
      enabled: true,
      // 用户活动指标
      userActivity: true,
      // API使用统计
      apiUsage: true,
      // 错误率统计
      errorRate: true,
    },
  },

  // 存储配置
  storage: {
    // 内存存储
    memory: {
      enabled: true,
      // 最大条目数
      maxEntries: parseInt(process.env.PERF_MEMORY_MAX_ENTRIES || '10000', 10),
      // TTL (毫秒)
      ttl: parseInt(process.env.PERF_MEMORY_TTL || '3600000', 10), // 1小时
    },
    
    // 文件存储
    file: {
      enabled: process.env.PERF_FILE_STORAGE_ENABLED === 'true' || true,
      // 存储路径
      path: process.env.PERF_FILE_STORAGE_PATH || './logs/performance',
      // 文件轮转
      rotation: {
        maxSize: process.env.PERF_FILE_MAX_SIZE || '100MB',
        maxFiles: parseInt(process.env.PERF_FILE_MAX_FILES || '7', 10),
        datePattern: 'YYYY-MM-DD',
      },
    },

    // 数据库存储
    database: {
      enabled: process.env.PERF_DB_STORAGE_ENABLED === 'true' || false,
      tableName: 'performance_metrics',
      batchInsert: true,
      retention: parseInt(process.env.PERF_DB_RETENTION_DAYS || '30', 10),
    },

    // 外部存储 (如InfluxDB, Prometheus)
    external: {
      enabled: process.env.PERF_EXTERNAL_STORAGE_ENABLED === 'true' || false,
      type: process.env.PERF_EXTERNAL_TYPE || 'prometheus', // prometheus, influxdb, datadog
      endpoint: process.env.PERF_EXTERNAL_ENDPOINT,
      apiKey: process.env.PERF_EXTERNAL_API_KEY,
      database: process.env.PERF_EXTERNAL_DATABASE || 'dongpaidi_performance',
    },
  },

  // 告警配置
  alerting: {
    enabled: process.env.PERF_ALERTING_ENABLED === 'true' || true,
    
    // 告警规则
    rules: [
      {
        name: 'high_response_time',
        metric: 'http.response_time',
        operator: '>',
        threshold: 2000, // 2秒
        duration: 300000, // 5分钟
        severity: 'medium',
      },
      {
        name: 'high_error_rate',
        metric: 'http.error_rate',
        operator: '>',
        threshold: 0.05, // 5%
        duration: 300000, // 5分钟
        severity: 'high',
      },
      {
        name: 'high_cpu_usage',
        metric: 'system.cpu_usage',
        operator: '>',
        threshold: 80, // 80%
        duration: 600000, // 10分钟
        severity: 'high',
      },
      {
        name: 'high_memory_usage',
        metric: 'system.memory_usage',
        operator: '>',
        threshold: 85, // 85%
        duration: 600000, // 10分钟
        severity: 'critical',
      },
      {
        name: 'low_cache_hit_rate',
        metric: 'cache.hit_rate',
        operator: '<',
        threshold: 70, // 70%
        duration: 900000, // 15分钟
        severity: 'medium',
      },
    ],

    // 通知渠道
    channels: {
      email: {
        enabled: process.env.PERF_ALERT_EMAIL_ENABLED === 'true' || false,
        recipients: process.env.PERF_ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      },
      webhook: {
        enabled: process.env.PERF_ALERT_WEBHOOK_ENABLED === 'true' || false,
        url: process.env.PERF_ALERT_WEBHOOK_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.PERF_ALERT_WEBHOOK_TOKEN,
        },
      },
      slack: {
        enabled: process.env.PERF_ALERT_SLACK_ENABLED === 'true' || false,
        webhookUrl: process.env.PERF_ALERT_SLACK_WEBHOOK_URL,
        channel: process.env.PERF_ALERT_SLACK_CHANNEL || '#performance-alerts',
      },
    },
  },

  // 报告配置
  reporting: {
    enabled: process.env.PERF_REPORTING_ENABLED === 'true' || true,
    
    // 报告类型
    types: {
      realtime: {
        enabled: true,
        updateInterval: 5000, // 5秒
      },
      hourly: {
        enabled: true,
        schedule: '0 * * * *', // 每小时
      },
      daily: {
        enabled: true,
        schedule: '0 8 * * *', // 每天8点
      },
      weekly: {
        enabled: true,
        schedule: '0 8 * * 1', // 每周一8点
      },
    },

    // 报告内容
    content: {
      summary: true,
      trends: true,
      topEndpoints: true,
      slowQueries: true,
      errorAnalysis: true,
      recommendations: true,
    },

    // 输出格式
    formats: ['json', 'html'],
    
    // 分发配置
    distribution: {
      email: {
        enabled: process.env.PERF_REPORT_EMAIL_ENABLED === 'true' || false,
        recipients: process.env.PERF_REPORT_EMAIL_RECIPIENTS?.split(',') || [],
      },
      file: {
        enabled: true,
        path: process.env.PERF_REPORT_FILE_PATH || './logs/performance/reports',
      },
    },
  },

  // API配置
  api: {
    enabled: process.env.PERF_API_ENABLED === 'true' || true,
    // API端点前缀
    prefix: '/api/v1/performance',
    // 认证要求
    requireAuth: true,
    // 管理员权限要求
    requireAdmin: true,
    // 速率限制
    rateLimit: {
      windowMs: 60000, // 1分钟
      max: 100, // 最多100个请求
    },
  },

  // 集成配置
  integrations: {
    // Prometheus集成
    prometheus: {
      enabled: process.env.PERF_PROMETHEUS_ENABLED === 'true' || false,
      endpoint: '/metrics',
      prefix: 'dongpaidi_',
      collectDefaultMetrics: true,
    },
    
    // Grafana集成
    grafana: {
      enabled: process.env.PERF_GRAFANA_ENABLED === 'true' || false,
      dashboardUrl: process.env.PERF_GRAFANA_DASHBOARD_URL,
    },

    // APM集成
    apm: {
      enabled: process.env.PERF_APM_ENABLED === 'true' || false,
      service: 'dongpaidi-backend',
      environment: config.server.env,
    },
  },

  // 调试配置
  debug: {
    enabled: config.server.isDevelopment,
    logLevel: 'debug',
    detailedMetrics: true,
    includeStackTrace: true,
  },
} as const;

/**
 * 获取环境特定的性能监控配置
 */
export function getPerformanceMonitoringConfig() {
  const env = config.server.env;
  
  // 生产环境配置调整
  if (env === 'production') {
    return {
      ...performanceMonitoringConfig,
      collection: {
        ...performanceMonitoringConfig.collection,
        samplingRate: 0.1, // 生产环境降低采样率
        batchSize: 500, // 增大批次大小
        flushInterval: 30000, // 30秒刷新间隔
      },
      debug: {
        ...performanceMonitoringConfig.debug,
        enabled: false,
        detailedMetrics: false,
        includeStackTrace: false,
      },
    };
  }

  return performanceMonitoringConfig;
}

export default performanceMonitoringConfig;
