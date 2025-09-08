import { PrismaClient } from '@prisma/client';
import { db } from '@/config/database';

/**
 * 查询条件接口
 */
export interface QueryCondition {
  field: string;
  operator: 'equals' | 'not' | 'in' | 'notIn' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  mode?: 'default' | 'insensitive';
}

/**
 * 排序条件接口
 */
export interface SortCondition {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 关联查询配置
 */
export interface RelationConfig {
  [key: string]: boolean | RelationConfig;
}

/**
 * 查询构建器类
 */
export class QueryBuilder {
  private prisma: PrismaClient;
  private model: string;
  private whereConditions: any = {};
  private selectFields: any = {};
  private includeRelations: any = {};
  private orderByConditions: any[] = [];
  private limitValue?: number;
  private skipValue?: number;
  private cursorValue?: any;

  constructor(model: string) {
    this.prisma = db.prisma;
    this.model = model;
  }

  /**
   * 添加查询条件
   */
  where(conditions: QueryCondition | QueryCondition[] | any): QueryBuilder {
    if (Array.isArray(conditions)) {
      // 处理条件数组
      conditions.forEach(condition => {
        if (typeof condition === 'object' && condition.field) {
          this.addCondition(condition);
        }
      });
    } else if (typeof conditions === 'object' && conditions.field) {
      // 处理单个条件
      this.addCondition(conditions);
    } else {
      // 处理原始Prisma条件对象
      this.whereConditions = { ...this.whereConditions, ...conditions };
    }
    return this;
  }

  /**
   * 添加OR条件
   */
  orWhere(conditions: QueryCondition[]): QueryBuilder {
    const orConditions = conditions.map(condition => {
      return this.buildCondition(condition);
    });

    if (this.whereConditions.OR) {
      this.whereConditions.OR.push(...orConditions);
    } else {
      this.whereConditions.OR = orConditions;
    }

    return this;
  }

  /**
   * 添加AND条件
   */
  andWhere(conditions: QueryCondition[]): QueryBuilder {
    const andConditions = conditions.map(condition => {
      return this.buildCondition(condition);
    });

    if (this.whereConditions.AND) {
      this.whereConditions.AND.push(...andConditions);
    } else {
      this.whereConditions.AND = andConditions;
    }

    return this;
  }

  /**
   * 选择字段
   */
  select(fields: string[] | Record<string, boolean>): QueryBuilder {
    if (Array.isArray(fields)) {
      this.selectFields = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any);
    } else {
      this.selectFields = fields;
    }
    return this;
  }

  /**
   * 包含关联
   */
  include(relations: RelationConfig): QueryBuilder {
    this.includeRelations = { ...this.includeRelations, ...relations };
    return this;
  }

  /**
   * 排序
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    this.orderByConditions.push({ [field]: direction });
    return this;
  }

  /**
   * 多字段排序
   */
  orderByMultiple(sorts: SortCondition[]): QueryBuilder {
    sorts.forEach(sort => {
      this.orderByConditions.push({ [sort.field]: sort.direction });
    });
    return this;
  }

  /**
   * 限制数量
   */
  limit(count: number): QueryBuilder {
    this.limitValue = count;
    return this;
  }

  /**
   * 跳过数量
   */
  skip(count: number): QueryBuilder {
    this.skipValue = count;
    return this;
  }

  /**
   * 游标分页
   */
  cursor(cursorValue: any): QueryBuilder {
    this.cursorValue = cursorValue;
    return this;
  }

  /**
   * 构建查询选项
   */
  private buildQueryOptions(): any {
    const options: any = {};

    if (Object.keys(this.whereConditions).length > 0) {
      options.where = this.whereConditions;
    }

    if (Object.keys(this.selectFields).length > 0) {
      options.select = this.selectFields;
    }

    if (Object.keys(this.includeRelations).length > 0) {
      options.include = this.includeRelations;
    }

    if (this.orderByConditions.length > 0) {
      options.orderBy = this.orderByConditions.length === 1 
        ? this.orderByConditions[0] 
        : this.orderByConditions;
    }

    if (this.limitValue !== undefined) {
      options.take = this.limitValue;
    }

    if (this.skipValue !== undefined) {
      options.skip = this.skipValue;
    }

    if (this.cursorValue !== undefined) {
      options.cursor = this.cursorValue;
    }

    return options;
  }

  /**
   * 执行查询 - 查找多条记录
   */
  async findMany<T>(): Promise<T[]> {
    const options = this.buildQueryOptions();
    return (this.prisma as any)[this.model].findMany(options);
  }

  /**
   * 执行查询 - 查找第一条记录
   */
  async findFirst<T>(): Promise<T | null> {
    const options = this.buildQueryOptions();
    return (this.prisma as any)[this.model].findFirst(options);
  }

