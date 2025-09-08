import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 类型定义
type ID = string;

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 简单的错误类
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface CreateMessageDto {
  receiverId: string;
  content: string;
  type?: 'text' | 'image' | 'system';
}

export interface MessageItem {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
}

export interface ConversationItem {
  userId: string;
  user: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: Date;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
}

/**
 * 消息服务类
 */
export class MessageService {
  /**
   * 发送消息
   */
  async sendMessage(senderId: ID, messageData: CreateMessageDto): Promise<MessageItem> {
    try {
      // 验证接收者是否存在
      const receiver = await prisma.user.findUnique({
        where: { id: messageData.receiverId },
      });

      if (!receiver) {
        throw new NotFoundError('接收者不存在');
      }

      // 不能给自己发消息
      if (senderId === messageData.receiverId) {
        throw new ValidationError('不能给自己发消息');
      }

      // 创建消息
      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          type: messageData.type || 'text',
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      console.log('Message sent', {
        messageId: message.id,
        senderId,
        receiverId: messageData.receiverId,
        type: messageData.type,
      });

      return message;
    } catch (error: any) {
      console.error('Send message failed', { error: error.message, senderId, messageData });
      throw error;
    }
  }

  /**
   * 获取对话消息列表
   */
  async getConversationMessages(
    userId: ID,
    otherUserId: ID,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<MessageItem>> {
    try {
      const skip = (page - 1) * limit;

      // 验证对方用户是否存在
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
      });

      if (!otherUser) {
        throw new NotFoundError('用户不存在');
      }

      const where = {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      };

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
            receiver: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.message.count({ where }),
      ]);

      return {
        items: messages.reverse(), // 反转顺序，最新消息在底部
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Get conversation messages failed', { error: error.message, userId, otherUserId });
      throw error;
    }
  }

  /**
   * 获取用户的对话列表
   */
  async getUserConversations(userId: ID): Promise<ConversationItem[]> {
    try {
      // 获取用户参与的所有消息，按对话分组
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 按对话分组
      const conversationMap = new Map<string, ConversationItem>();

      for (const message of messages) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const otherUser = message.senderId === userId ? message.receiver : message.sender;

        if (!conversationMap.has(otherUserId)) {
          // 计算未读消息数量
          const unreadCount = await prisma.message.count({
            where: {
              senderId: otherUserId,
              receiverId: userId,
              isRead: false,
            },
          });

          conversationMap.set(otherUserId, {
            userId: otherUserId,
            user: {
              ...otherUser,
              isOnline: false, // TODO: 从在线状态服务获取
            },
            lastMessage: {
              id: message.id,
              content: message.content,
              type: message.type,
              createdAt: message.createdAt,
              isRead: message.isRead,
              senderId: message.senderId,
            },
            unreadCount,
          });
        }
      }

      return Array.from(conversationMap.values()).sort(
        (a, b) => 
          new Date(b.lastMessage?.createdAt || 0).getTime() - 
          new Date(a.lastMessage?.createdAt || 0).getTime()
      );
    } catch (error: any) {
      console.error('Get user conversations failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 标记消息为已读
   */
  async markMessagesAsRead(userId: ID, otherUserId: ID): Promise<void> {
    try {
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      console.log('Messages marked as read', { userId, otherUserId });
    } catch (error: any) {
      console.error('Mark messages as read failed', { error: error.message, userId, otherUserId });
      throw error;
    }
  }

  /**
   * 获取未读消息总数
   */
  async getUnreadMessageCount(userId: ID): Promise<number> {
    try {
      const count = await prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });

      return count;
    } catch (error: any) {
      console.error('Get unread message count failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: ID, userId: ID): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('消息不存在');
      }

      // 只有发送者可以删除消息
      if (message.senderId !== userId) {
        throw new ValidationError('只能删除自己发送的消息');
      }

      await prisma.message.delete({
        where: { id: messageId },
      });

      console.log('Message deleted', { messageId, userId });
    } catch (error: any) {
      console.error('Delete message failed', { error: error.message, messageId, userId });
      throw error;
    }
  }

  /**
   * 发送系统消息
   */
  async sendSystemMessage(receiverId: ID, content: string): Promise<MessageItem> {
    try {
      // 使用系统用户ID（可以是固定的系统账号）
      const systemUserId = 'system'; // 或者从配置中获取

      const message = await prisma.message.create({
        data: {
          senderId: systemUserId,
          receiverId,
          content,
          type: 'system',
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      console.log('System message sent', { messageId: message.id, receiverId, content });

      return message;
    } catch (error: any) {
      console.error('Send system message failed', { error: error.message, receiverId, content });
      throw error;
    }
  }
}
