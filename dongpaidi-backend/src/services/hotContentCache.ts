import { cacheService } from './cache';
import { CacheKeys } from './cacheKeys';

/**
 * 热门内容项
 */
export interface HotContentItem {
  id: string;
  type: 'work' | 'user' | 'appointment';
  title: string;
  score: number;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * 热门内容统计
 */
export interface HotContentStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  score: number;
}

/**
 * 热门内容缓存服务
 */
export class HotContentCache {
  // 热门内容缓存时间（1小时）
  private static readonly HOT_CONTENT_TTL = 60 * 60; // 1小时
  
  // 热门内容最大数量
  private static readonly MAX_HOT_ITEMS = 100;
  
  // 分数计算权重
  private static readonly SCORE_WEIGHTS = {
    views: 1,
    likes: 5,
    comments: 3,
    shares: 8,
    favorites: 10,
    recency: 2, // 时间新鲜度权重
  };

  /**
   * 更新内容统计数据
   * @param contentId 内容ID
   * @param type 内容类型
   * @param stats 统计数据
   */
  async updateContentStats(
    contentId: string, 
    type: 'work' | 'user' | 'appointment',
    stats: Partial<HotContentStats>
  ): Promise<void> {
    const statsKey = this.getStatsKey(contentId, type);
    
    // 获取现有统计数据
    const existingStats = await cacheService.get<HotContentStats>(statsKey) || {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      favorites: 0,
      score: 0,
    };

    // 更新统计数据
    const updatedStats: HotContentStats = {
      ...existingStats,
      ...stats,
    };

    // 计算热度分数
    updatedStats.score = this.calculateHotScore(updatedStats);

    // 存储统计数据
    await cacheService.set(statsKey, updatedStats, HotContentCache.HOT_CONTENT_TTL * 24); // 24小时

    // 更新热门内容排行
    await this.updateHotRanking(contentId, type, updatedStats.score);
  }

  /**
   * 增加内容浏览量
   * @param contentId 内容ID
   * @param type 内容类型
   * @param increment 增加数量
   */
  async incrementViews(
    contentId: string, 
    type: 'work' | 'user' | 'appointment',
    increment: number = 1
  ): Promise<void> {
    const statsKey = this.getStatsKey(contentId, type);
    const stats = await cacheService.get<HotContentStats>(statsKey) || {
      views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, score: 0
    };
    
    stats.views += increment;
    await this.updateContentStats(contentId, type, stats);
  }

  /**
   * 增加内容点赞数
   * @param contentId 内容ID
   * @param type 内容类型
   * @param increment 增加数量
   */
  async incrementLikes(
    contentId: string, 
    type: 'work' | 'user' | 'appointment',
    increment: number = 1
  ): Promise<void> {
    const statsKey = this.getStatsKey(contentId, type);
    const stats = await cacheService.get<HotContentStats>(statsKey) || {
      views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, score: 0
    };
    
    stats.likes += increment;
    await this.updateContentStats(contentId, type, stats);
  }

  /**
   * 增加内容评论数
   * @param contentId 内容ID
   * @param type 内容类型
   * @param increment 增加数量
   */
  async incrementComments(
    contentId: string, 
    type: 'work' | 'user' | 'appointment',
    increment: number = 1
  ): Promise<void> {
    const statsKey = this.getStatsKey(contentId, type);
    const stats = await cacheService.get<HotContentStats>(statsKey) || {
      views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, score: 0
    };
    
    stats.comments += increment;
    await this.updateContentStats(contentId, type, stats);
  }

  /**
   * 获取热门内容列表
   * @param type 内容类型
   * @param limit 数量限制
   * @param category 分类（可选）
   * @returns 热门内容列表
   */
  async getHotContent(
    type: 'work' | 'user' | 'appointment',
    limit: number = 20,
    category?: string
  ): Promise<HotContentItem[]> {
    const hotKey = category ? 
      CacheKeys.work.hot(category) : 
      CacheKeys.work.hot();
    
    const hotItems = await cacheService.get<HotContentItem[]>(hotKey);
    
    if (!hotItems) {
      return [];
    }

    return hotItems
      .filter(item => item.type === type)
      .slice(0, limit);
  }

  /**
   * 获取内容统计数据
   * @param contentId 内容ID
   * @param type 内容类型
   * @returns 统计数据
   */
  async getContentStats(
    contentId: string, 
    type: 'work' | 'user' | 'appointment'
  ): Promise<HotContentStats | null> {
    const statsKey = this.getStatsKey(contentId, type);
    return await cacheService.get<HotContentStats>(statsKey);
  }

  /**
   * 批量获取内容统计数据
   * @param contentIds 内容ID列表
   * @param type 内容类型
   * @returns 统计数据映射
   */
  async getBatchContentStats(
    contentIds: string[], 
    type: 'work' | 'user' | 'appointment'
  ): Promise<Record<string, HotContentStats>> {
    const results: Record<string, HotContentStats> = {};
    
    for (const contentId of contentIds) {
      const stats = await this.getContentStats(contentId, type);
      if (stats) {
        results[contentId] = stats;
      }
    }
    
    return results;
  }

