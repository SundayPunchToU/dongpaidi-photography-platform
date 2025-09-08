import { logAnalyzer } from './logAnalyzer';
import { logCollector } from './logCollector';
import { logReporter, ReportType } from './logReporter';
import { logAlerting } from './logAlerting';
import { getLogAnalysisConfig } from '@/config/logAnalysis';
import { log } from '@/config/logger';

/**
 * 日志分析系统初始化器
 */
export class LogAnalysisInitializer {
  private static instance: LogAnalysisInitializer;
  private config = getLogAnalysisConfig();
  private initialized = false;

  private constructor() {}

  public static getInstance(): LogAnalysisInitializer {
    if (!LogAnalysisInitializer.instance) {
      LogAnalysisInitializer.instance = new LogAnalysisInitializer();
    }
    return LogAnalysisInitializer.instance;
  }

  /**
   * 初始化日志分析系统
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      log.warn('Log analysis system already initialized');
      return;
    }

    try {
      log.info('Initializing log analysis system...');

      // 初始化各个组件
      await this.initializeComponents();

      // 设置事件监听器
      this.setupEventListeners();

      // 启动定时任务
      this.startScheduledTasks();

      this.initialized = true;
      log.info('Log analysis system initialized successfully');

    } catch (error) {
      log.error('Failed to initialize log analysis system', { error });
      throw error;
    }
  }

  /**
   * 初始化组件
   */
  private async initializeComponents(): Promise<void> {
    // 日志分析器已经通过单例模式自动初始化
    log.debug('Log analyzer initialized');

    // 日志收集器已经通过单例模式自动初始化
    log.debug('Log collector initialized');

    // 日志报告器已经通过单例模式自动初始化
    log.debug('Log reporter initialized');

    // 日志告警系统已经通过单例模式自动初始化
    log.debug('Log alerting initialized');
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听告警事件
    logAlerting.on('alert_triggered', (alert) => {
      log.warn('Alert triggered', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
      });

      // 可以在这里添加额外的处理逻辑
      this.handleAlertTriggered(alert);
    });

    logAlerting.on('alert_acknowledged', (alert) => {
      log.info('Alert acknowledged', {
        alertId: alert.id,
        acknowledgedBy: alert.acknowledgedBy,
      });
    });

    logAlerting.on('alert_resolved', (alert) => {
      log.info('Alert resolved', {
        alertId: alert.id,
        resolvedAt: alert.resolvedAt,
      });
    });

    // 监听分析器事件
    logAnalyzer.on('batch_processed', (data) => {
      log.debug('Log batch processed', { count: data.count });
    });

    logAnalyzer.on('analysis_completed', (result) => {
      log.debug('Analysis completed', {
        type: result.type,
        insights: result.insights.length,
        alerts: result.alerts.length,
      });
    });

