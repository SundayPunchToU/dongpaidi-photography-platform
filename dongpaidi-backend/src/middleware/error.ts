import { Request, Response, NextFunction } from 'express';
import { ResponseUtil, ErrorUtil } from '@/utils/response';
import { log } from '@/config/logger';
import { config } from '@/config';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  log.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 如果响应已经发送，交给Express默认错误处理器
  if (res.headersSent) {
    return next(error);
  }

  // Prisma错误处理
  if (error.code && error.code.startsWith('P')) {
    const { message, code } = ErrorUtil.handlePrismaError(error);
    ResponseUtil.error(res, message, code);
    return;
  }

  // JWT错误处理
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const { message, code } = ErrorUtil.handleJwtError(error);
    ResponseUtil.error(res, message, code);
    return;
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    ResponseUtil.validationError(res, error.details || []);
    return;
  }

  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    ResponseUtil.error(res, 'File too large', 413);
    return;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    ResponseUtil.error(res, 'Unexpected file field', 400);
    return;
  }

  // 自定义业务错误
  if (error.statusCode) {
    ResponseUtil.error(res, error.message, error.statusCode);
    return;
  }

  // 默认服务器错误
  const message = config.server.isDevelopment 
    ? error.message 
    : 'Internal Server Error';
    
  ResponseUtil.error(res, message, 500);
};

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`);
};

/**
 * 异步错误捕获装饰器
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 业务错误类
 */
export class BusinessError extends AppError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}

/**
 * 认证错误类
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * 权限错误类
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * 资源不存在错误类
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 冲突错误类
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}
