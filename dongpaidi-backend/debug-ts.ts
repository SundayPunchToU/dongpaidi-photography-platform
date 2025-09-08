import express from 'express';
import cors from 'cors';

console.log('开始TypeScript调试...');

try {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // 简单的测试路由
  app.get('/api/v1/test', (req, res) => {
    res.json({ message: 'TypeScript服务器正常运行', timestamp: new Date().toISOString() });
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
  
  const port = 3001;
  app.listen(port, () => {
    console.log(`TypeScript调试服务器运行在端口 ${port}`);
    console.log(`测试URL: http://localhost:${port}/api/v1/test`);
  });
  
} catch (error) {
  console.error('TypeScript调试服务器启动失败:', error);
}
