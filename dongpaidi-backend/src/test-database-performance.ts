// 注册模块别名
import 'module-alias/register';

import { db } from '@/config/database';
import { dbOptimization } from '@/services/databaseOptimization';
import { dbMonitoring } from '@/services/databaseMonitoring';
import { createQueryBuilder } from '@/services/queryBuilder';
import { dbOptimizationScript } from '@/scripts/databaseOptimization';

/**
 * 数据库性能测试
 */
async function testDatabasePerformance() {
  console.log('🚀 开始数据库性能测试...\n');

  try {
    // 连接数据库
    await db.connect();

    // 1. 测试基础查询性能
    console.log('1️⃣ 测试基础查询性能...');
    await testBasicQueries();

    // 2. 测试分页性能
    console.log('\n2️⃣ 测试分页性能...');
    await testPaginationPerformance();

    // 3. 测试复杂查询性能
    console.log('\n3️⃣ 测试复杂查询性能...');
    await testComplexQueries();

    // 4. 测试并发查询性能
    console.log('\n4️⃣ 测试并发查询性能...');
    await testConcurrentQueries();

    // 5. 测试查询构建器性能
    console.log('\n5️⃣ 测试查询构建器性能...');
    await testQueryBuilderPerformance();

    // 6. 测试数据库监控
    console.log('\n6️⃣ 测试数据库监控...');
    await testDatabaseMonitoring();

    // 7. 运行优化脚本
    console.log('\n7️⃣ 运行数据库优化...');
    await testOptimizationScript();

    console.log('\n✅ 数据库性能测试完成！');

  } catch (error) {
    console.error('❌ 数据库性能测试失败:', error);
  } finally {
    await db.disconnect();
  }
}

/**
 * 测试基础查询性能
 */
