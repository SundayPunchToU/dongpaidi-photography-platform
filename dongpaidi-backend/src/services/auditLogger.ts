import { Request } from 'express';
import { log } from '@/config/logger';
import { securityConfig } from '@/config/security';
import { db } from '@/config/database';

/**
 * 审计事件类型
 */
export enum AuditEventType {
  // 认证相关
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  
  // 数据操作
  DATA_CREATE = 'data_create',
  DATA_READ = 'data_read',
  DATA_UPDATE = 'data_update',
  DATA_DELETE = 'data_delete',
  DATA_EXPORT = 'data_export',
  
  // 系统操作
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  ADMIN_ACTION = 'admin_action',
  PERMISSION_CHANGE = 'permission_change',
  
  // 安全事件
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALICIOUS_INPUT = 'malicious_input',
  
  // 文件操作
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  FILE_DELETE = 'file_delete',
  
  // API访问
  API_ACCESS = 'api_access',
  API_ERROR = 'api_error',
}

/**
 * 审计事件严重级别
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 审计事件接口
 */
export interface AuditEvent {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  resource?: string;
  action?: string;
  details?: any;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * 审计日志服务
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private auditQueue: AuditEvent[] = [];
  private isProcessing = false;

  private constructor() {
    // 启动定期处理队列
    setInterval(() => {
      this.processQueue();
    }, 5000); // 每5秒处理一次队列
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * 记录审计事件
   */
  public async logEvent(event: Partial<AuditEvent> & {
    eventType: AuditEventType;
    severity: AuditSeverity;
    ip: string;
    userAgent: string;
    success: boolean;
  }): Promise<void> {
    const auditEvent: AuditEvent = {
      timestamp: new Date(),
      ...event,
    };

    // 脱敏敏感信息
    if (auditEvent.details) {
      auditEvent.details = this.sanitizeDetails(auditEvent.details);
    }

    // 添加到队列
    this.auditQueue.push(auditEvent);

    // 立即记录高危事件
    if (event.severity === AuditSeverity.CRITICAL || event.severity === AuditSeverity.HIGH) {
      await this.writeToLog(auditEvent);
      await this.writeToDatabase(auditEvent);
    }
  }

  /**
   * 从Express请求记录审计事件
   */
  public async logFromRequest(
    req: Request,
    eventType: AuditEventType,
    severity: AuditSeverity,
    options: {
      success: boolean;
      resource?: string;
      action?: string;
      details?: any;
      errorMessage?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const user = (req as any).user;
    
    await this.logEvent({
      eventType,
      severity,
      userId: user?.id,
      sessionId: user?.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      resource: options.resource || req.path,
      action: options.action || req.method,
      details: options.details,
      success: options.success,
      errorMessage: options.errorMessage,
      metadata: {
        ...options.metadata,
        url: req.url,
        method: req.method,
        query: req.query,
        params: req.params,
      },
    });
  }

  /**
   * 记录认证事件
   */
  public async logAuthEvent(
    eventType: AuditEventType,
    req: Request,
    userId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const severity = success ? AuditSeverity.LOW : AuditSeverity.MEDIUM;
    
    await this.logEvent({
      eventType,
      severity,
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      success,
      errorMessage,
      metadata: {
        url: req.url,
        method: req.method,
      },
    });
  }

  /**
   * 记录数据操作事件
   */
  public async logDataEvent(
    eventType: AuditEventType,
    req: Request,
    resource: string,
    recordId?: string,
    oldData?: any,
    newData?: any
  ): Promise<void> {
    const user = (req as any).user;
    
    await this.logEvent({
      eventType,
      severity: AuditSeverity.LOW,
      userId: user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      resource,
      action: req.method,
      success: true,
      details: {
        recordId,
        oldData: oldData ? this.sanitizeDetails(oldData) : undefined,
        newData: newData ? this.sanitizeDetails(newData) : undefined,
      },
    });
  }

  /**
   * 记录安全事件
   */
  public async logSecurityEvent(
    eventType: AuditEventType,
    req: Request,
    severity: AuditSeverity,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const user = (req as any).user;
    
    await this.logEvent({
      eventType,
      severity,
      userId: user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      success: false,
      errorMessage: description,
      metadata: {
        ...metadata,
        url: req.url,
        method: req.method,
      },
    });
  }

  /**
   * 处理审计队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.auditQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const events = this.auditQueue.splice(0, 100); // 每次处理最多100个事件
      
      await Promise.all([
        this.batchWriteToLog(events),
        this.batchWriteToDatabase(events),
      ]);
    } catch (error) {
      log.error('Failed to process audit queue', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 写入日志文件
   */
  private async writeToLog(event: AuditEvent): Promise<void> {
    if (!securityConfig.audit.enabled) {
      return;
    }

    const logData = {
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      success: event.success,
      errorMessage: event.errorMessage,
      details: event.details,
      metadata: event.metadata,
    };

    switch (event.severity) {
      case AuditSeverity.CRITICAL:
        log.error('AUDIT - CRITICAL', logData);
        break;
      case AuditSeverity.HIGH:
        log.error('AUDIT - HIGH', logData);
        break;
      case AuditSeverity.MEDIUM:
        log.warn('AUDIT - MEDIUM', logData);
        break;
      case AuditSeverity.LOW:
        log.info('AUDIT - LOW', logData);
        break;
    }
  }

  /**
   * 批量写入日志文件
   */
  private async batchWriteToLog(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.writeToLog(event);
    }
  }

  /**
   * 写入数据库
   */
  private async writeToDatabase(event: AuditEvent): Promise<void> {
    try {
      // 这里应该写入专门的审计日志表
      // 由于当前schema中没有audit_logs表，暂时跳过数据库写入
      // await db.prisma.auditLog.create({
      //   data: {
      //     eventType: event.eventType,
      //     severity: event.severity,
      //     userId: event.userId,
      //     sessionId: event.sessionId,
      //     ip: event.ip,
      //     userAgent: event.userAgent,
      //     resource: event.resource,
      //     action: event.action,
      //     success: event.success,
      //     errorMessage: event.errorMessage,
      //     details: event.details ? JSON.stringify(event.details) : null,
      //     metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      //     timestamp: event.timestamp,
      //   },
      // });
    } catch (error) {
      log.error('Failed to write audit event to database', { error, event });
    }
  }

  /**
   * 批量写入数据库
   */
  private async batchWriteToDatabase(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.writeToDatabase(event);
    }
  }

