import { Router } from 'express';
import { performanceMonitor, MetricType } from '@/services/performanceMonitor';
import { performanceAnalyzer, PerformanceReporter } from '@/services/performanceAnalyzer';
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { authenticate } from '@/middleware/auth';
import { adminOnly } from '@/middleware/admin';
import { ResponseUtil } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { log } from '@/config/logger';

const router = Router();
const config = getPerformanceMonitoringConfig();

// 所有性能监控API都需要管理员权限
router.use(authenticate);
router.use(adminOnly);

/**
 * 获取性能监控概览
 */
router.get('/overview', asyncHandler(async (req, res) => {
  try {
    const stats = performanceMonitor.getMetricsStats();
    const aggregatedStats = performanceMonitor.getAggregatedStats();
    
    // 转换Map为普通对象
    const statsObject: Record<string, any> = {};
    if (aggregatedStats instanceof Map) {
      for (const [key, value] of aggregatedStats.entries()) {
        statsObject[key] = value;
      }
    }

    ResponseUtil.success(res, {
      monitoring: {
        enabled: config.enabled,
        queueSize: stats.queueSize,
        isProcessing: stats.isProcessing,
        lastFlush: stats.lastFlush,
        totalMetrics: stats.totalMetrics,
      },
      aggregatedStats: statsObject,
      config: {
        samplingRate: config.collection.samplingRate,
        batchSize: config.collection.batchSize,
        flushInterval: config.collection.flushInterval,
      },
    });
  } catch (error) {
    log.error('Failed to get performance overview', { error });
    ResponseUtil.error(res, 'Failed to get performance overview', 500);
  }
}));

/**
 * 获取指定类型的性能指标
 */
router.get('/metrics/:type', asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = '100', format = 'json' } = req.query;

    // 验证指标类型
    const validTypes = Object.values(MetricType);
    if (!validTypes.includes(type as MetricType)) {
      return ResponseUtil.error(res, 'Invalid metric type', 400);
    }

    const metrics = performanceMonitor.getMetrics(type as MetricType, parseInt(limit as string, 10));

    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = 'timestamp,name,value,unit,tags\n';
      const csvRows = metrics.map(metric => 
        `${metric.timestamp.toISOString()},${metric.name},${metric.value},${metric.unit},"${JSON.stringify(metric.tags)}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="metrics-${type}-${Date.now()}.csv"`);
      res.send(csvHeader + csvRows);
    } else {
      ResponseUtil.success(res, {
        type,
        count: metrics.length,
        metrics,
      });
    }
  } catch (error) {
    log.error('Failed to get performance metrics', { error, type: req.params.type });
    ResponseUtil.error(res, 'Failed to get performance metrics', 500);
  }
}));

/**
 * 获取聚合统计信息
 */
router.get('/stats/:key?', asyncHandler(async (req, res) => {
  try {
    const { key } = req.params;
    const stats = performanceMonitor.getAggregatedStats(key);

    if (key && !stats) {
      return ResponseUtil.error(res, 'Stats not found for the specified key', 404);
    }

    // 转换Map为普通对象
    let result: any;
    if (stats instanceof Map) {
      result = {};
      for (const [k, v] of stats.entries()) {
        result[k] = v;
      }
    } else {
      result = stats;
    }

    ResponseUtil.success(res, {
      key: key || 'all',
      stats: result,
    });
  } catch (error) {
    log.error('Failed to get performance stats', { error, key: req.params.key });
    ResponseUtil.error(res, 'Failed to get performance stats', 500);
  }
}));

/**
 * 执行性能分析
 */
router.post('/analyze', asyncHandler(async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    
    let timeWindow: { start: Date; end: Date } | undefined;
    if (startTime && endTime) {
      timeWindow = {
        start: new Date(startTime),
        end: new Date(endTime),
      };
    }

    const analysis = await performanceAnalyzer.performAnalysis(timeWindow);

    ResponseUtil.success(res, {
      analysis,
      message: 'Performance analysis completed successfully',
    });
  } catch (error) {
    log.error('Failed to perform performance analysis', { error });
    ResponseUtil.error(res, 'Failed to perform performance analysis', 500);
  }
}));

/**
 * 生成性能报告
 */
router.post('/report', asyncHandler(async (req, res) => {
  try {
    const { format = 'json', startTime, endTime } = req.body;
    
    let timeWindow: { start: Date; end: Date } | undefined;
    if (startTime && endTime) {
      timeWindow = {
        start: new Date(startTime),
        end: new Date(endTime),
      };
    }

    // 执行分析
    const analysis = await performanceAnalyzer.performAnalysis(timeWindow);

    // 生成报告
    let report: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'html':
        report = await PerformanceReporter.generateHtmlReport(analysis);
        contentType = 'text/html';
        filename = `performance-report-${Date.now()}.html`;
        break;
      case 'json':
      default:
        report = await PerformanceReporter.generateJsonReport(analysis);
        contentType = 'application/json';
        filename = `performance-report-${Date.now()}.json`;
        break;
    }

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report);
    } else {
      ResponseUtil.success(res, {
        format,
        report: format === 'json' ? JSON.parse(report) : report,
        filename,
      });
    }
  } catch (error) {
    log.error('Failed to generate performance report', { error });
    ResponseUtil.error(res, 'Failed to generate performance report', 500);
  }
}));

