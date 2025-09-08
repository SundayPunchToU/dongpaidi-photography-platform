import { Request, Response } from 'express';
import { UserService } from '@/services/UserService';
import { ResponseUtil } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { log } from '@/config/logger';
import { AuthenticatedRequest, UpdateUserDto, PaginationQuery } from '@/types';

/**
 * 用户控制器
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * 获取用户详情
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return ResponseUtil.error(res, '用户ID不能为空', 400);
    }

    const user = await this.userService.getUserById(id);

    ResponseUtil.success(res, user, '获取用户信息成功');
  });

  /**
   * 更新用户信息
   */
  updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateData: UpdateUserDto = req.body;
    
    const user = await this.userService.updateUser(req.user.id, updateData);

    log.info('User profile updated', { 
      userId: req.user.id,
      updateData,
      ip: req.ip,
    });

    ResponseUtil.success(res, user, '用户信息更新成功');
  });

  /**
   * 关注用户
   */
  followUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: followingId } = req.params;
    
    await this.userService.followUser(req.user.id, followingId);

    log.info('User followed', { 
      followerId: req.user.id,
      followingId,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '关注成功');
  });

  /**
   * 取消关注用户
   */
  unfollowUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: followingId } = req.params;
    
    await this.userService.unfollowUser(req.user.id, followingId);

    log.info('User unfollowed', { 
      followerId: req.user.id,
      followingId,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '取消关注成功');
  });

  /**
   * 获取用户关注列表
   */
  getUserFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const pagination: PaginationQuery = req.query;
    
    const result = await this.userService.getUserFollowing(id, pagination);

    ResponseUtil.successWithPagination(res, result, '获取关注列表成功');
  });

  /**
   * 获取用户粉丝列表
   */
  getUserFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const pagination: PaginationQuery = req.query;
    
    const result = await this.userService.getUserFollowers(id, pagination);

    ResponseUtil.successWithPagination(res, result, '获取粉丝列表成功');
  });

  /**
   * 检查是否关注某用户
   */
  checkFollowStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: followingId } = req.params;
    
    const isFollowing = await this.userService.isFollowing(req.user.id, followingId);

    ResponseUtil.success(res, { isFollowing }, '获取关注状态成功');
  });

  /**
   * 搜索用户
   */
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { keyword } = req.query;
    const pagination: PaginationQuery = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return ResponseUtil.error(res, '搜索关键词不能为空', 400);
    }

    const result = await this.userService.searchUsers(keyword, pagination);

    log.info('User search', { 
      keyword,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '搜索用户成功');
  });

  /**
   * 获取当前用户的关注列表
   */
  getMyFollowing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pagination: PaginationQuery = req.query;
    
    const result = await this.userService.getUserFollowing(req.user.id, pagination);

    ResponseUtil.successWithPagination(res, result, '获取我的关注列表成功');
  });

  /**
   * 获取当前用户的粉丝列表
   */
  getMyFollowers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pagination: PaginationQuery = req.query;
    
    const result = await this.userService.getUserFollowers(req.user.id, pagination);

    ResponseUtil.successWithPagination(res, result, '获取我的粉丝列表成功');
  });

  /**
   * 获取用户统计信息
   */
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const user = await this.userService.getUserById(id);

    ResponseUtil.success(res, user.stats, '获取用户统计信息成功');
  });

  /**
   * 批量获取用户信息
   */
  getUsersByIds = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return ResponseUtil.error(res, '用户ID列表不能为空', 400);
    }

    if (ids.length > 100) {
      return ResponseUtil.error(res, '一次最多查询100个用户', 400);
    }

    // TODO: 实现批量获取用户信息的逻辑
    const users: any[] = [];

    for (const id of ids) {
      try {
        const user = await this.userService.getUserById(id);
        users.push(user);
      } catch (error) {
        // 忽略不存在的用户
        log.warn('User not found in batch query', { userId: id });
      }
    }

    ResponseUtil.success(res, users, '批量获取用户信息成功');
  });

  /**
   * 获取推荐用户
   */
  getRecommendedUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pagination: PaginationQuery = req.query;

    // TODO: 实现用户推荐算法
    // 1. 基于共同关注的用户推荐
    // 2. 基于地理位置的推荐
    // 3. 基于兴趣标签的推荐
    // 4. 基于作品互动的推荐

    // 暂时返回活跃用户作为推荐
    const result = await this.userService.searchUsers('', pagination);

    log.info('Recommended users requested', { 
      userId: req.user.id,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取推荐用户成功');
  });

  /**
   * 举报用户
   */
  reportUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: reportedUserId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return ResponseUtil.error(res, '举报原因不能为空', 400);
    }

    // TODO: 实现用户举报功能
    // 1. 创建举报记录
    // 2. 发送通知给管理员
    // 3. 根据举报类型和频率自动处理

    log.info('User reported', { 
      reporterId: req.user.id,
      reportedUserId,
      reason,
      description,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '举报提交成功');
  });

  /**
   * 拉黑用户
   */
  blockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: blockedUserId } = req.params;

    // TODO: 实现用户拉黑功能
    // 1. 创建拉黑记录
    // 2. 自动取消关注关系
    // 3. 隐藏相关内容

    log.info('User blocked', { 
      blockerId: req.user.id,
      blockedUserId,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '拉黑成功');
  });

  /**
   * 取消拉黑用户
   */
  unblockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: blockedUserId } = req.params;

    // TODO: 实现取消拉黑功能

    log.info('User unblocked', { 
      blockerId: req.user.id,
      blockedUserId,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '取消拉黑成功');
  });
}

export default UserController;
