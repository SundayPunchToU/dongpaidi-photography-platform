import { EventEmitter } from 'events';
import { getLogAnalysisConfig } from '@/config/logAnalysis';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 告警级别
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 告警类型
 */
export enum AlertType {
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  REQUEST_VOLUME = 'request_volume',
  SECURITY_INCIDENT = 'security_incident',
  SYSTEM_ERROR = 'system_error',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  ANOMALY_DETECTED = 'anomaly_detected',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
}

/**
 * 告警规则
 */
export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: string;
  threshold: number;
  timeWindow: number; // 毫秒
  cooldown: number; // 毫秒
  enabled: boolean;
  description: string;
  actions: AlertAction[];
}

/**
 * 告警动作
 */
export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * 告警事件
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * 告警统计
 */
export interface AlertMetrics {
  value: number;
  timestamp: Date;
  windowStart: Date;
  windowEnd: Date;
}

/**
 * 日志告警系统
 */
export class LogAlerting extends EventEmitter {
  private static instance: LogAlerting;
  private config = getLogAnalysisConfig();
  private rules = new Map<string, AlertRule>();
  private activeAlerts = new Map<string, AlertEvent>();
  private cooldownTimers = new Map<string, NodeJS.Timeout>();
  private metricsBuffer = new Map<string, AlertMetrics[]>();

  private constructor() {
    super();
    this.initializeDefaultRules();
    this.startMetricsCollection();
  }

