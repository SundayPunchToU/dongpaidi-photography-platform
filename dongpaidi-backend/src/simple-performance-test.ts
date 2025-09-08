import { performanceMonitor } from '@/services/performanceMonitor';
import { initializePerformanceMonitoring, getPerformanceMonitoringStatus } from '@/services/performanceMonitoringInit';
import { log } from '@/config/logger';

/**
 * 简化的性能监控测试
 */
async function simplePerformanceTest(): Promise<void> {
  try {
    console.log('🚀 启动简化性能监控测试...');

    // 1. 初始化系统
    console.log('📋 初始化性能监控系统...');
    await initializePerformanceMonitoring();
    
    const status = getPerformanceMonitoringStatus();
    console.log('✅ 系统初始化完成:', {
      initialized: status.initialized,
      enabled: status.enabled,
    });

    // 2. 记录一些测试指标
    console.log('📊 记录测试指标...');
    
    performanceMonitor.recordHttpRequest({
      method: 'GET',
      path: '/api/test',
      statusCode: 200,
      responseTime: 150,
      ip: '127.0.0.1',
    });

    performanceMonitor.recordDatabaseQuery({
      query: 'SELECT * FROM users',
      model: 'User',
      action: 'findMany',
      executionTime: 25,
    });

    performanceMonitor.recordBusinessMetric({
      category: 'test',
      action: 'simple_test',
      count: 1,
      success: true,
    });

    console.log('✅ 指标记录完成');

    // 3. 等待处理
    console.log('⏳ 等待指标处理...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 检查统计信息
    const stats = performanceMonitor.getMetricsStats();
    console.log('📈 指标统计:', {
      queueSize: stats.queueSize,
      totalMetrics: stats.totalMetrics,
      isProcessing: stats.isProcessing,
    });

    console.log('🎉 简化测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  simplePerformanceTest();
}
