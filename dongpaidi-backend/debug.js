// 调试脚本 - 不使用TypeScript和路径别名
const express = require('express');
const cors = require('cors');

console.log('开始调试...');

try {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // 简单的测试路由
  app.get('/api/v1/test', (req, res) => {
    res.json({ message: '服务器正常运行', timestamp: new Date().toISOString() });
  });
  
  app.get('/api/v1/users', (req, res) => {
    res.json({ 
      success: true,
      data: [
        { id: 1, nickname: '测试用户1', avatar: null },
        { id: 2, nickname: '测试用户2', avatar: null }
      ]
    });
  });
  
  const port = 3000;
  app.listen(port, () => {
    console.log(`调试服务器运行在端口 ${port}`);
    console.log(`测试URL: http://localhost:${port}/api/v1/test`);
  });
  
} catch (error) {
  console.error('调试服务器启动失败:', error);
}