  public static getInstance(): LogAlerting {
    if (!LogAlerting.instance) {
      LogAlerting.instance = new LogAlerting();
    }
    return LogAlerting.instance;
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High Error Rate',
        type: AlertType.ERROR_RATE,
        severity: AlertSeverity.HIGH,
        condition: 'error_rate > threshold',
        threshold: 0.05, // 5%
        timeWindow: 5 * 60 * 1000, // 5分钟
        cooldown: 15 * 60 * 1000, // 15分钟
        enabled: true,
        description: '错误率超过5%时触发告警',
        actions: [
          {
            type: 'email',
            config: { template: 'high_error_rate' },
            enabled: this.config.alerting.channels.email.enabled,
          },
          {
            type: 'webhook',
            config: { url: this.config.alerting.channels.webhook.url },
            enabled: this.config.alerting.channels.webhook.enabled,
          },
        ],
      },
      {
        name: 'Slow Response Time',
        type: AlertType.RESPONSE_TIME,
        severity: AlertSeverity.MEDIUM,
        condition: 'avg_response_time > threshold',
        threshold: 5000, // 5秒
        timeWindow: 10 * 60 * 1000, // 10分钟
        cooldown: 30 * 60 * 1000, // 30分钟
        enabled: true,
        description: '平均响应时间超过5秒时触发告警',
        actions: [
          {
            type: 'email',
            config: { template: 'slow_response' },
            enabled: this.config.alerting.channels.email.enabled,
          },
        ],
      },
      {
        name: 'Security Incident',
        type: AlertType.SECURITY_INCIDENT,
        severity: AlertSeverity.CRITICAL,
        condition: 'security_events > threshold',
        threshold: 10,
        timeWindow: 5 * 60 * 1000, // 5分钟
        cooldown: 5 * 60 * 1000, // 5分钟
        enabled: true,
        description: '5分钟内安全事件超过10次时触发告警',
        actions: [
          {
            type: 'email',
            config: { template: 'security_incident', priority: 'high' },
            enabled: this.config.alerting.channels.email.enabled,
          },
          {
            type: 'webhook',
            config: { url: this.config.alerting.channels.webhook.url },
            enabled: this.config.alerting.channels.webhook.enabled,
          },
          {
            type: 'slack',
            config: { channel: '#security-alerts' },
            enabled: this.config.alerting.channels.slack.enabled,
          },
        ],
      },
      {
        name: 'High Request Volume',
        type: AlertType.REQUEST_VOLUME,
        severity: AlertSeverity.MEDIUM,
        condition: 'request_count > threshold',
        threshold: 1000,
        timeWindow: 1 * 60 * 1000, // 1分钟
        cooldown: 10 * 60 * 1000, // 10分钟
        enabled: true,
        description: '1分钟内请求数超过1000时触发告警',
        actions: [
          {
            type: 'webhook',
            config: { url: this.config.alerting.channels.webhook.url },
            enabled: this.config.alerting.channels.webhook.enabled,
          },
        ],
      },
    ];

    for (const ruleData of defaultRules) {
      const rule: AlertRule = {
        id: SecurityUtil.generateUUID(),
        ...ruleData,
      };
      this.rules.set(rule.id, rule);
    }

    log.info(`Initialized ${this.rules.size} default alert rules`);
  }

  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    // 每分钟收集一次指标
    setInterval(() => {
      this.collectMetrics();
    }, 60 * 1000);

    // 每30秒检查一次告警条件
    setInterval(() => {
      this.checkAlertConditions();
    }, 30 * 1000);
  }

  /**
   * 收集指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // 这里应该从日志分析器获取实际指标
      // 暂时使用模拟数据
      const metrics = {
        error_rate: Math.random() * 0.1, // 0-10%
        avg_response_time: 1000 + Math.random() * 4000, // 1-5秒
        request_count: Math.floor(Math.random() * 1500), // 0-1500
        security_events: Math.floor(Math.random() * 20), // 0-20
      };

      // 存储指标
      for (const [key, value] of Object.entries(metrics)) {
        if (!this.metricsBuffer.has(key)) {
          this.metricsBuffer.set(key, []);
        }

        const buffer = this.metricsBuffer.get(key)!;
        buffer.push({
          value,
          timestamp: now,
          windowStart: oneMinuteAgo,
          windowEnd: now,
        });

        // 保持缓冲区大小
        if (buffer.length > 60) { // 保留1小时的数据
          buffer.shift();
        }
      }
    } catch (error) {
      log.error('Failed to collect metrics for alerting', { error });
    }
  }

  /**
   * 检查告警条件
   */
  private checkAlertConditions(): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      // 检查冷却期
      if (this.cooldownTimers.has(rule.id)) {
        continue;
      }

      try {
        const shouldAlert = this.evaluateRule(rule);
        if (shouldAlert) {
          this.triggerAlert(rule);
        }
      } catch (error) {
        log.error(`Failed to evaluate alert rule: ${rule.name}`, { error, ruleId: rule.id });
      }
    }
  }

  /**
   * 评估告警规则
   */
  private evaluateRule(rule: AlertRule): boolean {
    const metricKey = this.getMetricKeyForRule(rule);
    const metrics = this.metricsBuffer.get(metricKey);

    if (!metrics || metrics.length === 0) {
      return false;
    }

    const now = Date.now();
    const windowStart = now - rule.timeWindow;

    // 获取时间窗口内的指标
    const windowMetrics = metrics.filter(m => m.timestamp.getTime() >= windowStart);

    if (windowMetrics.length === 0) {
      return false;
    }

    // 根据规则类型计算值
    let value: number;
    switch (rule.type) {
      case AlertType.ERROR_RATE:
      case AlertType.RESPONSE_TIME:
        value = windowMetrics.reduce((sum, m) => sum + m.value, 0) / windowMetrics.length;
        break;
      case AlertType.REQUEST_VOLUME:
      case AlertType.SECURITY_INCIDENT:
        value = windowMetrics.reduce((sum, m) => sum + m.value, 0);
        break;
      default:
        const lastMetric = windowMetrics[windowMetrics.length - 1];
        value = lastMetric ? lastMetric.value : 0;
    }

    // 评估条件
    return this.evaluateCondition(rule.condition, value, rule.threshold);
  }

  /**
   * 获取规则对应的指标键
   */
  private getMetricKeyForRule(rule: AlertRule): string {
    switch (rule.type) {
      case AlertType.ERROR_RATE:
        return 'error_rate';
      case AlertType.RESPONSE_TIME:
        return 'avg_response_time';
      case AlertType.REQUEST_VOLUME:
        return 'request_count';
      case AlertType.SECURITY_INCIDENT:
        return 'security_events';
      default:
        return 'unknown';
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    // 简单的条件评估
    if (condition.includes('> threshold')) {
      return value > threshold;
    } else if (condition.includes('< threshold')) {
      return value < threshold;
    } else if (condition.includes('>= threshold')) {
      return value >= threshold;
    } else if (condition.includes('<= threshold')) {
      return value <= threshold;
    } else if (condition.includes('== threshold')) {
      return value === threshold;
    }

    return false;
  }

  /**
   * 触发告警
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    try {
      const alertEvent: AlertEvent = {
        id: SecurityUtil.generateUUID(),
        ruleId: rule.id,
        type: rule.type,
        severity: rule.severity,
        message: `${rule.name}: ${rule.description}`,
        timestamp: new Date(),
        data: {
          rule: rule.name,
          condition: rule.condition,
          threshold: rule.threshold,
          currentValue: this.getCurrentValue(rule),
        },
        resolved: false,
      };

      // 存储活跃告警
      this.activeAlerts.set(alertEvent.id, alertEvent);

      // 执行告警动作
      await this.executeAlertActions(rule, alertEvent);

      // 设置冷却期
      this.setCooldown(rule);

      // 发出事件
      this.emit('alert_triggered', alertEvent);

      log.warn('Alert triggered', {
        alertId: alertEvent.id,
        rule: rule.name,
        severity: rule.severity,
        message: alertEvent.message,
      });

    } catch (error) {
      log.error('Failed to trigger alert', { error, ruleId: rule.id });
    }
  }

  /**
   * 获取当前值
   */
  private getCurrentValue(rule: AlertRule): number {
    const metricKey = this.getMetricKeyForRule(rule);
    const metrics = this.metricsBuffer.get(metricKey);
    
    if (!metrics || metrics.length === 0) {
      return 0;
    }

    const lastMetric = metrics[metrics.length - 1];
    return lastMetric ? lastMetric.value : 0;
  }

  /**
   * 执行告警动作
   */
  private async executeAlertActions(rule: AlertRule, alertEvent: AlertEvent): Promise<void> {
    for (const action of rule.actions) {
      if (!action.enabled) {
        continue;
      }

      try {
        switch (action.type) {
          case 'email':
            await this.sendEmailAlert(alertEvent, action.config);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alertEvent, action.config);
            break;
          case 'slack':
            await this.sendSlackAlert(alertEvent, action.config);
            break;
          case 'sms':
            await this.sendSMSAlert(alertEvent, action.config);
            break;
          default:
            log.warn(`Unknown alert action type: ${action.type}`);
        }
      } catch (error) {
        log.error(`Failed to execute alert action: ${action.type}`, { 
          error, 
          alertId: alertEvent.id 
        });
      }
    }
  }

  /**
   * 发送邮件告警
   */
  private async sendEmailAlert(alertEvent: AlertEvent, config: any): Promise<void> {
    // 这里应该实现邮件发送逻辑
    log.info('Email alert would be sent', { 
      alertId: alertEvent.id, 
      config,
      recipients: this.config.alerting.channels.email.recipients,
    });
  }

  /**
   * 发送Webhook告警
   */
  private async sendWebhookAlert(alertEvent: AlertEvent, config: any): Promise<void> {
    // 这里应该实现Webhook发送逻辑
    log.info('Webhook alert would be sent', { 
      alertId: alertEvent.id, 
      url: config.url || this.config.alerting.channels.webhook.url,
    });
  }

  /**
   * 发送Slack告警
   */
  private async sendSlackAlert(alertEvent: AlertEvent, config: any): Promise<void> {
    // 这里应该实现Slack发送逻辑
    log.info('Slack alert would be sent', { 
      alertId: alertEvent.id, 
      channel: config.channel,
      webhookUrl: this.config.alerting.channels.slack.webhookUrl,
    });
  }

  /**
   * 发送短信告警
   */
  private async sendSMSAlert(alertEvent: AlertEvent, config: any): Promise<void> {
    // 这里应该实现短信发送逻辑
    log.info('SMS alert would be sent', { alertId: alertEvent.id, config });
  }

  /**
   * 设置冷却期
   */
  private setCooldown(rule: AlertRule): void {
    const timer = setTimeout(() => {
      this.cooldownTimers.delete(rule.id);
      log.debug(`Cooldown expired for rule: ${rule.name}`);
    }, rule.cooldown);

    this.cooldownTimers.set(rule.id, timer);
  }

  /**
   * 添加告警规则
   */
  public addRule(rule: Omit<AlertRule, 'id'>): string {
    const ruleWithId: AlertRule = {
      id: SecurityUtil.generateUUID(),
      ...rule,
    };

    this.rules.set(ruleWithId.id, ruleWithId);
    log.info(`Added alert rule: ${rule.name}`, { ruleId: ruleWithId.id });
    
    return ruleWithId.id;
  }

  /**
   * 更新告警规则
   */
  public updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    const updatedRule = { ...rule, ...updates, id: ruleId };
    this.rules.set(ruleId, updatedRule);
    
    log.info(`Updated alert rule: ${updatedRule.name}`, { ruleId });
    return true;
  }

  /**
   * 删除告警规则
   */
  public deleteRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    this.rules.delete(ruleId);
    
    // 清除相关的冷却期定时器
    const timer = this.cooldownTimers.get(ruleId);
    if (timer) {
      clearTimeout(timer);
      this.cooldownTimers.delete(ruleId);
    }

    log.info(`Deleted alert rule: ${rule.name}`, { ruleId });
    return true;
  }

  /**
   * 获取所有告警规则
   */
  public getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 获取活跃告警
   */
  public getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 确认告警
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    log.info(`Alert acknowledged`, { alertId, acknowledgedBy });
    this.emit('alert_acknowledged', alert);
    
    return true;
  }

  /**
   * 解决告警
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    log.info(`Alert resolved`, { alertId });
    this.emit('alert_resolved', alert);
    
    return true;
  }

  /**
   * 获取告警统计
   */
  public getAlertStats(): {
    totalRules: number;
    enabledRules: number;
    activeAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const activeAlerts = this.getActiveAlerts();
    
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    for (const alert of activeAlerts) {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      activeAlerts: activeAlerts.length,
      alertsByType,
      alertsBySeverity,
    };
  }
}

// 导出单例实例
export const logAlerting = LogAlerting.getInstance();
