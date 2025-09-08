import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// 管理员登录验证schema
const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱地址不能为空',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6位字符',
    'any.required': '密码不能为空',
  }),
});

// 管理员认证路由
router.post('/login', validateRequest(adminLoginSchema), AdminController.login);

// 以下路由需要管理员权限
router.use(authenticate);
router.use(adminMiddleware);

// 统计数据路由
router.get('/stats', AdminController.getStats);
router.get('/stats/trend', AdminController.getTrendData);

// 用户管理路由
router.get('/users', AdminController.getUsers);
router.get('/users/stats', AdminController.getUserStats);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.delete('/users/:id', AdminController.deleteUser);

// TODO: 作品管理路由（待实现）
// router.get('/works', AdminController.getWorks);
// router.get('/works/stats', AdminController.getWorkStats);
// router.patch('/works/:id/status', AdminController.updateWorkStatus);
// router.delete('/works/:id', AdminController.deleteWork);

// TODO: 约拍管理路由（待实现）
// router.get('/appointments', AdminController.getAppointments);
// router.get('/appointments/stats', AdminController.getAppointmentStats);
// router.patch('/appointments/:id/status', AdminController.updateAppointmentStatus);

export default router;
