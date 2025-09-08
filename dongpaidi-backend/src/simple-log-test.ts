import 'module-alias/register';

console.log('🚀 开始简单日志分析测试...');

async function simpleTest() {
  try {
    console.log('📦 导入模块...');
    
    const { initializeLogAnalysis, logAnalysisInit } = await import('./services/logAnalysisInit');
    console.log('✅ 导入初始化模块成功');
    
    const { logCollector, LogSource } = await import('./services/logCollector');
    console.log('✅ 导入收集器模块成功');
    
    const { logReporter, ReportType, ReportFormat } = await import('./services/logReporter');
    console.log('✅ 导入报告器模块成功');
    
    const { logAlerting, AlertType, AlertSeverity } = await import('./services/logAlerting');
    console.log('✅ 导入告警模块成功');
    
    console.log('🔧 初始化日志分析系统...');
    await initializeLogAnalysis();
    console.log('✅ 系统初始化成功');
    
    console.log('📊 获取系统状态...');
    const status = logAnalysisInit.getSystemStatus();
    console.log('系统状态:', JSON.stringify(status, null, 2));
    
    console.log('📝 测试日志收集...');
    await logCollector.collectEntry({
      level: 'INFO',
      message: '测试日志条目',
      metadata: { test: true }
    }, LogSource.APPLICATION);
    console.log('✅ 日志收集测试成功');
    
    console.log('📈 获取收集器状态...');
    const collectorStatus = logCollector.getCollectorStatus();
    console.log('收集器状态:', JSON.stringify(collectorStatus, null, 2));
    
    console.log('🚨 测试告警系统...');
    const rules = logAlerting.getRules();
    console.log(`当前告警规则数量: ${rules.length}`);
    
    const alertStats = logAlerting.getAlertStats();
    console.log('告警统计:', JSON.stringify(alertStats, null, 2));
    
    console.log('📋 测试报告生成...');
    const reports = await logReporter.getReportList();
    console.log(`当前报告数量: ${reports.length}`);
    
    console.log('🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    if (error instanceof Error) {
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
simpleTest().then(() => {
  console.log('✅ 测试程序正常结束');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 测试程序异常:', error);
  process.exit(1);
});
