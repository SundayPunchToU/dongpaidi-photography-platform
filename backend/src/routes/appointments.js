/**
 * 约拍管理路由
 * 处理约拍相关的CRUD操作和统计信息
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { appointmentModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /appointments 获取约拍列表
 * @apiName GetAppointments
 * @apiGroup Appointments
 * @apiDescription 获取约拍列表，支持分页和筛选
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [limit=10] 每页数量
 * @apiQuery {String} [status] 约拍状态筛选
 * @apiQuery {String} [type] 约拍类型筛选
 * @apiQuery {String} [search] 搜索关键词
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Array} data 约拍列表
 * @apiSuccess {Object} meta 分页信息
 */
router.get('/', (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    type, 
    search 
  } = req.query;

  try {
    // 构建过滤条件
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.title = `*${search}*`;
    }

    // 模拟约拍数据
    const mockAppointments = [];
    const total = 0;

    logger.debug('Appointments list retrieved', { 
      page, 
      limit, 
      total, 
      filter 
    });

    res.paginated(mockAppointments, page, limit, total, '获取约拍列表成功');
  } catch (error) {
    logger.error('Failed to get appointments list', { error: error.message });
    res.error('获取约拍列表失败', 500);
  }
});

/**
 * @api {get} /appointments/stats 获取约拍统计信息
 * @apiName GetAppointmentStats
 * @apiGroup Appointments
 * @apiDescription 获取约拍相关的统计数据
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.total 总约拍数
 * @apiSuccess {Number} data.open 开放约拍数
 * @apiSuccess {Number} data.inProgress 进行中约拍数
 * @apiSuccess {Number} data.completed 已完成约拍数
 * @apiSuccess {Number} data.cancelled 已取消约拍数
 * @apiSuccess {Number} data.newToday 今日新增约拍数
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = appointmentModel.getStats();
    
    logger.debug('Appointment stats retrieved', stats);
    
    res.success(stats, '获取约拍统计成功');
  } catch (error) {
    logger.error('Failed to get appointment stats', { error: error.message });
    res.error('获取约拍统计失败', 500);
  }
});

/**
 * @api {get} /appointments/:id 获取约拍详情
 * @apiName GetAppointment
 * @apiGroup Appointments
 * @apiDescription 根据ID获取约拍详细信息
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 约拍ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 约拍信息
 */
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const appointment = appointmentModel.findById(id);
    
    if (!appointment) {
      logger.warn('Appointment not found', { id });
      return res.error('约拍不存在', 404);
    }

    logger.debug('Appointment details retrieved', { id, title: appointment.title });
    
    res.success(appointment, '获取约拍详情成功');
  } catch (error) {
    logger.error('Failed to get appointment details', { id, error: error.message });
    res.error('获取约拍详情失败', 500);
  }
});

/**
 * @api {put} /appointments/:id/status 更新约拍状态
 * @apiName UpdateAppointmentStatus
 * @apiGroup Appointments
 * @apiDescription 更新约拍状态
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 约拍ID
 * @apiBody {String} status 新状态 (open|inProgress|completed|cancelled)
 * @apiBody {String} [reason] 状态变更原因
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 更新后的约拍信息
 */
router.put('/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    if (!['open', 'inProgress', 'completed', 'cancelled'].includes(status)) {
      return res.error('无效的状态值', 400);
    }

    const appointment = appointmentModel.findById(id);
    
    if (!appointment) {
      logger.warn('Appointment not found for status update', { id });
      return res.error('约拍不存在', 404);
    }

    const updates = { 
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.session.username
    };

    if (reason) {
      updates.statusReason = reason;
    }

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    const updatedAppointment = appointmentModel.update(id, updates);

    logger.info('Appointment status updated', { 
      id, 
      oldStatus: appointment.status,
      newStatus: status,
      updatedBy: req.session.username
    });
    
    res.success(updatedAppointment, '约拍状态更新成功');
  } catch (error) {
    logger.error('Failed to update appointment status', { id, error: error.message });
    res.error('更新约拍状态失败', 500);
  }
});

/**
 * @api {delete} /appointments/:id 删除约拍
 * @apiName DeleteAppointment
 * @apiGroup Appointments
 * @apiDescription 删除约拍
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 约拍ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 */
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const appointment = appointmentModel.findById(id);
    
    if (!appointment) {
      logger.warn('Appointment not found for deletion', { id });
      return res.error('约拍不存在', 404);
    }

    const deleted = appointmentModel.delete(id);

    if (deleted) {
      logger.info('Appointment deleted', { 
        id, 
        title: appointment.title,
        deletedBy: req.session.username
      });
      
      res.success(null, '约拍删除成功');
    } else {
      res.error('删除约拍失败', 500);
    }
  } catch (error) {
    logger.error('Failed to delete appointment', { id, error: error.message });
    res.error('删除约拍失败', 500);
  }
});

module.exports = router;
