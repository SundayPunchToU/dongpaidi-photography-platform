import { performanceMonitor } from '@/services/performanceMonitor';

/**
 * 基础性能监控测试
 */
async function basicTest(): Promise<void> {
  try {
    console.log('🚀 基础性能监控测试开始...');

    // 记录一个HTTP请求指标
    performanceMonitor.recordHttpRequest({
      method: 'GET',
      path: '/api/test',
      statusCode: 200,
      responseTime: 100,
      ip: '127.0.0.1',
    });

    console.log('✅ HTTP指标记录成功');

    // 记录一个数据库查询指标
    performanceMonitor.recordDatabaseQuery({
      query: 'SELECT * FROM test',
      model: 'Test',
      action: 'findMany',
      executionTime: 50,
    });

    console.log('✅ 数据库指标记录成功');

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 获取统计信息
    const stats = performanceMonitor.getMetricsStats();
    console.log('📊 统计信息:', {
      queueSize: stats.queueSize,
      totalMetrics: stats.totalMetrics,
      isProcessing: stats.isProcessing,
    });

    console.log('🎉 基础测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
basicTest().catch(console.error);
