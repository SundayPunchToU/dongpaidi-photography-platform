const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 简单的会话管理
const sessions = new Map();

// 生成会话ID
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 默认管理员账户
const ADMIN_CREDENTIALS = {
  username: 'admin@dongpaidi.com',
  password: 'admin123456',
  email: 'admin@dongpaidi.com'
};

// 健康检查
app.get('/api/v1/health', (req, res) => {
  console.log('健康检查请求');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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
      data: {
        user: {
          username: sessionData.username,
          email: sessionData.email,
          loginTime: sessionData.loginTime
        },
        sessionId: sessionId
      },
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 测试服务器启动成功`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`❤️  健康检查: http://0.0.0.0:${PORT}/api/v1/health`);
  console.log(`🔐 登录接口: http://0.0.0.0:${PORT}/api/v1/admin/login`);
});
