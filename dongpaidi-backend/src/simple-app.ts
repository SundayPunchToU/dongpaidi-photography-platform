import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';

console.log('开始启动简化版应用...');

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
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 日志中间件
  app.use(morgan('dev'));

  // 静态文件服务
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 根路径欢迎页面
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: '🚀 懂拍帝后端API服务器',
      version: '1.0.0 (简化版)',
      description: '专业的摄影社交平台后端服务',
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      endpoints: {
        health: '/health',
        test: '/api/v1/test',
        users: '/api/v1/users',
        works: '/api/v1/works',
        appointments: '/api/v1/appointments',
        payments: '/api/v1/payments/admin/orders',
        messages: '/api/v1/messages/conversations',
        stats: '/api/v1/stats'
      },
      documentation: '访问 /api/v1/test 测试API连接'
    });
  });

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 基础API路由
  app.get('/api/v1/test', (req, res) => {
    res.json({ message: '简化版服务器正常运行', timestamp: new Date().toISOString() });
  });

  // 用户API - 模拟数据
  app.get('/api/v1/users', (req, res) => {
    const { page = 1, limit = 20, keyword = '', platform = '', isVerified } = req.query;
    const keywordStr = String(keyword);
    const platformStr = String(platform);

    let users = [
      {
        id: 1,
        nickname: '测试用户1',
        avatar: null,
        role: 'user',
        email: 'user1@test.com',
        phone: '13800138001',
        platform: 'wechat',
        isVerified: true,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        nickname: '测试用户2',
        avatar: null,
        role: 'user',
        email: 'user2@test.com',
        phone: '13800138002',
        platform: 'app',
        isVerified: false,
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
        lastLoginAt: '2024-01-14T15:20:00Z'
      },
      {
        id: 3,
        nickname: '管理员',
        avatar: null,
        role: 'admin',
        email: 'admin@test.com',
        phone: '13800138000',
        platform: 'web',
        isVerified: true,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-16T09:00:00Z'
      },
      {
        id: 4,
        nickname: '摄影师小王',
        avatar: null,
        role: 'photographer',
        email: 'photographer1@test.com',
        phone: '13800138003',
        platform: 'wechat',
        isVerified: true,
        status: 'active',
        createdAt: '2024-01-03T00:00:00Z',
        lastLoginAt: '2024-01-15T14:00:00Z'
      },
      {
        id: 5,
        nickname: '模特小李',
        avatar: null,
        role: 'model',
        email: 'model1@test.com',
        phone: '13800138004',
        platform: 'app',
        isVerified: false,
        status: 'inactive',
        createdAt: '2024-01-04T00:00:00Z',
        lastLoginAt: '2024-01-10T16:30:00Z'
      }
    ];

    // 应用过滤器
    if (keywordStr) {
      users = users.filter(user =>
        user.nickname.includes(keywordStr) ||
        user.email.includes(keywordStr) ||
        user.phone.includes(keywordStr)
      );
    }

    if (platformStr) {
      users = users.filter(user => user.platform === platformStr);
    }

    if (isVerified !== undefined) {
      users = users.filter(user => user.isVerified === (isVerified === 'true'));
    }

    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: users.length,
          totalPages: Math.ceil(users.length / Number(limit))
        }
      }
    });
  });

  // 用户统计API
  app.get('/api/v1/users/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        total: 5,
        verified: 3,
        active: 4,
        newToday: 1
      }
    });
  });

  // 获取单个用户详情
  app.get('/api/v1/users/:id', (req, res) => {
    const { id } = req.params;
    const user = {
      id: Number(id),
      nickname: `测试用户${id}`,
      avatar: null,
      role: 'user',
      email: `user${id}@test.com`,
      phone: `1380013800${id}`,
      platform: 'wechat',
      isVerified: true,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T10:30:00Z'
    };

    res.json({
      success: true,
      data: user
    });
  });

  // 更新用户状态
  app.patch('/api/v1/users/:id/status', (req, res) => {
    const { id } = req.params;
    const { isVerified, status } = req.body;

    res.json({
      success: true,
      data: {
        id: Number(id),
        isVerified,
        status,
        updatedAt: new Date().toISOString()
      }
    });
  });

  // 删除用户
  app.delete('/api/v1/users/:id', (req, res) => {
    const { id } = req.params;

    res.json({
      success: true,
      message: `用户 ${id} 已删除`
    });
  });

  // 作品API - 模拟数据
  app.get('/api/v1/works', (req, res) => {
    const { page = 1, limit = 20, keyword = '', category = '', status = '', userId = '' } = req.query;
    const keywordStr = String(keyword);
    const categoryStr = String(category);
    const statusStr = String(status);
    const userIdStr = String(userId);

    let works = [
      {
        id: '1',
        title: '夕阳下的婚纱照',
        description: '在海边拍摄的浪漫婚纱照片',
        category: 'wedding',
        location: '三亚海滩',
        tags: ['婚纱', '海边', '浪漫', '夕阳'],
        images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
        coverImage: 'https://picsum.photos/800/600?random=1',
        status: 'published',
        isPremium: true,
        price: 99,
        author: {
          id: '1',
          nickname: '测试用户1',
          avatarUrl: 'https://picsum.photos/100/100?random=11',
          isVerified: true
        },
        stats: {
          likeCount: 128,
          commentCount: 23,
          viewCount: 1520,
          collectCount: 45
        },
        createdAt: '2024-01-10T14:30:00Z',
        updatedAt: '2024-01-10T14:30:00Z'
      },
      {
        id: '2',
        title: '都市夜景人像',
        description: '城市霓虹灯下的时尚人像摄影',
        category: 'portrait',
        location: '上海外滩',
        tags: ['人像', '夜景', '都市', '时尚'],
        images: ['https://picsum.photos/800/600?random=3'],
        coverImage: 'https://picsum.photos/800/600?random=3',
        status: 'pending',
        isPremium: false,
        price: 0,
        author: {
          id: '2',
          nickname: '测试用户2',
          avatarUrl: 'https://picsum.photos/100/100?random=12',
          isVerified: false
        },
        stats: {
          likeCount: 89,
          commentCount: 12,
          viewCount: 456,
          collectCount: 18
        },
        createdAt: '2024-01-11T16:20:00Z',
        updatedAt: '2024-01-11T16:20:00Z'
      },
      {
        id: '3',
        title: '自然风光摄影',
        description: '山川湖海的壮美景色',
        category: 'landscape',
        location: '张家界',
        tags: ['风光', '自然', '山川', '壮美'],
        images: ['https://picsum.photos/800/600?random=4', 'https://picsum.photos/800/600?random=5', 'https://picsum.photos/800/600?random=6'],
        coverImage: 'https://picsum.photos/800/600?random=4',
        status: 'published',
        isPremium: true,
        price: 199,
        author: {
          id: '4',
          nickname: '摄影师小王',
          avatarUrl: 'https://picsum.photos/100/100?random=14',
          isVerified: true
        },
        stats: {
          likeCount: 256,
          commentCount: 67,
          viewCount: 2340,
          collectCount: 89
        },
        createdAt: '2024-01-12T09:15:00Z',
        updatedAt: '2024-01-12T09:15:00Z'
      },
      {
        id: '4',
        title: '街头摄影作品',
        description: '记录城市生活的瞬间',
        category: 'street',
        location: '北京胡同',
        tags: ['街头', '生活', '纪实', '城市'],
        images: ['https://picsum.photos/800/600?random=7'],
        coverImage: 'https://picsum.photos/800/600?random=7',
        status: 'rejected',
        isPremium: false,
        price: 0,
        author: {
          id: '1',
          nickname: '测试用户1',
          avatarUrl: 'https://picsum.photos/100/100?random=11',
          isVerified: true
        },
        stats: {
          likeCount: 23,
          commentCount: 5,
          viewCount: 145,
          collectCount: 8
        },
        createdAt: '2024-01-13T11:45:00Z',
        updatedAt: '2024-01-13T11:45:00Z'
      }
    ];

    // 应用过滤器
    if (keywordStr) {
      works = works.filter(work =>
        work.title.includes(keywordStr) ||
        work.description.includes(keywordStr) ||
        work.author.nickname.includes(keywordStr)
      );
    }

    if (categoryStr) {
      works = works.filter(work => work.category === categoryStr);
    }

    if (statusStr) {
      works = works.filter(work => work.status === statusStr);
    }

    if (userIdStr) {
      works = works.filter(work => work.author.id === userIdStr);
    }

    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedWorks = works.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedWorks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: works.length,
          totalPages: Math.ceil(works.length / Number(limit))
        }
      }
    });
  });

  // 作品统计API
  app.get('/api/v1/works/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        total: 4,
        published: 2,
        pending: 1,
        rejected: 1,
        newToday: 1
      }
    });
  });

  // 获取单个作品详情
  app.get('/api/v1/works/:id', (req, res) => {
    const { id } = req.params;
    const work = {
      id: id,
      title: `测试作品${id}`,
      description: `这是测试作品${id}的详细描述`,
      category: 'portrait',
      location: '工作室',
      tags: ['人像', '测试', '摄影'],
      images: [`https://picsum.photos/800/600?random=${id}0`],
      coverImage: `https://picsum.photos/800/600?random=${id}0`,
      status: 'published',
      isPremium: false,
      price: 0,
      author: {
        id: '1',
        nickname: '测试用户1',
        avatarUrl: 'https://picsum.photos/100/100?random=11',
        isVerified: true
      },
      stats: {
        likeCount: 100,
        commentCount: 15,
        viewCount: 500,
        collectCount: 25
      },
      createdAt: '2024-01-10T14:30:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    };

    res.json({
      success: true,
      data: work
    });
  });

  // 更新作品状态
  app.patch('/api/v1/works/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    res.json({
      success: true,
      data: {
        id: Number(id),
        status,
        reason,
        updatedAt: new Date().toISOString()
      }
    });
  });

  // 删除作品
  app.delete('/api/v1/works/:id', (req, res) => {
    const { id } = req.params;

    res.json({
      success: true,
      message: `作品 ${id} 已删除`
    });
  });

  // 预约API - 模拟数据
  app.get('/api/v1/appointments', (req, res) => {
    const { page = 1, limit = 20, keyword = '', status = '', photographerId = '' } = req.query;
    const keywordStr = String(keyword);
    const statusStr = String(status);
    const photographerIdStr = String(photographerId);

    let appointments = [
      {
        id: 1,
        title: '海边婚纱摄影',
        description: '希望在海边拍摄浪漫的婚纱照',
        userId: 1,
        userName: '测试用户1',
        userAvatar: null,
        photographerId: 4,
        photographerName: '摄影师小王',
        photographerAvatar: null,
        status: 'pending',
        type: 'wedding',
        location: '三亚海滩',
        scheduledDate: '2024-02-14T10:00:00Z',
        duration: 4,
        budget: 3000,
        requirements: '希望拍摄日出时分的照片',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z'
      },
      {
        id: 2,
        title: '个人写真拍摄',
        description: '想要拍一组时尚的个人写真',
        userId: 2,
        userName: '测试用户2',
        userAvatar: null,
        photographerId: 4,
        photographerName: '摄影师小王',
        photographerAvatar: null,
        status: 'confirmed',
        type: 'portrait',
        location: '工作室',
        scheduledDate: '2024-01-20T14:00:00Z',
        duration: 2,
        budget: 1500,
        requirements: '希望风格偏向日系清新',
        createdAt: '2024-01-14T16:20:00Z',
        updatedAt: '2024-01-15T10:15:00Z'
      },
      {
        id: 3,
        title: '商业产品拍摄',
        description: '需要拍摄一批产品照片用于电商',
        userId: 3,
        userName: '管理员',
        userAvatar: null,
        photographerId: 4,
        photographerName: '摄影师小王',
        photographerAvatar: null,
        status: 'in_progress',
        type: 'commercial',
        location: '摄影棚',
        scheduledDate: '2024-01-18T09:00:00Z',
        duration: 6,
        budget: 5000,
        requirements: '白底产品照，需要多角度拍摄',
        createdAt: '2024-01-13T11:45:00Z',
        updatedAt: '2024-01-16T08:30:00Z'
      },
      {
        id: 4,
        title: '宠物摄影',
        description: '为我的小狗拍摄一组可爱的照片',
        userId: 5,
        userName: '模特小李',
        userAvatar: null,
        photographerId: 4,
        photographerName: '摄影师小王',
        photographerAvatar: null,
        status: 'completed',
        type: 'pet',
        location: '公园',
        scheduledDate: '2024-01-10T15:00:00Z',
        duration: 1,
        budget: 800,
        requirements: '希望拍出宠物的活泼可爱',
        createdAt: '2024-01-08T14:20:00Z',
        updatedAt: '2024-01-10T17:00:00Z'
      },
      {
        id: 5,
        title: '活动摄影',
        description: '公司年会活动摄影',
        userId: 1,
        userName: '测试用户1',
        userAvatar: null,
        photographerId: 4,
        photographerName: '摄影师小王',
        photographerAvatar: null,
        status: 'cancelled',
        type: 'event',
        location: '酒店宴会厅',
        scheduledDate: '2024-01-25T18:00:00Z',
        duration: 3,
        budget: 2000,
        requirements: '需要拍摄活动全程',
        createdAt: '2024-01-12T10:00:00Z',
        updatedAt: '2024-01-14T09:00:00Z'
      }
    ];

    // 应用过滤器
    if (keywordStr) {
      appointments = appointments.filter(appointment =>
        appointment.title.includes(keywordStr) ||
        appointment.description.includes(keywordStr) ||
        appointment.userName.includes(keywordStr) ||
        appointment.photographerName.includes(keywordStr)
      );
    }

    if (statusStr) {
      appointments = appointments.filter(appointment => appointment.status === statusStr);
    }

    if (photographerIdStr) {
      appointments = appointments.filter(appointment => appointment.photographerId === Number(photographerIdStr));
    }

    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedAppointments = appointments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedAppointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: appointments.length,
          totalPages: Math.ceil(appointments.length / Number(limit))
        }
      }
    });
  });

  // 预约统计API
  app.get('/api/v1/appointments/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        total: 5,
        open: 1,
        inProgress: 1,
        completed: 1,
        cancelled: 1,
        photographerSeek: 3,
        modelSeek: 2,
        newToday: 1
      }
    });
  });

  // 获取单个预约详情
  app.get('/api/v1/appointments/:id', (req, res) => {
    const { id } = req.params;
    const appointment = {
      id: Number(id),
      title: `测试预约${id}`,
      description: `这是测试预约${id}的详细描述`,
      userId: 1,
      userName: '测试用户1',
      photographerId: 4,
      photographerName: '摄影师小王',
      status: 'pending',
      type: 'portrait',
      location: '工作室',
      scheduledDate: '2024-01-20T14:00:00Z',
      duration: 2,
      budget: 1500,
      requirements: '测试需求',
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T09:30:00Z'
    };

    res.json({
      success: true,
      data: appointment
    });
  });

  // 更新预约状态
  app.patch('/api/v1/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    res.json({
      success: true,
      data: {
        id: Number(id),
        status,
        reason,
        updatedAt: new Date().toISOString()
      }
    });
  });

  // 消息API - 模拟数据
  app.get('/api/v1/messages', (req, res) => {
    res.json({ 
      success: true,
      data: [
        { id: 1, content: '你好，我想预约拍摄', senderId: 1, receiverId: 2, createdAt: new Date() },
        { id: 2, content: '好的，什么时候方便？', senderId: 2, receiverId: 1, createdAt: new Date() }
      ],
      total: 2
    });
  });

  // 支付API - 模拟数据
  app.get('/api/v1/payments/orders', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, amount: 50000, status: 'paid', description: '婚纱摄影服务', userId: 1 },
        { id: 2, amount: 30000, status: 'pending', description: '个人写真服务', userId: 2 }
      ],
      total: 2
    });
  });

  // 管理员支付订单API
  app.get('/api/v1/payments/admin/orders', (req, res) => {
    const { page = 1, limit = 20, search = '', status = '', method = '' } = req.query;
    const searchStr = String(search);
    const statusStr = String(status);
    const methodStr = String(method);

    let orders = [
      {
        id: 1,
        orderNo: 'ORD202401150001',
        amount: 50000,
        status: 'paid',
        method: 'wechat',
        description: '婚纱摄影服务',
        userId: 1,
        userName: '测试用户1',
        userPhone: '13800138001',
        appointmentId: 1,
        appointmentTitle: '海边婚纱摄影',
        createdAt: '2024-01-15T10:30:00Z',
        paidAt: '2024-01-15T10:35:00Z',
        refundAmount: 0,
        refundStatus: null
      },
      {
        id: 2,
        orderNo: 'ORD202401160002',
        amount: 30000,
        status: 'pending',
        method: 'alipay',
        description: '个人写真服务',
        userId: 2,
        userName: '测试用户2',
        userPhone: '13800138002',
        appointmentId: 2,
        appointmentTitle: '个人写真拍摄',
        createdAt: '2024-01-16T14:20:00Z',
        paidAt: null,
        refundAmount: 0,
        refundStatus: null
      },
      {
        id: 3,
        orderNo: 'ORD202401140003',
        amount: 80000,
        status: 'paid',
        method: 'wechat',
        description: '商业产品拍摄',
        userId: 3,
        userName: '管理员',
        userPhone: '13800138000',
        appointmentId: 3,
        appointmentTitle: '商业产品拍摄',
        createdAt: '2024-01-14T09:15:00Z',
        paidAt: '2024-01-14T09:20:00Z',
        refundAmount: 10000,
        refundStatus: 'partial'
      },
      {
        id: 4,
        orderNo: 'ORD202401130004',
        amount: 15000,
        status: 'refunded',
        method: 'alipay',
        description: '宠物摄影',
        userId: 5,
        userName: '模特小李',
        userPhone: '13800138004',
        appointmentId: 4,
        appointmentTitle: '宠物摄影',
        createdAt: '2024-01-13T16:45:00Z',
        paidAt: '2024-01-13T16:50:00Z',
        refundAmount: 15000,
        refundStatus: 'full'
      },
      {
        id: 5,
        orderNo: 'ORD202401120005',
        amount: 25000,
        status: 'cancelled',
        method: 'wechat',
        description: '活动摄影',
        userId: 1,
        userName: '测试用户1',
        userPhone: '13800138001',
        appointmentId: 5,
        appointmentTitle: '活动摄影',
        createdAt: '2024-01-12T11:30:00Z',
        paidAt: null,
        refundAmount: 0,
        refundStatus: null
      }
    ];

    // 应用过滤器
    if (searchStr) {
      orders = orders.filter(order =>
        order.orderNo.includes(searchStr) ||
        order.userName.includes(searchStr) ||
        order.userPhone.includes(searchStr) ||
        order.description.includes(searchStr) ||
        order.appointmentTitle.includes(searchStr)
      );
    }

    if (statusStr) {
      orders = orders.filter(order => order.status === statusStr);
    }

    if (methodStr) {
      orders = orders.filter(order => order.method === methodStr);
    }

    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        items: paginatedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: orders.length,
          totalPages: Math.ceil(orders.length / Number(limit))
        }
      }
    });
  });

  // 管理员支付统计API
  app.get('/api/v1/payments/admin/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        totalOrders: 5,
        totalAmount: 200000,
        paidOrders: 2,
        paidAmount: 130000,
        pendingOrders: 1,
        pendingAmount: 30000,
        refundedOrders: 1,
        refundedAmount: 15000,
        cancelledOrders: 1,
        cancelledAmount: 25000,
        todayOrders: 1,
        todayAmount: 30000,
        wechatOrders: 3,
        wechatAmount: 125000,
        alipayOrders: 2,
        alipayAmount: 45000
      }
    });
  });

  // 系统统计API
  app.get('/api/v1/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        users: 5,
        works: 4,
        appointments: 5,
        messages: 12
      }
    });
  });

  // 趋势数据API
  app.get('/api/v1/stats/trend', (req, res) => {
    const { period = 'week' } = req.query;

    let dates: string[] = [];
    let users: number[] = [];
    let works: number[] = [];
    let appointments: number[] = [];

    if (period === 'week') {
      dates = ['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14', '2024-01-15', '2024-01-16'];
      users = [1, 2, 1, 0, 1, 0, 0];
      works = [0, 1, 1, 1, 0, 1, 0];
      appointments = [1, 1, 1, 0, 1, 1, 0];
    } else if (period === 'month') {
      dates = ['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22', '2024-01-29'];
      users = [2, 1, 1, 1, 0];
      works = [1, 2, 1, 0, 0];
      appointments = [2, 2, 1, 0, 0];
    } else {
      dates = ['2024-01', '2024-02', '2024-03'];
      users = [5, 0, 0];
      works = [4, 0, 0];
      appointments = [5, 0, 0];
    }

    res.json({
      success: true,
      data: {
        dates,
        users,
        works,
        appointments
      }
    });
  });

  // 消息对话列表API
  app.get('/api/v1/messages/conversations', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          user: {
            id: 1,
            nickname: '测试用户1',
            avatar: null,
            isOnline: true
          },
          lastMessage: {
            id: 1,
            content: '你好，我想预约拍摄',
            senderId: 1,
            createdAt: '2024-01-16T10:30:00Z'
          },
          unreadCount: 2,
          updatedAt: '2024-01-16T10:30:00Z'
        },
        {
          id: 2,
          user: {
            id: 2,
            nickname: '测试用户2',
            avatar: null,
            isOnline: false
          },
          lastMessage: {
            id: 5,
            content: '谢谢，照片很满意',
            senderId: 2,
            createdAt: '2024-01-15T16:45:00Z'
          },
          unreadCount: 0,
          updatedAt: '2024-01-15T16:45:00Z'
        },
        {
          id: 3,
          user: {
            id: 5,
            nickname: '模特小李',
            avatar: null,
            isOnline: true
          },
          lastMessage: {
            id: 8,
            content: '什么时候可以看到照片？',
            senderId: 5,
            createdAt: '2024-01-14T14:20:00Z'
          },
          unreadCount: 1,
          updatedAt: '2024-01-14T14:20:00Z'
        }
      ]
    });
  });

  // 获取对话消息API
  app.get('/api/v1/messages/conversations/:userId', (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = [
      {
        id: 1,
        content: '你好，我想预约拍摄',
        senderId: Number(userId),
        receiverId: 4,
        type: 'text',
        createdAt: '2024-01-16T10:30:00Z',
        readAt: null
      },
      {
        id: 2,
        content: '好的，什么时候方便？',
        senderId: 4,
        receiverId: Number(userId),
        type: 'text',
        createdAt: '2024-01-16T10:32:00Z',
        readAt: '2024-01-16T10:33:00Z'
      },
      {
        id: 3,
        content: '下周末可以吗？',
        senderId: Number(userId),
        receiverId: 4,
        type: 'text',
        createdAt: '2024-01-16T10:35:00Z',
        readAt: null
      }
    ];

    res.json({
      success: true,
      data: {
        items: messages,
        total: messages.length,
        page: Number(page),
        limit: Number(limit)
      }
    });
  });

  // 获取未读消息数量API
  app.get('/api/v1/messages/unread-count', (req, res) => {
    res.json({
      success: true,
      data: {
        count: 3,
        conversations: [
          { userId: 1, count: 2 },
          { userId: 5, count: 1 }
        ]
      }
    });
  });

  // 系统设置API - 模拟数据
  app.get('/api/v1/system/settings', (req, res) => {
    res.json({
      success: true,
      data: {
        siteName: '懂拍帝摄影平台',
        siteDescription: '专业的摄影社交平台',
        contactEmail: 'admin@dongpaidi.com',
        maintenanceMode: false
      }
    });
  });

  // 404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `路由 ${req.originalUrl} 未找到`,
      timestamp: new Date().toISOString()
    });
  });

  // 错误处理
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('服务器错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  });

  return app;
};

/**
 * 启动服务器
 */
export const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    const port = 3000;

    app.listen(port, () => {
      console.log(`🚀 简化版服务器启动成功！`);
      console.log(`📍 服务器地址: http://localhost:${port}`);
      console.log(`🏥 健康检查: http://localhost:${port}/health`);
      console.log(`🧪 测试API: http://localhost:${port}/api/v1/test`);
      console.log(`👥 用户API: http://localhost:${port}/api/v1/users`);
      console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此文件
if (require.main === module) {
  startServer();
}
