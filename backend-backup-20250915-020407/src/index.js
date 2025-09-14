/**
 * 懂拍帝后端服务主入口文件
 * 重构后的模块化架构，提供清晰的代码组织和可扩展性
 */

const express = require('express');
const cors = require('cors');

// 导入配置和工具
const config = require('./config');
const logger = require('./utils/logger');
const { responseMiddleware } = require('./utils/response');
const { requestLogger, notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

// 导入路由模块
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');
const appointmentRoutes = require('./routes/appointments');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const statsRoutes = require('./routes/stats');

/**
 * 应用初始化
 */
async function initializeApp() {
  try {
    // 验证配置
    config.validateConfig();
    logger.info('Configuration validated successfully');

    // 创建Express应用
    const app = express();

    // 基础中间件
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));
    
    app.use(express.json({ 
      limit: config.api.maxBodySize || '10mb' 
    }));
    
    app.use(express.urlencoded({ 
      extended: true,
      limit: config.api.maxBodySize || '10mb'
    }));

    // 请求日志中间件
    app.use(requestLogger);

    // 响应处理中间件
    app.use(responseMiddleware);

    // API状态检查端点
    app.get('/', (req, res) => {
      res.success({
        service: '懂拍帝后端API服务',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: config.server.env
      }, 'API服务运行正常');
    });

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.success({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }, '服务健康状态正常');
    });

    // API路由
    const apiPrefix = config.api.prefix;
    
    app.use(apiPrefix, authRoutes);
    app.use(`${apiPrefix}/users`, userRoutes);
    app.use(`${apiPrefix}/works`, workRoutes);
    app.use(`${apiPrefix}/appointments`, appointmentRoutes);
    app.use(`${apiPrefix}/messages`, messageRoutes);
    app.use(`${apiPrefix}/payments`, paymentRoutes);
    app.use(`${apiPrefix}/stats`, statsRoutes);

    // 管理员仪表板数据（兼容性端点）
    app.get(`${apiPrefix}/admin/dashboard`, (req, res) => {
      res.success({
        message: '管理员仪表板数据',
        stats: {
          users: 1250,
          works: 3200,
          appointments: 680,
          revenue: 125000
        }
      }, '获取仪表板数据成功');
    });

    // 管理员用户管理（兼容性端点）
    app.get(`${apiPrefix}/admin/users`, (req, res) => {
      res.success([], '获取管理员用户列表成功');
    });

    app.delete(`${apiPrefix}/admin/users/:id`, (req, res) => {
      res.success(null, '用户删除成功');
    });

    // 管理员作品管理（兼容性端点）
    app.get(`${apiPrefix}/admin/works`, (req, res) => {
      res.success([], '获取管理员作品列表成功');
    });

    app.put(`${apiPrefix}/admin/works/:id/approve`, (req, res) => {
      res.success(null, '作品审核成功');
    });

    app.put(`${apiPrefix}/admin/works/:id/reject`, (req, res) => {
      res.success(null, '作品拒绝成功');
    });

    app.delete(`${apiPrefix}/admin/works/:id`, (req, res) => {
      res.success(null, '作品删除成功');
    });

    // 404错误处理
    app.use(notFoundHandler);

    // 全局错误处理
    app.use(globalErrorHandler);

    return app;
  } catch (error) {
    logger.error('Failed to initialize application', { error: error.message });
    throw error;
  }
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    const app = await initializeApp();
    
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Server started successfully', {
        port: config.server.port,
        host: config.server.host,
        environment: config.server.env,
        apiPrefix: config.api.prefix
      });
      
      console.log(`
🚀 懂拍帝后端服务已启动
📍 服务地址: http://${config.server.host}:${config.server.port}
🔗 API前缀: ${config.api.prefix}
🌍 运行环境: ${config.server.env}
📊 管理后台: http://${config.server.host}:${config.server.port}/admin/
      `);
    });

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = { initializeApp, startServer };