/**
 * 获取性能趋势
 */
router.get('/trends', asyncHandler(async (req, res) => {
  try {
    const { 
      metrics = 'http.response_time,http.error_rate,system.cpu_usage,system.memory_usage',
      startTime,
      endTime,
      interval = '300000' // 5分钟
    } = req.query;

    if (!startTime || !endTime) {
      return ResponseUtil.error(res, 'startTime and endTime are required', 400);
    }

    const timeWindow = {
      start: new Date(startTime as string),
      end: new Date(endTime as string),
    };

    const metricsList = (metrics as string).split(',').map(m => m.trim());
    const intervalMs = parseInt(interval as string, 10);

    const trends = await performanceAnalyzer.getPerformanceTrends(
      metricsList,
      timeWindow,
      intervalMs
    );

    ResponseUtil.success(res, {
      timeWindow,
      interval: intervalMs,
      trends,
    });
  } catch (error) {
    log.error('Failed to get performance trends', { error });
    ResponseUtil.error(res, 'Failed to get performance trends', 500);
  }
}));

/**
 * 获取实时性能指标
 */
router.get('/realtime', asyncHandler(async (req, res) => {
  try {
    const { type } = req.query;
    
    // 获取最近5分钟的指标
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const now = new Date();
    
    let metrics;
    if (type && Object.values(MetricType).includes(type as MetricType)) {
      metrics = performanceMonitor.getMetrics(type as MetricType, 100)
        .filter(m => m.timestamp >= fiveMinutesAgo);
    } else {
      // 获取所有类型的最新指标
      const allMetrics = [];
      for (const metricType of Object.values(MetricType)) {
        const typeMetrics = performanceMonitor.getMetrics(metricType, 20)
          .filter(m => m.timestamp >= fiveMinutesAgo);
        allMetrics.push(...typeMetrics);
      }
      metrics = allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    ResponseUtil.success(res, {
      timeWindow: { start: fiveMinutesAgo, end: now },
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    log.error('Failed to get realtime performance metrics', { error });
    ResponseUtil.error(res, 'Failed to get realtime performance metrics', 500);
  }
}));

/**
 * 获取性能监控配置
 */
router.get('/config', asyncHandler(async (req, res) => {
  try {
    ResponseUtil.success(res, {
      config: {
        enabled: config.enabled,
        collection: config.collection,
        metrics: config.metrics,
        storage: {
          memory: config.storage.memory,
          file: { enabled: config.storage.file.enabled },
          database: { enabled: config.storage.database.enabled },
          external: { enabled: config.storage.external.enabled },
        },
        alerting: {
          enabled: config.alerting.enabled,
          rules: config.alerting.rules,
        },
        reporting: config.reporting,
      },
    });
  } catch (error) {
    log.error('Failed to get performance monitoring config', { error });
    ResponseUtil.error(res, 'Failed to get performance monitoring config', 500);
  }
}));

/**
 * 健康检查端点
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const stats = performanceMonitor.getMetricsStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      monitoring: {
        enabled: config.enabled,
        queueSize: stats.queueSize,
        isProcessing: stats.isProcessing,
        lastFlush: stats.lastFlush,
      },
      checks: [
        {
          name: 'metrics_queue',
          status: stats.queueSize < config.collection.maxQueueSize ? 'healthy' : 'warning',
          message: `Queue size: ${stats.queueSize}/${config.collection.maxQueueSize}`,
        },
        {
          name: 'processing',
          status: stats.isProcessing ? 'processing' : 'idle',
          message: stats.isProcessing ? 'Processing metrics' : 'Idle',
        },
        {
          name: 'last_flush',
          status: Date.now() - stats.lastFlush.getTime() < config.collection.flushInterval * 2 ? 'healthy' : 'warning',
          message: `Last flush: ${stats.lastFlush.toISOString()}`,
        },
      ],
    };

    // 检查是否有警告状态
    const hasWarnings = health.checks.some(check => check.status === 'warning');
    if (hasWarnings) {
      health.status = 'warning';
    }

    ResponseUtil.success(res, health);
  } catch (error) {
    log.error('Failed to get performance monitoring health', { error });
    ResponseUtil.error(res, 'Performance monitoring health check failed', 500);
  }
}));

export default router;