  /**
   * 清除内容缓存
   * @param contentId 内容ID
   * @param type 内容类型
   */
  async clearContentCache(
    contentId: string, 
    type: 'work' | 'user' | 'appointment'
  ): Promise<void> {
    const statsKey = this.getStatsKey(contentId, type);
    await cacheService.del(statsKey);
    
    // 从热门排行中移除
    await this.removeFromHotRanking(contentId, type);
  }

  /**
   * 刷新热门内容排行
   * @param type 内容类型
   * @param category 分类（可选）
   */
  async refreshHotRanking(
    type: 'work' | 'user' | 'appointment',
    category?: string
  ): Promise<void> {
    // 这里应该从数据库获取最新数据并重新计算排行
    // 为了演示，我们创建一些模拟数据
    const mockHotItems: HotContentItem[] = [
      {
        id: '1',
        type: 'work',
        title: '热门作品1',
        score: 95.5,
        metadata: { category: 'portrait' },
        createdAt: Date.now() - 86400000, // 1天前
        updatedAt: Date.now(),
      },
      {
        id: '2',
        type: 'work',
        title: '热门作品2',
        score: 88.2,
        metadata: { category: 'landscape' },
        createdAt: Date.now() - 172800000, // 2天前
        updatedAt: Date.now(),
      },
      {
        id: '3',
        type: 'work',
        title: '热门作品3',
        score: 82.7,
        metadata: { category: 'wedding' },
        createdAt: Date.now() - 259200000, // 3天前
        updatedAt: Date.now(),
      },
    ];

    const hotKey = category ? 
      CacheKeys.work.hot(category) : 
      CacheKeys.work.hot();
    
    await cacheService.set(hotKey, mockHotItems, HotContentCache.HOT_CONTENT_TTL);
    
    console.log(`热门内容排行已刷新: ${type}${category ? ` (${category})` : ''}`);
  }

  /**
   * 计算热度分数
   * @param stats 统计数据
   * @returns 热度分数
   */
  private calculateHotScore(stats: HotContentStats): number {
    const weights = HotContentCache.SCORE_WEIGHTS;
    
    let score = 0;
    score += stats.views * weights.views;
    score += stats.likes * weights.likes;
    score += stats.comments * weights.comments;
    score += stats.shares * weights.shares;
    score += stats.favorites * weights.favorites;
    
    // 时间衰减因子（越新的内容分数越高）
    const now = Date.now();
    const daysSinceCreation = 1; // 这里应该从实际创建时间计算
    const recencyFactor = Math.exp(-daysSinceCreation / 7); // 7天半衰期
    
    score *= (1 + recencyFactor * weights.recency);
    
    return Math.round(score * 100) / 100; // 保留两位小数
  }

  /**
   * 更新热门排行
   * @param contentId 内容ID
   * @param type 内容类型
   * @param score 分数
   */
  private async updateHotRanking(
    contentId: string, 
    type: 'work' | 'user' | 'appointment',
    score: number
  ): Promise<void> {
    const hotKey = CacheKeys.work.hot();
    const hotItems = await cacheService.get<HotContentItem[]>(hotKey) || [];
    
    // 查找现有项目
    const existingIndex = hotItems.findIndex(item => item.id === contentId && item.type === type);
    
    const newItem: HotContentItem = {
      id: contentId,
      type,
      title: `${type} ${contentId}`, // 这里应该从数据库获取实际标题
      score,
      createdAt: existingIndex >= 0 ? hotItems[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      hotItems[existingIndex] = newItem;
    } else {
      hotItems.push(newItem);
    }
    
    // 按分数排序并限制数量
    hotItems.sort((a, b) => b.score - a.score);
    const limitedItems = hotItems.slice(0, HotContentCache.MAX_HOT_ITEMS);
    
    await cacheService.set(hotKey, limitedItems, HotContentCache.HOT_CONTENT_TTL);
  }

  /**
   * 从热门排行中移除
   * @param contentId 内容ID
   * @param type 内容类型
   */
  private async removeFromHotRanking(
    contentId: string, 
    type: 'work' | 'user' | 'appointment'
  ): Promise<void> {
    const hotKey = CacheKeys.work.hot();
    const hotItems = await cacheService.get<HotContentItem[]>(hotKey) || [];
    
    const filteredItems = hotItems.filter(item => !(item.id === contentId && item.type === type));
    
    await cacheService.set(hotKey, filteredItems, HotContentCache.HOT_CONTENT_TTL);
  }

  /**
   * 获取统计数据缓存键
   * @param contentId 内容ID
   * @param type 内容类型
   * @returns 缓存键
   */
  private getStatsKey(contentId: string, type: 'work' | 'user' | 'appointment'): string {
    switch (type) {
      case 'work':
        return CacheKeys.work.stats(contentId);
      case 'user':
        return CacheKeys.user.info(contentId);
      case 'appointment':
        return CacheKeys.appointment.stats(contentId);
      default:
        throw new Error(`不支持的内容类型: ${type}`);
    }
  }
}

// 创建热门内容缓存服务实例
export const hotContentCache = new HotContentCache();

export default hotContentCache;
