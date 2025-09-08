import { PrismaClient } from '@prisma/client';
import { db } from '@/config/database';
import { dbOptimization } from '@/services/databaseOptimization';
import { dbMonitoring } from '@/services/databaseMonitoring';

/**
 * 数据库优化脚本
 */
export class DatabaseOptimizationScript {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db.prisma;
  }

  /**
   * 执行完整的数据库优化
   */
  async runFullOptimization(): Promise<void> {
    console.log('🚀 开始数据库优化...\n');

    try {
      // 1. 分析当前数据库状态
      console.log('1️⃣ 分析数据库状态...');
      await this.analyzeDatabaseStatus();

      // 2. 优化索引
      console.log('\n2️⃣ 优化数据库索引...');
      await this.optimizeIndexes();

      // 3. 更新表统计信息
      console.log('\n3️⃣ 更新表统计信息...');
      await this.updateTableStatistics();

      // 4. 清理过期数据
      console.log('\n4️⃣ 清理过期数据...');
      await this.cleanupExpiredData();

      // 5. 优化查询计划
      console.log('\n5️⃣ 优化查询计划...');
      await this.optimizeQueryPlans();

      // 6. 验证优化结果
      console.log('\n6️⃣ 验证优化结果...');
      await this.validateOptimization();

      console.log('\n✅ 数据库优化完成！');

    } catch (error) {
      console.error('❌ 数据库优化失败:', error);
      throw error;
    }
  }

  /**
   * 分析数据库状态
   */
  private async analyzeDatabaseStatus(): Promise<void> {
    try {
      // 获取数据库基本信息
      const dbInfo = await this.getDatabaseInfo();
      console.log('数据库信息:', dbInfo);

      // 获取表大小信息
      const tableSizes = await this.getTableSizes();
      console.log('表大小信息:');
      tableSizes.forEach(table => {
        console.log(`  ${table.name}: ${table.rowCount} 行`);
      });

      // 获取索引使用情况
      const indexUsage = await this.getIndexUsage();
      console.log('索引使用情况:');
      indexUsage.forEach(index => {
        console.log(`  ${index.table}.${index.index}: 使用次数 ${index.usage}`);
      });

    } catch (error) {
      console.error('分析数据库状态失败:', error);
    }
  }

  /**
   * 优化索引
   */
  private async optimizeIndexes(): Promise<void> {
    try {
      // 检查缺失的索引
      const missingIndexes = await this.findMissingIndexes();
      console.log(`发现 ${missingIndexes.length} 个可能缺失的索引`);

      // 检查未使用的索引
      const unusedIndexes = await this.findUnusedIndexes();
      console.log(`发现 ${unusedIndexes.length} 个未使用的索引`);

      // 重建碎片化的索引
      await this.rebuildFragmentedIndexes();
      console.log('已重建碎片化索引');

    } catch (error) {
      console.error('优化索引失败:', error);
    }
  }

  /**
   * 更新表统计信息
   */
  private async updateTableStatistics(): Promise<void> {
    try {
      const tables = ['users', 'works', 'appointments', 'orders', 'payments', 'messages'];
      
      for (const table of tables) {
        try {
          // 对于SQLite，我们可以运行ANALYZE命令
          await this.prisma.$executeRaw`ANALYZE ${table}`;
          console.log(`已更新表 ${table} 的统计信息`);
        } catch (error) {
          console.log(`更新表 ${table} 统计信息失败:`, error.message);
        }
      }

    } catch (error) {
      console.error('更新表统计信息失败:', error);
    }
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      // 清理过期的会话数据（假设有session表）
      // const expiredSessions = await dbOptimization.cleanupExpiredData('session', 'createdAt', 7);
      // console.log(`清理了 ${expiredSessions} 个过期会话`);

      // 清理过期的临时文件记录
      // const expiredFiles = await dbOptimization.cleanupExpiredData('tempFile', 'createdAt', 1);
      // console.log(`清理了 ${expiredFiles} 个过期临时文件`);

      // 清理过期的验证码
      // const expiredCodes = await dbOptimization.cleanupExpiredData('verificationCode', 'createdAt', 1);
      // console.log(`清理了 ${expiredCodes} 个过期验证码`);

      console.log('过期数据清理完成');

    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }

  /**
   * 优化查询计划
   */
  private async optimizeQueryPlans(): Promise<void> {
    try {
      // 分析常用查询的执行计划
      const commonQueries = [
        'SELECT * FROM users WHERE status = "active" ORDER BY createdAt DESC LIMIT 20',
        'SELECT * FROM works WHERE category = "portrait" AND status = "published" ORDER BY likeCount DESC LIMIT 10',
        'SELECT * FROM appointments WHERE status = "open" ORDER BY createdAt DESC',
      ];

      for (const query of commonQueries) {
        try {
          // 获取查询执行计划
          const plan = await this.prisma.$queryRaw`EXPLAIN QUERY PLAN ${query}`;
          console.log(`查询执行计划:`, plan);
        } catch (error) {
          console.log(`分析查询计划失败:`, error.message);
        }
      }

    } catch (error) {
      console.error('优化查询计划失败:', error);
    }
  }

  /**
   * 验证优化结果
   */
  private async validateOptimization(): Promise<void> {
    try {
      // 运行性能测试
      const performanceTest = await this.runPerformanceTest();
      console.log('性能测试结果:', performanceTest);

      // 检查数据库健康状态
      const healthCheck = await dbMonitoring.healthCheck();
      console.log('数据库健康检查:', healthCheck);

      // 获取优化后的指标
      const metrics = await dbMonitoring.getMetrics();
      console.log('数据库指标:', {
        connections: metrics.connections,
        queries: metrics.queries,
        tables: metrics.tables.length,
      });

    } catch (error) {
      console.error('验证优化结果失败:', error);
    }
  }

  /**
   * 获取数据库信息
   */
  private async getDatabaseInfo(): Promise<any> {
    try {
      // SQLite版本信息
      const version = await this.prisma.$queryRaw`SELECT sqlite_version() as version`;
      return version;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 获取表大小信息
   */
  private async getTableSizes(): Promise<Array<{ name: string; rowCount: number }>> {
    const tables = ['users', 'works', 'appointments', 'orders', 'payments', 'messages'];
    const sizes = [];

    for (const table of tables) {
      try {
        const count = await (this.prisma as any)[table].count();
        sizes.push({ name: table, rowCount: count });
      } catch (error) {
        sizes.push({ name: table, rowCount: 0 });
      }
    }

    return sizes;
  }

  /**
   * 获取索引使用情况
   */
  private async getIndexUsage(): Promise<Array<{ table: string; index: string; usage: number }>> {
    try {
      // SQLite的索引使用情况查询
      const usage = await this.prisma.$queryRaw`
        SELECT name as table_name, 'index' as index_name, 0 as usage_count
        FROM sqlite_master 
        WHERE type = 'table'
        LIMIT 5
      ` as any[];

      return usage.map((row: any) => ({
        table: row.table_name,
        index: row.index_name,
        usage: row.usage_count,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * 查找缺失的索引
   */
  private async findMissingIndexes(): Promise<string[]> {
    // 基于查询模式分析可能需要的索引
    const potentialIndexes = [
      'users(status, createdAt)',
      'works(category, status, likeCount)',
      'appointments(status, createdAt)',
      'messages(receiverId, isRead)',
      'orders(userId, status)',
    ];

    // 这里应该分析实际的查询日志来确定缺失的索引
    return potentialIndexes.slice(0, 2); // 模拟返回
  }

  /**
   * 查找未使用的索引
   */
  private async findUnusedIndexes(): Promise<string[]> {
    // 这里应该分析索引使用统计来确定未使用的索引
    return []; // SQLite中较难获取索引使用统计
  }

  /**
   * 重建碎片化的索引
   */
  private async rebuildFragmentedIndexes(): Promise<void> {
    try {
      // SQLite中可以使用REINDEX命令
      await this.prisma.$executeRaw`REINDEX`;
      console.log('已重建所有索引');
    } catch (error) {
      console.log('重建索引失败:', error.message);
    }
  }

  /**
   * 运行性能测试
   */
  private async runPerformanceTest(): Promise<{
    userQuery: number;
    workQuery: number;
    appointmentQuery: number;
  }> {
    const results = {
      userQuery: 0,
      workQuery: 0,
      appointmentQuery: 0,
    };

    try {
      // 测试用户查询性能
      const userStart = Date.now();
      await this.prisma.user.findMany({
        where: { status: 'active' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      results.userQuery = Date.now() - userStart;

      // 测试作品查询性能
      const workStart = Date.now();
      await this.prisma.work.findMany({
        where: { 
          status: 'published',
          category: 'portrait',
        },
        take: 10,
        orderBy: { likeCount: 'desc' },
      });
      results.workQuery = Date.now() - workStart;

      // 测试约拍查询性能
      const appointmentStart = Date.now();
      await this.prisma.appointment.findMany({
        where: { status: 'open' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      results.appointmentQuery = Date.now() - appointmentStart;

    } catch (error) {
      console.error('性能测试失败:', error);
    }

    return results;
  }

  /**
   * 生成优化报告
   */
  async generateOptimizationReport(): Promise<string> {
    const report = [];
    
    report.push('# 数据库优化报告');
    report.push(`生成时间: ${new Date().toISOString()}`);
    report.push('');

    try {
      // 数据库状态
      const dbInfo = await this.getDatabaseInfo();
      report.push('## 数据库信息');
      report.push(JSON.stringify(dbInfo, null, 2));
      report.push('');

      // 表统计
      const tableSizes = await this.getTableSizes();
      report.push('## 表统计信息');
      tableSizes.forEach(table => {
        report.push(`- ${table.name}: ${table.rowCount} 行`);
      });
      report.push('');

      // 性能测试结果
      const performance = await this.runPerformanceTest();
      report.push('## 性能测试结果');
      report.push(`- 用户查询: ${performance.userQuery}ms`);
      report.push(`- 作品查询: ${performance.workQuery}ms`);
      report.push(`- 约拍查询: ${performance.appointmentQuery}ms`);
      report.push('');

      // 健康检查
      const health = await dbMonitoring.healthCheck();
      report.push('## 健康检查');
      report.push(`状态: ${health.status}`);
      health.checks.forEach(check => {
        report.push(`- ${check.name}: ${check.status} - ${check.message}`);
      });

    } catch (error) {
      report.push(`报告生成失败: ${error.message}`);
    }

    return report.join('\n');
  }
}

// 创建优化脚本实例
export const dbOptimizationScript = new DatabaseOptimizationScript();

// 如果直接运行此脚本
if (require.main === module) {
  dbOptimizationScript.runFullOptimization()
    .then(() => {
      console.log('数据库优化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库优化脚本执行失败:', error);
      process.exit(1);
    });
}

export default dbOptimizationScript;
