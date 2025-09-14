const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 默认管理员账户
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'dongpaidi2024',
  email: 'admin@dongpaidi.com'
};

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 管理后台
app.use('/admin', express.static(path.join(__dirname, '../admin-panel')));

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
  console.log('收到登录请求:', req.body);
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
      sessionId: sessionId,
      user: {
        username: sessionData.username,
        email: sessionData.email,
        loginTime: sessionData.loginTime
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
    message: '懂拍帝摄影平台管理API服务',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      login: '/api/v1/admin/login',
      dashboard: '/api/v1/admin/dashboard',
      profile: '/api/v1/admin/profile'
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
  console.log(`🚀 懂拍帝管理后台服务启动成功`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📖 API文档: http://0.0.0.0:${PORT}/api/v1`);
  console.log(`❤️  健康检查: http://0.0.0.0:${PORT}/api/v1/health`);
  console.log(`🔐 管理后台: http://0.0.0.0:${PORT}/admin`);
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
