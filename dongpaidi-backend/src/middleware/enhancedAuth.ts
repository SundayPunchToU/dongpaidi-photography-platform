import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { db } from '@/config/database';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';
import { securityConfig } from '@/config/security';

/**
 * Token黑名单存储（生产环境应使用Redis）
 */
const tokenBlacklist = new Set<string>();

/**
 * 用户会话存储（生产环境应使用Redis）
 */
const userSessions = new Map<string, {
  sessionId: string;
  ip: string;
  userAgent: string;
  lastActivity: Date;
  loginTime: Date;
}[]>();

/**
 * 登录失败尝试记录
 */
const loginAttempts = new Map<string, {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}>();

/**
 * 检查token是否在黑名单中
 */
async function isTokenBlacklisted(token: string): Promise<boolean> {
  return tokenBlacklist.has(token);
}

/**
 * 将token加入黑名单
 */
export async function blacklistToken(token: string): Promise<void> {
  tokenBlacklist.add(token);
  // 生产环境中应该设置过期时间，与token过期时间一致
}

/**
 * 更新用户最后活跃时间
 */
async function updateUserLastActive(userId: string): Promise<void> {
  try {
    await db.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  } catch (error) {
    log.error('Failed to update user last active time', { userId, error });
  }
}

/**
 * 记录登录失败尝试
 */
function recordLoginFailure(identifier: string): void {
  const now = new Date();
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  // 如果距离上次尝试超过15分钟，重置计数
  if (now.getTime() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
    attempts.count = 0;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  // 如果失败次数超过阈值，锁定账户
  if (attempts.count >= securityConfig.password.maxAttempts) {
    attempts.lockedUntil = new Date(now.getTime() + securityConfig.password.lockoutDuration);
  }
  
  loginAttempts.set(identifier, attempts);
}

/**
 * 检查是否被锁定
 */
function isAccountLocked(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier);
  if (!attempts || !attempts.lockedUntil) {
    return false;
  }
  
  return new Date() < attempts.lockedUntil;
}

/**
 * 清除登录失败记录
 */
function clearLoginFailures(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * 管理用户会话
 */
function manageUserSession(userId: string, sessionData: {
  sessionId: string;
  ip: string;
  userAgent: string;
}): void {
  const sessions = userSessions.get(userId) || [];
  const now = new Date();
  
  // 移除过期会话
  const activeSessions = sessions.filter(session => 
    now.getTime() - session.lastActivity.getTime() < securityConfig.session.sessionTimeout
  );
  
  // 检查并发会话数限制
  if (activeSessions.length >= securityConfig.session.maxConcurrentSessions) {
    // 移除最旧的会话
    activeSessions.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());
    activeSessions.splice(0, activeSessions.length - securityConfig.session.maxConcurrentSessions + 1);
  }
  
  // 添加新会话
  activeSessions.push({
    ...sessionData,
    lastActivity: now,
    loginTime: now,
  });
  
  userSessions.set(userId, activeSessions);
}

/**
 * 增强的JWT认证中间件
 */
