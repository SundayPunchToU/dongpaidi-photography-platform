/**
 * 作品管理路由
 * 处理作品相关的CRUD操作和统计信息
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { workModel } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @api {get} /works 获取作品列表
 * @apiName GetWorks
 * @apiGroup Works
 * @apiDescription 获取作品列表，支持分页和筛选
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiQuery {Number} [page=1] 页码
 * @apiQuery {Number} [limit=10] 每页数量
 * @apiQuery {String} [status] 作品状态筛选
 * @apiQuery {String} [category] 作品分类筛选
 * @apiQuery {String} [search] 搜索关键词
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Array} data 作品列表
 * @apiSuccess {Object} meta 分页信息
 */
router.get('/', (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    category, 
    search 
  } = req.query;

  try {
    // 构建过滤条件
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.title = `*${search}*`;
    }

    // 模拟作品数据
    const mockWorks = [];
    const total = 0;

    logger.debug('Works list retrieved', { 
      page, 
      limit, 
      total, 
      filter 
    });

    res.paginated(mockWorks, page, limit, total, '获取作品列表成功');
  } catch (error) {
    logger.error('Failed to get works list', { error: error.message });
    res.error('获取作品列表失败', 500);
  }
});

/**
 * @api {get} /works/stats 获取作品统计信息
 * @apiName GetWorkStats
 * @apiGroup Works
 * @apiDescription 获取作品相关的统计数据
 * 
 * @apiHeader {String} x-session-id 会话ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.total 总作品数
 * @apiSuccess {Number} data.published 已发布作品数
 * @apiSuccess {Number} data.pending 待审核作品数
 * @apiSuccess {Number} data.rejected 已拒绝作品数
 * @apiSuccess {Number} data.newToday 今日新增作品数
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = workModel.getStats();
    
    logger.debug('Work stats retrieved', stats);
    
    res.success(stats, '获取作品统计成功');
  } catch (error) {
    logger.error('Failed to get work stats', { error: error.message });
    res.error('获取作品统计失败', 500);
  }
});

/**
 * @api {get} /works/:id 获取作品详情
 * @apiName GetWork
 * @apiGroup Works
 * @apiDescription 根据ID获取作品详细信息
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 作品ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 作品信息
 */
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const work = workModel.findById(id);
    
    if (!work) {
      logger.warn('Work not found', { id });
      return res.error('作品不存在', 404);
    }

    logger.debug('Work details retrieved', { id, title: work.title });
    
    res.success(work, '获取作品详情成功');
  } catch (error) {
    logger.error('Failed to get work details', { id, error: error.message });
    res.error('获取作品详情失败', 500);
  }
});

/**
 * @api {put} /works/:id/status 更新作品状态
 * @apiName UpdateWorkStatus
 * @apiGroup Works
 * @apiDescription 更新作品审核状态
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 作品ID
 * @apiBody {String} status 新状态 (pending|published|rejected)
 * @apiBody {String} [reason] 拒绝原因（当状态为rejected时）
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 更新后的作品信息
 */
router.put('/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    if (!['pending', 'published', 'rejected'].includes(status)) {
      return res.error('无效的状态值', 400);
    }

    const work = workModel.findById(id);
    
    if (!work) {
      logger.warn('Work not found for status update', { id });
      return res.error('作品不存在', 404);
    }

    const updates = { 
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.session.username
    };

    if (status === 'rejected' && reason) {
      updates.rejectReason = reason;
    }

    const updatedWork = workModel.update(id, updates);

    logger.info('Work status updated', { 
      id, 
      oldStatus: work.status,
      newStatus: status,
      reviewedBy: req.session.username
    });
    
    res.success(updatedWork, '作品状态更新成功');
  } catch (error) {
    logger.error('Failed to update work status', { id, error: error.message });
    res.error('更新作品状态失败', 500);
  }
});

/**
 * @api {delete} /works/:id 删除作品
 * @apiName DeleteWork
 * @apiGroup Works
 * @apiDescription 删除作品
 * 
 * @apiHeader {String} x-session-id 会话ID
 * @apiParam {String} id 作品ID
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} message 响应消息
 */
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const work = workModel.findById(id);
    
    if (!work) {
      logger.warn('Work not found for deletion', { id });
      return res.error('作品不存在', 404);
    }

    const deleted = workModel.delete(id);

    if (deleted) {
      logger.info('Work deleted', { 
        id, 
        title: work.title,
        deletedBy: req.session.username
      });
      
      res.success(null, '作品删除成功');
    } else {
      res.error('删除作品失败', 500);
    }
  } catch (error) {
    logger.error('Failed to delete work', { id, error: error.message });
    res.error('删除作品失败', 500);
  }
});

module.exports = router;
