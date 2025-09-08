import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { logAnalysisConfig, getLogAnalysisConfig } from '@/config/logAnalysis';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 日志条目接口
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'HTTP';
  message: string;
  service: string;
  module?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
  tags?: string[];
  processed: boolean;
  anonymized: boolean;
}

/**
 * 分析结果接口
 */
export interface AnalysisResult {
  id: string;
  type: string;
  timestamp: Date;
  timeWindow: {
    start: Date;
    end: Date;
  };
  metrics: Record<string, number>;
  insights: string[];
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    data: any;
  }>;
  recommendations: string[];
}

/**
 * 日志分析器类
 */
export class LogAnalyzer extends EventEmitter {
  private static instance: LogAnalyzer;
  private config = getLogAnalysisConfig();
  private logQueue: LogEntry[] = [];
  private analysisQueue: LogEntry[] = [];
  private isProcessing = false;
  private lastFlush = Date.now();

  private constructor() {
    super();
    this.initializeAnalyzer();
  }

  public static getInstance(): LogAnalyzer {
    if (!LogAnalyzer.instance) {
      LogAnalyzer.instance = new LogAnalyzer();
    }
    return LogAnalyzer.instance;
  }

  /**
   * 初始化分析器
   */
  private async initializeAnalyzer(): Promise<void> {
    try {
      // 确保日志目录存在
      await this.ensureDirectories();

      // 启动定期处理
      this.startPeriodicProcessing();

      // 启动批量分析
      if (this.config.analysis.batch.enabled) {
        this.startBatchAnalysis();
      }

      // 启动实时分析
      if (this.config.analysis.realtime.enabled) {
        this.startRealtimeAnalysis();
      }

      log.info('Log analyzer initialized successfully');
    } catch (error) {
      log.error('Failed to initialize log analyzer', { error });
    }
  }