export const enhancedAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || '';

    if (!token) {
      SecurityUtil.logSecurityEvent({
        type: 'auth_missing_token',
        severity: 'low',
        description: 'Authentication attempt without token',
        ip: clientIp,
        userAgent,
      });
      ResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    // 验证token
    const payload = JwtUtil.verifyToken(token);
    
    // 检查token是否在黑名单中
    if (securityConfig.jwt.blacklistEnabled) {
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        SecurityUtil.logSecurityEvent({
          type: 'auth_blacklisted_token',
          severity: 'medium',
          description: 'Attempt to use blacklisted token',
          ip: clientIp,
          userId: payload.userId,
          userAgent,
        });
        ResponseUtil.unauthorized(res, 'Token is invalid');
        return;
      }
    }
    
    // 检查账户锁定状态
    if (isAccountLocked(payload.userId)) {
      SecurityUtil.logSecurityEvent({
        type: 'auth_locked_account',
        severity: 'medium',
        description: 'Authentication attempt on locked account',
        ip: clientIp,
        userId: payload.userId,
        userAgent,
      });
      ResponseUtil.forbidden(res, 'Account is temporarily locked');
      return;
    }
    
    // 检查用户是否存在且状态正常
    const user = await db.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        status: true, 
        platform: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      SecurityUtil.logSecurityEvent({
        type: 'auth_user_not_found',
        severity: 'medium',
        description: 'Authentication with non-existent user',
        ip: clientIp,
        userId: payload.userId,
        userAgent,
      });
      ResponseUtil.unauthorized(res, 'User not found');
      return;
    }

    if (user.status !== 'active') {
      SecurityUtil.logSecurityEvent({
        type: 'auth_inactive_account',
        severity: 'low',
        description: 'Authentication attempt on inactive account',
        ip: clientIp,
        userId: payload.userId,
        userAgent,
      });
      ResponseUtil.forbidden(res, 'Account is suspended');
      return;
    }

    // 会话安全检查
    if (securityConfig.session.ipBinding || securityConfig.session.userAgentBinding) {
      const sessions = userSessions.get(payload.userId) || [];
      const currentSession = sessions.find(s => s.sessionId === payload.sessionId);
      
      if (currentSession) {
        if (securityConfig.session.ipBinding && currentSession.ip !== clientIp) {
          SecurityUtil.logSecurityEvent({
            type: 'auth_ip_mismatch',
            severity: 'high',
            description: 'Session IP mismatch detected',
            ip: clientIp,
            userId: payload.userId,
            userAgent,
            metadata: { originalIp: currentSession.ip },
          });
          ResponseUtil.forbidden(res, 'Session security violation');
          return;
        }
        
        if (securityConfig.session.userAgentBinding && currentSession.userAgent !== userAgent) {
          SecurityUtil.logSecurityEvent({
            type: 'auth_useragent_mismatch',
            severity: 'medium',
            description: 'Session User-Agent mismatch detected',
            ip: clientIp,
            userId: payload.userId,
            userAgent,
            metadata: { originalUserAgent: currentSession.userAgent },
          });
          ResponseUtil.forbidden(res, 'Session security violation');
          return;
        }
      }
    }

    // 更新用户最后活跃时间
    await updateUserLastActive(payload.userId);

    // 更新会话活动时间
    const sessions = userSessions.get(payload.userId) || [];
    const sessionIndex = sessions.findIndex(s => s.sessionId === payload.sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].lastActivity = new Date();
      userSessions.set(payload.userId, sessions);
    }

    // 将用户信息添加到请求对象
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      platform: payload.platform,
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    SecurityUtil.logSecurityEvent({
      type: 'auth_error',
      severity: 'medium',
      description: `Authentication error: ${errorMessage}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    log.error('Authentication failed', {
      error: errorMessage,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        ResponseUtil.unauthorized(res, 'Token expired');
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        ResponseUtil.unauthorized(res, 'Invalid token');
        return;
      }
    }

    ResponseUtil.unauthorized(res, 'Authentication failed');
  }
};

/**
 * 管理员权限验证中间件
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    const user = await db.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, status: true },
    });

    if (!user || user.status !== 'active') {
      ResponseUtil.forbidden(res, 'Access denied');
      return;
    }

    if (user.role !== 'admin') {
      SecurityUtil.logSecurityEvent({
        type: 'auth_admin_access_denied',
        severity: 'medium',
        description: 'Non-admin user attempted to access admin resource',
        ip: req.ip,
        userId: req.user.id,
        userAgent: req.get('User-Agent'),
      });
      ResponseUtil.forbidden(res, 'Admin access required');
      return;
    }

    next();
  } catch (error) {
    log.error('Admin authorization failed', { error, userId: req.user?.id });
    ResponseUtil.error(res, 'Authorization failed', 500);
  }
};

/**
 * 登出中间件（将token加入黑名单）
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);
    
    if (token) {
      await blacklistToken(token);
      
      // 清除用户会话
      if (req.user) {
        userSessions.delete(req.user.id);
        clearLoginFailures(req.user.id);
      }
      
      SecurityUtil.logSecurityEvent({
        type: 'auth_logout',
        severity: 'low',
        description: 'User logged out',
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
      });
    }
    
    next();
  } catch (error) {
    log.error('Logout failed', { error, userId: req.user?.id });
    next(); // 继续执行，不阻止登出
  }
};

export {
  recordLoginFailure,
  clearLoginFailures,
  isAccountLocked,
  manageUserSession,
};
