import { Router } from 'express';
import { logAnalyzer } from '@/services/logAnalyzer';
import { logCollector, LogSource } from '@/services/logCollector';
import { logReporter, ReportType, ReportFormat } from '@/services/logReporter';
import { logAlerting, AlertSeverity, AlertType } from '@/services/logAlerting';
import { authMiddleware } from '@/middleware/auth';
import { adminMiddleware } from '@/middleware/admin';
import { log } from '@/config/logger';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

// 所有日志分析路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * 获取日志分析统计
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const analyzerStats = logAnalyzer.getAnalysisStats();
  const collectorStatus = logCollector.getCollectorStatus();
  const alertStats = logAlerting.getAlertStats();

  res.json({
    success: true,
    data: {
      analyzer: analyzerStats,
      collectors: collectorStatus,
      alerts: alertStats,
    },
  });
}));

/**
 * 获取日志统计信息
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({
      success: false,
      message: 'Start and end dates are required',
    });
  }

  const timeWindow = {
    start: new Date(start as string),
    end: new Date(end as string),
  };

  const statistics = await logAnalyzer.getLogStatistics(timeWindow);

  res.json({
    success: true,
    data: statistics,
  });
}));

/**
 * 手动收集日志
 */
router.post('/collect', asyncHandler(async (req, res) => {
  const { filePath, source = LogSource.EXTERNAL } = req.body;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: 'File path is required',
    });
  }

  try {
    const count = await logCollector.collectFromFile(filePath, source);
    
    res.json({
      success: true,
      message: `Successfully collected ${count} log entries`,
      data: { count, source },
    });
  } catch (error) {
    log.error('Manual log collection failed', { error, filePath, source });
    res.status(500).json({
      success: false,
      message: 'Failed to collect logs from file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * 添加单个日志条目
 */
router.post('/entry', asyncHandler(async (req, res) => {
  const { level, message, metadata, source = LogSource.APPLICATION } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  await logCollector.collectEntry({
    level,
    message,
    metadata,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, source);

  res.json({
    success: true,
    message: 'Log entry added successfully',
  });
}));

/**
 * 重置收集器位置
 */
router.post('/collectors/:source/reset', asyncHandler(async (req, res) => {
  const { source } = req.params;

  if (!Object.values(LogSource).includes(source as LogSource)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid log source',
    });
  }

  logCollector.resetCollectorPosition(source as LogSource);

  res.json({
    success: true,
    message: `Collector position reset for source: ${source}`,
  });
}));

/**
 * 生成报告
 */
router.post('/reports', asyncHandler(async (req, res) => {
  const {
    type = ReportType.CUSTOM,
    format = ReportFormat.HTML,
    start,
    end,
    includeCharts = true,
    includeTrends = true,
    includeRecommendations = true,
    recipients,
  } = req.body;

  if (!start || !end) {
    return res.status(400).json({
      success: false,
      message: 'Start and end dates are required for custom reports',
    });
  }

  try {
    const reportPath = await logReporter.generateReport({
      type,
      format,
      timeWindow: {
        start: new Date(start),
        end: new Date(end),
      },
      includeCharts,
      includeTrends,
      includeRecommendations,
      recipients,
    });

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: { reportPath },
    });
  } catch (error) {
    log.error('Report generation failed', { error, type, format });
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * 生成定时报告
 */
router.post('/reports/scheduled/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!Object.values(ReportType).includes(type as ReportType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report type',
    });
  }

  try {
    const reportPath = await logReporter.generateScheduledReport(type as ReportType);

    res.json({
      success: true,
      message: `${type} report generated successfully`,
      data: { reportPath },
    });
  } catch (error) {
    log.error('Scheduled report generation failed', { error, type });
    res.status(500).json({
      success: false,
      message: 'Failed to generate scheduled report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * 获取报告列表
 */
router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await logReporter.getReportList();

  res.json({
    success: true,
    data: reports,
  });
}));

/**
 * 获取告警规则
 */
router.get('/alerts/rules', asyncHandler(async (req, res) => {
  const rules = logAlerting.getRules();

  res.json({
    success: true,
    data: rules,
  });
}));

/**
 * 添加告警规则
 */
router.post('/alerts/rules', asyncHandler(async (req, res) => {
  const {
    name,
    type,
    severity,
    condition,
    threshold,
    timeWindow,
    cooldown,
    description,
    actions = [],
  } = req.body;

  if (!name || !type || !severity || !condition || threshold === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, type, severity, condition, threshold',
    });
  }

  if (!Object.values(AlertType).includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid alert type',
    });
  }

  if (!Object.values(AlertSeverity).includes(severity)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid alert severity',
    });
  }

  const ruleId = logAlerting.addRule({
    name,
    type,
    severity,
    condition,
    threshold,
    timeWindow: timeWindow || 5 * 60 * 1000, // 默认5分钟
    cooldown: cooldown || 15 * 60 * 1000, // 默认15分钟
    enabled: true,
    description: description || '',
    actions,
  });

  res.json({
    success: true,
    message: 'Alert rule added successfully',
    data: { ruleId },
  });
}));

