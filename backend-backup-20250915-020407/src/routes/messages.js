/**
 * 消息管理路由
 * 处理消息相关的操作和统计信息
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { messageModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /messages/unread-count 获取未读消息数量
 * @apiName GetUnreadCount
 * @apiGroup Messages
 * @apiDescription 获取当前用户的未读消息数量
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Number} data.count 未读消息数量
 */
router.get('/unread-count', requireAuth, (req, res) => {
  try {
    const count = messageModel.getUnreadCount();
    
    logger.debug('Unread message count retrieved', { count });
    
    res.success({ count }, '获取未读消息数量成功');
  } catch (error) {
    logger.error('Failed to get unread message count', { error: error.message });
    res.error('获取未读消息数量失败', 500);
  }
});

/**
 * @api {get} /messages/conversations 获取对话列表
 * @apiName GetConversations
 * @apiGroup Messages
 * @apiDescription 获取用户的对话列表
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [limit=20] 每页数量
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Array} data 对话列表
 */
router.get('/conversations', requireAuth, (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    // 模拟对话数据
    const conversations = [];
    const total = 0;

    logger.debug('Conversations retrieved', { page, limit, total });
    
    res.paginated(conversations, page, limit, total, '获取对话列表成功');
  } catch (error) {
    logger.error('Failed to get conversations', { error: error.message });
    res.error('获取对话列表失败', 500);
  }
});

module.exports = router;