  /**
   * 确保必要的目录存在
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.config.storage.file.basePath,
      path.join(this.config.storage.file.basePath, 'raw'),
      path.join(this.config.storage.file.basePath, 'analysis'),
      path.join(this.config.storage.file.basePath, 'reports'),
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        log.error(`Failed to create directory: ${dir}`, { error });
      }
    }
  }

  /**
   * 添加日志条目
   */
  public async addLogEntry(entry: Partial<LogEntry>): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: SecurityUtil.generateUUID(),
        timestamp: new Date(),
        level: 'INFO',
        message: '',
        service: 'dongpaidi-backend',
        processed: false,
        anonymized: false,
        ...entry,
      };

      // 数据脱敏
      if (this.config.privacy.anonymization.enabled) {
        logEntry.anonymized = true;
        this.anonymizeLogEntry(logEntry);
      }

      // 敏感数据过滤
      if (this.config.privacy.sensitiveDataFilter.enabled) {
        this.filterSensitiveData(logEntry);
      }

      // 添加到队列
      this.logQueue.push(logEntry);

      // 检查是否需要立即处理
      if (this.shouldFlushQueue()) {
        await this.flushQueue();
      }

      // 实时分析
      if (this.config.analysis.realtime.enabled) {
        this.analysisQueue.push(logEntry);
        this.processRealtimeAnalysis();
      }

    } catch (error) {
      log.error('Failed to add log entry', { error, entry });
    }
  }

  /**
   * 数据脱敏
   */
  private anonymizeLogEntry(entry: LogEntry): void {
    const methods = this.config.privacy.anonymization.methods;

    if (entry.ip && methods.ip === 'mask_last_octet') {
      const parts = entry.ip.split('.');
      if (parts.length === 4) {
        parts[3] = 'xxx';
        entry.ip = parts.join('.');
      }
    }

    if (entry.userId && methods.userId === 'hash') {
      entry.userId = SecurityUtil.generateHMAC(entry.userId, 'user-anonymization');
    }

    // 处理元数据中的敏感信息
    if (entry.metadata) {
      for (const field of this.config.privacy.anonymization.fields) {
        if (entry.metadata[field]) {
          entry.metadata[field] = '[ANONYMIZED]';
        }
      }
    }
  }

  /**
   * 敏感数据过滤
   */
  private filterSensitiveData(entry: LogEntry): void {
    const patterns = this.config.privacy.sensitiveDataFilter.patterns;
    const replacement = this.config.privacy.sensitiveDataFilter.replacement;

    // 过滤消息内容
    for (const pattern of patterns) {
      entry.message = entry.message.replace(pattern, replacement);
    }

    // 过滤元数据
    if (entry.metadata) {
      const filteredMetadata: Record<string, any> = {};
      for (const [key, value] of Object.entries(entry.metadata)) {
        let filteredKey = key;
        let filteredValue = value;

        // 检查键名
        for (const pattern of patterns) {
          if (pattern.test(key)) {
            filteredKey = replacement;
            break;
          }
        }

        // 检查值
        if (typeof value === 'string') {
          for (const pattern of patterns) {
            filteredValue = value.replace(pattern, replacement);
          }
        }

        filteredMetadata[filteredKey] = filteredValue;
      }
      entry.metadata = filteredMetadata;
    }
  }

  /**
   * 检查是否需要刷新队列
   */
  private shouldFlushQueue(): boolean {
    const now = Date.now();
    const timeSinceLastFlush = now - this.lastFlush;
    
    return (
      this.logQueue.length >= this.config.collection.batchSize ||
      timeSinceLastFlush >= this.config.collection.flushInterval ||
      this.logQueue.length >= this.config.collection.maxQueueSize
    );
  }

  /**
   * 刷新队列
   */
  private async flushQueue(): Promise<void> {
    if (this.logQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const batch = this.logQueue.splice(0, this.config.collection.batchSize);

    try {
      // 写入文件存储
      if (this.config.storage.file.enabled) {
        await this.writeToFile(batch);
      }

      // 写入数据库
      if (this.config.storage.database.enabled) {
        await this.writeToDatabase(batch);
      }

      // 写入外部存储
      if (this.config.storage.external.enabled) {
        await this.writeToExternal(batch);
      }

      this.lastFlush = Date.now();
      this.emit('batch_processed', { count: batch.length });

    } catch (error) {
      log.error('Failed to flush log queue', { error, batchSize: batch.length });
      // 将失败的批次重新加入队列
      this.logQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 写入文件存储
   */
  private async writeToFile(entries: LogEntry[]): Promise<void> {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `logs-${dateStr}.json`;
      const filePath = path.join(this.config.storage.file.basePath, 'raw', fileName);

      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await fs.appendFile(filePath, logLines, 'utf8');
    } catch (error) {
      log.error('Failed to write logs to file', { error });
      throw error;
    }
  }

  /**
   * 写入数据库
   */
  private async writeToDatabase(entries: LogEntry[]): Promise<void> {
    try {
      // 这里应该实现数据库写入逻辑
      // 由于当前schema中没有log_entries表，暂时跳过
      log.debug('Database storage not implemented yet', { count: entries.length });
    } catch (error) {
      log.error('Failed to write logs to database', { error });
      throw error;
    }
  }

  /**
   * 写入外部存储
   */
  private async writeToExternal(entries: LogEntry[]): Promise<void> {
    try {
      // 这里应该实现外部存储写入逻辑（如Elasticsearch）
      log.debug('External storage not implemented yet', { count: entries.length });
    } catch (error) {
      log.error('Failed to write logs to external storage', { error });
      throw error;
    }
  }

  /**
   * 启动定期处理
   */
  private startPeriodicProcessing(): void {
    setInterval(async () => {
      if (this.logQueue.length > 0) {
        await this.flushQueue();
      }
    }, this.config.collection.flushInterval);
  }

  /**
   * 启动批量分析
   */
  private startBatchAnalysis(): void {
    // 这里应该实现cron调度
    setInterval(async () => {
      await this.performBatchAnalysis();
    }, 5 * 60 * 1000); // 每5分钟执行一次
  }

  /**
   * 启动实时分析
   */
  private startRealtimeAnalysis(): void {
    setInterval(() => {
      this.processRealtimeAnalysis();
    }, this.config.analysis.realtime.windowSize);
  }

  /**
   * 执行批量分析
   */
  private async performBatchAnalysis(): Promise<void> {
    try {
      const analysisTypes = this.config.analysis.batch.analysisTypes;
      
      for (const type of analysisTypes) {
        const result = await this.runAnalysis(type);
        if (result) {
          await this.saveAnalysisResult(result);
          this.emit('analysis_completed', result);
        }
      }
    } catch (error) {
      log.error('Batch analysis failed', { error });
    }
  }

  /**
   * 处理实时分析
   */
  private processRealtimeAnalysis(): void {
    if (this.analysisQueue.length === 0) {
      return;
    }

    const windowEntries = this.analysisQueue.splice(0);
    
    // 错误率分析
    const errorEntries = windowEntries.filter(e => e.level === 'ERROR');
    const errorRate = errorEntries.length / windowEntries.length;
    
    if (errorRate > this.config.analysis.realtime.alertThresholds.errorRate) {
      this.emit('alert', {
        type: 'high_error_rate',
        severity: 'high',
        message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold`,
        data: { errorRate, errorCount: errorEntries.length, totalCount: windowEntries.length },
      });
    }

    // 响应时间分析
    const httpEntries = windowEntries.filter(e => e.responseTime !== undefined);
    if (httpEntries.length > 0) {
      const avgResponseTime = httpEntries.reduce((sum, e) => sum + (e.responseTime || 0), 0) / httpEntries.length;
      
      if (avgResponseTime > this.config.analysis.realtime.alertThresholds.responseTime) {
        this.emit('alert', {
          type: 'slow_response',
          severity: 'medium',
          message: `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold`,
          data: { avgResponseTime, requestCount: httpEntries.length },
        });
      }
    }
  }

  /**
   * 运行特定类型的分析
   */
  private async runAnalysis(type: string): Promise<AnalysisResult | null> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 读取最近一小时的日志
      const entries = await this.readLogEntries(oneHourAgo, now);
      
      switch (type) {
        case 'error_analysis':
          return this.analyzeErrors(entries, oneHourAgo, now);
        case 'performance_analysis':
          return this.analyzePerformance(entries, oneHourAgo, now);
        case 'user_behavior_analysis':
          return this.analyzeUserBehavior(entries, oneHourAgo, now);
        case 'security_analysis':
          return this.analyzeSecurity(entries, oneHourAgo, now);
        case 'business_metrics':
          return this.analyzeBusinessMetrics(entries, oneHourAgo, now);
        default:
          log.warn(`Unknown analysis type: ${type}`);
          return null;
      }
    } catch (error) {
      log.error(`Analysis failed for type: ${type}`, { error });
      return null;
    }
  }

  /**
   * 读取日志条目
   */
  private async readLogEntries(start: Date, end: Date): Promise<LogEntry[]> {
    // 这里应该实现从存储中读取日志的逻辑
    // 暂时返回空数组
    return [];
  }

  /**
   * 错误分析
   */
  private analyzeErrors(entries: LogEntry[], start: Date, end: Date): AnalysisResult {
    const errorEntries = entries.filter(e => e.level === 'ERROR');
    const errorsByType = new Map<string, number>();
    const errorsByModule = new Map<string, number>();

    errorEntries.forEach(entry => {
      const errorType = entry.error?.name || 'Unknown';
      const module = entry.module || 'Unknown';
      
      errorsByType.set(errorType, (errorsByType.get(errorType) || 0) + 1);
      errorsByModule.set(module, (errorsByModule.get(module) || 0) + 1);
    });

    const insights = [];
    const alerts = [];
    const recommendations = [];

    if (errorEntries.length > 0) {
      insights.push(`Found ${errorEntries.length} errors in the last hour`);
      
      const topErrorType = Array.from(errorsByType.entries())
        .sort(([,a], [,b]) => b - a)[0];
      if (topErrorType) {
        insights.push(`Most common error: ${topErrorType[0]} (${topErrorType[1]} occurrences)`);
      }

      if (errorEntries.length > 10) {
        alerts.push({
          severity: 'high' as const,
          message: 'High error count detected',
          data: { errorCount: errorEntries.length },
        });
        recommendations.push('Investigate recent deployments or configuration changes');
      }
    }

    return {
      id: SecurityUtil.generateUUID(),
      type: 'error_analysis',
      timestamp: new Date(),
      timeWindow: { start, end },
      metrics: {
        totalErrors: errorEntries.length,
        errorRate: errorEntries.length / entries.length,
        uniqueErrorTypes: errorsByType.size,
        affectedModules: errorsByModule.size,
      },
      insights,
      alerts,
      recommendations,
    };
  }

  /**
   * 性能分析
   */
  private analyzePerformance(entries: LogEntry[], start: Date, end: Date): AnalysisResult {
    const httpEntries = entries.filter(e => e.responseTime !== undefined);
    
    if (httpEntries.length === 0) {
      return {
        id: SecurityUtil.generateUUID(),
        type: 'performance_analysis',
        timestamp: new Date(),
        timeWindow: { start, end },
        metrics: {},
        insights: ['No HTTP requests found in the time window'],
        alerts: [],
        recommendations: [],
      };
    }

    const responseTimes = httpEntries.map(e => e.responseTime!);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    // 计算百分位数
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    const insights = [
      `Processed ${httpEntries.length} HTTP requests`,
      `Average response time: ${avgResponseTime.toFixed(2)}ms`,
      `95th percentile: ${p95}ms`,
      `99th percentile: ${p99}ms`,
    ];

    const alerts = [];
    const recommendations = [];

    if (avgResponseTime > 1000) {
      alerts.push({
        severity: 'medium' as const,
        message: 'High average response time detected',
        data: { avgResponseTime },
      });
      recommendations.push('Consider optimizing database queries or adding caching');
    }

    return {
      id: SecurityUtil.generateUUID(),
      type: 'performance_analysis',
      timestamp: new Date(),
      timeWindow: { start, end },
      metrics: {
        totalRequests: httpEntries.length,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
      },
      insights,
      alerts,
      recommendations,
    };
  }

  /**
   * 用户行为分析
   */
  private analyzeUserBehavior(entries: LogEntry[], start: Date, end: Date): AnalysisResult {
    const userEntries = entries.filter(e => e.userId);
    const uniqueUsers = new Set(userEntries.map(e => e.userId)).size;
    const userSessions = new Set(userEntries.map(e => e.sessionId)).size;

    return {
      id: SecurityUtil.generateUUID(),
      type: 'user_behavior_analysis',
      timestamp: new Date(),
      timeWindow: { start, end },
      metrics: {
        totalUserActions: userEntries.length,
        uniqueUsers,
        uniqueSessions: userSessions,
        avgActionsPerUser: userEntries.length / (uniqueUsers || 1),
      },
      insights: [
        `${uniqueUsers} unique users generated ${userEntries.length} actions`,
        `Average actions per user: ${(userEntries.length / (uniqueUsers || 1)).toFixed(2)}`,
      ],
      alerts: [],
      recommendations: [],
    };
  }

  /**
   * 安全分析
   */
  private analyzeSecurity(entries: LogEntry[], start: Date, end: Date): AnalysisResult {
    const securityEntries = entries.filter(e => 
      e.tags?.includes('security') || 
      e.message.toLowerCase().includes('security') ||
      e.message.toLowerCase().includes('attack') ||
      e.level === 'ERROR'
    );

    return {
      id: SecurityUtil.generateUUID(),
      type: 'security_analysis',
      timestamp: new Date(),
      timeWindow: { start, end },
      metrics: {
        securityEvents: securityEntries.length,
        suspiciousIPs: new Set(securityEntries.map(e => e.ip)).size,
      },
      insights: [`Found ${securityEntries.length} potential security events`],
      alerts: [],
      recommendations: [],
    };
  }

  /**
   * 业务指标分析
   */
  private analyzeBusinessMetrics(entries: LogEntry[], start: Date, end: Date): AnalysisResult {
    const apiEntries = entries.filter(e => e.url && e.method);
    const endpointCounts = new Map<string, number>();

    apiEntries.forEach(entry => {
      const endpoint = `${entry.method} ${entry.url}`;
      endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      id: SecurityUtil.generateUUID(),
      type: 'business_metrics',
      timestamp: new Date(),
      timeWindow: { start, end },
      metrics: {
        totalAPIRequests: apiEntries.length,
        uniqueEndpoints: endpointCounts.size,
      },
      insights: [
        `${apiEntries.length} API requests across ${endpointCounts.size} endpoints`,
        ...topEndpoints.map(([endpoint, count]) => `${endpoint}: ${count} requests`),
      ],
      alerts: [],
      recommendations: [],
    };
  }

  /**
   * 保存分析结果
   */
  private async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    try {
      const fileName = `analysis-${result.type}-${result.timestamp.toISOString()}.json`;
      const filePath = path.join(this.config.storage.file.basePath, 'analysis', fileName);
      
      await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
    } catch (error) {
      log.error('Failed to save analysis result', { error, resultId: result.id });
    }
  }

  /**
   * 获取分析统计
   */
  public getAnalysisStats(): {
    queueSize: number;
    analysisQueueSize: number;
    isProcessing: boolean;
    lastFlush: Date;
  } {
    return {
      queueSize: this.logQueue.length,
      analysisQueueSize: this.analysisQueue.length,
      isProcessing: this.isProcessing,
      lastFlush: new Date(this.lastFlush),
    };
  }

  /**
   * 清理过期日志
   */
  public async cleanupExpiredLogs(): Promise<void> {
    try {
      const retentionDays = this.config.retention.rawLogs.days;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const rawLogsDir = path.join(this.config.storage.file.basePath, 'raw');
      const files = await fs.readdir(rawLogsDir);

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(rawLogsDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        log.info(`Cleaned up ${deletedCount} expired log files`);
      }
    } catch (error) {
      log.error('Failed to cleanup expired logs', { error });
    }
  }

  /**
   * 获取日志统计信息
   */
  public async getLogStatistics(timeWindow: { start: Date; end: Date }): Promise<{
    totalEntries: number;
    entriesByLevel: Record<string, number>;
    entriesByModule: Record<string, number>;
    topErrors: Array<{ error: string; count: number }>;
    topIPs: Array<{ ip: string; count: number }>;
  }> {
    // 这里应该实现从存储中读取和统计日志的逻辑
    // 暂时返回模拟数据
    return {
      totalEntries: 0,
      entriesByLevel: {},
      entriesByModule: {},
      topErrors: [],
      topIPs: [],
    };
  }
}

// 导出单例实例
export const logAnalyzer = LogAnalyzer.getInstance();
