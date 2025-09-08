import { Request } from 'express';
import { log } from '@/config/logger';
import { securityConfig } from '@/config/security';
import { SecurityUtil } from '@/utils/security';
import { auditLogger, AuditEventType, AuditSeverity } from './auditLogger';

/**
 * 威胁类型
 */
export enum ThreatType {
  BRUTE_FORCE = 'brute_force',
  SQL_INJECTION = 'sql_injection',
  XSS_ATTACK = 'xss_attack',
  CSRF_ATTACK = 'csrf_attack',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  RATE_LIMIT_ABUSE = 'rate_limit_abuse',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

/**
 * 威胁检测结果
 */
export interface ThreatDetectionResult {
  isThreat: boolean;
  threatType: ThreatType;
  severity: AuditSeverity;
  confidence: number; // 0-1之间的置信度
  description: string;
  metadata?: Record<string, any>;
}

/**
 * 用户行为模式
 */
interface UserBehaviorPattern {
  userId: string;
  requestCount: number;
  lastRequestTime: Date;
  requestIntervals: number[];
  ipAddresses: Set<string>;
  userAgents: Set<string>;
  endpoints: Map<string, number>;
  errorCount: number;
  suspiciousActivities: number;
}

/**
 * IP行为模式
 */
interface IPBehaviorPattern {
  ip: string;
  requestCount: number;
  userCount: number;
  lastRequestTime: Date;
  endpoints: Map<string, number>;
  errorCount: number;
  userAgents: Set<string>;
  countries: Set<string>;
}

/**
 * 安全监控服务
 */
export class SecurityMonitoring {
  private static instance: SecurityMonitoring;
  private userPatterns = new Map<string, UserBehaviorPattern>();
  private ipPatterns = new Map<string, IPBehaviorPattern>();
  private suspiciousIPs = new Set<string>();
  private blockedIPs = new Set<string>();

  private constructor() {
    // 定期清理过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000); // 每小时清理一次
  }

  public static getInstance(): SecurityMonitoring {
    if (!SecurityMonitoring.instance) {
      SecurityMonitoring.instance = new SecurityMonitoring();
    }
    return SecurityMonitoring.instance;
  }

  /**
   * 分析请求威胁
   */
  public async analyzeRequest(req: Request): Promise<ThreatDetectionResult[]> {
    const threats: ThreatDetectionResult[] = [];
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';
    const user = (req as any).user;

    // 检查IP是否被阻止
    if (this.blockedIPs.has(ip)) {
      threats.push({
        isThreat: true,
        threatType: ThreatType.UNAUTHORIZED_ACCESS,
        severity: AuditSeverity.HIGH,
        confidence: 1.0,
        description: 'Request from blocked IP address',
        metadata: { ip },
      });
    }

    // 更新行为模式
    this.updateUserPattern(user?.id, req);
    this.updateIPPattern(ip, req);

    // 执行各种威胁检测
    const detectionResults = await Promise.all([
      this.detectBruteForce(ip, req),
      this.detectSQLInjection(req),
      this.detectXSS(req),
      this.detectPathTraversal(req),
      this.detectCommandInjection(req),
      this.detectSuspiciousUserAgent(userAgent, ip),
      this.detectAnomalousBehavior(user?.id, ip, req),
      this.detectRateLimitAbuse(ip, user?.id),
    ]);

    threats.push(...detectionResults.filter(result => result.isThreat));

    // 记录威胁事件
    for (const threat of threats) {
      await this.recordThreatEvent(req, threat);
    }

    return threats;
  }

