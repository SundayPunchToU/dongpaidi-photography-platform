// 注册模块别名
import 'module-alias/register';

import { PrismaClient } from '@prisma/client';

/**
 * 简化的数据库性能测试
 */
async function testDatabaseOptimization() {
  console.log('🚀 开始数据库性能优化测试...\n');

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });

  try {
    // 连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 1. 测试基础查询性能
    console.log('\n1️⃣ 测试基础查询性能...');
    await testBasicQueries(prisma);

    // 2. 测试索引效果
    console.log('\n2️⃣ 测试索引效果...');
    await testIndexPerformance(prisma);

    // 3. 测试分页性能
    console.log('\n3️⃣ 测试分页性能...');
    await testPaginationPerformance(prisma);

    // 4. 测试聚合查询性能
    console.log('\n4️⃣ 测试聚合查询性能...');
    await testAggregationPerformance(prisma);

    // 5. 测试并发查询性能
    console.log('\n5️⃣ 测试并发查询性能...');
    await testConcurrentQueries(prisma);

    // 6. 生成性能报告
    console.log('\n6️⃣ 生成性能报告...');
    await generatePerformanceReport(prisma);

    console.log('\n✅ 数据库性能优化测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 测试基础查询性能
 */
async function testBasicQueries(prisma: PrismaClient) {
  const tests = [
    {
      name: '用户查询 (带索引)',
      query: () => prisma.user.findMany({ 
        where: { status: 'active' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
    },
    {
      name: '作品查询 (复合索引)',
      query: () => prisma.work.findMany({ 
        where: { 
          status: 'published',
          category: 'portrait'
        },
        take: 10,
        orderBy: { likeCount: 'desc' }
      }),
    },
    {
      name: '约拍查询 (状态索引)',
      query: () => prisma.appointment.findMany({ 
        where: { status: 'open' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
    },
    {
      name: '消息查询 (复合索引)',
      query: () => prisma.message.findMany({ 
        where: { 
          receiverId: '1',
          isRead: false
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
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
 * 测试索引效果
 */
async function testIndexPerformance(prisma: PrismaClient) {
  console.log('  测试不同查询条件的性能...');

  const indexTests = [
    {
      name: '主键查询',
      query: () => prisma.user.findUnique({ where: { id: '1' } }),
    },
    {
      name: '单字段索引查询',
      query: () => prisma.user.findMany({ where: { status: 'active' }, take: 5 }),
    },
    {
      name: '复合索引查询',
      query: () => prisma.work.findMany({ 
        where: { 
          category: 'portrait',
          status: 'published'
        },
        take: 5
      }),
    },
    {
      name: '范围查询',
      query: () => prisma.work.findMany({ 
        where: { 
          likeCount: { gte: 10 },
          status: 'published'
        },
        take: 5
      }),
    },
    {
      name: '模糊查询',
      query: () => prisma.user.findMany({ 
        where: { 
          nickname: { contains: '测试' }
        },
        take: 5
      }),
    },
  ];

  for (const test of indexTests) {
    const start = Date.now();
    try {
      const result = await test.query();
      const duration = Date.now() - start;
      console.log(`    ${test.name}: ${duration}ms`);
    } catch (error) {
      console.log(`    ${test.name}: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 测试分页性能
 */
async function testPaginationPerformance(prisma: PrismaClient) {
  const pageSize = 20;

  // 测试偏移分页
  console.log('  测试偏移分页性能...');
  for (let page = 1; page <= 3; page++) {
    const start = Date.now();
    try {
      const result = await prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });
      const duration = Date.now() - start;
      console.log(`    第${page}页 (偏移 ${(page - 1) * pageSize}): ${duration}ms (${result.length} 条记录)`);
    } catch (error) {
      console.log(`    第${page}页: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 测试游标分页
  console.log('  测试游标分页性能...');
  let cursor: string | undefined;
  for (let page = 1; page <= 3; page++) {
    const start = Date.now();
    try {
      const queryOptions: any = {
        take: pageSize,
        orderBy: { id: 'asc' },
      };
      
      if (cursor) {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1;
      }

      const result = await prisma.user.findMany(queryOptions);
      const duration = Date.now() - start;
      
      if (result.length > 0) {
        cursor = result[result.length - 1]?.id;
      }
      
      console.log(`    第${page}页 (游标): ${duration}ms (${result.length} 条记录)`);
    } catch (error) {
      console.log(`    第${page}页: 失败 - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 测试聚合查询性能
 */
async function testAggregationPerformance(prisma: PrismaClient) {
  const aggregationTests = [
    {
      name: '用户统计',
      query: () => prisma.user.aggregate({
        _count: { id: true },
        _avg: { followersCount: true },
        _max: { createdAt: true },
      }),
    },
    {
      name: '作品统计',
      query: () => prisma.work.aggregate({
        _count: { id: true },
        _avg: { likeCount: true },
        _sum: { viewCount: true },
      }),
    },
    {
      name: '分组统计 - 作品按状态',
      query: () => prisma.work.groupBy({
        by: ['status'],
        _count: { id: true },
        _avg: { likeCount: true },
      }),
    },
    {
      name: '分组统计 - 作品按分类',
      query: () => prisma.work.groupBy({
        by: ['category'],
        _count: { id: true },
        _sum: { viewCount: true },
      }),
    },
  ];

  for (const test of aggregationTests) {
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
async function testConcurrentQueries(prisma: PrismaClient) {
  const concurrentCount = 10;
  
  // 创建并发查询
  const queries = Array.from({ length: concurrentCount }, (_, i) => 
    () => prisma.user.findMany({ 
      take: 5,
      skip: i * 5,
      orderBy: { createdAt: 'desc' }
    })
  );

  const start = Date.now();
  try {
    const results = await Promise.all(queries.map(query => query()));
    const duration = Date.now() - start;
    const totalRecords = results.reduce((sum, result) => sum + result.length, 0);
    console.log(`  并发查询 (${concurrentCount} 个): ${duration}ms (${totalRecords} 条记录)`);
    console.log(`  平均每个查询: ${(duration / concurrentCount).toFixed(2)}ms`);
  } catch (error) {
    console.log(`  并发查询: 失败 - ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成性能报告
 */
async function generatePerformanceReport(prisma: PrismaClient) {
  try {
    // 获取数据库基本信息
    const dbInfo = await getDatabaseInfo(prisma);
    console.log('  数据库信息:', dbInfo);

    // 获取表统计信息
    const tableStats = await getTableStats(prisma);
    console.log('  表统计信息:');
    tableStats.forEach(stat => {
      console.log(`    ${stat.table}: ${stat.count} 条记录`);
    });

    // 运行性能基准测试
    console.log('  性能基准测试:');
    const benchmark = await runBenchmark(prisma);
    console.log(`    单条查询平均时间: ${benchmark.singleQuery.toFixed(2)}ms`);
    console.log(`    批量查询平均时间: ${benchmark.batchQuery.toFixed(2)}ms`);
    console.log(`    计数查询平均时间: ${benchmark.countQuery.toFixed(2)}ms`);

  } catch (error) {
    console.log(`  性能报告生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取数据库信息
 */
async function getDatabaseInfo(prisma: PrismaClient) {
  try {
    const version = await prisma.$queryRaw`SELECT sqlite_version() as version`;
    return version;
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 获取表统计信息
 */
async function getTableStats(prisma: PrismaClient) {
  const tables = ['user', 'work', 'appointment', 'order', 'payment', 'message'];
  const stats = [];

  for (const table of tables) {
    try {
      const count = await (prisma as any)[table].count();
      stats.push({ table, count });
    } catch (error) {
      stats.push({ table, count: 0 });
    }
  }

  return stats;
}

/**
 * 运行性能基准测试
 */
async function runBenchmark(prisma: PrismaClient) {
  const iterations = 10;
  
  // 单条查询基准
  const singleQueryTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await prisma.user.findFirst();
      singleQueryTimes.push(Date.now() - start);
    } catch (error) {
      // 忽略错误
    }
  }

  // 批量查询基准
  const batchQueryTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await prisma.user.findMany({ take: 10 });
      batchQueryTimes.push(Date.now() - start);
    } catch (error) {
      // 忽略错误
    }
  }

  // 计数查询基准
  const countQueryTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await prisma.user.count();
      countQueryTimes.push(Date.now() - start);
    } catch (error) {
      // 忽略错误
    }
  }

  return {
    singleQuery: singleQueryTimes.length > 0 
      ? singleQueryTimes.reduce((sum, time) => sum + time, 0) / singleQueryTimes.length 
      : 0,
    batchQuery: batchQueryTimes.length > 0 
      ? batchQueryTimes.reduce((sum, time) => sum + time, 0) / batchQueryTimes.length 
      : 0,
    countQuery: countQueryTimes.length > 0 
      ? countQueryTimes.reduce((sum, time) => sum + time, 0) / countQueryTimes.length 
      : 0,
  };
}

// 运行测试
if (require.main === module) {
  testDatabaseOptimization()
    .then(() => {
      console.log('🎉 测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

export { testDatabaseOptimization };