/**
 * 更新告警规则
 */
router.put('/alerts/rules/:ruleId', asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const updates = req.body;

  const success = logAlerting.updateRule(ruleId, updates);

  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Alert rule not found',
    });
  }

  res.json({
    success: true,
    message: 'Alert rule updated successfully',
  });
}));

/**
 * 删除告警规则
 */
router.delete('/alerts/rules/:ruleId', asyncHandler(async (req, res) => {
  const { ruleId } = req.params;

  const success = logAlerting.deleteRule(ruleId);

  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Alert rule not found',
    });
  }

  res.json({
    success: true,
    message: 'Alert rule deleted successfully',
  });
}));

/**
 * 获取活跃告警
 */
router.get('/alerts/active', asyncHandler(async (req, res) => {
  const alerts = logAlerting.getActiveAlerts();

  res.json({
    success: true,
    data: alerts,
  });
}));

/**
 * 确认告警
 */
router.post('/alerts/:alertId/acknowledge', asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const acknowledgedBy = req.user?.username || req.user?.id || 'unknown';

  const success = logAlerting.acknowledgeAlert(alertId, acknowledgedBy);

  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Alert not found',
    });
  }

  res.json({
    success: true,
    message: 'Alert acknowledged successfully',
  });
}));

/**
 * 解决告警
 */
router.post('/alerts/:alertId/resolve', asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const success = logAlerting.resolveAlert(alertId);

  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Alert not found',
    });
  }

  res.json({
    success: true,
    message: 'Alert resolved successfully',
  });
}));

/**
 * 清理过期日志
 */
router.post('/cleanup', asyncHandler(async (req, res) => {
  await logAnalyzer.cleanupExpiredLogs();

  res.json({
    success: true,
    message: 'Log cleanup completed',
  });
}));

/**
 * 健康检查
 */
router.get('/health', asyncHandler(async (req, res) => {
  const stats = logAnalyzer.getAnalysisStats();
  const collectorStatus = logCollector.getCollectorStatus();
  
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    analyzer: {
      queueSize: stats.queueSize,
      isProcessing: stats.isProcessing,
      lastFlush: stats.lastFlush,
    },
    collectors: collectorStatus.map(c => ({
      source: c.source,
      enabled: c.enabled,
      running: c.isRunning,
    })),
  };

  // 检查是否有问题
  if (stats.queueSize > 10000) {
    health.status = 'warning';
  }

  const runningCollectors = collectorStatus.filter(c => c.enabled && c.isRunning).length;
  const enabledCollectors = collectorStatus.filter(c => c.enabled).length;
  
  if (runningCollectors < enabledCollectors) {
    health.status = 'warning';
  }

  res.json({
    success: true,
    data: health,
  });
}));

export default router;
