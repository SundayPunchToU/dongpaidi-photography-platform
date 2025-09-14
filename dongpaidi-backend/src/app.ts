import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { config } from '@/config';
import { log } from '@/config/logger';
import { db } from '@/config/database';
import routes from '@/routes';
import { errorHandler, notFoundHandler, requestLogger } from '@/middleware/error';
import { responseMiddleware } from '@/utils/response';

/**
 * 创建Express应用
 */
export const createApp = (): express.Application => {
  const app = express();

  // 基础中间件
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  app.use(cors({
    origin: config.api.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // 静态文件服务
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 信任代理（用于获取真实IP）
  app.set('trust proxy', 1);

  // 添加整合的中间件 - 从backend/迁移
  app.use(responseMiddleware); // 为res对象添加便捷方法
  app.use(requestLogger); // 请求日志记录

  // API路由
  app.use(config.api.prefix, routes);

  // 根路径
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: '懂拍帝后端API服务',
      version: '1.0.0',
      environment: config.server.env,
      timestamp: new Date(),
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
 * 启动服务器
 */
export const startServer = async (): Promise<void> => {
  try {
    // 连接数据库
    await db.connect();
    log.info('Database connected successfully');

    // 创建应用
    const app = createApp();

    // 启动服务器
    const server = app.listen(config.server.port, () => {
      log.info(`🚀 Server is running on port ${config.server.port}`);
      log.info(`📖 API Documentation: http://localhost:${config.server.port}${config.api.prefix}`);
      log.info(`🌍 Environment: ${config.server.env}`);
      
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
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled Rejection at:', { promise, reason });
      process.exit(1);
    });

  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
};

export default createApp;
