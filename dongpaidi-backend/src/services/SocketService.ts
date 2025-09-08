import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MessageService } from './MessageService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
}

interface SocketUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
  socketId: string;
  lastSeen: Date;
}

/**
 * WebSocket服务类
 */
export class SocketService {
  private io: SocketIOServer;
  private messageService: MessageService;
  private onlineUsers: Map<string, SocketUser> = new Map(); // userId -> SocketUser
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.messageService = new MessageService();
    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('Socket.IO server initialized');
  }

  /**
   * 设置中间件
   */
  private setupMiddleware() {
    // 身份验证中间件
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // 验证JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // 获取用户信息
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        
        next();
      } catch (error) {
        console.error('Socket authentication failed', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * 处理连接事件
   */
  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const user = socket.user!;

    console.log('User connected via WebSocket', {
      userId,
      socketId: socket.id,
      nickname: user.nickname,
    });

    // 添加到在线用户列表
    this.onlineUsers.set(userId, {
      ...user,
      socketId: socket.id,
      lastSeen: new Date(),
    });
    this.userSockets.set(userId, socket.id);

    // 加入用户专属房间
    socket.join(`user:${userId}`);

    // 广播用户上线状态
    this.broadcastUserStatus(userId, true);

    // 发送在线用户列表
    socket.emit('online_users', Array.from(this.onlineUsers.values()));

    // 处理发送消息事件
    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    // 处理加入对话房间事件
    socket.on('join_conversation', (data) => {
      this.handleJoinConversation(socket, data);
    });

    // 处理离开对话房间事件
    socket.on('leave_conversation', (data) => {
      this.handleLeaveConversation(socket, data);
    });

    // 处理标记消息已读事件
    socket.on('mark_messages_read', async (data) => {
      await this.handleMarkMessagesRead(socket, data);
    });

    // 处理正在输入事件
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // 处理断开连接事件
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // 处理错误事件
    socket.on('error', (error) => {
      console.error('Socket error', { userId, socketId: socket.id, error });
    });
  }

  /**
   * 处理发送消息
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { receiverId, content, type = 'text' } = data;
      const senderId = socket.userId!;

      // 通过服务发送消息
      const message = await this.messageService.sendMessage(senderId, {
        receiverId,
        content,
        type,
      });

      // 发送给发送者（确认）
      socket.emit('message_sent', {
        success: true,
        message,
      });

      // 发送给接收者（如果在线）
      const receiverSocketId = this.userSockets.get(receiverId);
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('new_message', message);
      }

      // 发送给对话房间中的其他用户
      socket.to(`conversation:${this.getConversationId(senderId, receiverId)}`).emit('new_message', message);

      console.log('Message sent via WebSocket', {
        messageId: message.id,
        senderId,
        receiverId,
        type,
      });
    } catch (error) {
      console.error('Send message via WebSocket failed', {
        error: error.message,
        userId: socket.userId,
        data,
      });

      socket.emit('message_sent', {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 处理加入对话房间
   */
  private handleJoinConversation(socket: AuthenticatedSocket, data: any) {
    const { otherUserId } = data;
    const userId = socket.userId!;
    const conversationId = this.getConversationId(userId, otherUserId);
    
    socket.join(`conversation:${conversationId}`);
    
    console.log('User joined conversation', { userId, otherUserId, conversationId });
  }

  /**
   * 处理离开对话房间
   */
  private handleLeaveConversation(socket: AuthenticatedSocket, data: any) {
    const { otherUserId } = data;
    const userId = socket.userId!;
    const conversationId = this.getConversationId(userId, otherUserId);
    
    socket.leave(`conversation:${conversationId}`);
    
    console.log('User left conversation', { userId, otherUserId, conversationId });
  }

  /**
   * 处理标记消息已读
   */
  private async handleMarkMessagesRead(socket: AuthenticatedSocket, data: any) {
    try {
      const { otherUserId } = data;
      const userId = socket.userId!;

      await this.messageService.markMessagesAsRead(userId, otherUserId);

      // 通知对方消息已被读取
      const otherSocketId = this.userSockets.get(otherUserId);
      if (otherSocketId) {
        this.io.to(otherSocketId).emit('messages_read', {
          userId,
          readAt: new Date(),
        });
      }

      console.log('Messages marked as read via WebSocket', { userId, otherUserId });
    } catch (error) {
      console.error('Mark messages as read via WebSocket failed', {
        error: error.message,
        userId: socket.userId,
        data,
      });
    }
  }

  /**
   * 处理开始输入
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: any) {
    const { otherUserId } = data;
    const userId = socket.userId!;
    
    const otherSocketId = this.userSockets.get(otherUserId);
    if (otherSocketId) {
      this.io.to(otherSocketId).emit('user_typing', {
        userId,
        isTyping: true,
      });
    }
  }

  /**
   * 处理停止输入
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: any) {
    const { otherUserId } = data;
    const userId = socket.userId!;
    
    const otherSocketId = this.userSockets.get(otherUserId);
    if (otherSocketId) {
      this.io.to(otherSocketId).emit('user_typing', {
        userId,
        isTyping: false,
      });
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    console.log('User disconnected from WebSocket', {
      userId,
      socketId: socket.id,
    });

    // 从在线用户列表中移除
    this.onlineUsers.delete(userId);
    this.userSockets.delete(userId);

    // 广播用户下线状态
    this.broadcastUserStatus(userId, false);
  }

  /**
   * 广播用户在线状态
   */
  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.io.emit('user_status_changed', {
      userId,
      isOnline,
      timestamp: new Date(),
    });
  }

  /**
   * 获取对话ID（确保两个用户之间的对话ID一致）
   */
  private getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join(':');
  }

  /**
   * 发送系统通知
   */
  public sendSystemNotification(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('system_notification', notification);
    }
  }

  /**
   * 广播系统消息
   */
  public broadcastSystemMessage(message: string) {
    this.io.emit('system_message', {
      message,
      timestamp: new Date(),
    });
  }

  /**
   * 获取在线用户数量
   */
  public getOnlineUserCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * 获取在线用户列表
   */
  public getOnlineUsers(): SocketUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * 检查用户是否在线
   */
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

export default SocketService;
