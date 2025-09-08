import fs from 'fs/promises';
import path from 'path';
import { Transform } from 'stream';
import { createReadStream } from 'fs';
import readline from 'readline';
import { logAnalyzer, LogEntry } from './logAnalyzer';
import { getLogAnalysisConfig } from '@/config/logAnalysis';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 日志来源类型
 */
export enum LogSource {
  APPLICATION = 'application',
  ACCESS = 'access',
  ERROR = 'error',
  SECURITY = 'security',
  AUDIT = 'audit',
  PERFORMANCE = 'performance',
  DATABASE = 'database',
  EXTERNAL = 'external',
}

/**
 * 日志收集器配置
 */
export interface CollectorConfig {
  source: LogSource;
  enabled: boolean;
  filePath?: string;
  pattern?: RegExp;
  parser?: (line: string) => Partial<LogEntry> | null;
  pollInterval?: number;
  batchSize?: number;
}

/**
 * 日志收集器类
 */
export class LogCollector {
  private static instance: LogCollector;
  private config = getLogAnalysisConfig();
  private collectors = new Map<LogSource, CollectorConfig>();
  private watchers = new Map<LogSource, NodeJS.Timeout>();
  private lastPositions = new Map<string, number>();

  private constructor() {
    this.initializeCollectors();
  }

  public static getInstance(): LogCollector {
    if (!LogCollector.instance) {
      LogCollector.instance = new LogCollector();
    }
    return LogCollector.instance;
  }

  /**
   * 初始化收集器
   */
  private initializeCollectors(): void {
    // 应用日志收集器
    this.addCollector({
      source: LogSource.APPLICATION,
      enabled: true,
      filePath: path.join(this.config.storage.file.basePath, '../combined.log'),
      parser: this.parseApplicationLog.bind(this),
      pollInterval: 5000,
      batchSize: 100,
    });

    // 错误日志收集器
    this.addCollector({
      source: LogSource.ERROR,
      enabled: true,
      filePath: path.join(this.config.storage.file.basePath, '../error.log'),
      parser: this.parseErrorLog.bind(this),
      pollInterval: 1000, // 更频繁地检查错误日志
      batchSize: 50,
    });

    // 访问日志收集器
    this.addCollector({
      source: LogSource.ACCESS,
      enabled: true,
      filePath: path.join(this.config.storage.file.basePath, '../access.log'),
      parser: this.parseAccessLog.bind(this),
      pollInterval: 10000,
      batchSize: 200,
    });

    // 安全日志收集器
    this.addCollector({
      source: LogSource.SECURITY,
      enabled: true,
      filePath: path.join(this.config.storage.file.basePath, '../security.log'),
      parser: this.parseSecurityLog.bind(this),
      pollInterval: 2000,
      batchSize: 50,
    });

    // 审计日志收集器
    this.addCollector({
      source: LogSource.AUDIT,
      enabled: true,
      filePath: path.join(this.config.storage.file.basePath, '../audit.log'),
      parser: this.parseAuditLog.bind(this),
      pollInterval: 5000,
      batchSize: 100,
    });

    this.startCollectors();
  }

  /**
   * 添加收集器
   */
  public addCollector(config: CollectorConfig): void {
    this.collectors.set(config.source, config);
    
    if (config.enabled) {
      this.startCollector(config.source);
    }
  }

  /**
   * 启动所有收集器
   */
  private startCollectors(): void {
    for (const [source, config] of this.collectors.entries()) {
      if (config.enabled) {
        this.startCollector(source);
      }
    }
  }

  /**
   * 启动单个收集器
   */
  private startCollector(source: LogSource): void {
    const config = this.collectors.get(source);
    if (!config || !config.enabled) {
      return;
    }

    // 清除现有的监听器
    this.stopCollector(source);

    // 启动新的监听器
    const interval = setInterval(async () => {
      try {
        await this.collectLogs(source);
      } catch (error) {
        log.error(`Log collection failed for source: ${source}`, { error });
      }
    }, config.pollInterval || 5000);

    this.watchers.set(source, interval);
    log.info(`Started log collector for source: ${source}`);
  }

  /**
   * 停止收集器
   */
  public stopCollector(source: LogSource): void {
    const interval = this.watchers.get(source);
    if (interval) {
      clearInterval(interval);
      this.watchers.delete(source);
      log.info(`Stopped log collector for source: ${source}`);
    }
  }

