import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { log } from './config/logger';
import { db } from './config/database';
import { ResponseUtil } from './utils/response';

/**
 * 测试API服务器
 */
const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 基础路由
app.get('/', (req, res) => {
  ResponseUtil.success(res, {
    message: '懂拍帝后端API服务运行正常',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.get('/health', (req, res) => {
  ResponseUtil.success(res, {
    status: 'healthy',
    database: 'connected',
    timestamp: new Date(),
  });
});

// 用户相关API
app.get('/api/v1/users', async (req, res) => {
  try {
    const users = await db.prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        platform: true,
        createdAt: true,
        isVerified: true,
      },
    });

    ResponseUtil.success(res, users, '获取用户列表成功');
  } catch (error: any) {
    ResponseUtil.error(res, error.message, 500);
  }
});

app.post('/api/v1/users', async (req, res): Promise<void> => {
  try {
    const { nickname, platform = 'wechat' } = req.body;

    if (!nickname) {
      ResponseUtil.error(res, '昵称不能为空', 400);
      return;
    }

    const user = await db.prisma.user.create({
      data: {
        nickname,
        platform,
        specialties: '[]',
        equipment: '[]',
        portfolioImages: '[]',
      },
      select: {
        id: true,
        nickname: true,
        platform: true,
        createdAt: true,
      },
    });

    ResponseUtil.success(res, user, '用户创建成功', 201);
  } catch (error: any) {
    ResponseUtil.error(res, error.message, 500);
  }
});

// 作品相关API
app.get('/api/v1/works', async (req, res) => {
  try {
    const works = await db.prisma.work.findMany({
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            collections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 解析JSON字段
    const formattedWorks = works.map(work => ({
      ...work,
      images: JSON.parse(work.images || '[]'),
      tags: JSON.parse(work.tags || '[]'),
      shootingInfo: JSON.parse(work.shootingInfo || '{}'),
      stats: {
        likes: work._count.likes,
        comments: work._count.comments,
        collections: work._count.collections,
        views: work.viewCount,
      },
    }));

    ResponseUtil.success(res, formattedWorks, '获取作品列表成功');
  } catch (error: any) {
    ResponseUtil.error(res, error.message, 500);
  }
});

app.post('/api/v1/works', async (req, res): Promise<void> => {
  try {
    const { title, description, images = [], tags = [], category, userId } = req.body;

    if (!title || !category || !userId) {
      ResponseUtil.error(res, '标题、分类和用户ID不能为空', 400);
      return;
    }

    // 验证用户是否存在
    const user = await db.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      ResponseUtil.error(res, '用户不存在', 404);
      return;
    }

    const work = await db.prisma.work.create({
      data: {
        title,
        description,
        images: JSON.stringify(images),
        tags: JSON.stringify(tags),
        category,
        userId,
        coverImage: images[0] || '',
        shootingInfo: '{}',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formattedWork = {
      ...work,
      images: JSON.parse(work.images || '[]'),
      tags: JSON.parse(work.tags || '[]'),
      shootingInfo: JSON.parse(work.shootingInfo || '{}'),
    };

    ResponseUtil.success(res, formattedWork, '作品创建成功', 201);
  } catch (error: any) {
    ResponseUtil.error(res, error.message, 500);
  }
});

// 数据库统计API
app.get('/api/v1/stats', async (req, res) => {
  try {
    const [userCount, workCount, appointmentCount] = await Promise.all([
      db.prisma.user.count(),
      db.prisma.work.count(),
      db.prisma.appointment.count(),
    ]);

    ResponseUtil.success(res, {
      users: userCount,
      works: workCount,
      appointments: appointmentCount,
      timestamp: new Date(),
    }, '获取统计信息成功');
  } catch (error: any) {
    ResponseUtil.error(res, error.message, 500);
  }
});

// 错误处理中间件
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error('Unhandled error:', error);
  ResponseUtil.error(res, '服务器内部错误', 500);
});

// 404处理
app.use((req, res) => {
  ResponseUtil.notFound(res, '接口不存在');
});

// 启动服务器
async function startApiServer() {
  try {
    // 连接数据库
    await db.connect();
    log.info('Database connected successfully');

    const port = config.server.port;
    app.listen(port, () => {
      log.info(`🚀 API server is running on port ${port}`);
      log.info(`📖 API Base URL: http://localhost:${port}/api/v1`);
      log.info(`🔧 Health check: http://localhost:${port}/health`);
      log.info(`📊 Stats: http://localhost:${port}/api/v1/stats`);
    });
  } catch (error) {
    log.error('Failed to start API server:', error);
    process.exit(1);
  }
}

startApiServer();
