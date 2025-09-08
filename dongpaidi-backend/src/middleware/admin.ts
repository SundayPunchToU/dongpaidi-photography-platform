import { Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api';
import { AuthenticatedRequest } from '../types';
import { log } from '../config/logger';

/**
 * 管理员权限中间件
 * 验证用户是否具有管理员权限
 */
export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // 检查是否为管理员（通过平台标识判断）
    if (user.platform !== 'admin') {
      log.warn(`非管理员用户尝试访问管理接口: ${user.email || user.id}`);

      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限',
        code: 403,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // 记录管理员操作日志
    log.info(`管理员操作: ${user.email} ${req.method} ${req.originalUrl}`);

    next();
  } catch (error) {
    log.error('管理员权限验证失败:', error);
    
    res.status(500).json({
      success: false,
      message: '权限验证失败',
      code: 500,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};
