import { Router } from 'express';
import { WorksController } from '@/controllers/WorksController';
import { authenticate, optionalAuthenticate, requireOwnership } from '@/middleware/auth';
import { validate, schemas } from '@/utils/validation';

const router = Router();
const worksController = new WorksController();

/**
 * 作品相关路由
 */

// 获取作品列表
router.get('/', 
  optionalAuthenticate,
  validate(schemas.worksQuery, 'query'),
  worksController.getWorks
);

// 搜索作品
router.get('/search', 
  validate(schemas.worksQuery, 'query'),
  worksController.searchWorks
);

// 获取推荐作品
router.get('/recommended', 
  validate(schemas.pagination, 'query'),
  worksController.getRecommendedWorks
);

// 获取热门作品
router.get('/trending', 
  validate(schemas.pagination, 'query'),
  worksController.getTrendingWorks
);

// 按分类获取作品
router.get('/category/:category', 
  validate(schemas.worksQuery, 'query'),
  worksController.getWorksByCategory
);

// 创建作品（需要认证）
router.post('/', 
  authenticate,
  validate(schemas.createWork),
  worksController.createWork
);

// 获取当前用户收藏的作品（需要认证）
router.get('/me/collections', 
  authenticate,
  validate(schemas.pagination, 'query'),
  worksController.getUserCollections
);

// 获取作品详情
router.get('/:id', 
  optionalAuthenticate,
  worksController.getWorkById
);

// 获取作品统计信息
router.get('/:id/stats', worksController.getWorkStats);

// 更新作品（需要认证且为作品所有者）
router.put('/:id', 
  authenticate,
  requireOwnership('work'),
  validate(schemas.updateWork),
  worksController.updateWork
);

// 删除作品（需要认证且为作品所有者）
router.delete('/:id', 
  authenticate,
  requireOwnership('work'),
  worksController.deleteWork
);

// 点赞作品（需要认证）
router.post('/:id/like', 
  authenticate, 
  worksController.likeWork
);

// 取消点赞作品（需要认证）
router.delete('/:id/like', 
  authenticate, 
  worksController.unlikeWork
);

// 收藏作品（需要认证）
router.post('/:id/collect', 
  authenticate, 
  worksController.collectWork
);

// 取消收藏作品（需要认证）
router.delete('/:id/collect', 
  authenticate, 
  worksController.uncollectWork
);

// 举报作品（需要认证）
router.post('/:id/report', 
  authenticate, 
  worksController.reportWork
);

// 获取用户的作品
router.get('/user/:id', 
  validate(schemas.worksQuery, 'query'),
  worksController.getUserWorks
);

export default router;