  /**
   * 检测暴力破解攻击
   */
  private async detectBruteForce(ip: string, req: Request): Promise<ThreatDetectionResult> {
    const pattern = this.ipPatterns.get(ip);
    if (!pattern) {
      return { isThreat: false, threatType: ThreatType.BRUTE_FORCE, severity: AuditSeverity.LOW, confidence: 0, description: '' };
    }

    const isAuthEndpoint = req.path.includes('/auth/') || req.path.includes('/login');
    const highErrorRate = pattern.errorCount / pattern.requestCount > 0.5;
    const rapidRequests = pattern.requestCount > 50; // 短时间内大量请求

    if (isAuthEndpoint && (highErrorRate || rapidRequests)) {
      const confidence = Math.min(1.0, (pattern.errorCount / 10) + (pattern.requestCount / 100));
      
      return {
        isThreat: true,
        threatType: ThreatType.BRUTE_FORCE,
        severity: confidence > 0.8 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
        confidence,
        description: 'Potential brute force attack detected',
        metadata: {
          ip,
          requestCount: pattern.requestCount,
          errorCount: pattern.errorCount,
          errorRate: pattern.errorCount / pattern.requestCount,
        },
      };
    }

    return { isThreat: false, threatType: ThreatType.BRUTE_FORCE, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测SQL注入攻击
   */
  private async detectSQLInjection(req: Request): Promise<ThreatDetectionResult> {
    const inputs = [
      JSON.stringify(req.body),
      JSON.stringify(req.query),
      JSON.stringify(req.params),
      req.url,
    ].join(' ');

    for (const pattern of securityConfig.validation.sqlInjectionPatterns) {
      if (pattern.test(inputs)) {
        return {
          isThreat: true,
          threatType: ThreatType.SQL_INJECTION,
          severity: AuditSeverity.HIGH,
          confidence: 0.9,
          description: 'SQL injection attempt detected',
          metadata: {
            pattern: pattern.source,
            input: inputs.substring(0, 200),
          },
        };
      }
    }

    return { isThreat: false, threatType: ThreatType.SQL_INJECTION, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测XSS攻击
   */
  private async detectXSS(req: Request): Promise<ThreatDetectionResult> {
    const inputs = [
      JSON.stringify(req.body),
      JSON.stringify(req.query),
      JSON.stringify(req.params),
    ].join(' ');

    for (const pattern of securityConfig.validation.xssPatterns) {
      if (pattern.test(inputs)) {
        return {
          isThreat: true,
          threatType: ThreatType.XSS_ATTACK,
          severity: AuditSeverity.HIGH,
          confidence: 0.8,
          description: 'XSS attack attempt detected',
          metadata: {
            pattern: pattern.source,
            input: inputs.substring(0, 200),
          },
        };
      }
    }

    return { isThreat: false, threatType: ThreatType.XSS_ATTACK, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测路径遍历攻击
   */
  private async detectPathTraversal(req: Request): Promise<ThreatDetectionResult> {
    const pathTraversalPattern = /\.\.[\/\\]/;
    const inputs = [req.url, JSON.stringify(req.query), JSON.stringify(req.params)].join(' ');

    if (pathTraversalPattern.test(inputs)) {
      return {
        isThreat: true,
        threatType: ThreatType.PATH_TRAVERSAL,
        severity: AuditSeverity.HIGH,
        confidence: 0.9,
        description: 'Path traversal attack detected',
        metadata: {
          input: inputs.substring(0, 200),
        },
      };
    }

    return { isThreat: false, threatType: ThreatType.PATH_TRAVERSAL, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测命令注入攻击
   */
  private async detectCommandInjection(req: Request): Promise<ThreatDetectionResult> {
    const commandInjectionPattern = /[;&|`$(){}[\]<>]/;
    const inputs = [
      JSON.stringify(req.body),
      JSON.stringify(req.query),
      JSON.stringify(req.params),
    ].join(' ');

    if (commandInjectionPattern.test(inputs)) {
      return {
        isThreat: true,
        threatType: ThreatType.COMMAND_INJECTION,
        severity: AuditSeverity.HIGH,
        confidence: 0.7,
        description: 'Command injection attempt detected',
        metadata: {
          input: inputs.substring(0, 200),
        },
      };
    }

    return { isThreat: false, threatType: ThreatType.COMMAND_INJECTION, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测可疑User-Agent
   */
  private async detectSuspiciousUserAgent(userAgent: string, ip: string): Promise<ThreatDetectionResult> {
    const suspiciousPatterns = securityConfig.threatDetection.anomalyDetection.suspiciousPatterns;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return {
          isThreat: true,
          threatType: ThreatType.SUSPICIOUS_USER_AGENT,
          severity: AuditSeverity.MEDIUM,
          confidence: 0.6,
          description: 'Suspicious User-Agent detected',
          metadata: {
            userAgent,
            ip,
            pattern: pattern.source,
          },
        };
      }
    }

    return { isThreat: false, threatType: ThreatType.SUSPICIOUS_USER_AGENT, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测异常行为
   */
  private async detectAnomalousBehavior(userId: string | undefined, ip: string, req: Request): Promise<ThreatDetectionResult> {
    if (!userId) {
      return { isThreat: false, threatType: ThreatType.ANOMALOUS_BEHAVIOR, severity: AuditSeverity.LOW, confidence: 0, description: '' };
    }

    const userPattern = this.userPatterns.get(userId);
    const ipPattern = this.ipPatterns.get(ip);

    if (!userPattern || !ipPattern) {
      return { isThreat: false, threatType: ThreatType.ANOMALOUS_BEHAVIOR, severity: AuditSeverity.LOW, confidence: 0, description: '' };
    }

    let anomalyScore = 0;
    const anomalies: string[] = [];

    // 检查IP地址变化
    if (userPattern.ipAddresses.size > securityConfig.threatDetection.anomalyDetection.maxLocationChanges) {
      anomalyScore += 0.3;
      anomalies.push('Multiple IP addresses');
    }

    // 检查User-Agent变化
    if (userPattern.userAgents.size > securityConfig.threatDetection.anomalyDetection.maxDeviceChanges) {
      anomalyScore += 0.2;
      anomalies.push('Multiple User-Agents');
    }

    // 检查请求频率异常
    const avgInterval = userPattern.requestIntervals.reduce((a, b) => a + b, 0) / userPattern.requestIntervals.length;
    if (avgInterval < 100) { // 平均间隔小于100ms
      anomalyScore += 0.4;
      anomalies.push('Unusually high request frequency');
    }

    // 检查错误率异常
    const errorRate = userPattern.errorCount / userPattern.requestCount;
    if (errorRate > 0.3) {
      anomalyScore += 0.3;
      anomalies.push('High error rate');
    }

    if (anomalyScore > 0.5) {
      return {
        isThreat: true,
        threatType: ThreatType.ANOMALOUS_BEHAVIOR,
        severity: anomalyScore > 0.8 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
        confidence: Math.min(1.0, anomalyScore),
        description: 'Anomalous user behavior detected',
        metadata: {
          userId,
          ip,
          anomalyScore,
          anomalies,
          userPattern: {
            requestCount: userPattern.requestCount,
            ipCount: userPattern.ipAddresses.size,
            userAgentCount: userPattern.userAgents.size,
            errorRate,
          },
        },
      };
    }

    return { isThreat: false, threatType: ThreatType.ANOMALOUS_BEHAVIOR, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 检测速率限制滥用
   */
  private async detectRateLimitAbuse(ip: string, userId?: string): Promise<ThreatDetectionResult> {
    const ipPattern = this.ipPatterns.get(ip);
    if (!ipPattern) {
      return { isThreat: false, threatType: ThreatType.RATE_LIMIT_ABUSE, severity: AuditSeverity.LOW, confidence: 0, description: '' };
    }

    const timeWindow = 60 * 1000; // 1分钟
    const now = new Date();
    const timeSinceLastRequest = now.getTime() - ipPattern.lastRequestTime.getTime();

    if (timeSinceLastRequest < timeWindow && ipPattern.requestCount > 200) {
      return {
        isThreat: true,
        threatType: ThreatType.RATE_LIMIT_ABUSE,
        severity: AuditSeverity.MEDIUM,
        confidence: 0.8,
        description: 'Rate limit abuse detected',
        metadata: {
          ip,
          userId,
          requestCount: ipPattern.requestCount,
          timeWindow: timeSinceLastRequest,
        },
      };
    }

    return { isThreat: false, threatType: ThreatType.RATE_LIMIT_ABUSE, severity: AuditSeverity.LOW, confidence: 0, description: '' };
  }

  /**
   * 更新用户行为模式
   */
  private updateUserPattern(userId: string | undefined, req: Request): void {
    if (!userId) return;

    const now = new Date();
    const pattern = this.userPatterns.get(userId) || {
      userId,
      requestCount: 0,
      lastRequestTime: now,
      requestIntervals: [],
      ipAddresses: new Set(),
      userAgents: new Set(),
      endpoints: new Map(),
      errorCount: 0,
      suspiciousActivities: 0,
    };

    // 更新请求间隔
    if (pattern.requestCount > 0) {
      const interval = now.getTime() - pattern.lastRequestTime.getTime();
      pattern.requestIntervals.push(interval);
      if (pattern.requestIntervals.length > 100) {
        pattern.requestIntervals.shift(); // 保持最近100个间隔
      }
    }

    pattern.requestCount++;
    pattern.lastRequestTime = now;
    pattern.ipAddresses.add(req.ip);
    pattern.userAgents.add(req.get('User-Agent') || '');
    
    const endpoint = `${req.method} ${req.path}`;
    pattern.endpoints.set(endpoint, (pattern.endpoints.get(endpoint) || 0) + 1);

    this.userPatterns.set(userId, pattern);
  }

  /**
   * 更新IP行为模式
   */
  private updateIPPattern(ip: string, req: Request): void {
    const now = new Date();
    const pattern = this.ipPatterns.get(ip) || {
      ip,
      requestCount: 0,
      userCount: 0,
      lastRequestTime: now,
      endpoints: new Map(),
      errorCount: 0,
      userAgents: new Set(),
      countries: new Set(),
    };

    pattern.requestCount++;
    pattern.lastRequestTime = now;
    pattern.userAgents.add(req.get('User-Agent') || '');
    
    const endpoint = `${req.method} ${req.path}`;
    pattern.endpoints.set(endpoint, (pattern.endpoints.get(endpoint) || 0) + 1);

    this.ipPatterns.set(ip, pattern);
  }

  /**
   * 记录威胁事件
   */
  private async recordThreatEvent(req: Request, threat: ThreatDetectionResult): Promise<void> {
    await auditLogger.logFromRequest(req, AuditEventType.SECURITY_VIOLATION, threat.severity, {
      success: false,
      errorMessage: threat.description,
      metadata: {
        threatType: threat.threatType,
        confidence: threat.confidence,
        ...threat.metadata,
      },
    });

    // 根据威胁严重程度采取行动
    if (threat.severity === AuditSeverity.HIGH || threat.severity === AuditSeverity.CRITICAL) {
      await this.handleHighSeverityThreat(req, threat);
    }
  }

  /**
   * 处理高严重性威胁
   */
  private async handleHighSeverityThreat(req: Request, threat: ThreatDetectionResult): Promise<void> {
    const ip = req.ip;
    
    // 标记IP为可疑
    this.suspiciousIPs.add(ip);
    
    // 如果置信度很高，直接阻止IP
    if (threat.confidence > 0.9) {
      this.blockedIPs.add(ip);
      log.error('IP blocked due to high-confidence threat', {
        ip,
        threatType: threat.threatType,
        confidence: threat.confidence,
      });
    }

    // 发送安全告警
    SecurityUtil.logSecurityEvent({
      type: 'high_severity_threat',
      severity: 'high',
      description: `High severity threat detected: ${threat.description}`,
      ip,
      userAgent: req.get('User-Agent'),
      metadata: threat.metadata,
    });
  }

  /**
   * 清理过期数据
   */
  private cleanupExpiredData(): void {
    const now = new Date();
    const expireTime = 24 * 60 * 60 * 1000; // 24小时

    // 清理过期的用户模式
    for (const [userId, pattern] of this.userPatterns.entries()) {
      if (now.getTime() - pattern.lastRequestTime.getTime() > expireTime) {
        this.userPatterns.delete(userId);
      }
    }

    // 清理过期的IP模式
    for (const [ip, pattern] of this.ipPatterns.entries()) {
      if (now.getTime() - pattern.lastRequestTime.getTime() > expireTime) {
        this.ipPatterns.delete(ip);
      }
    }

    log.info('Security monitoring data cleanup completed', {
      userPatterns: this.userPatterns.size,
      ipPatterns: this.ipPatterns.size,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
    });
  }

  /**
   * 获取安全统计信息
   */
  public getSecurityStats(): {
    userPatterns: number;
    ipPatterns: number;
    suspiciousIPs: number;
    blockedIPs: number;
    topSuspiciousIPs: string[];
  } {
    return {
      userPatterns: this.userPatterns.size,
      ipPatterns: this.ipPatterns.size,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
      topSuspiciousIPs: Array.from(this.suspiciousIPs).slice(0, 10),
    };
  }

  /**
   * 手动阻止IP
   */
  public blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    log.info('IP manually blocked', { ip });
  }

  /**
   * 解除IP阻止
   */
  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    log.info('IP unblocked', { ip });
  }
}

// 导出单例实例
export const securityMonitoring = SecurityMonitoring.getInstance();
