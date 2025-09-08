import { Request, Response } from 'express';
import { MessageService, CreateMessageDto } from '@/services/MessageService';

// 简单的响应工具
class ResponseUtil {
  static success(res: Response, data: any, message = 'Success', status = 200) {
    res.status(status).json({
      success: true,
      data,
      message,
      code: status,
      timestamp: new Date().toISOString(),
    });
  }

  static successWithPagination(res: Response, result: any, message = 'Success') {
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      message,
      code: 200,
      timestamp: new Date().toISOString(),
    });
  }
}

// 简单的异步处理器
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 认证请求接口
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

/**
 * 消息控制器
 */
export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * 发送消息
   */
  sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const messageData: CreateMessageDto = req.body;
    
    const message = await this.messageService.sendMessage(req.user.id, messageData);

    console.log('Message sent via API', {
      messageId: message.id,
      senderId: req.user.id,
      receiverId: messageData.receiverId,
      ip: req.ip,
    });

    ResponseUtil.success(res, message, '消息发送成功', 201);
  });

  /**
   * 获取对话消息列表
   */
  getConversationMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await this.messageService.getConversationMessages(
      req.user.id,
      otherUserId,
      Number(page),
      Number(limit)
    );

    console.log('Conversation messages retrieved', {
      userId: req.user.id,
      otherUserId,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取对话消息成功');
  });

  /**
   * 获取用户的对话列表
   */
  getUserConversations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversations = await this.messageService.getUserConversations(req.user.id);

    console.log('User conversations retrieved', {
      userId: req.user.id,
      conversationCount: conversations.length,
      ip: req.ip,
    });

    ResponseUtil.success(res, conversations, '获取对话列表成功');
  });

  /**
   * 标记消息为已读
   */
  markMessagesAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { otherUserId } = req.params;
    
    await this.messageService.markMessagesAsRead(req.user.id, otherUserId);

    console.log('Messages marked as read', {
      userId: req.user.id,
      otherUserId,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '消息已标记为已读');
  });

  /**
   * 获取未读消息总数
   */
  getUnreadMessageCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await this.messageService.getUnreadMessageCount(req.user.id);

    ResponseUtil.success(res, { count }, '获取未读消息数成功');
  });

  /**
   * 删除消息
   */
  deleteMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params;
    
    await this.messageService.deleteMessage(messageId, req.user.id);

    console.log('Message deleted via API', {
      messageId,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '消息删除成功');
  });

  /**
   * 发送系统消息 (管理员专用)
   */
  sendSystemMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { receiverId, content } = req.body;
    
    // TODO: 验证管理员权限
    
    const message = await this.messageService.sendSystemMessage(receiverId, content);

    console.log('System message sent via API', {
      messageId: message.id,
      receiverId,
      adminId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, message, '系统消息发送成功', 201);
  });
}

export default MessageController;
