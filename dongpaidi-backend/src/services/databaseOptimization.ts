import { PrismaClient } from '@prisma/client';
import { db } from '@/config/database';

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * 游标分页结果接口
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    nextCursor?: string;
  };
}

/**
 * 查询优化选项
 */
export interface QueryOptimizationOptions {
  useIndex?: string[];
  selectFields?: string[];
  includeRelations?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>;
  cacheKey?: string;
  cacheTTL?: number;
}

/**
 * 数据库性能优化服务
 */
export class DatabaseOptimizationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db.prisma;
  }

  /**
   * 偏移分页（适用于小数据集）
   * @param model 模型名称
   * @param params 分页参数
   * @param where 查询条件
   * @param options 优化选项
   */
  async offsetPagination<T>(
    model: string,
    params: PaginationParams = {},
    where: any = {},
    options: QueryOptimizationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20 } = params;
    const { selectFields, includeRelations, orderBy } = options;

    // 计算偏移量
    const skip = (page - 1) * limit;

    // 构建查询选项
    const queryOptions: any = {
      where,
      skip,
      take: limit,
    };

    if (selectFields) {
      queryOptions.select = selectFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any);
    }

    if (includeRelations) {
      queryOptions.include = includeRelations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as any);
    }

    if (orderBy) {
      queryOptions.orderBy = orderBy;
    }

    // 执行查询
    const [items, total] = await Promise.all([
      (this.prisma as any)[model].findMany(queryOptions),
      (this.prisma as any)[model].count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 游标分页（适用于大数据集）
   * @param model 模型名称
   * @param params 分页参数
   * @param where 查询条件
   * @param options 优化选项
   */
  async cursorPagination<T>(
    model: string,
    params: PaginationParams = {},
    where: any = {},
    options: QueryOptimizationOptions = {}
  ): Promise<CursorPaginatedResult<T>> {
    const { limit = 20, cursor } = params;
    const { selectFields, includeRelations, orderBy } = options;

    // 构建查询选项
    const queryOptions: any = {
      where,
      take: limit + 1, // 多取一条用于判断是否有下一页
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // 跳过游标本身
    }

    if (selectFields) {
      queryOptions.select = selectFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any);
    }

    if (includeRelations) {
      queryOptions.include = includeRelations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as any);
    }

    if (orderBy) {
      queryOptions.orderBy = orderBy;
    } else {
      queryOptions.orderBy = { id: 'asc' }; // 默认按ID排序
    }

    // 执行查询
    const results = await (this.prisma as any)[model].findMany(queryOptions);

    // 检查是否有下一页
    const hasNext = results.length > limit;
    const items = hasNext ? results.slice(0, -1) : results;
    const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : undefined;

    return {
      items,
      pagination: {
        limit,
        hasNext,
        nextCursor,
      },
    };
  }

  /**
   * 批量查询优化
   * @param queries 查询数组
   */
  async batchQuery<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(queries.map(query => query()));
  }

  /**
   * 事务批量操作
   * @param operations 操作数组
   */
  async batchTransaction<T>(
    operations: Array<(prisma: PrismaClient) => Promise<T>>
  ): Promise<T[]> {
    return this.prisma.$transaction(async (prisma) => {
      return Promise.all(operations.map(op => op(prisma)));
    });
  }

  /**
   * 优化的计数查询
   * @param model 模型名称
   * @param where 查询条件
   * @param useApproximate 是否使用近似计数（适用于大表）
   */
  async optimizedCount(
    model: string,
    where: any = {},
    useApproximate: boolean = false
  ): Promise<number> {
    if (useApproximate) {
      // 对于大表，使用近似计数
      const result = await this.prisma.$queryRaw`
        SELECT reltuples::BIGINT AS approximate_row_count
        FROM pg_class
        WHERE relname = ${model.toLowerCase()}s
      ` as any[];
      
      return result[0]?.approximate_row_count || 0;
    }

    return (this.prisma as any)[model].count({ where });
  }

  /**
   * 聚合查询优化
   * @param model 模型名称
   * @param aggregations 聚合操作
   * @param where 查询条件
   */
  async optimizedAggregate(
    model: string,
    aggregations: any,
    where: any = {}
  ): Promise<any> {
    return (this.prisma as any)[model].aggregate({
      where,
      ...aggregations,
    });
  }

  /**
   * 全文搜索优化
   * @param model 模型名称
   * @param searchFields 搜索字段
   * @param query 搜索关键词
   * @param params 分页参数
   */
  async fullTextSearch<T>(
    model: string,
    searchFields: string[],
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // 构建搜索条件
    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: query,
        mode: 'insensitive' as const,
      },
    }));

    const where = {
      OR: searchConditions,
    };

    // 执行搜索
    const [items, total] = await Promise.all([
      (this.prisma as any)[model].findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any)[model].count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 关联查询优化
   * @param model 模型名称
   * @param relations 关联关系配置
   * @param where 查询条件
   * @param params 分页参数
   */
  async optimizedRelationQuery<T>(
    model: string,
    relations: Record<string, any>,
    where: any = {},
    params: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // 执行查询
    const [items, total] = await Promise.all([
      (this.prisma as any)[model].findMany({
        where,
        include: relations,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any)[model].count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 数据库性能分析
   */
  async performanceAnalysis(): Promise<{
    slowQueries: any[];
    indexUsage: any[];
    tableStats: any[];
    connectionStats: any;
  }> {
    try {
      // 获取慢查询（PostgreSQL）
      const slowQueries = await this.prisma.$queryRaw`
        SELECT query, mean_time, calls, total_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT 10
      ` as any[];

      // 获取索引使用情况
      const indexUsage = await this.prisma.$queryRaw`
        SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 20
      ` as any[];

      // 获取表统计信息
      const tableStats = await this.prisma.$queryRaw`
        SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      ` as any[];

      // 获取连接统计
      const connectionStats = await this.prisma.$queryRaw`
        SELECT count(*) as total_connections,
               count(*) FILTER (WHERE state = 'active') as active_connections,
               count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      ` as any[];

      return {
        slowQueries: slowQueries || [],
        indexUsage: indexUsage || [],
        tableStats: tableStats || [],
        connectionStats: connectionStats[0] || {},
      };
    } catch (error) {
      console.error('性能分析失败:', error);
      return {
        slowQueries: [],
        indexUsage: [],
        tableStats: [],
        connectionStats: {},
      };
    }
  }

  /**
   * 清理过期数据
   * @param model 模型名称
   * @param dateField 日期字段
   * @param daysOld 保留天数
   */
  async cleanupExpiredData(
    model: string,
    dateField: string = 'createdAt',
    daysOld: number = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await (this.prisma as any)[model].deleteMany({
      where: {
        [dateField]: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

// 创建数据库优化服务实例
export const dbOptimization = new DatabaseOptimizationService();

export default dbOptimization;
