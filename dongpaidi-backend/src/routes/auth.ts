import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authenticate } from '@/middleware/auth';
import { validate, schemas } from '@/utils/validation';

const router = Router();
const authController = new AuthController();

/**
 * 认证相关路由
 */

// 健康检查
router.get('/health', authController.healthCheck);

// 微信小程序登录
router.post('/wechat/login', 
  validate(schemas.wechatLogin), 
  authController.wechatLogin
);

// 手机号登录
router.post('/phone/login', 
  validate(schemas.phoneLogin), 
  authController.phoneLogin
);

// 发送短信验证码
router.post('/sms/send', authController.sendSmsCode);

// 验证短信验证码
router.post('/sms/verify', authController.verifySmsCode);

// 刷新访问令牌
router.post('/refresh', authController.refreshToken);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, authController.getCurrentUser);

// 登出（需要认证）
router.post('/logout', authenticate, authController.logout);

// 检查用户名可用性
router.get('/check-nickname', authController.checkNicknameAvailability);

export default router;
