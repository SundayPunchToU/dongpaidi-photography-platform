const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 默认管理员账户
const ADMIN_CREDENTIALS = {
  username: 'admin@dongpaidi.com',
  password: 'admin123456',
  email: 'admin@dongpaidi.com'
};

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务由Nginx处理，这里不需要
// app.use('/admin', express.static(path.join(__dirname, '../admin-panel')));

// 简单的会话管理（生产环境应使用Redis或数据库）
const sessions = new Map();

// 生成会话ID
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 认证中间件
function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: '未授权访问', message: '请先登录' });
  }
  req.session = sessions.get(sessionId);
  next();
}

// 管理员登录
app.post('/api/v1/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const sessionId = generateSessionId();
    const sessionData = {
      id: sessionId,
      username: ADMIN_CREDENTIALS.username,
      email: ADMIN_CREDENTIALS.email,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    sessions.set(sessionId, sessionData);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          username: sessionData.username,
          email: sessionData.email,
          loginTime: sessionData.loginTime
        },
        sessionId: sessionId
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: '登录失败',
      message: '用户名或密码错误'
    });
  }
});

// 管理员登出
app.post('/api/v1/admin/logout', requireAuth, (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  sessions.delete(sessionId);
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 获取当前用户信息
app.get('/api/v1/admin/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.session.username,
      email: req.session.email,
      loginTime: req.session.loginTime,
      lastActivity: req.session.lastActivity
    }
  });
});

// 健康检查端点
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.get('/api/v1', (req, res) => {
  res.json({
    message: '懂拍帝摄影平台API服务',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      users: '/api/v1/users',
      works: '/api/v1/works',
      appointments: '/api/v1/appointments'
    }
  });
});

// 用户相关路由
app.get('/api/v1/users', (req, res) => {
  res.json({
    message: '用户列表',
    data: [],
    total: 0
  });
});

// 用户统计
app.get('/api/v1/users/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      total: 1250,
      verified: 980,
      active: 850,
      newToday: 15
    }
  });
});

// 作品相关路由
app.get('/api/v1/works', (req, res) => {
  res.json({
    message: '作品列表',
    data: [],
    total: 0
  });
});

// 作品统计
app.get('/api/v1/works/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      total: 3200,
      published: 2800,
      pending: 250,
      rejected: 150,
      newToday: 25
    }
  });
});

// 约拍相关路由
app.get('/api/v1/appointments', (req, res) => {
  res.json({
    message: '约拍列表',
    data: [],
    total: 0
  });
});

// 约拍统计
app.get('/api/v1/appointments/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      total: 680,
      open: 120,
      inProgress: 85,
      completed: 450,
      cancelled: 25,
      newToday: 8
    }
  });
});

// ===== 管理员专用API路由 =====

// 管理员仪表板数据
app.get('/api/v1/admin/dashboard', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 0,
        totalWorks: 0,
        totalAppointments: 0,
        todayAppointments: 0
      },
      recentActivities: [],
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      }
    }
  });
});

// 管理员用户管理
app.get('/api/v1/admin/users', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pageSize: 10
  });
});

app.post('/api/v1/admin/users', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '用户创建成功',
    data: { id: Date.now(), ...req.body }
  });
});

app.put('/api/v1/admin/users/:id', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '用户更新成功',
    data: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/v1/admin/users/:id', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '用户删除成功'
  });
});

// 管理员作品管理
app.get('/api/v1/admin/works', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pageSize: 10
  });
});

app.post('/api/v1/admin/works', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '作品创建成功',
    data: { id: Date.now(), ...req.body }
  });
});

app.put('/api/v1/admin/works/:id', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '作品更新成功',
    data: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/v1/admin/works/:id', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '作品删除成功'
  });
});

// 管理员约拍管理
app.get('/api/v1/admin/appointments', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0,
    page: 1,
    pageSize: 10
  });
});

app.put('/api/v1/admin/appointments/:id', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '约拍状态更新成功',
    data: { id: req.params.id, ...req.body }
  });
});

// 系统设置
app.get('/api/v1/admin/settings', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: '懂拍帝摄影平台',
      siteDescription: '专业摄影服务平台',
      contactEmail: 'contact@dongpaidi.com',
      contactPhone: '400-123-4567'
    }
  });
});

app.put('/api/v1/admin/settings', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '设置更新成功',
    data: req.body
  });
});

// 系统总体统计API
app.get('/api/v1/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      users: 1250,
      works: 3200,
      appointments: 680,
      messages: 450
    }
  });
});

// 趋势数据API
app.get('/api/v1/stats/trend', requireAuth, (req, res) => {
  const period = req.query.period || 'week';

  // 根据不同时间段生成模拟数据
  let dates = [];
  let users = [];
  let works = [];
  let appointments = [];

  if (period === 'week') {
    dates = ['2025-09-08', '2025-09-09', '2025-09-10', '2025-09-11', '2025-09-12', '2025-09-13', '2025-09-14'];
    users = [12, 18, 15, 22, 25, 20, 15];
    works = [8, 12, 10, 15, 18, 14, 25];
    appointments = [5, 8, 6, 10, 12, 9, 8];
  } else if (period === 'month') {
    dates = ['2025-08-14', '2025-08-21', '2025-08-28', '2025-09-04', '2025-09-11'];
    users = [85, 92, 78, 105, 98];
    works = [65, 72, 58, 85, 92];
    appointments = [35, 42, 28, 48, 45];
  } else if (period === 'year') {
    dates = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
    users = [320, 350, 380, 420, 450, 480, 520, 580, 620, 680, 750, 820, 890];
    works = [250, 280, 310, 340, 380, 420, 460, 510, 560, 620, 680, 750, 820];
    appointments = [120, 135, 150, 165, 180, 200, 220, 245, 270, 300, 330, 365, 400];
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

// 消息管理API
app.get('/api/v1/messages/unread-count', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      count: 12
    }
  });
});

app.get('/api/v1/messages/conversations', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// 支付管理API
app.get('/api/v1/payments/admin/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 125000,
      totalOrders: 450,
      pendingOrders: 15,
      completedOrders: 420,
      refundedOrders: 15,
      todayRevenue: 2500,
      todayOrders: 8
    }
  });
});

app.get('/api/v1/payments/admin/orders', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 懂拍帝后端服务启动成功`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📖 API文档: http://0.0.0.0:${PORT}/api/v1`);
  console.log(`❤️  健康检查: http://0.0.0.0:${PORT}/api/v1/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});
