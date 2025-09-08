import { performanceMonitor, MetricType } from '@/services/performanceMonitor';
import { performanceAnalyzer } from '@/services/performanceAnalyzer';
import { initializePerformanceMonitoring, getPerformanceMonitoringStatus } from '@/services/performanceMonitoringInit';
import { log } from '@/config/logger';

/**
 * 性能监控系统测试
 */
class PerformanceMonitoringTester {
  private testResults: Array<{
    name: string;
    success: boolean;
    duration: number;
    error?: string;
    details?: any;
  }> = [];

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 启动性能监控系统测试...');
    console.log('📋 初始化测试器...');

    try {
      // 初始化性能监控系统
      await this.testSystemInitialization();

      // 测试性能指标记录
      await this.testMetricRecording();

      // 测试性能分析
      await this.testPerformanceAnalysis();

      // 测试系统状态
      await this.testSystemStatus();

      // 测试性能报告生成
      await this.testReportGeneration();

      // 输出测试结果
      this.printTestResults();

    } catch (error) {
      console.error('❌ 测试执行失败:', error);
    }
  }

  /**
   * 测试系统初始化
   */
  private async testSystemInitialization(): Promise<void> {
    const testName = '系统初始化';
    const startTime = Date.now();

    try {
      console.log('🧪 开始系统初始化测试...');

      // 初始化性能监控系统
      await initializePerformanceMonitoring();

      // 检查系统状态
      const status = getPerformanceMonitoringStatus();

      if (!status.initialized || !status.enabled) {
        throw new Error('系统初始化失败');
      }

      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: true,
        duration,
        details: {
          initialized: status.initialized,
          enabled: status.enabled,
          monitorQueueSize: status.monitor.queueSize,
        },
      });

      console.log(`✅ ${testName} (${duration}ms): 系统初始化成功`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试性能指标记录
   */
  private async testMetricRecording(): Promise<void> {
    const testName = '性能指标记录';
    const startTime = Date.now();

    try {
      console.log('🧪 开始性能指标记录测试...');

      // 记录HTTP请求指标
      performanceMonitor.recordHttpRequest({
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        responseTime: 150,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Test Agent',
        ip: '127.0.0.1',
        userId: 'test-user-1',
      });

      // 记录数据库查询指标
      performanceMonitor.recordDatabaseQuery({
        query: 'SELECT * FROM users WHERE id = ?',
        model: 'User',
        action: 'findUnique',
        executionTime: 25,
        rowsAffected: 1,
        parameters: { id: 1 },
      });

      // 记录缓存操作指标
      performanceMonitor.recordCacheOperation({
        operation: 'get',
        key: 'user:1',
        hit: true,
        executionTime: 5,
        size: 512,
      });

      // 记录业务指标
      performanceMonitor.recordBusinessMetric({
        category: 'user',
        action: 'login',
        count: 1,
        duration: 200,
        success: true,
      });

      // 等待指标处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 检查指标统计
      const stats = performanceMonitor.getMetricsStats();

      if (stats.totalMetrics === 0) {
        throw new Error('未记录到任何指标');
      }

      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: true,
        duration,
        details: {
          totalMetrics: stats.totalMetrics,
          queueSize: stats.queueSize,
          isProcessing: stats.isProcessing,
        },
      });

      console.log(`✅ ${testName} (${duration}ms): 成功记录指标，总计${stats.totalMetrics}个指标`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试性能分析
   */
  private async testPerformanceAnalysis(): Promise<void> {
    const testName = '性能分析';
    const startTime = Date.now();

    try {
      console.log('🧪 开始性能分析测试...');

      // 生成更多测试数据
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordHttpRequest({
          method: i % 2 === 0 ? 'GET' : 'POST',
          path: `/api/test/${i}`,
          statusCode: i % 10 === 0 ? 500 : 200,
          responseTime: 100 + Math.random() * 500,
          ip: '127.0.0.1',
        });

        performanceMonitor.recordDatabaseQuery({
          query: `SELECT * FROM table_${i}`,
          model: 'TestModel',
          action: 'findMany',
          executionTime: 10 + Math.random() * 100,
        });
      }

      // 等待数据处理
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 执行性能分析
      const timeWindow = {
        start: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
        end: new Date(),
      };

      const analysis = await performanceAnalyzer.performAnalysis(timeWindow);

      if (!analysis || !analysis.id) {
        throw new Error('性能分析失败');
      }

      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: true,
        duration,
        details: {
          analysisId: analysis.id,
          totalRequests: analysis.summary.totalRequests,
          avgResponseTime: analysis.summary.avgResponseTime,
          errorRate: analysis.summary.errorRate,
          alertCount: analysis.alerts.length,
          recommendationCount: analysis.recommendations.length,
        },
      });

      console.log(`✅ ${testName} (${duration}ms): 分析完成，处理${analysis.summary.totalRequests}个请求，${analysis.alerts.length}个告警`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试系统状态
   */
  private async testSystemStatus(): Promise<void> {
    const testName = '系统状态';
    const startTime = Date.now();

    try {
      console.log('🧪 开始系统状态测试...');

      // 获取系统状态
      const status = getPerformanceMonitoringStatus();

      // 获取指标统计
      const stats = performanceMonitor.getMetricsStats();

      // 获取聚合统计
      const aggregatedStats = performanceMonitor.getAggregatedStats();

      // 获取各类型指标
      const httpMetrics = performanceMonitor.getMetrics(MetricType.HTTP_REQUEST, 5);
      const dbMetrics = performanceMonitor.getMetrics(MetricType.DATABASE_QUERY, 5);

      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: true,
        duration,
        details: {
          systemStatus: status,
          metricsStats: stats,
          httpMetricsCount: httpMetrics.length,
          dbMetricsCount: dbMetrics.length,
          aggregatedStatsCount: aggregatedStats instanceof Map ? aggregatedStats.size : 0,
        },
      });

      console.log(`✅ ${testName} (${duration}ms): 系统状态正常，HTTP指标${httpMetrics.length}个，DB指标${dbMetrics.length}个`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 测试性能报告生成
   */
  private async testReportGeneration(): Promise<void> {
    const testName = '报告生成';
    const startTime = Date.now();

    try {
      console.log('🧪 开始报告生成测试...');

      // 执行分析以获取数据
      const analysis = await performanceAnalyzer.performAnalysis();

      // 生成JSON报告
      const { PerformanceReporter } = await import('@/services/performanceAnalyzer');
      const jsonReport = await PerformanceReporter.generateJsonReport(analysis);

      // 生成HTML报告
      const htmlReport = await PerformanceReporter.generateHtmlReport(analysis);

      if (!jsonReport || !htmlReport) {
        throw new Error('报告生成失败');
      }

      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: true,
        duration,
        details: {
          jsonReportSize: jsonReport.length,
          htmlReportSize: htmlReport.length,
          analysisId: analysis.id,
        },
      });

      console.log(`✅ ${testName} (${duration}ms): 报告生成成功，JSON ${jsonReport.length} 字符，HTML ${htmlReport.length} 字符`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 输出测试结果
   */
  private printTestResults(): void {
    console.log('\n📊 测试结果汇总:');
    console.log('============================================================');

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, result) => sum + result.duration, 0);

    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalDuration}ms`);

    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name} (${result.duration}ms)`);
      
      if (!result.success && result.error) {
        console.log(`   错误: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`);
      }
    });

    console.log('\n============================================================');

    if (failedTests === 0) {
      console.log('🎉 所有测试通过！性能监控系统运行正常。');
    } else {
      console.log(`⚠️  有 ${failedTests} 个测试失败，请检查相关功能。`);
    }
  }
}

/**
 * 性能压力测试
 */
async function performanceStressTest(): Promise<void> {
  console.log('\n🚀 开始性能压力测试...');

  const testCounts = [100, 500, 1000, 2000];
  
  for (const count of testCounts) {
    const startTime = Date.now();
    
    // 批量记录指标
    for (let i = 0; i < count; i++) {
      performanceMonitor.recordHttpRequest({
        method: 'GET',
        path: `/api/stress-test/${i}`,
        statusCode: 200,
        responseTime: Math.random() * 1000,
        ip: '127.0.0.1',
      });
    }
    
    const duration = Date.now() - startTime;
    const throughput = count / (duration / 1000);
    
    console.log(`✅ 批量记录${count}条指标: ${duration}ms (${throughput.toFixed(2)} metrics/sec)`);
  }
  
  console.log('✅ 所有压力测试完成！');
}

// 主函数
async function main(): Promise<void> {
  try {
    const tester = new PerformanceMonitoringTester();
    await tester.runAllTests();
    
    // 运行压力测试
    await performanceStressTest();
    
  } catch (error) {
    console.error('测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

export { PerformanceMonitoringTester, performanceStressTest };
