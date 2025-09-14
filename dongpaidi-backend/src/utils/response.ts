import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiErrorResponse, PaginatedResponse } from '@/types';

/**
 * 统一API响应格式工具类
 */
export class ResponseUtil {
  /**
   * 成功响应
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    code = 200
  ): Response<ApiResponse<T>> {
    return res.status(code).json({
      success: true,
      data,
      message,
      code,
      timestamp: new Date(),
    });
  }

  /**
   * 分页成功响应
   */
  static successWithPagination<T>(
    res: Response,
    data: PaginatedResponse<T>,
    message = 'Success',
    code = 200
  ): Response<ApiResponse<PaginatedResponse<T>>> {
    return res.status(code).json({
      success: true,
      data,
      message,
      code,
      timestamp: new Date(),
    });
  }

  /**
   * 错误响应
   */
  static error(
    res: Response,
    message = 'Internal Server Error',
    code = 500,
    errors?: any[]
  ): Response<ApiErrorResponse> {
    return res.status(code).json({
      success: false,
      data: null,
      message,
      code,
      errors,
      timestamp: new Date(),
    });
  }

  /**
   * 参数验证错误
   */
  static validationError(
    res: Response,
    errors: any[],
    message = 'Validation Error'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 400, errors);
  }

  /**
   * 未授权错误
   */
  static unauthorized(
    res: Response,
    message = 'Unauthorized'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 401);
  }

  /**
   * 禁止访问错误
   */
  static forbidden(
    res: Response,
    message = 'Forbidden'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 403);
  }

  /**
   * 资源不存在错误
   */
  static notFound(
    res: Response,
    message = 'Resource Not Found'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 404);
  }

  /**
   * 冲突错误
   */
  static conflict(
    res: Response,
    message = 'Resource Conflict'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 409);
  }

  /**
   * 请求过于频繁
   */
  static tooManyRequests(
    res: Response,
    message = 'Too Many Requests'
  ): Response<ApiErrorResponse> {
    return this.error(res, message, 429);
  }
}

/**
 * 分页工具函数
 */
export class PaginationUtil {
  /**
   * 计算分页参数
   */
  static calculatePagination(page = 1, limit = 20) {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip,
    };
  }

  /**
   * 构建分页响应
   */
  static buildPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

/**
 * 错误处理工具
 */
export class ErrorUtil {
  /**
   * 处理Prisma错误
   */
  static handlePrismaError(error: any): { message: string; code: number } {
    if (error.code === 'P2002') {
      return {
        message: 'Resource already exists',
        code: 409,
      };
    }
    
    if (error.code === 'P2025') {
      return {
        message: 'Resource not found',
        code: 404,
      };
    }

    if (error.code === 'P2003') {
      return {
        message: 'Foreign key constraint failed',
        code: 400,
      };
    }

    return {
      message: 'Database error',
      code: 500,
    };
  }

  /**
   * 处理JWT错误
   */
  static handleJwtError(error: any): { message: string; code: number } {
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Token expired',
        code: 401,
      };
    }

    if (error.name === 'JsonWebTokenError') {
      return {
        message: 'Invalid token',
        code: 401,
      };
    }

    return {
      message: 'Authentication error',
      code: 401,
    };
  }
}

/**
 * 响应处理中间件 - 从backend/迁移的功能
 * 为res对象添加便捷的响应方法，保持API兼容性
 */
export function responseMiddleware(req: Request, res: Response, next: NextFunction): void {
  /**
   * 发送成功响应 - 兼容backend/的API格式
   */
  res.success = function(data: any = null, message = '操作成功', meta: any = null) {
    const response: any = {
      success: true,
      message,
      code: 200,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    if (meta !== null) {
      response.meta = meta;
    }

    return res.json(response);
  };

  /**
   * 发送错误响应 - 兼容backend/的API格式
   */
  res.error = function(message = '操作失败', code = 400, data: any = null) {
    const response: any = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(code).json(response);
  };

  /**
   * 发送分页响应 - 兼容backend/的API格式
   */
  res.paginated = function(data: any[], page: number, limit: number, total: number, message = '获取成功') {
    const totalPages = Math.ceil(total / limit);

    const meta = {
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: parseInt(total.toString()),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    const response = {
      success: true,
      data,
      message,
      code: 200,
      timestamp: new Date().toISOString(),
      meta
    };

    return res.json(response);
  };

  next();
}

// 扩展Express Response接口
declare global {
  namespace Express {
    interface Response {
      success(data?: any, message?: string, meta?: any): Response;
      error(message?: string, code?: number, data?: any): Response;
      paginated(data: any[], page: number, limit: number, total: number, message?: string): Response;
    }
  }
}
