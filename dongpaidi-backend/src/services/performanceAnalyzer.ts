import { EventEmitter } from 'events';
import { performanceMonitor, PerformanceMetric, MetricType, AggregatedStats } from './performanceMonitor';
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 性能分析结果接口
 */
export interface PerformanceAnalysisResult {
  id: string;
  timestamp: Date;
  timeWindow: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  httpAnalysis: {
    slowestEndpoints: Array<{
      path: string;
      method: string;
      avgResponseTime: number;
      requestCount: number;
    }>;
    errorEndpoints: Array<{
      path: string;
      method: string;
      errorCount: number;
      errorRate: number;
    }>;
    statusCodeDistribution: Record<string, number>;
  };
  databaseAnalysis: {
    slowestQueries: Array<{
      query: string;
      avgExecutionTime: number;
      executionCount: number;
    }>;
    queryDistribution: Record<string, number>;
    connectionPoolStats: {
      avgActive: number;
      maxActive: number;
      avgWaiting: number;
    };
  };
  systemAnalysis: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    loadAverage: number[];
  };
  cacheAnalysis: {
    hitRate: number;
    avgResponseTime: number;
    operationDistribution: Record<string, number>;
  };
  recommendations: string[];
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>;
}

/**
 * 性能趋势数据
 */
export interface PerformanceTrend {
  metric: string;
  timePoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // 变化率百分比
}

/**
 * 性能分析器类
 */
export class PerformanceAnalyzer extends EventEmitter {
  private static instance: PerformanceAnalyzer;
  private config = getPerformanceMonitoringConfig();
  private analysisTimer?: NodeJS.Timeout;
  private isAnalyzing = false;

  private constructor() {
    super();
    this.initializeAnalyzer();
  }

