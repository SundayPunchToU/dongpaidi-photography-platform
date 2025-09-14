/**
 * 认证相关路由
 * 处理用户登录、登出、会话管理等功能
 */

const express = require('express');
const { requireAuth, createSession } = require('../middleware/auth');
const { admin } = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {post} /admin/login 管理员登录
 * @apiName AdminLogin
 * @apiGroup Auth
 * @apiDescription 管理员登录接口
 * 
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 * @apiSuccess {Object} data 响应数据
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {String} data.sessionId 会话ID
 * 
 * @apiError {Boolean} success=false 请求失败
 * @apiError {String} message 错误消息
 */
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  // 验证必填字段
  if (!username || !password) {
    logger.warn('Login attempt with missing credentials', { username });
    return res.error('用户名和密码不能为空', 400);
  }

  // 验证管理员凭据
  if (username === admin.username && password === admin.password) {
    const user = {
      username: admin.username,
      email: admin.email,
      loginTime: new Date().toISOString()
    };

    // 创建会话
    const sessionId = createSession(user);

    logger.info('Admin login successful', { username, sessionId });

    return res.success({
      user,
      sessionId
    }, '登录成功');
  } else {
    logger.warn('Admin login failed - invalid credentials', { username });
    return res.error('用户名或密码错误', 401);
  }
});

/**
 * @api {get} /admin/profile 获取当前用户信息
 * @apiName GetAdminProfile
 * @apiGroup Auth
 * @apiDescription 获取当前登录用户的详细信息
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 用户信息
 * @apiSuccess {String} data.username 用户名
 * @apiSuccess {String} data.email 邮箱
 * @apiSuccess {String} data.loginTime 登录时间
 * @apiSuccess {String} data.lastActivity 最后活动时间
 */
router.get('/admin/profile', requireAuth, (req, res) => {
  const user = {
    username: req.session.username,
    email: req.session.email,
    loginTime: req.session.loginTime,
    lastActivity: req.session.lastActivity
  };

  logger.debug('Admin profile accessed', { username: user.username });

  res.success(user, '获取用户信息成功');
});

/**
 * @api {post} /admin/logout 管理员登出
 * @apiName AdminLogout
 * @apiGroup Auth
 * @apiDescription 管理员登出接口，清除会话
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 */
router.post('/admin/logout', requireAuth, (req, res) => {
  const { destroySession } = require('../middleware/auth');
  
  destroySession(req.sessionId);
  
  logger.info('Admin logout successful', { 
    username: req.session.username,
    sessionId: req.sessionId 
  });

  res.success(null, '登出成功');
});

/**
 * @api {post} /admin/change-password 修改密码
 * @apiName ChangePassword
 * @apiGroup Auth
 * @apiDescription 修改管理员密码（注意：这是模拟实现）
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} currentPassword 当前密码
 * @apiParam {String} newPassword 新密码
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 */
router.post('/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.error('当前密码和新密码不能为空', 400);
  }

  if (currentPassword !== admin.password) {
    logger.warn('Password change failed - invalid current password', { 
      username: req.session.username 
    });
    return res.error('当前密码错误', 400);
  }

  if (newPassword.length < 6) {
    return res.error('新密码长度不能少于6位', 400);
  }

  // 注意：在真实应用中，这里应该更新数据库中的密码
  logger.info('Password change requested (simulated)', { 
    username: req.session.username 
  });

  res.success(null, '密码修改成功（模拟）');
});

module.exports = router;
