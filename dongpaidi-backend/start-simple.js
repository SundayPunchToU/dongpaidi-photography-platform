/**
 * 简化启动脚本
 * 使用JavaScript启动整合后的后端服务，避免TypeScript编译问题
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// 基础中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(morgan('combined'));

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 管理后台静态资源服务 - 仅处理assets目录下的静态文件
app.use('/admin/assets', express.static(path.join(__dirname, 'admin-panel/dist/assets')));

// 管理后台SPA路由支持 - 必须在通用静态文件服务之前
app.get('/admin/*', (req, res) => {
  // 如果请求的是静态资源文件，则跳过SPA处理
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
    return res.status(404).send('Static file not found');
  }

  // 安全检查：防止路径遍历攻击
  if (req.path.includes('..') || req.path.includes('~')) {
    return res.status(403).send('Forbidden');
  }

  console.log(`SPA路由处理: ${req.path}`);

  // 设置正确的缓存头
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.sendFile(path.join(__dirname, 'admin-panel/dist/index.html'));
});

// 管理后台根路径重定向
app.get('/admin', (req, res) => {
  res.redirect('/admin/');
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '系统运行正常',
    timestamp: new Date().toISOString(),
    service: 'dongpaidi-integrated-api'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    service: 'dongpaidi-integrated-api',
    version: '1.0.0'
  });
});

// 信任代理
app.set('trust proxy', 1);

// 响应中间件 - 整合的功能
app.use((req, res, next) => {
  res.success = function(data = null, message = '操作成功', meta = null) {
    const response = {
      success: true,
      message,
      code: 200,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    if (meta !== null) {
      response.meta = meta;
    }

    return res.json(response);
  };

  res.error = function(message = '操作失败', code = 400, data = null) {
    const response = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(code).json(response);
  };

  res.paginated = function(data, page, limit, total, message = '获取成功') {
    const totalPages = Math.ceil(total / limit);
    
    const meta = {
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: parseInt(total.toString()),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    const response = {
      success: true,
      data,
      message,
      code: 200,
      timestamp: new Date().toISOString(),
      meta
    };

    return res.json(response);
  };

  next();
});

// 会话管理 - 整合的功能
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createSession(user) {
  const sessionId = generateSessionId();
  const sessionData = {
    user: user,  // 保存完整的用户对象
    loginTime: Date.now(),
    lastActivity: Date.now()
  };

  sessions.set(sessionId, sessionData);
  console.log('创建会话:', sessionId, sessionData);
  return sessionId;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function updateSessionActivity(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);
  }
}

// 认证中间件
function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;

  console.log('认证检查:', { sessionId, hasSession: !!sessionId });

  if (!sessionId) {
    return res.error('未提供会话ID', 401);
  }

  const session = getSession(sessionId);
  console.log('获取会话:', { sessionId, session });

  if (!session) {
    return res.error('会话无效或已过期', 401);
  }

  updateSessionActivity(sessionId);
  req.session = session;
  req.sessionId = sessionId;
  req.user = session.user || session;  // 兼容两种数据结构

  next();
}

// 模拟数据
const mockUsers = [
  { id: "user_1_" + Date.now(), username: "photographer1", email: "photo1@example.com", nickname: "摄影师小王", role: "photographer", isVerified: true, status: "active", avatar: "/avatars/photographer1.jpg", phone: "13800138001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "user_2_" + Date.now(), username: "model1", email: "model1@example.com", nickname: "模特小李", role: "model", isVerified: true, status: "active", avatar: "/avatars/model1.jpg", phone: "13800138002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// API路由
const apiRouter = express.Router();

// 根路径
app.get('/', (req, res) => {
  res.success({
    service: '懂拍帝后端API服务',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  }, 'API服务运行正常');
});



// 测试页面 - 用于调试
app.get('/admin/test', (req, res) => {
  res.send(`
    <html>
      <head><title>管理后台测试</title></head>
      <body>
        <h1>管理后台测试页面</h1>
        <p>如果您能看到这个页面，说明路由配置正常</p>
        <p>时间: ${new Date().toISOString()}</p>
        <a href="/admin/">返回管理后台</a>
      </body>
    </html>
  `);
});

// 管理员登录
apiRouter.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.error('用户名和密码不能为空', 400);
  }

  if (username === 'admin@dongpaidi.com' && password === 'admin123456') {
    const user = {
      username: 'admin@dongpaidi.com',
      email: 'admin@dongpaidi.com',
      loginTime: new Date().toISOString(),
      role: 'admin'
    };

    const sessionId = createSession(user);

    return res.success({
      user,
      sessionId
    }, '登录成功');
  } else {
    return res.error('用户名或密码错误', 401);
  }
});

// 获取当前用户信息API
apiRouter.get('/admin/profile', requireAuth, (req, res) => {
  const session = req.session;
  if (session && session.user) {
    res.success(session.user, '获取用户信息成功');
  } else {
    res.error('用户信息不存在', 404);
  }
});

// 用户列表
apiRouter.get('/users', requireAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.paginated(mockUsers, page, limit, mockUsers.length, '获取用户列表成功');
});

// 其他API路由...
apiRouter.get('/works', requireAuth, (req, res) => {
  res.success([], '获取作品列表成功');
});

apiRouter.get('/appointments', requireAuth, (req, res) => {
  res.success([], '获取约拍列表成功');
});

apiRouter.get('/messages', requireAuth, (req, res) => {
  const mockMessages = [
    {
      id: 'msg_001',
      from: {
        id: 'user_001',
        username: '张三',
        avatarUrl: '/uploads/avatars/default.jpg'
      },
      to: {
        id: 'admin',
        username: '管理员',
        avatarUrl: '/uploads/avatars/admin.jpg'
      },
      content: '您好，我想咨询一下约拍的相关事宜',
      type: 'text',
      status: 'unread',
      createdAt: '2025-09-14T10:30:00Z',
      updatedAt: '2025-09-14T10:30:00Z'
    },
    {
      id: 'msg_002',
      from: {
        id: 'user_002',
        username: '李四',
        avatarUrl: '/uploads/avatars/default.jpg'
      },
      to: {
        id: 'admin',
        username: '管理员',
        avatarUrl: '/uploads/avatars/admin.jpg'
      },
      content: '请问外景拍摄的价格是多少？',
      type: 'text',
      status: 'read',
      createdAt: '2025-09-14T09:15:00Z',
      updatedAt: '2025-09-14T09:15:00Z'
    }
  ];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  res.paginated(mockMessages, page, limit, mockMessages.length, '获取消息列表成功');
});

// 消息会话列表API
apiRouter.get('/messages/conversations', requireAuth, (req, res) => {
  const mockConversations = [
    {
      id: 'conv_001',
      userId: 'user_1',
      user: {
        id: 'user_1',
        username: 'photographer1',
        nickname: '摄影师小王',
        email: 'photo1@example.com',
        avatar: '/avatars/photographer1.jpg',
        role: 'photographer'
      },
      lastMessage: {
        id: 'msg_001',
        content: '您好，我想预约拍摄服务',
        senderId: 'user_1',
        timestamp: new Date().toISOString()
      },
      unreadCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'conv_002',
      userId: 'user_2',
      user: {
        id: 'user_2',
        username: 'model1',
        nickname: '模特小李',
        email: 'model1@example.com',
        avatar: '/avatars/model1.jpg',
        role: 'model'
      },
      lastMessage: {
        id: 'msg_002',
        content: '拍摄效果很满意，谢谢！',
        senderId: 'user_2',
        timestamp: new Date().toISOString()
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'conv_003',
      userId: 'user_3',
      user: {
        id: 'user_3',
        username: 'client1',
        nickname: '客户张三',
        email: 'client1@example.com',
        avatar: '/avatars/client1.jpg',
        role: 'client'
      },
      lastMessage: {
        id: 'msg_003',
        content: '请问什么时候可以看到精修后的照片？',
        senderId: 'user_3',
        timestamp: new Date().toISOString()
      },
      unreadCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  res.success(mockConversations, '获取消息会话成功');
});

// 获取未读消息数量API
apiRouter.get('/messages/unread-count', requireAuth, (req, res) => {
  res.success({ count: 3 }, '获取未读消息数量成功');
});

apiRouter.get('/payments', requireAuth, (req, res) => {
  const mockPayments = [
    {
      id: 'pay_001',
      orderId: 'order_20250914001',
      user: {
        id: 'user_001',
        username: '张三',
        avatarUrl: '/uploads/avatars/default.jpg'
      },
      amount: 1200.00,
      status: 'completed',
      method: 'wechat',
      description: '个人写真拍摄套餐',
      createdAt: '2025-09-14T10:30:00Z',
      completedAt: '2025-09-14T10:31:00Z'
    },
    {
      id: 'pay_002',
      orderId: 'order_20250914002',
      user: {
        id: 'user_002',
        username: '李四',
        avatarUrl: '/uploads/avatars/default.jpg'
      },
      amount: 800.00,
      status: 'pending',
      method: 'alipay',
      description: '情侣写真拍摄套餐',
      createdAt: '2025-09-14T09:15:00Z',
      completedAt: null
    }
  ];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  res.paginated(mockPayments, page, limit, mockPayments.length, '获取支付列表成功');
});

// 支付统计API (用户端)
apiRouter.get('/payments/stats', requireAuth, (req, res) => {
  res.success({
    total: 125000,
    thisMonth: 45600,
    orders: {
      total: 680,
      completed: 520,
      pending: 45
    },
    growth: {
      monthly: 25.8
    }
  }, '获取支付统计成功');
});

apiRouter.get('/stats', requireAuth, (req, res) => {
  res.success({
    users: mockUsers.length,
    works: 0,
    appointments: 0,
    messages: 0
  }, '获取统计数据成功');
});

// 统计趋势API
apiRouter.get('/stats/trend', requireAuth, (req, res) => {
  res.success({
    users: [120, 132, 101, 134, 90, 230, 210],
    works: [220, 182, 191, 234, 290, 330, 310],
    appointments: [150, 232, 201, 154, 190, 330, 410],
    revenue: [35000, 42000, 38000, 45000, 52000, 61000, 58000]
  }, '获取趋势统计成功');
});

// 用户统计API
apiRouter.get('/users/stats', requireAuth, (req, res) => {
  res.success({
    total: 1250,
    active: 980,
    photographers: 650,
    models: 600,
    growth: {
      daily: 15,
      weekly: 89,
      monthly: 320
    },
    verification: {
      verified: 890,
      pending: 45,
      rejected: 12
    }
  }, '获取用户统计成功');
});

// 作品统计API
apiRouter.get('/works/stats', requireAuth, (req, res) => {
  res.success({
    total: 3200,
    published: 2890,
    draft: 310,
    categories: {
      portrait: 1200,
      wedding: 800,
      commercial: 650,
      art: 550
    },
    growth: {
      daily: 25,
      weekly: 156,
      monthly: 580
    }
  }, '获取作品统计成功');
});

// 预约统计API
apiRouter.get('/appointments/stats', requireAuth, (req, res) => {
  res.success({
    total: 680,
    pending: 45,
    confirmed: 520,
    completed: 98,
    cancelled: 17,
    growth: {
      daily: 8,
      weekly: 42,
      monthly: 165
    }
  }, '获取预约统计成功');
});

// 未读消息数量API
apiRouter.get('/messages/unread-count', requireAuth, (req, res) => {
  res.success({
    count: 23,
    categories: {
      system: 5,
      user: 12,
      appointment: 6
    }
  }, '获取未读消息数量成功');
});

// 支付订单管理API
apiRouter.get('/payments/admin/orders', requireAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const mockOrders = [
    {
      id: 'order_001',
      userId: 'user_1',
      user: {
        id: 'user_1',
        username: 'photographer1',
        nickname: '摄影师小王',
        email: 'photo1@example.com',
        avatar: '/avatars/photographer1.jpg',
        avatarUrl: '/avatars/photographer1.jpg'
      },
      amount: 1200,
      status: 'completed',
      method: 'wechat',
      type: 'appointment',
      description: '人像拍摄服务',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [
        {
          id: 'pay_001',
          amount: 1200,
          status: 'completed',
          method: 'wechat',
          transactionId: 'wx_20250915001'
        }
      ]
    },
    {
      id: 'order_002',
      userId: 'user_2',
      user: {
        id: 'user_2',
        username: 'model1',
        nickname: '模特小李',
        email: 'model1@example.com',
        avatar: '/avatars/model1.jpg',
        avatarUrl: '/avatars/model1.jpg'
      },
      amount: 800,
      status: 'pending',
      method: 'alipay',
      type: 'work',
      description: '作品购买',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [
        {
          id: 'pay_002',
          amount: 800,
          status: 'pending',
          method: 'alipay',
          transactionId: 'ali_20250915002'
        }
      ]
    },
    {
      id: 'order_003',
      userId: 'user_3',
      user: {
        id: 'user_3',
        username: 'client1',
        nickname: '客户张三',
        email: 'client1@example.com',
        avatar: '/avatars/client1.jpg',
        avatarUrl: '/avatars/client1.jpg'
      },
      amount: 1500,
      status: 'completed',
      method: 'wechat',
      type: 'appointment',
      description: '婚纱摄影套餐',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [
        {
          id: 'pay_003',
          amount: 1500,
          status: 'completed',
          method: 'wechat',
          transactionId: 'wx_20250915003'
        }
      ]
    }
  ];

  res.paginated(mockOrders, page, limit, mockOrders.length, '获取支付订单成功');
});

// 支付统计API
apiRouter.get('/payments/admin/stats', requireAuth, (req, res) => {
  res.success({
    total: 125000,
    today: 3200,
    thisMonth: 45600,
    orders: {
      total: 680,
      completed: 520,
      pending: 45,
      failed: 17
    },
    growth: {
      daily: 8.5,
      weekly: 12.3,
      monthly: 25.8
    },
    topCategories: [
      { name: '人像拍摄', amount: 45000, percentage: 36 },
      { name: '婚纱摄影', amount: 38000, percentage: 30.4 },
      { name: '商业摄影', amount: 25000, percentage: 20 },
      { name: '艺术摄影', amount: 17000, percentage: 13.6 }
    ]
  }, '获取支付统计成功');
});

// 注册API路由
app.use('/api/v1', apiRouter);

// 404处理
app.use((req, res) => {
  res.error(`Route ${req.method} ${req.path} not found`, 404);
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.error('Internal Server Error', 500);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 整合后的懂拍帝后端服务运行在端口 ${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}`);
  console.log(`🔧 管理后台: http://localhost/admin/`);
  console.log(`✨ 整合功能: 统一响应处理、会话管理、错误处理、日志系统`);
});

// 定期清理过期会话
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24小时
  
  for (const [sessionId, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > maxAge) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // 每小时清理一次