  /**
   * 收集日志
   */
  private async collectLogs(source: LogSource): Promise<void> {
    const config = this.collectors.get(source);
    if (!config || !config.filePath) {
      return;
    }

    try {
      // 检查文件是否存在
      await fs.access(config.filePath);
      
      // 获取文件统计信息
      const stats = await fs.stat(config.filePath);
      const currentSize = stats.size;
      
      // 获取上次读取位置
      const lastPosition = this.lastPositions.get(config.filePath) || 0;
      
      // 如果文件没有新内容，跳过
      if (currentSize <= lastPosition) {
        return;
      }

      // 读取新内容
      const newLines = await this.readNewLines(config.filePath, lastPosition, currentSize);
      
      if (newLines.length > 0) {
        await this.processLines(source, newLines, config);
        this.lastPositions.set(config.filePath, currentSize);
      }

    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        log.error(`Failed to collect logs from ${config.filePath}`, { error });
      }
    }
  }

  /**
   * 读取新行
   */
  private async readNewLines(filePath: string, start: number, end: number): Promise<string[]> {
    const lines: string[] = [];
    
    const stream = createReadStream(filePath, { start, end: end - 1 });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim()) {
        lines.push(line);
      }
    }

    return lines;
  }

  /**
   * 处理日志行
   */
  private async processLines(source: LogSource, lines: string[], config: CollectorConfig): Promise<void> {
    const entries: LogEntry[] = [];

    for (const line of lines) {
      try {
        if (config.parser) {
          const parsed = config.parser(line);
          if (parsed) {
            const entry: LogEntry = {
              id: SecurityUtil.generateUUID(),
              timestamp: new Date(),
              level: 'INFO',
              message: '',
              service: 'dongpaidi-backend',
              module: source,
              processed: false,
              anonymized: false,
              ...parsed,
            };
            entries.push(entry);
          }
        }
      } catch (error) {
        log.error(`Failed to parse log line from ${source}`, { error, line: line.substring(0, 100) });
      }
    }

    // 批量发送到分析器
    for (const entry of entries) {
      await logAnalyzer.addLogEntry(entry);
    }

    if (entries.length > 0) {
      log.debug(`Collected ${entries.length} log entries from ${source}`);
    }
  }

  /**
   * 解析应用日志
   */
  private parseApplicationLog(line: string): Partial<LogEntry> | null {
    try {
      // 尝试解析JSON格式的日志
      const parsed = JSON.parse(line);
      
      const result: Partial<LogEntry> = {
        timestamp: new Date(parsed.timestamp),
        level: this.mapLogLevel(parsed.level),
        message: parsed.message,
        metadata: parsed.meta || parsed.metadata,
      };

      if (parsed.error) {
        result.error = {
          name: parsed.error.name || 'Error',
          message: parsed.error.message || 'Unknown error',
          stack: parsed.error.stack,
        };
      }

      return result;
    } catch {
      // 如果不是JSON，尝试解析文本格式
      const textMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);
      if (textMatch && textMatch[1] && textMatch[2] && textMatch[3]) {
        return {
          timestamp: new Date(textMatch[1]),
          level: this.mapLogLevel(textMatch[2]),
          message: textMatch[3],
        };
      }
    }

    return null;
  }

  /**
   * 解析错误日志
   */
  private parseErrorLog(line: string): Partial<LogEntry> | null {
    try {
      const parsed = JSON.parse(line);
      
      return {
        timestamp: new Date(parsed.timestamp),
        level: 'ERROR',
        message: parsed.message,
        error: {
          name: parsed.error?.name || 'Error',
          message: parsed.error?.message || parsed.message,
          stack: parsed.error?.stack,
        },
        metadata: parsed.meta || parsed.metadata,
        url: parsed.url,
        method: parsed.method,
        ip: parsed.ip,
        userAgent: parsed.userAgent,
      };
    } catch {
      return {
        level: 'ERROR',
        message: line,
      };
    }
  }

  /**
   * 解析访问日志
   */
  private parseAccessLog(line: string): Partial<LogEntry> | null {
    // 解析Common Log Format或Combined Log Format
    const combinedMatch = line.match(
      /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)"/
    );

    if (combinedMatch) {
      const [, ip, timestamp, method, url, protocol, statusCode, size, referer, userAgent] = combinedMatch;

      if (ip && timestamp && method && url && statusCode) {
        const result: Partial<LogEntry> = {
          timestamp: new Date(timestamp.replace(/\//g, ' ')),
          level: 'HTTP',
          message: `${method} ${url} ${statusCode}`,
          ip,
          method,
          url,
          statusCode: parseInt(statusCode, 10),
          metadata: {
            protocol: protocol || '',
            size: size ? parseInt(size, 10) : 0,
            referer: referer || '',
          },
        };

        if (userAgent) {
          result.userAgent = userAgent;
        }

        return result;
      }
    }

    return null;
  }

  /**
   * 解析安全日志
   */
  private parseSecurityLog(line: string): Partial<LogEntry> | null {
    try {
      const parsed = JSON.parse(line);
      
      return {
        timestamp: new Date(parsed.timestamp),
        level: this.mapLogLevel(parsed.level || 'WARN'),
        message: parsed.message,
        ip: parsed.ip,
        userAgent: parsed.userAgent,
        userId: parsed.userId,
        tags: ['security'],
        metadata: parsed.metadata || parsed.data,
      };
    } catch {
      return {
        level: 'WARN',
        message: line,
        tags: ['security'],
      };
    }
  }

  /**
   * 解析审计日志
   */
  private parseAuditLog(line: string): Partial<LogEntry> | null {
    try {
      const parsed = JSON.parse(line);
      
      return {
        timestamp: new Date(parsed.timestamp),
        level: 'INFO',
        message: `${parsed.eventType}: ${parsed.description || parsed.message}`,
        userId: parsed.userId,
        sessionId: parsed.sessionId,
        ip: parsed.ip,
        userAgent: parsed.userAgent,
        url: parsed.resource,
        method: parsed.action,
        tags: ['audit'],
        metadata: {
          eventType: parsed.eventType,
          severity: parsed.severity,
          success: parsed.success,
          details: parsed.details,
        },
      };
    } catch {
      return {
        level: 'INFO',
        message: line,
        tags: ['audit'],
      };
    }
  }

  /**
   * 映射日志级别
   */
  private mapLogLevel(level: string): LogEntry['level'] {
    const upperLevel = level.toUpperCase();
    switch (upperLevel) {
      case 'ERROR':
        return 'ERROR';
      case 'WARN':
      case 'WARNING':
        return 'WARN';
      case 'INFO':
        return 'INFO';
      case 'DEBUG':
        return 'DEBUG';
      case 'HTTP':
        return 'HTTP';
      default:
        return 'INFO';
    }
  }

  /**
   * 手动收集日志
   */
  public async collectFromFile(filePath: string, source: LogSource = LogSource.EXTERNAL): Promise<number> {
    try {
      const lines: string[] = [];
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim()) {
          lines.push(line);
        }
      }

      const config = this.collectors.get(source) || {
        source,
        enabled: true,
        parser: this.parseApplicationLog.bind(this),
      };

      await this.processLines(source, lines, config);
      
      log.info(`Manually collected ${lines.length} log entries from ${filePath}`);
      return lines.length;

    } catch (error) {
      log.error(`Failed to collect logs from file: ${filePath}`, { error });
      throw error;
    }
  }

  /**
   * 收集实时日志条目
   */
  public async collectEntry(entry: Partial<LogEntry>, source: LogSource = LogSource.APPLICATION): Promise<void> {
    const logEntry: LogEntry = {
      id: SecurityUtil.generateUUID(),
      timestamp: new Date(),
      level: 'INFO',
      message: '',
      service: 'dongpaidi-backend',
      module: source,
      processed: false,
      anonymized: false,
      ...entry,
    };

    await logAnalyzer.addLogEntry(logEntry);
  }

  /**
   * 获取收集器状态
   */
  public getCollectorStatus(): Array<{
    source: LogSource;
    enabled: boolean;
    isRunning: boolean;
    filePath?: string;
    lastPosition?: number;
  }> {
    const status = [];

    for (const [source, config] of this.collectors.entries()) {
      const statusItem: {
        source: LogSource;
        enabled: boolean;
        isRunning: boolean;
        filePath?: string;
        lastPosition?: number;
      } = {
        source,
        enabled: config.enabled,
        isRunning: this.watchers.has(source),
      };

      if (config.filePath) {
        statusItem.filePath = config.filePath;
        const lastPos = this.lastPositions.get(config.filePath);
        if (lastPos !== undefined) {
          statusItem.lastPosition = lastPos;
        }
      }

      status.push(statusItem);
    }

    return status;
  }

  /**
   * 重置收集器位置
   */
  public resetCollectorPosition(source: LogSource): void {
    const config = this.collectors.get(source);
    if (config && config.filePath) {
      this.lastPositions.delete(config.filePath);
      log.info(`Reset collector position for source: ${source}`);
    }
  }

  /**
   * 停止所有收集器
   */
  public stopAllCollectors(): void {
    for (const source of this.watchers.keys()) {
      this.stopCollector(source);
    }
    log.info('Stopped all log collectors');
  }
}

// 导出单例实例
export const logCollector = LogCollector.getInstance();
