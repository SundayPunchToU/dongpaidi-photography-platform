import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { securityConfig } from '@/config/security';
import { log } from '@/config/logger';

/**
 * 安全工具类
 */
export class SecurityUtil {
  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = securityConfig.password.saltRounds;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length < securityConfig.password.minLength) {
      errors.push(`Password must be at least ${securityConfig.password.minLength} characters long`);
    } else if (password.length >= securityConfig.password.minLength) {
      score += 1;
    }

    if (password.length > securityConfig.password.maxLength) {
      errors.push(`Password must not exceed ${securityConfig.password.maxLength} characters`);
    }

    // 大写字母检查
    if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // 小写字母检查
    if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // 数字检查
    if (securityConfig.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // 特殊字符检查
    if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    }

    // 常见密码检查
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      '12345678', '123456789', 'password1', 'abc123', '111111'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(5, score),
    };
  }

  /**
   * AES加密
   */
  static encrypt(text: string, key?: string): {
    encrypted: string;
    iv: string;
    tag: string;
    key: string;
  } {
    const algorithm = securityConfig.encryption.algorithm;
    const keyBuffer = key ? Buffer.from(key, 'hex') : crypto.randomBytes(securityConfig.encryption.keyLength);
    const iv = crypto.randomBytes(securityConfig.encryption.ivLength);

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    cipher.setAAD(Buffer.from('dongpaidi-security'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      key: keyBuffer.toString('hex'),
    };
  }

  /**
   * AES解密
   */
  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
    key: string;
  }): string {
    const algorithm = securityConfig.encryption.algorithm;
    const keyBuffer = Buffer.from(encryptedData.key, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAAD(Buffer.from('dongpaidi-security'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 生成HMAC签名
   */
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * 验证HMAC签名
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * 生成CSP nonce
   */
  static generateCSPNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * 安全的字符串比较（防止时序攻击）
   */
  static safeStringCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * 生成API密钥
   */
  static generateApiKey(): string {
    const randomPart = crypto.randomBytes(securityConfig.apiKey.length).toString('hex');
    return `${securityConfig.apiKey.prefix}${randomPart}`;
  }

  /**
   * 验证API密钥格式
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey.startsWith(securityConfig.apiKey.prefix)) {
      return false;
    }
    
    const keyPart = apiKey.substring(securityConfig.apiKey.prefix.length);
    return keyPart.length === securityConfig.apiKey.length * 2; // hex编码后长度翻倍
  }

  /**
   * 生成安全的验证码
   */
  static generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      code += digits[randomIndex];
    }
    
    return code;
  }

  /**
   * 计算文件哈希
   */
  static calculateFileHash(buffer: Buffer, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /**
   * 验证文件完整性
   */
  static verifyFileIntegrity(buffer: Buffer, expectedHash: string, algorithm: string = 'sha256'): boolean {
    const actualHash = this.calculateFileHash(buffer, algorithm);
    return this.safeStringCompare(actualHash, expectedHash);
  }

  /**
   * 生成JWT密钥
   */
  static generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 脱敏敏感信息
   */
  static maskSensitiveData(data: string, type: 'phone' | 'email' | 'idCard' | 'bankCard'): string {
    const patterns = securityConfig.dataMasking.patterns;
    const replacements = securityConfig.dataMasking.replacement;
    
    const pattern = patterns[type];
    const replacement = replacements[type];
    
    if (pattern && replacement && pattern.test(data)) {
      return data.replace(pattern, replacement);
    }
    
    return data;
  }

  /**
   * 检测恶意输入
   */
  static detectMaliciousInput(input: string): {
    isMalicious: boolean;
    threats: string[];
  } {
    const threats: string[] = [];
    
    // SQL注入检测
    for (const pattern of securityConfig.validation.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        threats.push('SQL Injection');
        break;
      }
    }
    
    // XSS检测
    for (const pattern of securityConfig.validation.xssPatterns) {
      if (pattern.test(input)) {
        threats.push('XSS');
        break;
      }
    }
    
    // 路径遍历检测
    if (/\.\.[\/\\]/.test(input)) {
      threats.push('Path Traversal');
    }
    
    // 命令注入检测
    if (/[;&|`$(){}[\]<>]/.test(input)) {
      threats.push('Command Injection');
    }
    
    return {
      isMalicious: threats.length > 0,
      threats,
    };
  }

  /**
   * 生成安全的会话ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成CSRF令牌
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * 验证CSRF令牌
   */
  static verifyCSRFToken(token: string, sessionToken: string): boolean {
    return this.safeStringCompare(token, sessionToken);
  }

  /**
   * 记录安全事件
   */
  static logSecurityEvent(event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ip?: string;
    userId?: string;
    userAgent?: string;
    metadata?: any;
  }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      event: event.type,
      severity: event.severity,
      description: event.description,
      ip: event.ip,
      userId: event.userId,
      userAgent: event.userAgent,
      metadata: event.metadata,
    };

    switch (event.severity) {
      case 'critical':
        log.error('Security Event - Critical', logData);
        break;
      case 'high':
        log.error('Security Event - High', logData);
        break;
      case 'medium':
        log.warn('Security Event - Medium', logData);
        break;
      case 'low':
        log.info('Security Event - Low', logData);
        break;
    }

    // 这里可以添加安全事件通知逻辑
    if (event.severity === 'critical' || event.severity === 'high') {
      // 发送安全告警
      this.sendSecurityAlert(logData);
    }
  }

  /**
   * 发送安全告警
   */
  private static async sendSecurityAlert(eventData: any): Promise<void> {
    if (!securityConfig.notification.enabled) {
      return;
    }

    try {
      // 这里实现具体的告警发送逻辑
      // 例如：发送邮件、调用Webhook等
      log.info('Security alert sent', { event: eventData.event });
    } catch (error) {
      log.error('Failed to send security alert', { error, eventData });
    }
  }
}

export default SecurityUtil;