  /**
   * 执行查询 - 查找唯一记录
   */
  async findUnique<T>(uniqueField: any): Promise<T | null> {
    const options = this.buildQueryOptions();
    options.where = uniqueField;
    return (this.prisma as any)[this.model].findUnique(options);
  }

  /**
   * 计数查询
   */
  async count(): Promise<number> {
    return (this.prisma as any)[this.model].count({
      where: this.whereConditions,
    });
  }

  /**
   * 聚合查询
   */
  async aggregate(aggregations: any): Promise<any> {
    return (this.prisma as any)[this.model].aggregate({
      where: this.whereConditions,
      ...aggregations,
    });
  }

  /**
   * 分组查询
   */
  async groupBy(groupBy: any): Promise<any[]> {
    return (this.prisma as any)[this.model].groupBy({
      where: this.whereConditions,
      ...groupBy,
    });
  }

  /**
   * 创建记录
   */
  async create<T>(data: any): Promise<T> {
    return (this.prisma as any)[this.model].create({
      data,
      select: Object.keys(this.selectFields).length > 0 ? this.selectFields : undefined,
      include: Object.keys(this.includeRelations).length > 0 ? this.includeRelations : undefined,
    });
  }

  /**
   * 批量创建记录
   */
  async createMany(data: any[]): Promise<{ count: number }> {
    return (this.prisma as any)[this.model].createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 更新记录
   */
  async update<T>(data: any): Promise<T> {
    return (this.prisma as any)[this.model].update({
      where: this.whereConditions,
      data,
      select: Object.keys(this.selectFields).length > 0 ? this.selectFields : undefined,
      include: Object.keys(this.includeRelations).length > 0 ? this.includeRelations : undefined,
    });
  }

  /**
   * 批量更新记录
   */
  async updateMany(data: any): Promise<{ count: number }> {
    return (this.prisma as any)[this.model].updateMany({
      where: this.whereConditions,
      data,
    });
  }

  /**
   * 删除记录
   */
  async delete<T>(): Promise<T> {
    return (this.prisma as any)[this.model].delete({
      where: this.whereConditions,
    });
  }

  /**
   * 批量删除记录
   */
  async deleteMany(): Promise<{ count: number }> {
    return (this.prisma as any)[this.model].deleteMany({
      where: this.whereConditions,
    });
  }

  /**
   * Upsert操作
   */
  async upsert<T>(create: any, update: any): Promise<T> {
    return (this.prisma as any)[this.model].upsert({
      where: this.whereConditions,
      create,
      update,
      select: Object.keys(this.selectFields).length > 0 ? this.selectFields : undefined,
      include: Object.keys(this.includeRelations).length > 0 ? this.includeRelations : undefined,
    });
  }

  /**
   * 添加单个条件
   */
  private addCondition(condition: QueryCondition): void {
    const builtCondition = this.buildCondition(condition);
    this.whereConditions = { ...this.whereConditions, ...builtCondition };
  }

  /**
   * 构建单个条件
   */
  private buildCondition(condition: QueryCondition): any {
    const { field, operator, value, mode } = condition;

    switch (operator) {
      case 'equals':
        return { [field]: value };
      case 'not':
        return { [field]: { not: value } };
      case 'in':
        return { [field]: { in: value } };
      case 'notIn':
        return { [field]: { notIn: value } };
      case 'lt':
        return { [field]: { lt: value } };
      case 'lte':
        return { [field]: { lte: value } };
      case 'gt':
        return { [field]: { gt: value } };
      case 'gte':
        return { [field]: { gte: value } };
      case 'contains':
        return { [field]: { contains: value, mode: mode || 'default' } };
      case 'startsWith':
        return { [field]: { startsWith: value, mode: mode || 'default' } };
      case 'endsWith':
        return { [field]: { endsWith: value, mode: mode || 'default' } };
      default:
        return { [field]: value };
    }
  }

  /**
   * 重置查询构建器
   */
  reset(): QueryBuilder {
    this.whereConditions = {};
    this.selectFields = {};
    this.includeRelations = {};
    this.orderByConditions = [];
    this.limitValue = undefined;
    this.skipValue = undefined;
    this.cursorValue = undefined;
    return this;
  }

  /**
   * 克隆查询构建器
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder(this.model);
    cloned.whereConditions = { ...this.whereConditions };
    cloned.selectFields = { ...this.selectFields };
    cloned.includeRelations = { ...this.includeRelations };
    cloned.orderByConditions = [...this.orderByConditions];
    cloned.limitValue = this.limitValue;
    cloned.skipValue = this.skipValue;
    cloned.cursorValue = this.cursorValue;
    return cloned;
  }
}

/**
 * 创建查询构建器的工厂函数
 */
export function createQueryBuilder(model: string): QueryBuilder {
  return new QueryBuilder(model);
}

export default QueryBuilder;
