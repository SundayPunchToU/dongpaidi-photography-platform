import fs from 'fs/promises';
import path from 'path';
import { logAnalyzer, AnalysisResult } from './logAnalyzer';
import { getLogAnalysisConfig } from '@/config/logAnalysis';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 报告类型
 */
export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

/**
 * 报告格式
 */
export enum ReportFormat {
  HTML = 'html',
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

/**
 * 报告配置
 */
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  timeWindow: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeTrends: boolean;
  includeRecommendations: boolean;
  recipients?: string[];
}

/**
 * 报告数据
 */
export interface ReportData {
  id: string;
  type: ReportType;
  generatedAt: Date;
  timeWindow: {
    start: Date;
    end: Date;
  };
  summary: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    uniqueUsers: number;
    topErrors: Array<{ error: string; count: number }>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    performanceMetrics: {
      avgResponseTime: number;
      p95ResponseTime: number;
      slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
    };
  };
  analysisResults: AnalysisResult[];
  trends: {
    errorRate: Array<{ timestamp: Date; value: number }>;
    requestVolume: Array<{ timestamp: Date; value: number }>;
    responseTime: Array<{ timestamp: Date; value: number }>;
  };
  alerts: Array<{
    severity: string;
    message: string;
    timestamp: Date;
    data: any;
  }>;
  recommendations: string[];
}

/**
 * 日志报告生成器
 */
export class LogReporter {
  private static instance: LogReporter;
  private config = getLogAnalysisConfig();

  private constructor() {}

  public static getInstance(): LogReporter {
    if (!LogReporter.instance) {
      LogReporter.instance = new LogReporter();
    }
    return LogReporter.instance;
  }

  /**
   * 生成报告
   */
  public async generateReport(config: ReportConfig): Promise<string> {
    try {
      log.info('Generating log report', { type: config.type, format: config.format });

      // 收集报告数据
      const reportData = await this.collectReportData(config);

      // 生成报告文件
      const reportPath = await this.generateReportFile(reportData, config);

      // 发送报告（如果配置了收件人）
      if (config.recipients && config.recipients.length > 0) {
        await this.sendReport(reportPath, config);
      }

      log.info('Log report generated successfully', { 
        reportId: reportData.id, 
        path: reportPath 
      });

      return reportPath;
    } catch (error) {
      log.error('Failed to generate log report', { error, config });
      throw error;
    }
  }

  /**
   * 收集报告数据
   */
  private async collectReportData(config: ReportConfig): Promise<ReportData> {
    const { start, end } = config.timeWindow;

    // 获取日志统计信息
    const statistics = await logAnalyzer.getLogStatistics(config.timeWindow);

    // 获取分析结果
    const analysisResults = await this.getAnalysisResults(start, end);

    // 生成趋势数据
    const trends = await this.generateTrends(start, end);

    // 收集告警信息
    const alerts = await this.collectAlerts(start, end);

    // 生成建议
    const recommendations = this.generateRecommendations(statistics, analysisResults);

    return {
      id: SecurityUtil.generateUUID(),
      type: config.type,
      generatedAt: new Date(),
      timeWindow: config.timeWindow,
      summary: {
        totalLogs: statistics.totalEntries,
        errorCount: statistics.entriesByLevel['ERROR'] || 0,
        warningCount: statistics.entriesByLevel['WARN'] || 0,
        uniqueUsers: 0, // 需要从统计中获取
        topErrors: statistics.topErrors,
        topEndpoints: [], // 需要从统计中获取
        performanceMetrics: {
          avgResponseTime: 0, // 需要计算
          p95ResponseTime: 0, // 需要计算
          slowestEndpoints: [], // 需要计算
        },
      },
      analysisResults,
      trends,
      alerts,
      recommendations,
    };
  }