    log.debug('Event listeners set up');
  }

  /**
   * 处理告警触发
   */
  private async handleAlertTriggered(alert: any): Promise<void> {
    try {
      // 这里可以添加自定义的告警处理逻辑
      // 例如：记录到数据库、发送通知等

      // 记录告警到应用日志
      await logCollector.collectEntry({
        level: 'WARN',
        message: `Alert triggered: ${alert.message}`,
        metadata: {
          alertId: alert.id,
          alertType: alert.type,
          severity: alert.severity,
          data: alert.data,
        },
        tags: ['alert', 'system'],
      });

    } catch (error) {
      log.error('Failed to handle alert trigger', { error, alertId: alert.id });
    }
  }

  /**
   * 启动定时任务
   */
  private startScheduledTasks(): void {
    // 每日报告生成
    if (this.config.reporting.enabled) {
      this.scheduleReports();
    }

    // 日志清理任务
    this.scheduleLogCleanup();

    // 健康检查任务
    this.scheduleHealthCheck();

    log.debug('Scheduled tasks started');
  }

  /**
   * 调度报告生成
   */
  private scheduleReports(): void {
    // 每日报告 - 每天早上8点
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        try {
          await logReporter.generateScheduledReport(ReportType.DAILY);
          log.info('Daily report generated');
        } catch (error) {
          log.error('Failed to generate daily report', { error });
        }
      }
    }, 60 * 1000); // 每分钟检查一次

    // 周报告 - 每周一早上8点
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 8 && now.getMinutes() === 0) {
        try {
          await logReporter.generateScheduledReport(ReportType.WEEKLY);
          log.info('Weekly report generated');
        } catch (error) {
          log.error('Failed to generate weekly report', { error });
        }
      }
    }, 60 * 1000);

    // 月报告 - 每月1号早上8点
    setInterval(async () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 8 && now.getMinutes() === 0) {
        try {
          await logReporter.generateScheduledReport(ReportType.MONTHLY);
          log.info('Monthly report generated');
        } catch (error) {
          log.error('Failed to generate monthly report', { error });
        }
      }
    }, 60 * 1000);
  }

  /**
   * 调度日志清理
   */
  private scheduleLogCleanup(): void {
    // 每天凌晨2点执行日志清理
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        try {
          await logAnalyzer.cleanupExpiredLogs();
          log.info('Log cleanup completed');
        } catch (error) {
          log.error('Failed to cleanup logs', { error });
        }
      }
    }, 60 * 1000);
  }

  /**
   * 调度健康检查
   */
  private scheduleHealthCheck(): void {
    // 每5分钟执行一次健康检查
    setInterval(async () => {
      try {
        const stats = logAnalyzer.getAnalysisStats();
        const collectorStatus = logCollector.getCollectorStatus();
        const alertStats = logAlerting.getAlertStats();

        // 检查队列大小
        if (stats.queueSize > 10000) {
          log.warn('Log queue size is high', { queueSize: stats.queueSize });
        }

        // 检查收集器状态
        const enabledCollectors = collectorStatus.filter(c => c.enabled);
        const runningCollectors = collectorStatus.filter(c => c.enabled && c.isRunning);
        
        if (runningCollectors.length < enabledCollectors.length) {
          log.warn('Some log collectors are not running', {
            enabled: enabledCollectors.length,
            running: runningCollectors.length,
          });
        }

        // 检查活跃告警
        if (alertStats.activeAlerts > 0) {
          log.info('Active alerts detected', { count: alertStats.activeAlerts });
        }

      } catch (error) {
        log.error('Health check failed', { error });
      }
    }, 5 * 60 * 1000);
  }

  /**
   * 获取系统状态
   */
  public getSystemStatus(): {
    initialized: boolean;
    components: {
      analyzer: any;
      collector: any;
      reporter: any;
      alerting: any;
    };
  } {
    return {
      initialized: this.initialized,
      components: {
        analyzer: logAnalyzer.getAnalysisStats(),
        collector: logCollector.getCollectorStatus(),
        reporter: { available: true }, // 报告器没有状态方法
        alerting: logAlerting.getAlertStats(),
      },
    };
  }

  /**
   * 关闭日志分析系统
   */
  public async shutdown(): Promise<void> {
    try {
      log.info('Shutting down log analysis system...');

      // 停止所有收集器
      logCollector.stopAllCollectors();

      // 清理定时器和事件监听器
      logAlerting.removeAllListeners();
      logAnalyzer.removeAllListeners();

      this.initialized = false;
      log.info('Log analysis system shut down successfully');

    } catch (error) {
      log.error('Failed to shutdown log analysis system', { error });
      throw error;
    }
  }

  /**
   * 重启日志分析系统
   */
  public async restart(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }
}

// 导出单例实例
export const logAnalysisInit = LogAnalysisInitializer.getInstance();

/**
 * 便捷的初始化函数
 */
export const initializeLogAnalysis = async (): Promise<void> => {
  await logAnalysisInit.initialize();
};

/**
 * 便捷的关闭函数
 */
export const shutdownLogAnalysis = async (): Promise<void> => {
  await logAnalysisInit.shutdown();
};
