/**
 * 认证中间件
 * 处理用户认证和会话管理
 */

const { createResponse } = require('../utils/response');

// 简单的会话管理（生产环境应使用Redis或数据库）
const sessions = new Map();

/**
 * 生成会话ID
 * @returns {string} 唯一的会话ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 创建用户会话
 * @param {Object} user - 用户信息
 * @returns {string} 会话ID
 */
function createSession(user) {
  const sessionId = generateSessionId();
  const sessionData = {
    id: sessionId,
    username: user.username,
    email: user.email,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  sessions.set(sessionId, sessionData);
  return sessionId;
}

/**
 * 获取会话信息
 * @param {string} sessionId - 会话ID
 * @returns {Object|null} 会话数据
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * 更新会话活动时间
 * @param {string} sessionId - 会话ID
 */
function updateSessionActivity(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);
  }
}

/**
 * 删除会话
 * @param {string} sessionId - 会话ID
 */
function destroySession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * 清理过期会话
 * @param {number} maxAge - 最大存活时间（毫秒）
 */
function cleanupExpiredSessions(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > maxAge) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * 认证中间件
 * 验证用户是否已登录
 */
function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (!sessionId) {
    return res.status(401).json(createResponse(false, null, '未提供会话ID', 401));
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json(createResponse(false, null, '会话无效或已过期', 401));
  }

  // 更新会话活动时间
  updateSessionActivity(sessionId);
  
  // 将会话信息添加到请求对象
  req.session = session;
  req.sessionId = sessionId;
  
  next();
}

/**
 * 可选认证中间件
 * 如果提供了会话ID则验证，否则继续执行
 */
function optionalAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  
  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      updateSessionActivity(sessionId);
      req.session = session;
      req.sessionId = sessionId;
    }
  }
  
  next();
}

// 定期清理过期会话
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000); // 每小时清理一次

module.exports = {
  requireAuth,
  optionalAuth,
  createSession,
  getSession,
  updateSessionActivity,
  destroySession,
  generateSessionId
};
