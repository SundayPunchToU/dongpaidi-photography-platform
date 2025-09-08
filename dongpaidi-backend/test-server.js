const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

// 中间件
app.use(cors());
app.use(express.json());

// 管理员登录接口
app.post('/api/v1/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('登录请求:', { email, password });

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 查找管理员用户
    const admin = await prisma.user.findFirst({
      where: {
        email,
        platform: 'admin',
      },
    });

    console.log('找到管理员:', admin);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员账号不存在',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // 验证密码
    const isValidPassword = password === 'admin123456';

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // 生成JWT token
    const accessToken = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: 'admin',
        platform: admin.platform
      },
      'dongpaidi-super-secret-jwt-key-for-development-only',
      { expiresIn: '7d' }
    );

    console.log('登录成功:', admin.email);

    res.json({
      success: true,
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          nickname: admin.nickname,
          role: 'admin',
          avatarUrl: admin.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken: accessToken,
        },
      },
      message: '登录成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('管理员登录失败:', error);
    
    res.status(500).json({
      success: false,
      message: '登录失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 系统统计接口
app.get('/api/v1/stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const workCount = await prisma.work.count();
    const appointmentCount = await prisma.appointment.count();

    res.json({
      success: true,
      data: {
        users: userCount,
        works: workCount,
        appointments: appointmentCount,
        messages: 0,
      },
      message: '获取统计数据成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 趋势数据接口
app.get('/api/v1/stats/trend', (req, res) => {
  const { period = 'week' } = req.query;

  // 模拟趋势数据
  const mockTrendData = [
    { date: '2025-09-01', users: 120, works: 80, appointments: 20 },
    { date: '2025-09-02', users: 132, works: 95, appointments: 25 },
    { date: '2025-09-03', users: 145, works: 110, appointments: 30 },
    { date: '2025-09-04', users: 158, works: 125, appointments: 28 },
    { date: '2025-09-05', users: 170, works: 140, appointments: 35 },
    { date: '2025-09-06', users: 185, works: 155, appointments: 40 },
    { date: '2025-09-07', users: 200, works: 170, appointments: 45 },
  ];

  res.json({
    success: true,
    data: {
      dates: mockTrendData.map(item => item.date),
      users: mockTrendData.map(item => item.users),
      works: mockTrendData.map(item => item.works),
      appointments: mockTrendData.map(item => item.appointments),
    },
    message: '获取趋势数据成功',
    code: 200,
    timestamp: new Date().toISOString(),
  });
});

// 用户管理接口
app.get('/api/v1/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword, platform, isVerified } = req.query;

    console.log('用户列表请求参数:', { page, limit, keyword, platform, isVerified });

    const where = {};
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }
    if (platform && platform !== '') {
      where.platform = platform;
    }
    if (isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }

    console.log('查询条件:', where);

    const users = await prisma.user.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    // 格式化用户数据
    const formattedUsers = users.map(user => {
      try {
        return {
          ...user,
          specialties: user.specialties ? JSON.parse(user.specialties) : [],
          equipment: user.equipment ? JSON.parse(user.equipment) : [],
          portfolioImages: user.portfolioImages ? JSON.parse(user.portfolioImages) : [],
          status: user.status || 'active', // 确保有默认状态
        };
      } catch (error) {
        console.error('解析用户数据失败:', error, user);
        return {
          ...user,
          specialties: [],
          equipment: [],
          portfolioImages: [],
          status: user.status || 'active',
        };
      }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        items: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      message: '获取用户列表成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 用户统计接口
app.get('/api/v1/users/stats', async (req, res) => {
  try {
    const total = await prisma.user.count();
    const verified = await prisma.user.count({ where: { isVerified: true } });
    const active = await prisma.user.count({ where: { status: 'active' } });

    // 今天新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    res.json({
      success: true,
      data: {
        total,
        verified,
        active,
        newToday,
      },
      message: '获取用户统计成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 更新用户状态接口
app.patch('/api/v1/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, status } = req.body;

    const updateData = {};
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (status !== undefined) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: user,
      message: '更新用户状态成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 删除用户接口
app.delete('/api/v1/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: null,
      message: '删除用户成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// ==================== 约拍相关接口 ====================

// 获取约拍列表
app.get('/api/v1/appointments', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, location, status = 'open', keyword } = req.query;

    const where = {};
    if (type) where.type = type;
    if (location) where.location = { contains: location };
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.appointment.count({ where });

    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      requirements: appointment.requirements ? JSON.parse(appointment.requirements) : {},
      applicationsCount: appointment.applications.length,
    }));

    res.json({
      success: true,
      data: {
        items: formattedAppointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      message: '获取约拍列表成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取约拍列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取约拍列表失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 创建约拍
app.post('/api/v1/appointments', async (req, res) => {
  try {
    // 模拟用户认证 - 使用第一个用户作为发布者
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: '系统中没有用户',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const userId = users[0].id;
    const {
      title,
      description,
      type,
      location,
      shootDate,
      budget,
      requirements,
    } = req.body;

    // 验证必填字段
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: '标题和类型为必填项',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 验证约拍类型
    if (!['photographer_seek_model', 'model_seek_photographer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '约拍类型无效',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        publisherId: userId,
        title,
        description: description || '',
        type,
        location: location || '',
        shootDate: shootDate ? new Date(shootDate) : null,
        budget: budget ? parseFloat(budget) : null,
        requirements: requirements ? JSON.stringify(requirements) : '{}',
      },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...appointment,
        requirements: JSON.parse(appointment.requirements),
      },
      message: '约拍发布成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建约拍失败:', error);
    res.status(500).json({
      success: false,
      message: '创建约拍失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 约拍统计接口（必须在详情路由之前）
app.get('/api/v1/appointments/stats', async (req, res) => {
  try {
    const total = await prisma.appointment.count();
    const open = await prisma.appointment.count({ where: { status: 'open' } });
    const inProgress = await prisma.appointment.count({ where: { status: 'in_progress' } });
    const completed = await prisma.appointment.count({ where: { status: 'completed' } });

    const photographerSeek = await prisma.appointment.count({
      where: { type: 'photographer_seek_model' }
    });
    const modelSeek = await prisma.appointment.count({
      where: { type: 'model_seek_photographer' }
    });

    // 今天新增约拍
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await prisma.appointment.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        completed,
        photographerSeek,
        modelSeek,
        newToday,
      },
      message: '获取约拍统计成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取约拍统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取约拍统计失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 获取约拍详情
app.get('/api/v1/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
            specialties: true,
            location: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                specialties: true,
                location: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '约拍不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        ...appointment,
        requirements: appointment.requirements ? JSON.parse(appointment.requirements) : {},
        publisher: {
          ...appointment.publisher,
          specialties: appointment.publisher.specialties ? JSON.parse(appointment.publisher.specialties) : [],
        },
        applications: appointment.applications.map(app => ({
          ...app,
          applicant: {
            ...app.applicant,
            specialties: app.applicant.specialties ? JSON.parse(app.applicant.specialties) : [],
          },
        })),
      },
      message: '获取约拍详情成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取约拍详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取约拍详情失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 作品管理API
app.get('/api/v1/works', async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, category, status, userId } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              isVerified: true,
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
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.work.count({ where }),
    ]);

    // 格式化作品数据
    const formattedWorks = works.map(work => ({
      ...work,
      images: JSON.parse(work.images || '[]'),
      tags: JSON.parse(work.tags || '[]'),
      shootingInfo: JSON.parse(work.shootingInfo || '{}'),
      author: work.user,
      stats: {
        likeCount: work._count.likes,
        commentCount: work._count.comments,
        collectCount: work._count.collections,
        viewCount: work.viewCount,
      },
    }));

    res.json({
      success: true,
      data: {
        items: formattedWorks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      message: '获取作品列表成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取作品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取作品列表失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 作品统计API
app.get('/api/v1/works/stats', async (req, res) => {
  try {
    const works = await prisma.work.findMany();

    const stats = {
      total: works.length,
      published: works.filter(w => w.status === 'published').length,
      pending: works.filter(w => w.status === 'draft').length,
      rejected: works.filter(w => w.status === 'deleted').length,
      newToday: works.filter(w => {
        const today = new Date();
        const workDate = new Date(w.createdAt);
        return workDate.toDateString() === today.toDateString();
      }).length,
    };

    res.json({
      success: true,
      data: stats,
      message: '获取作品统计成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取作品统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取作品统计失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 作品详情API
app.get('/api/v1/works/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            isVerified: true,
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
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    const formattedWork = {
      ...work,
      images: JSON.parse(work.images || '[]'),
      tags: JSON.parse(work.tags || '[]'),
      shootingInfo: JSON.parse(work.shootingInfo || '{}'),
      author: work.user,
      stats: {
        likeCount: work._count.likes,
        commentCount: work._count.comments,
        collectCount: work._count.collections,
        viewCount: work.viewCount,
      },
    };

    res.json({
      success: true,
      data: formattedWork,
      message: '获取作品详情成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取作品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取作品详情失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 更新作品状态API
app.patch('/api/v1/works/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const work = await prisma.work.update({
      where: { id },
      data: { status },
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

    res.json({
      success: true,
      data: work,
      message: '作品状态更新成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新作品状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新作品状态失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 删除作品API
app.delete('/api/v1/works/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.work.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: null,
      message: '作品删除成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除作品失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 消息管理API
app.get('/api/v1/messages/conversations', async (req, res) => {
  try {
    // 模拟获取对话列表
    const conversations = [
      {
        userId: 'user1',
        user: {
          id: 'user1',
          nickname: '摄影师小王',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          isOnline: true,
        },
        lastMessage: {
          id: 'msg1',
          content: '你好，我想预约拍摄',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
          isRead: false,
          senderId: 'user1',
        },
        unreadCount: 2,
      },
      {
        userId: 'user2',
        user: {
          id: 'user2',
          nickname: '模特小李',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616c6d4e6e8?w=100',
          isOnline: false,
        },
        lastMessage: {
          id: 'msg2',
          content: '拍摄效果很棒！',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
          isRead: true,
          senderId: 'user2',
        },
        unreadCount: 0,
      },
      {
        userId: 'user3',
        user: {
          id: 'user3',
          nickname: '化妆师小张',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          isOnline: true,
        },
        lastMessage: {
          id: 'msg3',
          content: '明天的拍摄时间确认一下',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5小时前
          isRead: true,
          senderId: 'current-user',
        },
        unreadCount: 0,
      },
    ];

    res.json({
      success: true,
      data: conversations,
      message: '获取对话列表成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取对话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话列表失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 获取对话消息API
app.get('/api/v1/messages/conversations/:otherUserId', async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 模拟对话消息
    const messages = [
      {
        id: 'msg1',
        content: '你好，我想预约拍摄',
        type: 'text',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        sender: {
          id: otherUserId,
          nickname: '摄影师小王',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        },
        receiver: {
          id: 'current-user',
          nickname: '当前用户',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        },
      },
      {
        id: 'msg2',
        content: '好的，什么时候方便？',
        type: 'text',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
        sender: {
          id: 'current-user',
          nickname: '当前用户',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        },
        receiver: {
          id: otherUserId,
          nickname: '摄影师小王',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        },
      },
      {
        id: 'msg3',
        content: '明天下午2点怎么样？',
        type: 'text',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        sender: {
          id: otherUserId,
          nickname: '摄影师小王',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        },
        receiver: {
          id: 'current-user',
          nickname: '当前用户',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        },
      },
    ];

    res.json({
      success: true,
      data: {
        items: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length,
          pages: 1,
        },
      },
      message: '获取对话消息成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取对话消息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话消息失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 发送消息API
app.post('/api/v1/messages', async (req, res) => {
  try {
    const { receiverId, content, type = 'text' } = req.body;

    const message = {
      id: `msg_${Date.now()}`,
      content,
      type,
      isRead: false,
      createdAt: new Date(),
      sender: {
        id: 'current-user',
        nickname: '当前用户',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      },
      receiver: {
        id: receiverId,
        nickname: '接收者',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
    };

    res.json({
      success: true,
      data: message,
      message: '消息发送成功',
      code: 201,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 获取未读消息数量API
app.get('/api/v1/messages/unread-count', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { count: 3 },
      message: '获取未读消息数成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 标记消息已读API
app.put('/api/v1/messages/conversations/:otherUserId/read', async (req, res) => {
  try {
    const { otherUserId } = req.params;

    res.json({
      success: true,
      data: null,
      message: '消息已标记为已读',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记消息已读失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝后端服务运行正常',
    version: '1.0.0',
    timestamp: new Date(),
    apiDocs: 'http://localhost:3000/api/v1',
  });
});

// API根路径
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝 API 服务运行正常',
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      works: '/api/v1/works',
      upload: '/api/v1/upload',
      admin: '/api/v1/admin',
    },
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('全局错误处理:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 500,
    timestamp: new Date().toISOString(),
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    code: 404,
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在端口 ${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`🌐 根路径: http://localhost:${PORT}`);
});
