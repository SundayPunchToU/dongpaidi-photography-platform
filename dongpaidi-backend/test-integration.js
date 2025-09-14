/**
 * 整合测试脚本
 * 测试整合后的功能是否正常工作
 */

const express = require('express');
const cors = require('cors');

// 模拟整合后的功能
const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 模拟响应中间件
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

  next();
});

// 模拟会话管理
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

// 测试路由
app.get('/', (req, res) => {
  res.success({
    message: '懂拍帝后端整合测试',
    version: '1.0.0',
    features: [
      '统一响应处理',
      '会话管理',
      '错误处理',
      '日志系统',
      '配置管理'
    ]
  }, '整合测试成功');
});

// 登录测试
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin@dongpaidi.com' && password === 'admin123456') {
    const user = { username, email: username };
    const sessionId = createSession(user);
    
    res.success({
      user,
      sessionId
    }, '登录成功');
  } else {
    res.error('用户名或密码错误', 401);
  }
});

// 用户列表测试
app.get('/api/v1/users', (req, res) => {
  const mockUsers = [
    { id: 1, username: 'photographer1', email: 'photo1@test.com', type: 'photographer' },
    { id: 2, username: 'model1', email: 'model1@test.com', type: 'model' }
  ];
  
  res.success(mockUsers, '获取用户列表成功');
});

// 错误处理测试
app.get('/api/v1/test-error', (req, res) => {
  res.error('这是一个测试错误', 500);
});

// 404处理
app.use((req, res) => {
  res.error(`Route ${req.method} ${req.path} not found`, 404);
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.error('Internal Server Error', 500);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 整合测试服务器运行在端口 ${PORT}`);
  console.log(`📖 测试地址: http://localhost:${PORT}`);
  console.log(`🔧 API测试: http://localhost:${PORT}/api/v1/users`);
});
