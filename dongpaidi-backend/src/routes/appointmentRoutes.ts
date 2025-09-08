import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  applyForAppointment,
  handleApplication,
  getMyAppointments,
  getMyApplications,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointmentController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// 验证约拍创建数据
const createAppointmentSchema = Joi.object({
  title: Joi.string().required().min(1).max(100).messages({
    'string.empty': '标题不能为空',
    'string.min': '标题至少1个字符',
    'string.max': '标题不能超过100个字符',
    'any.required': '标题为必填项',
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': '描述不能超过1000个字符',
  }),
  type: Joi.string().valid('photographer_seek_model', 'model_seek_photographer').required().messages({
    'any.only': '约拍类型必须是 photographer_seek_model 或 model_seek_photographer',
    'any.required': '约拍类型为必填项',
  }),
  location: Joi.string().allow('').max(200).messages({
    'string.max': '地点不能超过200个字符',
  }),
  shootDate: Joi.date().iso().allow(null).messages({
    'date.format': '拍摄日期格式无效',
  }),
  budget: Joi.number().min(0).allow(null).messages({
    'number.min': '预算不能为负数',
  }),
  requirements: Joi.object().allow(null).messages({
    'object.base': '要求必须是对象格式',
  }),
});

// 验证申请数据
const applyAppointmentSchema = Joi.object({
  message: Joi.string().allow('').max(500).messages({
    'string.max': '申请留言不能超过500个字符',
  }),
});

// 验证处理申请数据
const handleApplicationSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject').required().messages({
    'any.only': '操作类型必须是 accept 或 reject',
    'any.required': '操作类型为必填项',
  }),
});

// 验证状态更新数据
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').required().messages({
    'any.only': '状态必须是 open, in_progress, completed 或 cancelled',
    'any.required': '状态为必填项',
  }),
});

// 公开路由
router.get('/', getAppointments); // 获取约拍列表
router.get('/:id', getAppointmentById); // 获取约拍详情

// 需要认证的路由
router.post('/', authenticateToken, validateRequest(createAppointmentSchema), createAppointment); // 创建约拍
router.post('/:id/apply', authenticateToken, validateRequest(applyAppointmentSchema), applyForAppointment); // 申请约拍
router.post('/applications/:applicationId/handle', authenticateToken, validateRequest(handleApplicationSchema), handleApplication); // 处理申请
router.get('/my/published', authenticateToken, getMyAppointments); // 获取我发布的约拍
router.get('/my/applications', authenticateToken, getMyApplications); // 获取我的申请
router.patch('/:id/status', authenticateToken, validateRequest(updateStatusSchema), updateAppointmentStatus); // 更新约拍状态
router.delete('/:id', authenticateToken, deleteAppointment); // 删除约拍

export default router;
