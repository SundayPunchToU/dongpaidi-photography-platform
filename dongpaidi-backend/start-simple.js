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
    id: sessionId,
    username: user.username || user.email,
    email: user.email,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  sessions.set(sessionId, sessionData);
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
  
  if (!sessionId) {
    return res.error('未提供会话ID', 401);
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.error('会话无效或已过期', 401);
  }

  updateSessionActivity(sessionId);
  req.session = session;
  req.sessionId = sessionId;
  
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
      loginTime: new Date().toISOString()
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
  res.success([], '获取消息列表成功');
});

apiRouter.get('/payments', requireAuth, (req, res) => {
  res.success([], '获取支付列表成功');
});

apiRouter.get('/stats', requireAuth, (req, res) => {
  res.success({
    users: mockUsers.length,
    works: 0,
    appointments: 0,
    messages: 0
  }, '获取统计数据成功');
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