  /**
   * 获取分析结果
   */
  private async getAnalysisResults(start: Date, end: Date): Promise<AnalysisResult[]> {
    try {
      const analysisDir = path.join(this.config.storage.file.basePath, 'analysis');
      const files = await fs.readdir(analysisDir);
      
      const results: AnalysisResult[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(analysisDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const result: AnalysisResult = JSON.parse(content);
            
            // 检查时间窗口
            if (result.timestamp >= start && result.timestamp <= end) {
              results.push(result);
            }
          } catch (error) {
            log.warn(`Failed to parse analysis result file: ${file}`, { error });
          }
        }
      }

      return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      log.error('Failed to get analysis results', { error });
      return [];
    }
  }

  /**
   * 生成趋势数据
   */
  private async generateTrends(start: Date, end: Date): Promise<ReportData['trends']> {
    // 这里应该实现趋势数据生成逻辑
    // 暂时返回空数据
    return {
      errorRate: [],
      requestVolume: [],
      responseTime: [],
    };
  }

  /**
   * 收集告警信息
   */
  private async collectAlerts(start: Date, end: Date): Promise<ReportData['alerts']> {
    // 这里应该实现告警收集逻辑
    // 暂时返回空数组
    return [];
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    statistics: any,
    analysisResults: AnalysisResult[]
  ): string[] {
    const recommendations: string[] = [];

    // 基于错误率的建议
    const errorRate = statistics.entriesByLevel['ERROR'] / statistics.totalEntries;
    if (errorRate > 0.05) {
      recommendations.push('错误率较高，建议检查最近的代码变更和部署');
    }

    // 基于分析结果的建议
    for (const result of analysisResults) {
      recommendations.push(...result.recommendations);
    }

    // 去重
    return [...new Set(recommendations)];
  }

  /**
   * 生成报告文件
   */
  private async generateReportFile(data: ReportData, config: ReportConfig): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `log-report-${config.type}-${timestamp}.${config.format}`;
    const filePath = path.join(this.config.storage.file.basePath, 'reports', fileName);

    switch (config.format) {
      case ReportFormat.JSON:
        await this.generateJSONReport(data, filePath);
        break;
      case ReportFormat.HTML:
        await this.generateHTMLReport(data, filePath, config);
        break;
      case ReportFormat.CSV:
        await this.generateCSVReport(data, filePath);
        break;
      case ReportFormat.PDF:
        await this.generatePDFReport(data, filePath, config);
        break;
      default:
        throw new Error(`Unsupported report format: ${config.format}`);
    }

    return filePath;
  }

  /**
   * 生成JSON报告
   */
  private async generateJSONReport(data: ReportData, filePath: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf8');
  }

  /**
   * 生成HTML报告
   */
  private async generateHTMLReport(
    data: ReportData,
    filePath: string,
    config: ReportConfig
  ): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>懂拍帝日志分析报告 - ${data.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007cba; }
        .section { margin-bottom: 30px; }
        .section h2 { border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .alert.high { background: #ffebee; border-left: 4px solid #f44336; }
        .alert.medium { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert.low { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .recommendation { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>懂拍帝日志分析报告</h1>
        <p><strong>报告类型:</strong> ${data.type}</p>
        <p><strong>时间范围:</strong> ${data.timeWindow.start.toLocaleString()} - ${data.timeWindow.end.toLocaleString()}</p>
        <p><strong>生成时间:</strong> ${data.generatedAt.toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>总日志数</h3>
            <div class="value">${data.summary.totalLogs.toLocaleString()}</div>
        </div>
        <div class="metric">
            <h3>错误数</h3>
            <div class="value">${data.summary.errorCount.toLocaleString()}</div>
        </div>
        <div class="metric">
            <h3>警告数</h3>
            <div class="value">${data.summary.warningCount.toLocaleString()}</div>
        </div>
        <div class="metric">
            <h3>独立用户</h3>
            <div class="value">${data.summary.uniqueUsers.toLocaleString()}</div>
        </div>
    </div>

    ${data.summary.topErrors.length > 0 ? `
    <div class="section">
        <h2>主要错误</h2>
        <table>
            <thead>
                <tr><th>错误类型</th><th>次数</th></tr>
            </thead>
            <tbody>
                ${data.summary.topErrors.map(error => 
                    `<tr><td>${error.error}</td><td>${error.count}</td></tr>`
                ).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${data.alerts.length > 0 ? `
    <div class="section">
        <h2>告警信息</h2>
        ${data.alerts.map(alert => 
            `<div class="alert ${alert.severity}">
                <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
                <br><small>${alert.timestamp.toLocaleString()}</small>
            </div>`
        ).join('')}
    </div>
    ` : ''}

    ${data.recommendations.length > 0 ? `
    <div class="section">
        <h2>优化建议</h2>
        ${data.recommendations.map(rec => 
            `<div class="recommendation">💡 ${rec}</div>`
        ).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>分析结果</h2>
        ${data.analysisResults.map(result => `
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h3>${result.type}</h3>
                <p><strong>时间:</strong> ${result.timestamp.toLocaleString()}</p>
                <p><strong>洞察:</strong></p>
                <ul>
                    ${result.insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
                ${result.alerts.length > 0 ? `
                <p><strong>告警:</strong></p>
                <ul>
                    ${result.alerts.map(alert => `<li class="alert ${alert.severity}">${alert.message}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
        <p>此报告由懂拍帝日志分析系统自动生成</p>
    </div>
</body>
</html>`;

    await fs.writeFile(filePath, html, 'utf8');
  }

  /**
   * 生成CSV报告
   */
  private async generateCSVReport(data: ReportData, filePath: string): Promise<void> {
    const csvLines = [
      'Type,Timestamp,Message,Level,Module,IP,User,URL',
      // 这里应该添加实际的日志数据行
      // 暂时只添加汇总信息
      `Summary,${data.generatedAt.toISOString()},Total Logs: ${data.summary.totalLogs},INFO,system,,,`,
      `Summary,${data.generatedAt.toISOString()},Errors: ${data.summary.errorCount},ERROR,system,,,`,
      `Summary,${data.generatedAt.toISOString()},Warnings: ${data.summary.warningCount},WARN,system,,,`,
    ];

    const csvContent = csvLines.join('\n');
    await fs.writeFile(filePath, csvContent, 'utf8');
  }

  /**
   * 生成PDF报告
   */
  private async generatePDFReport(
    data: ReportData,
    filePath: string,
    config: ReportConfig
  ): Promise<void> {
    // 这里应该实现PDF生成逻辑
    // 暂时生成HTML然后转换为PDF，或者使用PDF库
    log.warn('PDF report generation not implemented yet');
    
    // 作为临时方案，生成HTML文件
    const htmlPath = filePath.replace('.pdf', '.html');
    await this.generateHTMLReport(data, htmlPath, config);
  }

  /**
   * 发送报告
   */
  private async sendReport(reportPath: string, config: ReportConfig): Promise<void> {
    try {
      // 这里应该实现报告发送逻辑（邮件、Webhook等）
      log.info('Report sending not implemented yet', { 
        reportPath, 
        recipients: config.recipients 
      });
    } catch (error) {
      log.error('Failed to send report', { error, reportPath });
    }
  }

  /**
   * 生成定时报告
   */
  public async generateScheduledReport(type: ReportType): Promise<string> {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (type) {
      case ReportType.DAILY:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case ReportType.WEEKLY:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportType.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        throw new Error(`Unsupported scheduled report type: ${type}`);
    }

    const config: ReportConfig = {
      type,
      format: ReportFormat.HTML,
      timeWindow: { start, end },
      includeCharts: true,
      includeTrends: true,
      includeRecommendations: true,
      recipients: this.config.reporting.recipients,
    };

    return this.generateReport(config);
  }

  /**
   * 获取报告列表
   */
  public async getReportList(): Promise<Array<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
    type: string;
  }>> {
    try {
      const reportsDir = path.join(this.config.storage.file.basePath, 'reports');
      const files = await fs.readdir(reportsDir);
      
      const reports = [];
      for (const file of files) {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);
        
        reports.push({
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          type: path.extname(file).substring(1),
        });
      }

      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      log.error('Failed to get report list', { error });
      return [];
    }
  }
}

// 导出单例实例
export const logReporter = LogReporter.getInstance();
