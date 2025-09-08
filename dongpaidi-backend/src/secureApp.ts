import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { config } from '@/config';
import { securityConfig, getSecurityConfig } from '@/config/security';
import { log } from '@/config/logger';
import { db } from '@/config/database';
import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import securityMiddleware from '@/middleware/security';
import { enhancedAuthenticate } from '@/middleware/enhancedAuth';
import { securityMonitoring } from '@/services/securityMonitoring';
import { auditLogger, AuditEventType, AuditSeverity } from '@/services/auditLogger';

/**
 * 创建安全加固的Express应用
 */
export const createSecureApp = (): express.Application => {
  const app = express();
  const secConfig = getSecurityConfig();

  // 信任代理设置（必须在其他中间件之前）
  app.set('trust proxy', secConfig.ipFilter.trustProxy);

  // 安全头配置
  app.use(helmet({
    contentSecurityPolicy: {
      directives: secConfig.headers.csp.directives,
    },
    hsts: {
      maxAge: secConfig.headers.hsts.maxAge,
      includeSubDomains: secConfig.headers.hsts.includeSubDomains,
      preload: secConfig.headers.hsts.preload,
    },
    noSniff: secConfig.headers.noSniff,
    frameguard: secConfig.headers.frameguard,
    xssFilter: secConfig.headers.xssFilter,
    referrerPolicy: { policy: secConfig.headers.referrerPolicy as any },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS配置
  app.use(cors({
    origin: secConfig.cors.origin,
    credentials: secConfig.cors.credentials,
    methods: secConfig.cors.methods,
    allowedHeaders: secConfig.cors.allowedHeaders,
    exposedHeaders: secConfig.cors.exposedHeaders,
    maxAge: secConfig.cors.maxAge,
  }));

  // 全局速率限制
  app.use(securityMiddleware.globalRateLimit);

  // 慢速攻击防护
  app.use(securityMiddleware.slowDownProtection);

  // IP过滤
  app.use(securityMiddleware.ipFilter);

  // 威胁检测中间件
  app.use(securityMiddleware.threatDetection);

  // 输入验证和清理
  app.use(securityMiddleware.inputSanitization);

  // 数据脱敏（响应时）
  app.use(securityMiddleware.dataMasking);

  // 请求安全分析中间件
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // 分析请求威胁
      const threats = await securityMonitoring.analyzeRequest(req);
      
      // 如果检测到高危威胁，阻止请求
      const highThreat = threats.find(t => 
        t.severity === AuditSeverity.CRITICAL || 
        (t.severity === AuditSeverity.HIGH && t.confidence > 0.8)
      );
      
      if (highThreat) {
        await auditLogger.logFromRequest(req, AuditEventType.SECURITY_VIOLATION, highThreat.severity, {
          success: false,
          errorMessage: `Request blocked: ${highThreat.description}`,
          metadata: { threat: highThreat },
        });
        
        return res.status(403).json({
          success: false,
          message: 'Request blocked for security reasons',
          code: 403,
          timestamp: new Date().toISOString(),
        });
      }
      
      next();
    } catch (error) {
      log.error('Security analysis failed', { error, url: req.url });
      next(); // 继续处理请求，不因安全分析失败而阻止正常请求
    }
  });

  // 基础中间件
  app.use(compression());
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // 验证JSON格式，防止JSON炸弹攻击
      try {
        JSON.parse(buf.toString());
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 1000, // 限制参数数量
  }));

  // 审计日志中间件
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const startTime = Date.now();
    
    // 记录API访问
    await auditLogger.logFromRequest(req, AuditEventType.API_ACCESS, AuditSeverity.LOW, {
      success: true,
      action: req.method,
      resource: req.path,
    });

    // 监听响应完成
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      if (isError) {
        await auditLogger.logFromRequest(req, AuditEventType.API_ERROR, AuditSeverity.MEDIUM, {
          success: false,
          errorMessage: `HTTP ${res.statusCode}`,
          metadata: { 
            statusCode: res.statusCode,
            duration,
          },
        });
      }
    });

    next();
  });

  // 日志中间件
  if (config.server.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          log.http(message.trim());
        },
      },
    }));
  }

  // 静态文件服务（带安全检查）
  app.use('/uploads', (req, res, next) => {
    // 检查文件路径，防止路径遍历
    const filePath = req.path;
    if (filePath.includes('..') || filePath.includes('~')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 403,
      });
    }
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));

  // 健康检查端点
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      security: securityMonitoring.getSecurityStats(),
    });
  });

  // 安全状态端点（需要管理员权限）
  app.get('/security/status', enhancedAuthenticate, async (req: any, res) => {
    try {
      // 这里应该检查管理员权限
      const stats = securityMonitoring.getSecurityStats();
      
      res.json({
        success: true,
        data: {
          ...stats,
          config: {
            rateLimitEnabled: true,
            threatDetectionEnabled: secConfig.threatDetection.enabled,
            auditEnabled: secConfig.audit.enabled,
            ipFilterEnabled: secConfig.ipFilter.enabled,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get security status',
        code: 500,
      });
    }
  });

  // API路由（应用安全中间件）
  app.use(config.api.prefix, 
    // API特定的速率限制
    securityMiddleware.apiRateLimit,
    // 会话安全检查
    securityMiddleware.sessionSecurity,
    // 路由
    routes
  );

  // 根路径
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: '懂拍帝后端API服务 - 安全加固版',
      version: '1.0.0',
      environment: config.server.env,
      timestamp: new Date().toISOString(),
      security: {
        enabled: true,
        features: [
          'Rate Limiting',
          'Threat Detection',
          'Input Sanitization',
          'Audit Logging',
          'Session Security',
          'Data Masking',
        ],
      },
      documentation: `${req.protocol}://${req.get('host')}${config.api.prefix}`,
    });
  });

  // 404处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);

  return app;
};

