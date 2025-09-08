import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from 'dotenv';

import routes from '@/routes';
import { SocketService } from '@/services/SocketService';

// 加载环境变量
config();

const app = express();
const httpServer = createServer(app);

// 初始化WebSocket服务
const socketService = new SocketService(httpServer);

// 中间件配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查（在所有路由之前）
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    websocket: {
      connected: socketService.getOnlineUserCount(),
      status: 'running',
    },
  });
});

// WebSocket状态API
app.get('/api/v1/socket/status', (req, res) => {
  res.json({
    success: true,
    data: {
      onlineUsers: socketService.getOnlineUserCount(),
      users: socketService.getOnlineUsers(),
    },
    message: 'WebSocket状态获取成功',
  });
});

// API路由
app.use('/api/v1', routes);

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    code: 404,
    timestamp: new Date(),
  });
});

// 全局错误处理
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 500,
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 服务器启动成功`);
  console.log(`📡 HTTP服务器运行在端口 ${PORT}`);
  console.log(`🔌 WebSocket服务器已启动`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`🌐 根路径: http://localhost:${PORT}`);
  console.log(`💬 WebSocket状态: http://localhost:${PORT}/api/v1/socket/status`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  httpServer.close(() => {
    console.log('HTTP服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  httpServer.close(() => {
    console.log('HTTP服务器已关闭');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝', reason);
  process.exit(1);
});

export { socketService };
export default app;
