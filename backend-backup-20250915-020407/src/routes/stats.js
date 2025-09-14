/**
 * 统计数据路由
 * 处理系统统计和趋势数据
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { statsModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /stats 获取系统总体统计
 * @apiName GetOverallStats
 * @apiGroup Stats
 * @apiDescription 获取系统总体统计数据
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.users 用户总数
 * @apiSuccess {Number} data.works 作品总数
 * @apiSuccess {Number} data.appointments 约拍总数
 * @apiSuccess {Number} data.messages 消息总数
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const stats = statsModel.getOverallStats();
    
    logger.debug('Overall stats retrieved', stats);
    
    res.success(stats, '获取系统统计成功');
  } catch (error) {
    logger.error('Failed to get overall stats', { error: error.message });
    res.error('获取系统统计失败', 500);
  }
});

/**
 * @api {get} /stats/trend 获取趋势数据
 * @apiName GetTrendData
 * @apiGroup Stats
 * @apiDescription 获取系统数据趋势
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {String} [period=week] 时间段 (week|month|year)
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 趋势数据
 * @apiSuccess {Array} data.dates 日期数组
 * @apiSuccess {Array} data.users 用户数据数组
 * @apiSuccess {Array} data.works 作品数据数组
 * @apiSuccess {Array} data.appointments 约拍数据数组
 */
router.get('/trend', requireAuth, (req, res) => {
  const { period = 'week' } = req.query;

  try {
    if (!['week', 'month', 'year'].includes(period)) {
      return res.error('无效的时间段参数', 400);
    }

    const trendData = statsModel.getTrendData(period);
    
    logger.debug('Trend data retrieved', { period, dataPoints: trendData.dates.length });
    
    res.success(trendData, '获取趋势数据成功');
  } catch (error) {
    logger.error('Failed to get trend data', { period, error: error.message });
    res.error('获取趋势数据失败', 500);
  }
});

module.exports = router;
