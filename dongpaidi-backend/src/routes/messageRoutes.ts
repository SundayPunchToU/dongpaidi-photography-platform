import { Router } from 'express';
import { MessageController } from '@/controllers/MessageController';
import Joi from 'joi';

// 简单的认证中间件
const authenticate = (req: any, res: any, next: any) => {
  // 简单的模拟认证，实际应该验证JWT token
  req.user = {
    id: 'current-user',
    email: 'admin@dongpaidi.com',
    nickname: '当前用户',
  };
  next();
};

// 简单的验证中间件
const validate = (schema: any, source = 'body') => (req: any, res: any, next: any) => {
  const { error } = schema.validate(req[source]);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      code: 400,
    });
  }
  next();
};

const router = Router();
const messageController = new MessageController();

// 消息验证schemas
const messageSchemas = {
  sendMessage: Joi.object({
    receiverId: Joi.string().required().messages({
      'string.empty': '接收者ID不能为空',
      'any.required': '接收者ID是必需的',
    }),
    content: Joi.string().required().max(1000).messages({
      'string.empty': '消息内容不能为空',
      'string.max': '消息内容不能超过1000个字符',
      'any.required': '消息内容是必需的',
    }),
    type: Joi.string().valid('text', 'image', 'system').default('text').messages({
      'any.only': '消息类型必须是 text, image 或 system',
    }),
  }),

  sendSystemMessage: Joi.object({
    receiverId: Joi.string().required().messages({
      'string.empty': '接收者ID不能为空',
      'any.required': '接收者ID是必需的',
    }),
    content: Joi.string().required().max(1000).messages({
      'string.empty': '消息内容不能为空',
      'string.max': '消息内容不能超过1000个字符',
      'any.required': '消息内容是必需的',
    }),
  }),

  conversationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码必须大于0',
    }),
    limit: Joi.number().integer().min(1).max(100).default(50).messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100',
    }),
  }),
};

/**
 * 消息相关路由
 */

// 发送消息（需要认证）
router.post('/', 
  authenticate,
  validate(messageSchemas.sendMessage),
  messageController.sendMessage
);

// 获取用户的对话列表（需要认证）
router.get('/conversations', 
  authenticate,
  messageController.getUserConversations
);

// 获取未读消息总数（需要认证）
router.get('/unread-count', 
  authenticate,
  messageController.getUnreadMessageCount
);

// 获取与特定用户的对话消息（需要认证）
router.get('/conversations/:otherUserId', 
  authenticate,
  validate(messageSchemas.conversationQuery, 'query'),
  messageController.getConversationMessages
);

// 标记与特定用户的消息为已读（需要认证）
router.put('/conversations/:otherUserId/read', 
  authenticate,
  messageController.markMessagesAsRead
);

// 删除消息（需要认证）
router.delete('/:messageId', 
  authenticate,
  messageController.deleteMessage
);

// 发送系统消息（管理员专用）
router.post('/system', 
  authenticate,
  validate(messageSchemas.sendSystemMessage),
  messageController.sendSystemMessage
);

export default router;
