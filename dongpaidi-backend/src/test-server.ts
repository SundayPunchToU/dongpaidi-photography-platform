import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { log } from './config/logger';
import { db } from './config/database';

/**
 * 简单的测试服务器
 */
const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝后端API服务运行正常',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    timestamp: new Date(),
  });
});

// 数据库测试路由
app.get('/test/db', async (req, res) => {
  try {
    // 测试数据库连接
    const userCount = await db.prisma.user.count();
    const workCount = await db.prisma.work.count();
    
    res.json({
      success: true,
      message: '数据库连接正常',
      stats: {
        users: userCount,
        works: workCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '数据库连接失败',
      error: error.message,
    });
  }
});

// 启动服务器
async function startTestServer() {
  try {
    // 连接数据库
    await db.connect();
    log.info('Database connected successfully');

    const port = config.server.port;
    app.listen(port, () => {
      log.info(`🚀 Test server is running on port ${port}`);
      log.info(`📖 Health check: http://localhost:${port}/health`);
      log.info(`🔧 Database test: http://localhost:${port}/test/db`);
    });
  } catch (error) {
    log.error('Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();
