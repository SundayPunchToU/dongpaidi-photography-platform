/**
 * 用户管理路由
 * 处理用户相关的CRUD操作和统计信息
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { userModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /users 获取用户列表
 * @apiName GetUsers
 * @apiGroup Users
 * @apiDescription 获取用户列表，支持分页和筛选
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [limit=10] 每页数量
 * @apiQuery {String} [role] 用户角色筛选
 * @apiQuery {String} [status] 用户状态筛选
 * @apiQuery {String} [search] 搜索关键词
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Array} data 用户列表
 * @apiSuccess {Object} meta 分页信息
 */
router.get('/', requireAuth, (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    role, 
    status, 
    search 
  } = req.query;

  try {
    // 构建过滤条件
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      // 模拟搜索功能
      filter.username = `*${search}*`;
    }

    // 查询用户
    const users = userModel.findAll(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const total = userModel.count(filter);

    logger.debug('Users list retrieved', { 
      page, 
      limit, 
      total, 
      filter 
    });

    res.paginated(users, page, limit, total, '获取用户列表成功');
  } catch (error) {
    logger.error('Failed to get users list', { error: error.message });
    res.error('获取用户列表失败', 500);
  }
});

/**
 * @api {get} /users/stats 获取用户统计信息
 * @apiName GetUserStats
 * @apiGroup Users
 * @apiDescription 获取用户相关的统计数据
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.total 总用户数
 * @apiSuccess {Number} data.verified 已验证用户数
 * @apiSuccess {Number} data.active 活跃用户数
 * @apiSuccess {Number} data.newToday 今日新增用户数
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = userModel.getStats();
    
    logger.debug('User stats retrieved', stats);
    
    res.success(stats, '获取用户统计成功');
  } catch (error) {
    logger.error('Failed to get user stats', { error: error.message });
    res.error('获取用户统计失败', 500);
  }
});

/**
 * @api {get} /users/:id 获取用户详情
 * @apiName GetUser
 * @apiGroup Users
 * @apiDescription 根据ID获取用户详细信息
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 用户ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 用户信息
 */
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const user = userModel.findById(id);
    
    if (!user) {
      logger.warn('User not found', { id });
      return res.error('用户不存在', 404);
    }

    logger.debug('User details retrieved', { id, username: user.username });
    
    res.success(user, '获取用户详情成功');
  } catch (error) {
    logger.error('Failed to get user details', { id, error: error.message });
    res.error('获取用户详情失败', 500);
  }
});

/**
 * @api {put} /users/:id 更新用户信息
 * @apiName UpdateUser
 * @apiGroup Users
 * @apiDescription 更新用户信息
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 用户ID
 * @apiBody {String} [nickname] 昵称
 * @apiBody {String} [status] 状态
 * @apiBody {Boolean} [isVerified] 是否已验证
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 更新后的用户信息
 */
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = userModel.findById(id);
    
    if (!user) {
      logger.warn('User not found for update', { id });
      return res.error('用户不存在', 404);
    }

    // 过滤允许更新的字段
    const allowedFields = ['nickname', 'status', 'isVerified', 'phone'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updatedUser = userModel.update(id, filteredUpdates);

    logger.info('User updated', { 
      id, 
      username: user.username, 
      updates: filteredUpdates 
    });
    
    res.success(updatedUser, '用户信息更新成功');
  } catch (error) {
    logger.error('Failed to update user', { id, error: error.message });
    res.error('更新用户信息失败', 500);
  }
});

/**
 * @api {delete} /users/:id 删除用户
 * @apiName DeleteUser
 * @apiGroup Users
 * @apiDescription 删除用户（软删除）
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 用户ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 */
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const user = userModel.findById(id);
    
    if (!user) {
      logger.warn('User not found for deletion', { id });
      return res.error('用户不存在', 404);
    }

    // 软删除：更新状态而不是真正删除
    const deletedUser = userModel.update(id, { 
      status: 'deleted',
      deletedAt: new Date().toISOString()
    });

    logger.info('User deleted (soft)', { 
      id, 
      username: user.username 
    });
    
    res.success(null, '用户删除成功');
  } catch (error) {
    logger.error('Failed to delete user', { id, error: error.message });
    res.error('删除用户失败', 500);
  }
});

module.exports = router;
