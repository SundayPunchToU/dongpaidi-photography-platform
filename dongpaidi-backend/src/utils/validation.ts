import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from './response';

/**
 * 验证工具类
 */
export class ValidationUtil {
  /**
   * 手机号验证
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 邮箱验证
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 密码强度验证
   */
  static isValidPassword(password: string): boolean {
    // 至少8位，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 用户名验证
   */
  static isValidUsername(username: string): boolean {
    // 2-20位，只能包含中文、字母、数字、下划线
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * URL验证
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 图片文件类型验证
   */
  static isValidImageType(mimetype: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return allowedTypes.includes(mimetype);
  }

  /**
   * 文件大小验证
   */
  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

/**
 * Joi验证schemas
 */
export const schemas = {
  // 用户相关
  createUser: Joi.object({
    openid: Joi.string().optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    email: Joi.string().email().optional(),
    platform: Joi.string().valid('wechat', 'ios', 'android', 'web').required(),
    nickname: Joi.string().min(2).max(20).required(),
    avatarUrl: Joi.string().uri().optional(),
    bio: Joi.string().max(200).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    isPhotographer: Joi.boolean().optional(),
    isModel: Joi.boolean().optional(),
  }),

  updateUser: Joi.object({
    nickname: Joi.string().min(2).max(20).optional(),
    avatarUrl: Joi.string().uri().optional(),
    bio: Joi.string().max(200).optional(),
    location: Joi.string().max(100).optional(),
    contactWechat: Joi.string().max(50).optional(),
    contactPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    specialties: Joi.array().items(Joi.string().max(50)).optional(),
    equipment: Joi.array().items(Joi.string().max(100)).optional(),
  }),

  // 作品相关
  createWork: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).min(1).max(9).required(),
    coverImage: Joi.string().uri().optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(10).required(),
    category: Joi.string().valid(
      'portrait', 'landscape', 'street', 'commercial', 
      'art', 'wedding', 'fashion', 'nature', 'architecture', 'food'
    ).required(),
    location: Joi.string().max(100).optional(),
    shootingDate: Joi.date().optional(),
    shootingInfo: Joi.object().optional(),
  }),

  updateWork: Joi.object({
    title: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    category: Joi.string().valid(
      'portrait', 'landscape', 'street', 'commercial', 
      'art', 'wedding', 'fashion', 'nature', 'architecture', 'food'
    ).optional(),
    location: Joi.string().max(100).optional(),
    shootingInfo: Joi.object().optional(),
  }),

  // 约拍相关
  createAppointment: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid('photographer_seek_model', 'model_seek_photographer').required(),
    location: Joi.string().max(100).optional(),
    shootDate: Joi.date().min('now').optional(),
    budget: Joi.number().min(0).max(999999.99).optional(),
    requirements: Joi.object().optional(),
  }),

  // 登录相关
  wechatLogin: Joi.object({
    code: Joi.string().required(),
    userInfo: Joi.object({
      nickname: Joi.string().min(1).max(20).required(),
      avatarUrl: Joi.string().uri().optional(),
    }).optional(),
  }),

  phoneLogin: Joi.object({
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  // 分页查询
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // 作品查询
  worksQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    userId: Joi.string().optional(),
    location: Joi.string().optional(),
    keyword: Joi.string().max(50).optional(),
    sortBy: Joi.string().valid('createdAt', 'likeCount', 'viewCount').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

/**
 * 验证中间件工厂
 */
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
      }));

      ResponseUtil.validationError(res, errors);
      return;
    }

    // 将验证后的值赋回请求对象
    req[property] = value;
    next();
  };
}

export default ValidationUtil;
