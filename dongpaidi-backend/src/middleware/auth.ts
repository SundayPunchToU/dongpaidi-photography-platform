import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { db } from '@/config/database';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';
import { securityConfig } from '@/config/security';

/**
 * JWT认证中间件
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      ResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    // 验证token
    const payload = JwtUtil.verifyToken(token);
    
    // 检查用户是否存在且状态正常
    const user = await db.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, platform: true },
    });

    if (!user) {
      ResponseUtil.unauthorized(res, 'User not found');
      return;
    }

    if (user.status !== 'active') {
      ResponseUtil.forbidden(res, 'Account is suspended');
      return;
    }

    // 将用户信息添加到请求对象
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      platform: payload.platform,
    };

    next();
  } catch (error: any) {
    log.warn('Authentication failed', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      ResponseUtil.unauthorized(res, 'Invalid token');
    } else {
      ResponseUtil.unauthorized(res, 'Authentication failed');
    }
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = JwtUtil.verifyToken(token);
      
      const user = await db.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, status: true, platform: true },
      });

      if (user && user.status === 'active') {
        (req as AuthenticatedRequest).user = {
          id: payload.userId,
          platform: payload.platform,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

/**
 * 角色验证中间件
 */
export const requireRole = (roles: string[]) => {
  return async (
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
        select: { 
          isPhotographer: true, 
          isModel: true, 
          status: true 
        },
      });

      if (!user) {
        ResponseUtil.unauthorized(res, 'User not found');
        return;
      }

      const userRoles: string[] = [];
      if (user.isPhotographer) userRoles.push('photographer');
      if (user.isModel) userRoles.push('model');

      const hasRequiredRole = roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        ResponseUtil.forbidden(res, 'Insufficient permissions');
        return;
      }

      next();
    } catch (error) {
      log.error('Role verification failed', { error, userId: req.user?.id });
      ResponseUtil.error(res, 'Authorization failed');
    }
  };
};

/**
 * 资源所有者验证中间件
 */
export const requireOwnership = (resourceType: 'work' | 'appointment') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        ResponseUtil.error(res, 'Resource ID required', 400);
        return;
      }

      let resource;
      
      if (resourceType === 'work') {
        resource = await db.prisma.work.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
      } else if (resourceType === 'appointment') {
        resource = await db.prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { publisherId: true },
        });
      }

      if (!resource) {
        ResponseUtil.notFound(res, 'Resource not found');
        return;
      }

      const ownerId = resourceType === 'work' 
        ? (resource as any).userId 
        : (resource as any).publisherId;

      if (ownerId !== req.user.id) {
        ResponseUtil.forbidden(res, 'Access denied');
        return;
      }

      next();
    } catch (error) {
      log.error('Ownership verification failed', { 
        error, 
        userId: req.user?.id, 
        resourceType,
        resourceId: req.params.id 
      });
      ResponseUtil.error(res, 'Authorization failed');
    }
  };
};

// ========== 从backend/迁移的会话管理功能 ==========
// 为了保持API兼容性，保留原有的会话管理系统

// 简单的会话管理（生产环境应使用Redis或数据库）
const sessions = new Map<string, any>();

/**
 * 生成会话ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 创建用户会话
 */
export function createSession(user: any): string {
  const sessionId = generateSessionId();
  const sessionData = {
    id: sessionId,
    username: user.username || user.email,
    email: user.email,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  sessions.set(sessionId, sessionData);
  return sessionId;
}

/**
 * 获取会话信息
 */
export function getSession(sessionId: string): any | null {
  return sessions.get(sessionId) || null;
}

/**
 * 更新会话活动时间
 */
export function updateSessionActivity(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);
  }
}

/**
 * 删除会话
 */
export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * 清理过期会话
 */
export function cleanupExpiredSessions(maxAge = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > maxAge) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * 会话认证中间件 - 兼容backend/的API
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = req.headers['x-session-id'] as string || req.query.sessionId as string;

  if (!sessionId) {
    return res.error('未提供会话ID', 401);
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.error('会话无效或已过期', 401);
  }

  // 更新会话活动时间
  updateSessionActivity(sessionId);

  // 将会话信息添加到请求对象
  (req as any).session = session;
  (req as any).sessionId = sessionId;

  next();
};

/**
 * 可选会话认证中间件 - 兼容backend/的API
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = req.headers['x-session-id'] as string || req.query.sessionId as string;

  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      updateSessionActivity(sessionId);
      (req as any).session = session;
      (req as any).sessionId = sessionId;
    }
  }

  next();
};

// 定期清理过期会话
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000); // 每小时清理一次
