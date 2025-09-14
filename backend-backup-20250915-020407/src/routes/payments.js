/**
 * 支付管理路由
 * 处理支付相关的操作和统计信息
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { paymentModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /payments/admin/stats 获取支付统计信息
 * @apiName GetPaymentStats
 * @apiGroup Payments
 * @apiDescription 获取支付相关的统计数据
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.totalRevenue 总收入
 * @apiSuccess {Number} data.totalOrders 总订单数
 * @apiSuccess {Number} data.pendingOrders 待处理订单数
 * @apiSuccess {Number} data.completedOrders 已完成订单数
 * @apiSuccess {Number} data.refundedOrders 已退款订单数
 * @apiSuccess {Number} data.todayRevenue 今日收入
 * @apiSuccess {Number} data.todayOrders 今日订单数
 */
router.get('/admin/stats', requireAuth, (req, res) => {
  try {
    const stats = paymentModel.getStats();
    
    logger.debug('Payment stats retrieved', stats);
    
    res.success(stats, '获取支付统计成功');
  } catch (error) {
    logger.error('Failed to get payment stats', { error: error.message });
    res.error('获取支付统计失败', 500);
  }
});

/**
 * @api {get} /payments/admin/orders 获取订单列表
 * @apiName GetOrders
 * @apiGroup Payments
 * @apiDescription 获取订单列表，支持分页和筛选
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [limit=10] 每页数量
 * @apiQuery {String} [status] 订单状态筛选
 * @apiQuery {String} [search] 搜索关键词
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Array} data 订单列表
 * @apiSuccess {Object} meta 分页信息
 */
router.get('/admin/orders', requireAuth, (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    search 
  } = req.query;

  try {
    // 构建过滤条件
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.orderNumber = `*${search}*`;
    }

    // 模拟订单数据
    const orders = [];
    const total = 0;

    logger.debug('Orders list retrieved', { 
      page, 
      limit, 
      total, 
      filter 
    });

    res.paginated(orders, page, limit, total, '获取订单列表成功');
  } catch (error) {
    logger.error('Failed to get orders list', { error: error.message });
    res.error('获取订单列表失败', 500);
  }
});

module.exports = router;
