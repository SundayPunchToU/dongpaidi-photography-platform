import { Request, Response } from 'express';
import { WorksService } from '@/services/WorksService';
import { ResponseUtil } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { log } from '@/config/logger';
import { AuthenticatedRequest, CreateWorkDto, UpdateWorkDto, WorksFilterDto } from '@/types';

/**
 * 作品控制器
 */
export class WorksController {
  private worksService: WorksService;

  constructor() {
    this.worksService = new WorksService();
  }

  /**
   * 创建作品
   */
  createWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workData: CreateWorkDto = req.body;
    
    const work = await this.worksService.createWork(req.user.id, workData);

    log.info('Work created', { 
      workId: work.id,
      userId: req.user.id,
      title: workData.title,
      ip: req.ip,
    });

    ResponseUtil.success(res, work, '作品发布成功', 201);
  });

  /**
   * 获取作品详情
   */
  getWorkById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const viewerId = (req as AuthenticatedRequest).user?.id;
    
    const work = await this.worksService.getWorkById(id, viewerId);

    ResponseUtil.success(res, work, '获取作品详情成功');
  });

  /**
   * 获取作品列表
   */
  getWorks = asyncHandler(async (req: Request, res: Response) => {
    const filters: WorksFilterDto = req.query;
    
    const result = await this.worksService.getWorks(filters);

    log.info('Works list requested', { 
      filters,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取作品列表成功');
  });

  /**
   * 更新作品
   */
  updateWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateWorkDto = req.body;
    
    const work = await this.worksService.updateWork(id, req.user.id, updateData);

    log.info('Work updated', { 
      workId: id,
      userId: req.user.id,
      updateData,
      ip: req.ip,
    });

    ResponseUtil.success(res, work, '作品更新成功');
  });

  /**
   * 删除作品
   */
  deleteWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await this.worksService.deleteWork(id, req.user.id);

    log.info('Work deleted', { 
      workId: id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '作品删除成功');
  });

  /**
   * 点赞作品
   */
  likeWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await this.worksService.likeWork(id, req.user.id);

    log.info('Work liked', { 
      workId: id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '点赞成功');
  });

  /**
   * 取消点赞作品
   */
  unlikeWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await this.worksService.unlikeWork(id, req.user.id);

    log.info('Work unliked', { 
      workId: id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '取消点赞成功');
  });

  /**
   * 收藏作品
   */
  collectWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await this.worksService.collectWork(id, req.user.id);

    log.info('Work collected', { 
      workId: id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '收藏成功');
  });

  /**
   * 取消收藏作品
   */
  uncollectWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await this.worksService.uncollectWork(id, req.user.id);

    log.info('Work uncollected', { 
      workId: id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '取消收藏成功');
  });

  /**
   * 获取用户收藏的作品
   */
  getUserCollections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pagination = req.query;
    
    const result = await this.worksService.getUserCollections(req.user.id, pagination);

    ResponseUtil.successWithPagination(res, result, '获取收藏列表成功');
  });

  /**
   * 获取用户的作品
   */
  getUserWorks = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const filters: WorksFilterDto = {
      ...req.query,
      userId: id,
    };
    
    const result = await this.worksService.getWorks(filters);

    ResponseUtil.successWithPagination(res, result, '获取用户作品成功');
  });

  /**
   * 获取推荐作品
   */
  getRecommendedWorks = asyncHandler(async (req: Request, res: Response) => {
    const filters: WorksFilterDto = {
      ...req.query,
      sortBy: 'likeCount', // 按点赞数排序作为推荐
    };
    
    const result = await this.worksService.getWorks(filters);

    log.info('Recommended works requested', { 
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取推荐作品成功');
  });

  /**
   * 获取热门作品
   */
  getTrendingWorks = asyncHandler(async (req: Request, res: Response) => {
    const filters: WorksFilterDto = {
      ...req.query,
      sortBy: 'viewCount', // 按浏览量排序
    };
    
    const result = await this.worksService.getWorks(filters);

    log.info('Trending works requested', { 
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取热门作品成功');
  });

  /**
   * 按分类获取作品
   */
  getWorksByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const filters: WorksFilterDto = {
      ...req.query,
      category,
    };
    
    const result = await this.worksService.getWorks(filters);

    log.info('Works by category requested', { 
      category,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, `获取${category}分类作品成功`);
  });

  /**
   * 搜索作品
   */
  searchWorks = asyncHandler(async (req: Request, res: Response) => {
    const { keyword } = req.query;
    
    if (!keyword || typeof keyword !== 'string') {
      return ResponseUtil.error(res, '搜索关键词不能为空', 400);
    }

    const filters: WorksFilterDto = {
      ...req.query,
      keyword,
    };
    
    const result = await this.worksService.getWorks(filters);

    log.info('Works search', { 
      keyword,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '搜索作品成功');
  });

  /**
   * 举报作品
   */
  reportWork = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return ResponseUtil.error(res, '举报原因不能为空', 400);
    }

    // TODO: 实现作品举报功能
    // 1. 创建举报记录
    // 2. 发送通知给管理员
    // 3. 根据举报类型和频率自动处理

    log.info('Work reported', { 
      workId: id,
      reporterId: req.user.id,
      reason,
      description,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '举报提交成功');
  });

  /**
   * 获取作品统计信息
   */
  getWorkStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const work = await this.worksService.getWorkById(id);

    ResponseUtil.success(res, work.stats, '获取作品统计信息成功');
  });
}

export default WorksController;