  public static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }

  /**
   * 初始化分析器
   */
  private async initializeAnalyzer(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // 启动定期分析
      this.startPeriodicAnalysis();
      
      log.info('Performance analyzer initialized successfully');
    } catch (error) {
      log.error('Failed to initialize performance analyzer', { error });
    }
  }

  /**
   * 启动定期分析
   */
  private startPeriodicAnalysis(): void {
    // 每5分钟进行一次分析
    this.analysisTimer = setInterval(async () => {
      if (!this.isAnalyzing) {
        await this.performAnalysis();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * 执行性能分析
   */
  public async performAnalysis(timeWindow?: { start: Date; end: Date }): Promise<PerformanceAnalysisResult> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;

    try {
      const now = new Date();
      const window = timeWindow || {
        start: new Date(now.getTime() - 60 * 60 * 1000), // 过去1小时
        end: now,
      };

      log.info('Starting performance analysis', { timeWindow: window });

      // 获取指标数据
      const httpMetrics = performanceMonitor.getMetrics(MetricType.HTTP_REQUEST, 10000);
      const dbMetrics = performanceMonitor.getMetrics(MetricType.DATABASE_QUERY, 10000);
      const systemMetrics = performanceMonitor.getMetrics(MetricType.SYSTEM_RESOURCE, 1000);
      const cacheMetrics = performanceMonitor.getMetrics(MetricType.CACHE_OPERATION, 5000);

      // 过滤时间窗口内的数据
      const filteredHttpMetrics = this.filterMetricsByTimeWindow(httpMetrics, window);
      const filteredDbMetrics = this.filterMetricsByTimeWindow(dbMetrics, window);
      const filteredSystemMetrics = this.filterMetricsByTimeWindow(systemMetrics, window);
      const filteredCacheMetrics = this.filterMetricsByTimeWindow(cacheMetrics, window);

      // 执行各项分析
      const summary = this.analyzeSummary(filteredHttpMetrics);
      const httpAnalysis = this.analyzeHttpMetrics(filteredHttpMetrics);
      const databaseAnalysis = this.analyzeDatabaseMetrics(filteredDbMetrics);
      const systemAnalysis = this.analyzeSystemMetrics(filteredSystemMetrics);
      const cacheAnalysis = this.analyzeCacheMetrics(filteredCacheMetrics);

      // 生成建议和告警
      const recommendations = this.generateRecommendations({
        summary,
        httpAnalysis,
        databaseAnalysis,
        systemAnalysis,
        cacheAnalysis,
      });

      const alerts = this.generateAlerts({
        summary,
        httpAnalysis,
        databaseAnalysis,
        systemAnalysis,
        cacheAnalysis,
      });

      const result: PerformanceAnalysisResult = {
        id: SecurityUtil.generateUUID(),
        timestamp: now,
        timeWindow: window,
        summary,
        httpAnalysis,
        databaseAnalysis,
        systemAnalysis,
        cacheAnalysis,
        recommendations,
        alerts,
      };

      // 发出分析完成事件
      this.emit('analysis_completed', result);

      log.info('Performance analysis completed', {
        analysisId: result.id,
        totalRequests: summary.totalRequests,
        avgResponseTime: summary.avgResponseTime,
        errorRate: summary.errorRate,
        alertCount: alerts.length,
      });

      return result;

    } catch (error) {
      log.error('Performance analysis failed', { error });
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * 按时间窗口过滤指标
   */
  private filterMetricsByTimeWindow(metrics: PerformanceMetric[], window: { start: Date; end: Date }): PerformanceMetric[] {
    return metrics.filter(metric => 
      metric.timestamp >= window.start && metric.timestamp <= window.end
    );
  }

  /**
   * 分析总体摘要
   */
  private analyzeSummary(httpMetrics: PerformanceMetric[]): PerformanceAnalysisResult['summary'] {
    if (httpMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
      };
    }

    const totalRequests = httpMetrics.length;
    const totalResponseTime = httpMetrics.reduce((sum, metric) => sum + metric.value, 0);
    const avgResponseTime = totalResponseTime / totalRequests;
    
    const errorRequests = httpMetrics.filter(metric => 
      (metric as any).statusCode >= 400
    ).length;
    const errorRate = errorRequests / totalRequests;

    // 计算吞吐量 (请求/秒)
    const timeSpan = Math.max(
      httpMetrics[httpMetrics.length - 1].timestamp.getTime() - httpMetrics[0].timestamp.getTime(),
      1000
    ) / 1000;
    const throughput = totalRequests / timeSpan;

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      throughput,
    };
  }

  /**
   * 分析HTTP指标
   */
  private analyzeHttpMetrics(httpMetrics: PerformanceMetric[]): PerformanceAnalysisResult['httpAnalysis'] {
    // 按端点分组
    const endpointGroups = new Map<string, PerformanceMetric[]>();
    const statusCodeCounts = new Map<string, number>();

    for (const metric of httpMetrics) {
      const httpMetric = metric as any;
      const key = `${httpMetric.method} ${httpMetric.path}`;
      
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);

      // 统计状态码
      const statusCode = httpMetric.statusCode.toString();
      statusCodeCounts.set(statusCode, (statusCodeCounts.get(statusCode) || 0) + 1);
    }

    // 分析最慢的端点
    const slowestEndpoints = Array.from(endpointGroups.entries())
      .map(([endpoint, metrics]) => {
        const [method, path] = endpoint.split(' ', 2);
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        return {
          path,
          method,
          avgResponseTime,
          requestCount: metrics.length,
        };
      })
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // 分析错误端点
    const errorEndpoints = Array.from(endpointGroups.entries())
      .map(([endpoint, metrics]) => {
        const [method, path] = endpoint.split(' ', 2);
        const errorCount = metrics.filter(m => (m as any).statusCode >= 400).length;
        const errorRate = errorCount / metrics.length;
        return {
          path,
          method,
          errorCount,
          errorRate,
        };
      })
      .filter(e => e.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10);

    // 状态码分布
    const statusCodeDistribution: Record<string, number> = {};
    for (const [code, count] of statusCodeCounts.entries()) {
      statusCodeDistribution[code] = count;
    }

    return {
      slowestEndpoints,
      errorEndpoints,
      statusCodeDistribution,
    };
  }

  /**
   * 分析数据库指标
   */
  private analyzeDatabaseMetrics(dbMetrics: PerformanceMetric[]): PerformanceAnalysisResult['databaseAnalysis'] {
    // 按查询分组
    const queryGroups = new Map<string, PerformanceMetric[]>();
    const queryTypeCounts = new Map<string, number>();

    for (const metric of dbMetrics) {
      const dbMetric = metric as any;
      const query = dbMetric.query || `${dbMetric.model}.${dbMetric.action}`;
      
      if (!queryGroups.has(query)) {
        queryGroups.set(query, []);
      }
      queryGroups.get(query)!.push(metric);

      // 统计查询类型
      const action = dbMetric.action || 'unknown';
      queryTypeCounts.set(action, (queryTypeCounts.get(action) || 0) + 1);
    }

    // 分析最慢的查询
    const slowestQueries = Array.from(queryGroups.entries())
      .map(([query, metrics]) => {
        const avgExecutionTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        return {
          query,
          avgExecutionTime,
          executionCount: metrics.length,
        };
      })
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 10);

    // 查询分布
    const queryDistribution: Record<string, number> = {};
    for (const [action, count] of queryTypeCounts.entries()) {
      queryDistribution[action] = count;
    }

    // 连接池统计（模拟数据，实际应该从数据库监控服务获取）
    const connectionPoolStats = {
      avgActive: 5,
      maxActive: 10,
      avgWaiting: 0,
    };

    return {
      slowestQueries,
      queryDistribution,
      connectionPoolStats,
    };
  }

  /**
   * 分析系统指标
   */
  private analyzeSystemMetrics(systemMetrics: PerformanceMetric[]): PerformanceAnalysisResult['systemAnalysis'] {
    if (systemMetrics.length === 0) {
      return {
        avgCpuUsage: 0,
        maxCpuUsage: 0,
        avgMemoryUsage: 0,
        maxMemoryUsage: 0,
        loadAverage: [0, 0, 0],
      };
    }

    const cpuUsages = systemMetrics.map(m => (m as any).cpuUsage).filter(Boolean);
    const memoryUsages = systemMetrics.map(m => (m as any).memoryUsage).filter(Boolean);
    const loadAverages = systemMetrics.map(m => (m as any).loadAverage).filter(Boolean);

    const avgCpuUsage = cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length || 0;
    const maxCpuUsage = Math.max(...cpuUsages, 0);
    const avgMemoryUsage = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length || 0;
    const maxMemoryUsage = Math.max(...memoryUsages, 0);

    // 计算平均负载
    const avgLoadAverage = loadAverages.length > 0 
      ? loadAverages.reduce((sum, load) => [
          sum[0] + load[0],
          sum[1] + load[1],
          sum[2] + load[2],
        ], [0, 0, 0]).map(sum => sum / loadAverages.length)
      : [0, 0, 0];

    return {
      avgCpuUsage,
      maxCpuUsage,
      avgMemoryUsage,
      maxMemoryUsage,
      loadAverage: avgLoadAverage,
    };
  }

  /**
   * 分析缓存指标
   */
  private analyzeCacheMetrics(cacheMetrics: PerformanceMetric[]): PerformanceAnalysisResult['cacheAnalysis'] {
    if (cacheMetrics.length === 0) {
      return {
        hitRate: 0,
        avgResponseTime: 0,
        operationDistribution: {},
      };
    }

    const hits = cacheMetrics.filter(m => (m as any).hit === true).length;
    const hitRate = hits / cacheMetrics.length;
    
    const totalResponseTime = cacheMetrics.reduce((sum, m) => sum + m.value, 0);
    const avgResponseTime = totalResponseTime / cacheMetrics.length;

    // 操作分布
    const operationCounts = new Map<string, number>();
    for (const metric of cacheMetrics) {
      const operation = (metric as any).operation || 'unknown';
      operationCounts.set(operation, (operationCounts.get(operation) || 0) + 1);
    }

    const operationDistribution: Record<string, number> = {};
    for (const [operation, count] of operationCounts.entries()) {
      operationDistribution[operation] = count;
    }

    return {
      hitRate,
      avgResponseTime,
      operationDistribution,
    };
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(analysis: {
    summary: PerformanceAnalysisResult['summary'];
    httpAnalysis: PerformanceAnalysisResult['httpAnalysis'];
    databaseAnalysis: PerformanceAnalysisResult['databaseAnalysis'];
    systemAnalysis: PerformanceAnalysisResult['systemAnalysis'];
    cacheAnalysis: PerformanceAnalysisResult['cacheAnalysis'];
  }): string[] {
    const recommendations: string[] = [];

    // HTTP性能建议
    if (analysis.summary.avgResponseTime > 1000) {
      recommendations.push('平均响应时间较高，建议优化慢接口或增加缓存');
    }

    if (analysis.summary.errorRate > 0.05) {
      recommendations.push('错误率较高，建议检查错误日志并修复相关问题');
    }

    if (analysis.httpAnalysis.slowestEndpoints.length > 0) {
      const slowest = analysis.httpAnalysis.slowestEndpoints[0];
      if (slowest.avgResponseTime > 2000) {
        recommendations.push(`最慢接口 ${slowest.method} ${slowest.path} 响应时间过长，建议优化`);
      }
    }

    // 数据库性能建议
    if (analysis.databaseAnalysis.slowestQueries.length > 0) {
      const slowest = analysis.databaseAnalysis.slowestQueries[0];
      if (slowest.avgExecutionTime > 500) {
        recommendations.push(`数据库查询 ${slowest.query} 执行时间过长，建议添加索引或优化查询`);
      }
    }

    // 系统资源建议
    if (analysis.systemAnalysis.avgCpuUsage > 80) {
      recommendations.push('CPU使用率较高，建议优化计算密集型操作或增加服务器资源');
    }

    if (analysis.systemAnalysis.avgMemoryUsage > 85) {
      recommendations.push('内存使用率较高，建议检查内存泄漏或增加内存资源');
    }

    // 缓存性能建议
    if (analysis.cacheAnalysis.hitRate < 0.7) {
      recommendations.push('缓存命中率较低，建议优化缓存策略或增加缓存时间');
    }

    if (recommendations.length === 0) {
      recommendations.push('系统性能表现良好，继续保持');
    }

    return recommendations;
  }

  /**
   * 生成性能告警
   */
  private generateAlerts(analysis: {
    summary: PerformanceAnalysisResult['summary'];
    httpAnalysis: PerformanceAnalysisResult['httpAnalysis'];
    databaseAnalysis: PerformanceAnalysisResult['databaseAnalysis'];
    systemAnalysis: PerformanceAnalysisResult['systemAnalysis'];
    cacheAnalysis: PerformanceAnalysisResult['cacheAnalysis'];
  }): PerformanceAnalysisResult['alerts'] {
    const alerts: PerformanceAnalysisResult['alerts'] = [];

    // 检查配置的告警规则
    for (const rule of this.config.alerting.rules) {
      let value: number;
      let shouldAlert = false;

      switch (rule.metric) {
        case 'http.response_time':
          value = analysis.summary.avgResponseTime;
          shouldAlert = this.evaluateAlertRule(value, rule.operator, rule.threshold);
          break;
        case 'http.error_rate':
          value = analysis.summary.errorRate * 100;
          shouldAlert = this.evaluateAlertRule(value, rule.operator, rule.threshold);
          break;
        case 'system.cpu_usage':
          value = analysis.systemAnalysis.avgCpuUsage;
          shouldAlert = this.evaluateAlertRule(value, rule.operator, rule.threshold);
          break;
        case 'system.memory_usage':
          value = analysis.systemAnalysis.avgMemoryUsage;
          shouldAlert = this.evaluateAlertRule(value, rule.operator, rule.threshold);
          break;
        case 'cache.hit_rate':
          value = analysis.cacheAnalysis.hitRate * 100;
          shouldAlert = this.evaluateAlertRule(value, rule.operator, rule.threshold);
          break;
        default:
          continue;
      }

      if (shouldAlert) {
        alerts.push({
          severity: rule.severity as any,
          message: `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
        });
      }
    }

    return alerts;
  }

  /**
   * 评估告警规则
   */
  private evaluateAlertRule(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * 获取性能趋势
   */
  public async getPerformanceTrends(
    metrics: string[],
    timeWindow: { start: Date; end: Date },
    interval: number = 5 * 60 * 1000 // 5分钟间隔
  ): Promise<PerformanceTrend[]> {
    const trends: PerformanceTrend[] = [];

    for (const metric of metrics) {
      const timePoints: Array<{ timestamp: Date; value: number }> = [];
      
      // 生成时间点
      const start = timeWindow.start.getTime();
      const end = timeWindow.end.getTime();
      
      for (let time = start; time <= end; time += interval) {
        const timestamp = new Date(time);
        
        // 这里应该从实际数据中计算值
        // 暂时使用模拟数据
        const value = Math.random() * 100;
        
        timePoints.push({ timestamp, value });
      }

      // 计算趋势
      const values = timePoints.map(p => p.value);
      const firstValue = values[0] || 0;
      const lastValue = values[values.length - 1] || 0;
      const changeRate = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(changeRate) < 5) {
        trend = 'stable';
      } else if (changeRate > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      trends.push({
        metric,
        timePoints,
        trend,
        changeRate,
      });
    }

    return trends;
  }

  /**
   * 关闭分析器
   */
  public async shutdown(): Promise<void> {
    log.info('Shutting down performance analyzer...');

    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.removeAllListeners();

    log.info('Performance analyzer shut down successfully');
  }
}

// 导出单例实例
export const performanceAnalyzer = PerformanceAnalyzer.getInstance();

/**
 * 性能报告生成器
 */
export class PerformanceReporter {
  /**
   * 生成HTML报告
   */
  public static async generateHtmlReport(analysis: PerformanceAnalysisResult): Promise<string> {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能分析报告 - ${analysis.timestamp.toLocaleString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert-critical { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-high { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-medium { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .alert-low { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .recommendations { background-color: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>性能分析报告</h1>
            <p>分析时间: ${analysis.timestamp.toLocaleString()}</p>
            <p>时间窗口: ${analysis.timeWindow.start.toLocaleString()} - ${analysis.timeWindow.end.toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${analysis.summary.totalRequests}</div>
                <div class="metric-label">总请求数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.summary.avgResponseTime.toFixed(2)}ms</div>
                <div class="metric-label">平均响应时间</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(analysis.summary.errorRate * 100).toFixed(2)}%</div>
                <div class="metric-label">错误率</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.summary.throughput.toFixed(2)}</div>
                <div class="metric-label">吞吐量 (req/s)</div>
            </div>
        </div>

        ${analysis.alerts.length > 0 ? `
        <div class="section">
            <h2>🚨 性能告警</h2>
            ${analysis.alerts.map(alert => `
                <div class="alert alert-${alert.severity}">
                    <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>📊 HTTP分析</h2>
            <h3>最慢的端点</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>方法</th>
                        <th>路径</th>
                        <th>平均响应时间</th>
                        <th>请求数</th>
                    </tr>
                </thead>
                <tbody>
                    ${analysis.httpAnalysis.slowestEndpoints.map(endpoint => `
                        <tr>
                            <td>${endpoint.method}</td>
                            <td>${endpoint.path}</td>
                            <td>${endpoint.avgResponseTime.toFixed(2)}ms</td>
                            <td>${endpoint.requestCount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🗄️ 数据库分析</h2>
            <h3>最慢的查询</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>查询</th>
                        <th>平均执行时间</th>
                        <th>执行次数</th>
                    </tr>
                </thead>
                <tbody>
                    ${analysis.databaseAnalysis.slowestQueries.map(query => `
                        <tr>
                            <td>${query.query}</td>
                            <td>${query.avgExecutionTime.toFixed(2)}ms</td>
                            <td>${query.executionCount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>💻 系统资源分析</h2>
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value">${analysis.systemAnalysis.avgCpuUsage.toFixed(2)}%</div>
                    <div class="metric-label">平均CPU使用率</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${analysis.systemAnalysis.avgMemoryUsage.toFixed(2)}%</div>
                    <div class="metric-label">平均内存使用率</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${analysis.systemAnalysis.loadAverage[0].toFixed(2)}</div>
                    <div class="metric-label">1分钟负载</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🚀 缓存分析</h2>
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value">${(analysis.cacheAnalysis.hitRate * 100).toFixed(2)}%</div>
                    <div class="metric-label">缓存命中率</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${analysis.cacheAnalysis.avgResponseTime.toFixed(2)}ms</div>
                    <div class="metric-label">平均响应时间</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>💡 优化建议</h2>
            <div class="recommendations">
                <ul>
                    ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 生成JSON报告
   */
  public static async generateJsonReport(analysis: PerformanceAnalysisResult): Promise<string> {
    return JSON.stringify(analysis, null, 2);
  }
}
