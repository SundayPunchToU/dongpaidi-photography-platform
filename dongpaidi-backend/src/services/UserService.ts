import { db } from '@/config/database';
import { log } from '@/config/logger';
import { 
  ID, 
  UpdateUserDto, 
  UserProfile,
  PaginationQuery,
  PaginatedResponse 
} from '@/types';
import { PaginationUtil } from '@/utils/response';
import { NotFoundError, BusinessError } from '@/middleware/error';

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 获取用户详情
   */
  async getUserById(userId: ID): Promise<UserProfile> {
    const user = await db.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            works: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return this.formatUserProfile(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: ID, updateData: UpdateUserDto): Promise<UserProfile> {
    try {
      // 检查用户是否存在
      const existingUser = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new NotFoundError('用户不存在');
      }

      // 更新用户信息
      const updatedUser = await db.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          specialties: updateData.specialties ? JSON.stringify(updateData.specialties) : undefined,
          equipment: updateData.equipment ? JSON.stringify(updateData.equipment) : undefined,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              works: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      log.info('User updated', { userId, updateData });

      return this.formatUserProfile(updatedUser);
    } catch (error: any) {
      log.error('Update user failed', { error: error.message, userId, updateData });
      throw error;
    }
  }

  /**
   * 关注用户
   */
  async followUser(followerId: ID, followingId: ID): Promise<void> {
    if (followerId === followingId) {
      throw new BusinessError('不能关注自己');
    }

    // 检查目标用户是否存在
    const targetUser = await db.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundError('目标用户不存在');
    }

    // 检查是否已经关注
    const existingFollow = await db.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BusinessError('已经关注该用户');
    }

    // 使用事务创建关注关系并更新统计
    await db.transaction(async (prisma) => {
      // 创建关注关系
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // 更新关注者的关注数
      await prisma.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            increment: 1,
          },
        },
      });

      // 更新被关注者的粉丝数
      await prisma.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      });
    });

    log.info('User followed', { followerId, followingId });
  }

  /**
   * 取消关注用户
   */
  async unfollowUser(followerId: ID, followingId: ID): Promise<void> {
    // 检查关注关系是否存在
    const existingFollow = await db.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new BusinessError('未关注该用户');
    }

    // 使用事务删除关注关系并更新统计
    await db.transaction(async (prisma) => {
      // 删除关注关系
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      // 更新关注者的关注数
      await prisma.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            decrement: 1,
          },
        },
      });

      // 更新被关注者的粉丝数
      await prisma.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            decrement: 1,
          },
        },
      });
    });

    log.info('User unfollowed', { followerId, followingId });
  }

  /**
   * 获取用户关注列表
   */
  async getUserFollowing(
    userId: ID, 
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<UserProfile>> {
    const { page, limit, skip } = PaginationUtil.calculatePagination(
      pagination.page, 
      pagination.limit
    );

    const [follows, total] = await Promise.all([
      db.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: {
              _count: {
                select: {
                  works: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    const users = follows.map(follow => this.formatUserProfile(follow.following));

    return PaginationUtil.buildPaginatedResponse(users, total, page, limit);
  }

  /**
   * 获取用户粉丝列表
   */
  async getUserFollowers(
    userId: ID, 
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<UserProfile>> {
    const { page, limit, skip } = PaginationUtil.calculatePagination(
      pagination.page, 
      pagination.limit
    );

    const [follows, total] = await Promise.all([
      db.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: {
              _count: {
                select: {
                  works: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    const users = follows.map(follow => this.formatUserProfile(follow.follower));

    return PaginationUtil.buildPaginatedResponse(users, total, page, limit);
  }

  /**
   * 检查是否关注某用户
   */
  async isFollowing(followerId: ID, followingId: ID): Promise<boolean> {
    const follow = await db.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  /**
   * 搜索用户
   */
  async searchUsers(
    keyword: string, 
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<UserProfile>> {
    const { page, limit, skip } = PaginationUtil.calculatePagination(
      pagination.page, 
      pagination.limit
    );

    const [users, total] = await Promise.all([
      db.prisma.user.findMany({
        where: {
          OR: [
            { nickname: { contains: keyword } },
            { bio: { contains: keyword } },
          ],
          status: 'active',
        },
        include: {
          _count: {
            select: {
              works: true,
              followers: true,
              following: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { followersCount: 'desc' },
      }),
      db.prisma.user.count({
        where: {
          OR: [
            { nickname: { contains: keyword } },
            { bio: { contains: keyword } },
          ],
          status: 'active',
        },
      }),
    ]);

    const userProfiles = users.map(user => this.formatUserProfile(user));

    return PaginationUtil.buildPaginatedResponse(userProfiles, total, page, limit);
  }

  /**
   * 格式化用户资料
   */
  private formatUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isPhotographer: user.isPhotographer,
      isModel: user.isModel,
      isVerified: user.isVerified,
      stats: {
        worksCount: user._count?.works || 0,
        followersCount: user._count?.followers || user.followersCount || 0,
        followingCount: user._count?.following || user.followingCount || 0,
        totalLikes: user.totalLikes || 0,
      },
      createdAt: user.createdAt,
    };
  }
}

export default UserService;
