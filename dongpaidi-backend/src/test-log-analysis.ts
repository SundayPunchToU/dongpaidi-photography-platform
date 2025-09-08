import { initializeLogAnalysis, logAnalysisInit } from './services/logAnalysisInit';
import { logCollector, LogSource } from './services/logCollector';
import { logReporter, ReportType, ReportFormat } from './services/logReporter';
import { logAlerting, AlertType, AlertSeverity } from './services/logAlerting';

/**
 * 日志分析系统测试
 */
class LogAnalysisTest {
  private testResults: Array<{ name: string; success: boolean; message: string; duration: number }> = [];

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<void> {
    console.log('🧪 开始日志分析系统测试...\n');

    try {
      // 初始化系统
      await this.testInitialization();

      // 测试日志收集
      await this.testLogCollection();

      // 测试告警系统
      await this.testAlertingSystem();

      // 测试报告生成
      await this.testReportGeneration();

      // 测试系统状态
      await this.testSystemStatus();

      // 输出测试结果
      this.printTestResults();

    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    }
  }

  /**
   * 测试系统初始化
   */
  private async testInitialization(): Promise<void> {
    const testName = '系统初始化';
    const startTime = Date.now();

    try {
      await initializeLogAnalysis();
      const status = logAnalysisInit.getSystemStatus();
      
      if (status.initialized) {
        this.addTestResult(testName, true, '系统初始化成功', Date.now() - startTime);
      } else {
        this.addTestResult(testName, false, '系统初始化失败', Date.now() - startTime);
      }
    } catch (error) {
      this.addTestResult(testName, false, `初始化异常: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试日志收集
   */
  private async testLogCollection(): Promise<void> {
    const testName = '日志收集';
    const startTime = Date.now();

    try {
      // 添加测试日志条目
      const testEntries = [
        {
          level: 'INFO' as const,
          message: '测试信息日志',
          metadata: { test: true, timestamp: new Date() },
        },
        {
          level: 'WARN' as const,
          message: '测试警告日志',
          metadata: { test: true, warning: 'test warning' },
        },
        {
          level: 'ERROR' as const,
          message: '测试错误日志',
          metadata: { test: true, error: 'test error' },
        },
      ];

      for (const entry of testEntries) {
        await logCollector.collectEntry(entry, LogSource.APPLICATION);
      }

      // 等待处理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 检查收集器状态
      const status = logCollector.getCollectorStatus();
      const runningCollectors = status.filter(c => c.enabled && c.isRunning);

      if (runningCollectors.length > 0) {
        this.addTestResult(testName, true, `成功收集${testEntries.length}条日志，${runningCollectors.length}个收集器运行中`, Date.now() - startTime);
      } else {
        this.addTestResult(testName, false, '没有运行中的收集器', Date.now() - startTime);
      }
    } catch (error) {
      this.addTestResult(testName, false, `日志收集异常: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试告警系统
   */
  private async testAlertingSystem(): Promise<void> {
    const testName = '告警系统';
    const startTime = Date.now();

    try {
      // 添加测试告警规则
      const ruleId = logAlerting.addRule({
        name: '测试告警规则',
        type: AlertType.ERROR_RATE,
        severity: AlertSeverity.MEDIUM,
        condition: 'error_rate > threshold',
        threshold: 0.01, // 1%
        timeWindow: 60000, // 1分钟
        cooldown: 300000, // 5分钟
        enabled: true,
        description: '测试用的告警规则',
        actions: [
          {
            type: 'webhook',
            config: { url: 'http://test.example.com/webhook' },
            enabled: false, // 测试时不实际发送
          },
        ],
      });

      // 获取告警规则
      const rules = logAlerting.getRules();
      const testRule = rules.find(r => r.id === ruleId);

      if (testRule) {
        // 获取告警统计
        const stats = logAlerting.getAlertStats();
        
        this.addTestResult(testName, true, `告警规则创建成功，当前${stats.totalRules}个规则，${stats.enabledRules}个启用`, Date.now() - startTime);
        
        // 清理测试规则
        logAlerting.deleteRule(ruleId);
      } else {
        this.addTestResult(testName, false, '告警规则创建失败', Date.now() - startTime);
      }
    } catch (error) {
      this.addTestResult(testName, false, `告警系统异常: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试报告生成
   */
  private async testReportGeneration(): Promise<void> {
    const testName = '报告生成';
    const startTime = Date.now();

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 生成测试报告
      const reportPath = await logReporter.generateReport({
        type: ReportType.CUSTOM,
        format: ReportFormat.JSON,
        timeWindow: {
          start: oneHourAgo,
          end: now,
        },
        includeCharts: false,
        includeTrends: false,
        includeRecommendations: true,
      });

      if (reportPath) {
        // 获取报告列表
        const reports = await logReporter.getReportList();
        
        this.addTestResult(testName, true, `报告生成成功: ${reportPath}，当前共${reports.length}个报告`, Date.now() - startTime);
      } else {
        this.addTestResult(testName, false, '报告生成失败', Date.now() - startTime);
      }
    } catch (error) {
      this.addTestResult(testName, false, `报告生成异常: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试系统状态
   */
  private async testSystemStatus(): Promise<void> {
    const testName = '系统状态';
    const startTime = Date.now();

    try {
      const status = logAnalysisInit.getSystemStatus();
      
      const details = [
        `初始化状态: ${status.initialized ? '✅' : '❌'}`,
        `分析器队列: ${status.components.analyzer.queueSize}`,
        `收集器数量: ${status.components.collector.length}`,
        `告警规则: ${status.components.alerting.totalRules}`,
        `活跃告警: ${status.components.alerting.activeAlerts}`,
      ];

      this.addTestResult(testName, true, details.join(', '), Date.now() - startTime);
    } catch (error) {
      this.addTestResult(testName, false, `状态检查异常: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(name: string, success: boolean, message: string, duration: number): void {
    this.testResults.push({ name, success, message, duration });
    
    const status = success ? '✅' : '❌';
    const time = `${duration}ms`;
    console.log(`${status} ${name} (${time}): ${message}`);
  }

  /**
   * 打印测试结果汇总
   */
  private printTestResults(): void {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
    }

    console.log('\n' + '='.repeat(60));
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！日志分析系统运行正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查系统配置。');
    }
  }

  /**
   * 性能测试
   */
  public async runPerformanceTest(): Promise<void> {
    console.log('\n🚀 开始性能测试...\n');

    const batchSizes = [10, 50, 100, 500];
    
    for (const batchSize of batchSizes) {
      const testName = `批量处理${batchSize}条日志`;
      const startTime = Date.now();

      try {
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          promises.push(logCollector.collectEntry({
            level: 'INFO',
            message: `性能测试日志 ${i + 1}`,
            metadata: { 
              test: 'performance',
              batch: batchSize,
              index: i,
              timestamp: new Date(),
            },
          }));
        }

        await Promise.all(promises);
        const duration = Date.now() - startTime;
        const throughput = (batchSize / duration * 1000).toFixed(2);

        console.log(`✅ ${testName}: ${duration}ms (${throughput} logs/sec)`);
      } catch (error) {
        console.log(`❌ ${testName}: 失败 - ${error}`);
      }
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('📋 初始化测试器...');
  const tester = new LogAnalysisTest();

  try {
    console.log('🧪 开始功能测试...');
    // 运行功能测试
    await tester.runAllTests();

    console.log('🚀 开始性能测试...');
    // 运行性能测试
    await tester.runPerformanceTest();

    console.log('✅ 所有测试完成！');
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  console.log('🚀 启动日志分析系统测试...');
  main().catch((error) => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

export default LogAnalysisTest;
