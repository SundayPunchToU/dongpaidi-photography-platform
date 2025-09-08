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