  /**
   * 脱敏敏感信息
   */
  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = Array.isArray(details) ? [...details] : { ...details };
    
    const sensitiveFields = securityConfig.audit.sensitiveFields;
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * 查询审计日志
   */
  public async queryAuditLogs(filters: {
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    userId?: string;
    ip?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AuditEvent[]> {
    // 这里应该从数据库查询审计日志
    // 由于当前schema中没有audit_logs表，返回空数组
    return [];
  }

  /**
   * 生成审计报告
   */
  public async generateAuditReport(
    startDate: Date,
    endDate: Date,
    options?: {
      eventTypes?: AuditEventType[];
      severities?: AuditSeverity[];
      userId?: string;
    }
  ): Promise<{
    summary: {
      totalEvents: number;
      successfulEvents: number;
      failedEvents: number;
      eventsByType: Record<string, number>;
      eventsBySeverity: Record<string, number>;
    };
    events: AuditEvent[];
  }> {
    const events = await this.queryAuditLogs({
      startDate,
      endDate,
      eventType: options?.eventTypes?.[0],
      severity: options?.severities?.[0],
      userId: options?.userId,
    });

    const summary = {
      totalEvents: events.length,
      successfulEvents: events.filter(e => e.success).length,
      failedEvents: events.filter(e => !e.success).length,
      eventsByType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      eventsBySeverity: events.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { summary, events };
  }
}

// 导出单例实例
export const auditLogger = AuditLogger.getInstance();
