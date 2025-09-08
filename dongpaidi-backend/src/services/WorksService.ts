import { db } from '@/config/database';
import { log } from '@/config/logger';
import { 
  ID, 
  CreateWorkDto, 
  UpdateWorkDto, 
  WorkItem,
  WorksFilterDto,
  PaginatedResponse 
} from '@/types';
import { PaginationUtil } from '@/utils/response';
import { NotFoundError, BusinessError, ForbiddenError } from '@/middleware/error';

/**
 * 作品服务类
 */
export class WorksService {
  /**
   * 创建作品
   */
  async createWork(userId: ID, workData: CreateWorkDto): Promise<WorkItem> {
    try {
      // 使用事务创建作品并更新用户统计
      const work = await db.transaction(async (prisma) => {
        // 创建作品
        const newWork = await prisma.work.create({
          data: {
            userId,
            title: workData.title,
            description: workData.description,
            images: JSON.stringify(workData.images || []),
            tags: JSON.stringify(workData.tags || []),
            category: workData.category,
            location: workData.location,
            shootingDate: workData.shootingDate,
            shootingInfo: JSON.stringify(workData.shootingInfo || {}),
            coverImage: workData.coverImage || (workData.images && workData.images[0]) || '',
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        });

        // 更新用户作品数量
        await prisma.user.update({
          where: { id: userId },
          data: {
            worksCount: {
              increment: 1,
            },
          },
        });

        return newWork;
      });

      log.info('Work created', { workId: work.id, userId, title: workData.title });

      return this.formatWorkItem(work);
    } catch (error: any) {
      log.error('Create work failed', { error: error.message, userId, workData });
      throw error;
    }
  }

  /**
   * 获取作品详情
   */
  async getWorkById(workId: ID, viewerId?: ID): Promise<WorkItem> {
    const work = await db.prisma.work.findUnique({
      where: { id: workId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!work) {
      throw new NotFoundError('作品不存在');
    }

    if (work.status !== 'published') {
      throw new NotFoundError('作品不存在');
    }

    // 增加浏览量（异步执行，不影响响应）
    this.incrementViewCount(workId).catch(error => {
      log.error('Increment view count failed', { error: error.message, workId });
    });

    // 获取用户交互状态
    let userInteraction;
    if (viewerId) {
      userInteraction = await this.getUserInteraction(workId, viewerId);
    }

    return this.formatWorkItem(work, userInteraction);
  }

  /**
   * 获取作品列表
   */
  async getWorks(filters: WorksFilterDto): Promise<PaginatedResponse<WorkItem>> {
    const { page, limit, skip } = PaginationUtil.calculatePagination(
      filters.page, 
      filters.limit
    );

    // 构建查询条件
    const where: any = {
      status: 'published',
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
        { tags: { hasSome: [filters.keyword] } },
      ];
    }

    // 构建排序条件
    const orderBy: any = {};
    if (filters.sortBy === 'likeCount') {
      orderBy.likeCount = filters.sortOrder || 'desc';
    } else if (filters.sortBy === 'viewCount') {
      orderBy.viewCount = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = filters.sortOrder || 'desc';
    }

    const [works, total] = await Promise.all([
      db.prisma.work.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      db.prisma.work.count({ where }),
    ]);

    const workItems = works.map(work => this.formatWorkItem(work));

    return PaginationUtil.buildPaginatedResponse(workItems, total, page, limit);
  }

  /**
   * 更新作品
   */
  async updateWork(workId: ID, userId: ID, updateData: UpdateWorkDto): Promise<WorkItem> {
    // 检查作品是否存在且属于当前用户
    const existingWork = await db.prisma.work.findUnique({
      where: { id: workId },
    });

    if (!existingWork) {
      throw new NotFoundError('作品不存在');
    }

    if (existingWork.userId !== userId) {
      throw new ForbiddenError('无权限修改此作品');
    }

    try {
      const updatedWork = await db.prisma.work.update({
        where: { id: workId },
        data: {
          ...updateData,
          tags: updateData.tags ? JSON.stringify(updateData.tags) : undefined,
          shootingInfo: updateData.shootingInfo ? JSON.stringify(updateData.shootingInfo) : undefined,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      });

      log.info('Work updated', { workId, userId, updateData });

      return this.formatWorkItem(updatedWork);
    } catch (error: any) {
      log.error('Update work failed', { error: error.message, workId, userId, updateData });
      throw error;
    }
  }

  /**
   * 删除作品
   */
  async deleteWork(workId: ID, userId: ID): Promise<void> {
    // 检查作品是否存在且属于当前用户
    const existingWork = await db.prisma.work.findUnique({
      where: { id: workId },
    });

    if (!existingWork) {
      throw new NotFoundError('作品不存在');
    }

    if (existingWork.userId !== userId) {
      throw new ForbiddenError('无权限删除此作品');
    }

    try {
      // 使用事务删除作品并更新用户统计
      await db.transaction(async (prisma) => {
        // 删除作品（级联删除相关的点赞、评论、收藏）
        await prisma.work.delete({
          where: { id: workId },
        });

        // 更新用户作品数量
        await prisma.user.update({
          where: { id: userId },
          data: {
            worksCount: {
              decrement: 1,
            },
          },
        });
      });

      log.info('Work deleted', { workId, userId });
    } catch (error: any) {
      log.error('Delete work failed', { error: error.message, workId, userId });
      throw error;
    }
  }

  /**
   * 点赞作品
   */
  async likeWork(workId: ID, userId: ID): Promise<void> {
    // 检查作品是否存在
    const work = await db.prisma.work.findUnique({
      where: { id: workId },
      select: { id: true, userId: true },
    });

    if (!work) {
      throw new NotFoundError('作品不存在');
    }

    // 检查是否已经点赞
    const existingLike = await db.prisma.like.findUnique({
      where: {
        userId_workId: {
          userId,
          workId,
        },
      },
    });

    if (existingLike) {
      throw new BusinessError('已经点赞过该作品');
    }

    try {
      // 使用事务创建点赞并更新统计
      await db.transaction(async (prisma) => {
        // 创建点赞记录
        await prisma.like.create({
          data: {
            userId,
            workId,
          },
        });

        // 更新作品点赞数
        await prisma.work.update({
          where: { id: workId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });

        // 更新作品作者的总点赞数
        await prisma.user.update({
          where: { id: work.userId },
          data: {
            totalLikes: {
              increment: 1,
            },
          },
        });
      });

      log.info('Work liked', { workId, userId });
    } catch (error: any) {
      log.error('Like work failed', { error: error.message, workId, userId });
      throw error;
    }
  }

  /**
   * 取消点赞作品
   */
  async unlikeWork(workId: ID, userId: ID): Promise<void> {
    // 检查点赞是否存在
    const existingLike = await db.prisma.like.findUnique({
      where: {
        userId_workId: {
          userId,
          workId,
        },
      },
      include: {
        work: {
          select: { userId: true },
        },
      },
    });

    if (!existingLike) {
      throw new BusinessError('未点赞该作品');
    }

    try {
      // 使用事务删除点赞并更新统计
      await db.transaction(async (prisma) => {
        // 删除点赞记录
        await prisma.like.delete({
          where: {
            userId_workId: {
              userId,
              workId,
            },
          },
        });

        // 更新作品点赞数
        await prisma.work.update({
          where: { id: workId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });

        // 更新作品作者的总点赞数
        await prisma.user.update({
          where: { id: existingLike.work.userId },
          data: {
            totalLikes: {
              decrement: 1,
            },
          },
        });
      });

      log.info('Work unliked', { workId, userId });
    } catch (error: any) {
      log.error('Unlike work failed', { error: error.message, workId, userId });
      throw error;
    }
  }

  /**
   * 收藏作品
   */
  async collectWork(workId: ID, userId: ID): Promise<void> {
    // 检查作品是否存在
    const work = await db.prisma.work.findUnique({
      where: { id: workId },
      select: { id: true },
    });

    if (!work) {
      throw new NotFoundError('作品不存在');
    }

    // 检查是否已经收藏
    const existingCollection = await db.prisma.collection.findUnique({
      where: {
        userId_workId: {
          userId,
          workId,
        },
      },
    });

    if (existingCollection) {
      throw new BusinessError('已经收藏过该作品');
    }

    try {
      // 使用事务创建收藏并更新统计
      await db.transaction(async (prisma) => {
        // 创建收藏记录
        await prisma.collection.create({
          data: {
            userId,
            workId,
          },
        });

        // 更新作品收藏数
        await prisma.work.update({
          where: { id: workId },
          data: {
            collectCount: {
              increment: 1,
            },
          },
        });
      });

      log.info('Work collected', { workId, userId });
    } catch (error: any) {
      log.error('Collect work failed', { error: error.message, workId, userId });
      throw error;
    }
  }

  /**
   * 取消收藏作品
   */
  async uncollectWork(workId: ID, userId: ID): Promise<void> {
    // 检查收藏是否存在
    const existingCollection = await db.prisma.collection.findUnique({
      where: {
        userId_workId: {
          userId,
          workId,
        },
      },
    });

    if (!existingCollection) {
      throw new BusinessError('未收藏该作品');
    }

    try {
      // 使用事务删除收藏并更新统计
      await db.transaction(async (prisma) => {
        // 删除收藏记录
        await prisma.collection.delete({
          where: {
            userId_workId: {
              userId,
              workId,
            },
          },
        });

        // 更新作品收藏数
        await prisma.work.update({
          where: { id: workId },
          data: {
            collectCount: {
              decrement: 1,
            },
          },
        });
      });

      log.info('Work uncollected', { workId, userId });
    } catch (error: any) {
      log.error('Uncollect work failed', { error: error.message, workId, userId });
      throw error;
    }
  }

  /**
   * 获取用户收藏的作品
   */
  async getUserCollections(
    userId: ID,
    pagination: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<WorkItem>> {
    const { page, limit, skip } = PaginationUtil.calculatePagination(
      pagination.page,
      pagination.limit
    );

    const [collections, total] = await Promise.all([
      db.prisma.collection.findMany({
        where: { userId },
        include: {
          work: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.prisma.collection.count({
        where: { userId },
      }),
    ]);

    const works = collections.map(collection => this.formatWorkItem(collection.work));

    return PaginationUtil.buildPaginatedResponse(works, total, page, limit);
  }

  /**
   * 增加浏览量
   */
  private async incrementViewCount(workId: ID): Promise<void> {
    await db.prisma.work.update({
      where: { id: workId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 获取用户对作品的交互状态
   */
  private async getUserInteraction(workId: ID, userId: ID): Promise<any> {
    const [like, collection] = await Promise.all([
      db.prisma.like.findUnique({
        where: {
          userId_workId: {
            userId,
            workId,
          },
        },
      }),
      db.prisma.collection.findUnique({
        where: {
          userId_workId: {
            userId,
            workId,
          },
        },
      }),
    ]);

    return {
      isLiked: !!like,
      isCollected: !!collection,
    };
  }

  /**
   * 格式化作品数据
   */
  private formatWorkItem(work: any, userInteraction?: any): WorkItem {
    return {
      id: work.id,
      title: work.title,
      description: work.description,
      images: work.images as string[],
      coverImage: work.coverImage,
      tags: work.tags,
      category: work.category,
      location: work.location,
      shootingDate: work.shootingDate,
      shootingInfo: work.shootingInfo,
      author: {
        id: work.user.id,
        nickname: work.user.nickname,
        avatarUrl: work.user.avatarUrl,
        isVerified: work.user.isVerified,
      },
      stats: {
        likeCount: work.likeCount,
        commentCount: work.commentCount,
        viewCount: work.viewCount,
        collectCount: work.collectCount,
      },
      userInteraction,
      createdAt: work.createdAt,
    };
  }
}

export default WorksService;