/**
 * 启动安全加固的服务器
 */
export const startSecureServer = async (): Promise<void> => {
  try {
    // 连接数据库
    await db.connect();
    log.info('Database connected successfully');

    // 创建安全应用
    const app = createSecureApp();

    // 启动服务器
    const server = app.listen(config.server.port, () => {
      log.info(`🚀 Secure Server is running on port ${config.server.port}`);
      log.info(`🔒 Security features enabled`);
      log.info(`📖 API Documentation: http://localhost:${config.server.port}${config.api.prefix}`);
      log.info(`🌍 Environment: ${config.server.env}`);
      log.info(`🛡️  Security monitoring active`);
      
      if (config.server.isDevelopment) {
        log.info(`🔧 Development mode enabled`);
        log.info(`📁 Static files: http://localhost:${config.server.port}/uploads`);
      }
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      log.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        log.info('HTTP server closed');
        
        try {
          await db.disconnect();
          log.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          log.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // 强制关闭超时
      setTimeout(() => {
        log.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      log.error('Uncaught Exception:', error);
      
      // 记录安全事件
      auditLogger.logEvent({
        eventType: AuditEventType.SYSTEM_CONFIG_CHANGE,
        severity: AuditSeverity.CRITICAL,
        ip: 'localhost',
        userAgent: 'system',
        success: false,
        errorMessage: 'Uncaught Exception',
        metadata: { error: error.message, stack: error.stack },
      });
      
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled Rejection at:', { promise, reason });
      
      // 记录安全事件
      auditLogger.logEvent({
        eventType: AuditEventType.SYSTEM_CONFIG_CHANGE,
        severity: AuditSeverity.HIGH,
        ip: 'localhost',
        userAgent: 'system',
        success: false,
        errorMessage: 'Unhandled Rejection',
        metadata: { reason, promise: promise.toString() },
      });
      
      process.exit(1);
    });

  } catch (error) {
    log.error('Failed to start secure server:', error);
    process.exit(1);
  }
};

export default createSecureApp;
