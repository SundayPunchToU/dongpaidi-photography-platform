const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

// 配置Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// 中间件
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true,
}));

app.use(express.json());
app.use(express.static('.'));

// 在线用户管理
const onlineUsers = new Map();

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入
  socket.on('user_join', (userData) => {
    console.log('用户加入:', userData);
    onlineUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
      joinTime: new Date(),
    });

    // 广播在线用户列表
    io.emit('online_users', Array.from(onlineUsers.values()));
  });

  // 发送消息
  socket.on('send_message', (messageData) => {
    console.log('收到消息:', messageData);
    
    // 广播消息给所有用户
    io.emit('new_message', {
      id: `msg_${Date.now()}`,
      ...messageData,
      timestamp: new Date(),
      sender: onlineUsers.get(socket.id) || { nickname: '匿名用户' },
    });

    // 确认消息发送成功
    socket.emit('message_sent', {
      success: true,
      message: '消息发送成功',
    });
  });

  // 加入对话房间
  socket.on('join_conversation', (data) => {
    const roomName = `conversation_${data.otherUserId}`;
    socket.join(roomName);
    console.log(`用户 ${socket.id} 加入对话房间: ${roomName}`);
  });

  // 离开对话房间
  socket.on('leave_conversation', (data) => {
    const roomName = `conversation_${data.otherUserId}`;
    socket.leave(roomName);
    console.log(`用户 ${socket.id} 离开对话房间: ${roomName}`);
  });

  // 正在输入
  socket.on('typing_start', (data) => {
    socket.broadcast.emit('user_typing', {
      userId: socket.id,
      isTyping: true,
    });
  });

  socket.on('typing_stop', (data) => {
    socket.broadcast.emit('user_typing', {
      userId: socket.id,
      isTyping: false,
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    onlineUsers.delete(socket.id);
    
    // 广播更新的在线用户列表
    io.emit('online_users', Array.from(onlineUsers.values()));
    
    // 广播用户下线状态
    io.emit('user_status_changed', {
      userId: socket.id,
      isOnline: false,
      timestamp: new Date(),
    });
  });
});

// HTTP路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝 WebSocket 服务器运行正常',
    timestamp: new Date(),
    onlineUsers: onlineUsers.size,
  });
});

app.get('/api/v1/socket/status', (req, res) => {
  res.json({
    success: true,
    data: {
      onlineUsers: onlineUsers.size,
      users: Array.from(onlineUsers.values()),
    },
    message: 'WebSocket状态获取成功',
  });
});

// 测试消息API
app.get('/api/v1/messages/conversations', (req, res) => {
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
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
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
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isRead: true,
        senderId: 'user2',
      },
      unreadCount: 0,
    },
  ];

  res.json({
    success: true,
    data: conversations,
    message: '获取对话列表成功',
  });
});

app.get('/api/v1/messages/unread-count', (req, res) => {
  res.json({
    success: true,
    data: { count: 3 },
    message: '获取未读消息数成功',
  });
});

app.get('/api/v1/messages/conversations/:otherUserId', (req, res) => {
  const messages = [
    {
      id: 'msg1',
      content: '你好，我想预约拍摄',
      type: 'text',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      sender: {
        id: req.params.otherUserId,
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
        id: req.params.otherUserId,
        nickname: '摄影师小王',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
    },
  ];

  res.json({
    success: true,
    data: {
      items: messages,
      pagination: {
        page: 1,
        limit: 50,
        total: messages.length,
        pages: 1,
      },
    },
    message: '获取对话消息成功',
  });
});

// 启动服务器
const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket服务器启动成功`);
  console.log(`📡 HTTP服务器运行在端口 ${PORT}`);
  console.log(`🔌 WebSocket服务器已启动`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`💬 WebSocket状态: http://localhost:${PORT}/api/v1/socket/status`);
  console.log(`📄 测试页面: http://localhost:${PORT}/websocket-client-example.html`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
