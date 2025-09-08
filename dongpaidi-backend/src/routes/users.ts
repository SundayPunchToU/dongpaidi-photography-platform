import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticate, optionalAuthenticate } from '@/middleware/auth';
import { validate, schemas } from '@/utils/validation';

const router = Router();
const userController = new UserController();

/**
 * 用户相关路由
 */

// 搜索用户
router.get('/search', 
  validate(schemas.pagination, 'query'),
  userController.searchUsers
);

// 获取推荐用户（需要认证）
router.get('/recommended', 
  authenticate,
  validate(schemas.pagination, 'query'),
  userController.getRecommendedUsers
);

// 批量获取用户信息
router.post('/batch', userController.getUsersByIds);

// 获取当前用户的关注列表（需要认证）
router.get('/me/following', 
  authenticate,
  validate(schemas.pagination, 'query'),
  userController.getMyFollowing
);

// 获取当前用户的粉丝列表（需要认证）
router.get('/me/followers', 
  authenticate,
  validate(schemas.pagination, 'query'),
  userController.getMyFollowers
);

// 更新当前用户信息（需要认证）
router.put('/me', 
  authenticate,
  validate(schemas.updateUser),
  userController.updateUser
);

// 获取用户详情
router.get('/:id', userController.getUserById);

// 获取用户统计信息
router.get('/:id/stats', userController.getUserStats);

// 获取用户关注列表
router.get('/:id/following', 
  validate(schemas.pagination, 'query'),
  userController.getUserFollowing
);

// 获取用户粉丝列表
router.get('/:id/followers', 
  validate(schemas.pagination, 'query'),
  userController.getUserFollowers
);

// 关注用户（需要认证）
router.post('/:id/follow', 
  authenticate, 
  userController.followUser
);

// 取消关注用户（需要认证）
router.delete('/:id/follow', 
  authenticate, 
  userController.unfollowUser
);

// 检查关注状态（需要认证）
router.get('/:id/follow/status', 
  authenticate, 
  userController.checkFollowStatus
);

// 举报用户（需要认证）
router.post('/:id/report', 
  authenticate, 
  userController.reportUser
);

// 拉黑用户（需要认证）
router.post('/:id/block', 
  authenticate, 
  userController.blockUser
);

// 取消拉黑用户（需要认证）
router.delete('/:id/block', 
  authenticate, 
  userController.unblockUser
);

export default router;