async function testBasicQueries() {
  const tests = [
    {
      name: '用户查询',
      query: () => db.prisma.user.findMany({ take: 10 }),
    },
    {
      name: '作品查询',
      query: () => db.prisma.work.findMany({ take: 10 }),
    },
    {
      name: '约拍查询',
      query: () => db.prisma.appointment.findMany({ take: 10 }),
    },
    {
      name: '订单查询',
      query: () => db.prisma.order.findMany({ take: 10 }),
    },
  ];

  for (const test of tests) {
    const start = Date.now();
    try {
      const result = await test.query();
      const duration = Date.now() - start;
      console.log(`  ${test.name}: ${duration}ms (${Array.isArray(result) ? result.length : 1} 条记录)`);
    } catch (error) {
      console.log(`  ${test.name}: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 测试分页性能
 */
async function testPaginationPerformance() {
  console.log('  测试偏移分页...');
  
  // 测试偏移分页
  const offsetStart = Date.now();
  try {
    const offsetResult = await dbOptimization.offsetPagination(
      'user',
      { page: 1, limit: 20 },
      { status: 'active' }
    );
    const offsetDuration = Date.now() - offsetStart;
    console.log(`    偏移分页: ${offsetDuration}ms (${offsetResult.items.length} 条记录)`);
  } catch (error) {
    console.log(`    偏移分页: 失败 - ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('  测试游标分页...');
  
  // 测试游标分页
  const cursorStart = Date.now();
  try {
    const cursorResult = await dbOptimization.cursorPagination(
      'user',
      { limit: 20 },
      { status: 'active' }
    );
    const cursorDuration = Date.now() - cursorStart;
    console.log(`    游标分页: ${cursorDuration}ms (${cursorResult.items.length} 条记录)`);
  } catch (error) {
    console.log(`    游标分页: 失败 - ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 测试复杂查询性能
 */
async function testComplexQueries() {
  const tests = [
    {
      name: '关联查询 - 用户及其作品',
      query: () => db.prisma.user.findMany({
        take: 5,
        include: {
          works: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    },
    {
      name: '聚合查询 - 用户统计',
      query: () => db.prisma.user.aggregate({
        _count: { id: true },
        _avg: { followersCount: true },
        _max: { createdAt: true },
      }),
    },
    {
      name: '分组查询 - 按状态分组',
      query: () => db.prisma.work.groupBy({
        by: ['status'],
        _count: { id: true },
        _avg: { likeCount: true },
      }),
    },
  ];

  for (const test of tests) {
    const start = Date.now();
    try {
      const result = await test.query();
      const duration = Date.now() - start;
      console.log(`  ${test.name}: ${duration}ms`);
    } catch (error) {
      console.log(`  ${test.name}: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 测试并发查询性能
 */
async function testConcurrentQueries() {
  const concurrentCount = 10;
  const queries = Array.from({ length: concurrentCount }, (_, i) => 
    () => db.prisma.user.findMany({ 
      take: 5,
      skip: i * 5,
    })
  );

  const start = Date.now();
  try {
    const results = await Promise.all(queries.map(query => query()));
    const duration = Date.now() - start;
    const totalRecords = results.reduce((sum, result) => sum + result.length, 0);
    console.log(`  并发查询 (${concurrentCount} 个): ${duration}ms (${totalRecords} 条记录)`);
  } catch (error) {
    console.log(`  并发查询: 失败 - ${error instanceof Error ? error.message : String(error)}`);
  }

  // 测试批量查询
  const batchStart = Date.now();
  try {
    const batchResults = await dbOptimization.batchQuery(queries);
    const batchDuration = Date.now() - batchStart;
    const batchTotalRecords = batchResults.reduce((sum, result) => sum + result.length, 0);
    console.log(`  批量查询 (${concurrentCount} 个): ${batchDuration}ms (${batchTotalRecords} 条记录)`);
  } catch (error) {
    console.log(`  批量查询: 失败 - ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 测试查询构建器性能
 */
async function testQueryBuilderPerformance() {
  const tests = [
    {
      name: '简单查询构建器',
      query: () => createQueryBuilder('user')
        .where({ field: 'status', operator: 'equals', value: 'active' })
        .orderBy('createdAt', 'desc')
        .limit(10)
        .findMany(),
    },
    {
      name: '复杂查询构建器',
      query: () => createQueryBuilder('work')
        .where([
          { field: 'status', operator: 'equals', value: 'published' },
          { field: 'likeCount', operator: 'gte', value: 10 },
        ])
        .include({ author: true })
        .orderBy('likeCount', 'desc')
        .limit(5)
        .findMany(),
    },
    {
      name: '搜索查询构建器',
      query: () => createQueryBuilder('user')
        .where({ field: 'nickname', operator: 'contains', value: '测试', mode: 'insensitive' })
        .select(['id', 'nickname', 'avatarUrl'])
        .limit(10)
        .findMany(),
    },
  ];

  for (const test of tests) {
    const start = Date.now();
    try {
      const result = await test.query();
      const duration = Date.now() - start;
      console.log(`  ${test.name}: ${duration}ms (${Array.isArray(result) ? result.length : 1} 条记录)`);
    } catch (error) {
      console.log(`  ${test.name}: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 测试数据库监控
 */
async function testDatabaseMonitoring() {
  try {
    // 启动监控
    dbMonitoring.startMonitoring(5000); // 5秒间隔

    // 执行一些查询来生成监控数据
    await db.prisma.user.findMany({ take: 5 });
    await db.prisma.work.findMany({ take: 5 });
    
    // 等待一段时间让监控收集数据
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 获取监控指标
    const metrics = await dbMonitoring.getMetrics();
    console.log('  数据库指标:');
    console.log(`    连接数: ${metrics.connections.total} (活跃: ${metrics.connections.active})`);
    console.log(`    查询数: ${metrics.queries.totalExecuted}`);
    console.log(`    平均执行时间: ${metrics.queries.averageExecutionTime.toFixed(2)}ms`);

    // 健康检查
    const health = await dbMonitoring.healthCheck();
    console.log(`  健康状态: ${health.status}`);
    health.checks.forEach(check => {
      console.log(`    ${check.name}: ${check.status} - ${check.message}`);
    });

    // 获取慢查询
    const slowQueries = dbMonitoring.getSlowQueries(5);
    console.log(`  慢查询数量: ${slowQueries.length}`);

    // 停止监控
    dbMonitoring.stopMonitoring();

  } catch (error) {
    console.log(`  数据库监控测试失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 测试优化脚本
 */
async function testOptimizationScript() {
  try {
    // 生成优化报告
    const report = await dbOptimizationScript.generateOptimizationReport();
    console.log('  优化报告已生成');
    console.log('  报告摘要:');
    
    const lines = report.split('\n');
    const summary = lines.slice(0, 10).join('\n');
    console.log(summary);

    // 运行性能分析
    const analysis = await dbOptimization.performanceAnalysis();
    console.log('  性能分析结果:');
    console.log(`    慢查询: ${analysis.slowQueries.length} 个`);
    console.log(`    索引使用: ${analysis.indexUsage.length} 个`);
    console.log(`    表统计: ${analysis.tableStats.length} 个`);

  } catch (error) {
    console.log(`  优化脚本测试失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 性能基准测试
 */
async function runBenchmark() {
  console.log('📊 运行性能基准测试...\n');

  const benchmarks = [
    {
      name: '单条记录查询',
      iterations: 100,
      query: () => db.prisma.user.findFirst(),
    },
    {
      name: '批量记录查询',
      iterations: 50,
      query: () => db.prisma.user.findMany({ take: 20 }),
    },
    {
      name: '计数查询',
      iterations: 20,
      query: () => db.prisma.user.count(),
    },
    {
      name: '关联查询',
      iterations: 20,
      query: () => db.prisma.user.findMany({
        take: 5,
        include: { works: { take: 3 } },
      }),
    },
  ];

  for (const benchmark of benchmarks) {
    const times: number[] = [];
    
    for (let i = 0; i < benchmark.iterations; i++) {
      const start = Date.now();
      try {
        await benchmark.query();
        times.push(Date.now() - start);
      } catch (error) {
        console.log(`  ${benchmark.name} 第${i+1}次失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (times.length > 0) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`${benchmark.name} (${benchmark.iterations} 次):`);
      console.log(`  平均: ${avg.toFixed(2)}ms`);
      console.log(`  最小: ${min}ms`);
      console.log(`  最大: ${max}ms`);
      console.log(`  P95: ${p95}ms`);
      console.log('');
    }
  }
}

// 运行测试
if (require.main === module) {
  testDatabasePerformance()
    .then(() => runBenchmark())
    .then(() => {
      console.log('🎉 所有测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

export { testDatabasePerformance, runBenchmark };
