import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types/api';

/**
 * 请求验证中间件
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        data: null,
        message: '请求参数验证失败',
        code: 400,
        timestamp: new Date().toISOString(),
        errors,
      } as ApiResponse);
    }
    
    next();
  };
};
