import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { ResponseUtil } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { log } from '@/config/logger';
import { LoginDto, AuthenticatedRequest } from '@/types';

/**
 * 认证控制器
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 微信小程序登录
   */
  wechatLogin = asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginDto = {
      platform: 'wechat',
      code: req.body.code,
      userInfo: req.body.userInfo,
    };

    const result = await this.authService.wechatLogin(loginData);

    log.info('Wechat login request', { 
      userId: result.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    ResponseUtil.success(res, result, '登录成功');
  });

  /**
   * 手机号登录
   */
  phoneLogin = asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginDto = {
      platform: 'phone',
      phone: req.body.phone,
      code: req.body.code,
    };

    const result = await this.authService.phoneLogin(loginData);

    log.info('Phone login request', { 
      userId: result.user.id,
      phone: req.body.phone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    ResponseUtil.success(res, result, '登录成功');
  });

  /**
   * 刷新访问令牌
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ResponseUtil.error(res, 'Refresh token is required', 400);
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    log.info('Token refreshed', { 
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    ResponseUtil.success(res, tokens, '令牌刷新成功');
  });

  /**
   * 获取当前用户信息
   */
  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.authService.getUserById(req.user.id);

    ResponseUtil.success(res, user, '获取用户信息成功');
  });

  /**
   * 登出
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: 实现token黑名单机制
    // 目前客户端删除token即可实现登出

    log.info('User logout', { 
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    ResponseUtil.success(res, null, '登出成功');
  });

  /**
   * 发送短信验证码
   */
  sendSmsCode = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
      return ResponseUtil.error(res, '手机号不能为空', 400);
    }

    // TODO: 实现真实的短信发送逻辑
    // 1. 验证手机号格式
    // 2. 检查发送频率限制
    // 3. 生成验证码
    // 4. 调用短信服务发送
    // 5. 将验证码存储到Redis

    log.info('SMS code send request', { 
      phone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // 开发环境下返回模拟成功
    ResponseUtil.success(res, { 
      phone,
      message: '验证码已发送，开发环境请使用 123456' 
    }, '验证码发送成功');
  });

  /**
   * 验证短信验证码
   */
  verifySmsCode = asyncHandler(async (req: Request, res: Response) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return ResponseUtil.error(res, '手机号和验证码不能为空', 400);
    }

    // TODO: 实现真实的验证码验证逻辑
    // 1. 从Redis获取验证码
    // 2. 比较验证码
    // 3. 检查是否过期
    // 4. 删除已使用的验证码

    const isValid = code === '123456'; // 开发环境模拟

    if (!isValid) {
      return ResponseUtil.error(res, '验证码错误或已过期', 400);
    }

    log.info('SMS code verified', { 
      phone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    ResponseUtil.success(res, { valid: true }, '验证码验证成功');
  });

  /**
   * 检查用户名是否可用
   */
  checkNicknameAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { nickname } = req.query;

    if (!nickname || typeof nickname !== 'string') {
      return ResponseUtil.error(res, '用户名不能为空', 400);
    }

    // TODO: 实现用户名可用性检查
    // 1. 查询数据库中是否存在相同用户名
    // 2. 检查是否为保留用户名
    // 3. 验证用户名格式

    const isAvailable = true; // 模拟结果

    ResponseUtil.success(res, { 
      nickname,
      available: isAvailable 
    }, isAvailable ? '用户名可用' : '用户名已被使用');
  });

  /**
   * 健康检查
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    ResponseUtil.success(res, {
      status: 'ok',
      timestamp: new Date(),
      service: 'dongpaidi-auth',
    }, 'Service is healthy');
  });
}

export default AuthController;
