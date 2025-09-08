import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { securityConfig } from '@/config/security';
import { ResponseUtil } from '@/utils/response';
import { log } from '@/config/logger';
import { db } from '@/config/database';

/**
 * 安全中间件集合
 */

/**
 * 全局速率限制中间件
 */
export const globalRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.global.windowMs,
  max: securityConfig.rateLimit.global.max,
  message: {
    success: false,
    message: securityConfig.rateLimit.global.message,
    code: 429,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    ResponseUtil.error(res, 'Too many requests', 429);
  },
});

/**
 * 认证相关速率限制
 */
export const authRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.auth.windowMs,
  max: securityConfig.rateLimit.auth.max,
  skipSuccessfulRequests: securityConfig.rateLimit.auth.skipSuccessfulRequests,
  keyGenerator: (req) => {
    // 使用IP + User-Agent组合作为key
    return `${req.ip}-${req.get('User-Agent')}`;
  },
  handler: (req, res) => {
    log.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    ResponseUtil.error(res, 'Too many authentication attempts', 429);
  },
});

/**
 * API速率限制（需要认证）
 */
export const apiRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.api.windowMs,
  max: securityConfig.rateLimit.api.max,
  keyGenerator: (req: any) => {
    // 对已认证用户使用用户ID，未认证用户使用IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    ResponseUtil.error(res, 'API rate limit exceeded', 429);
  },
});

/**
 * 慢速攻击防护
 */
export const slowDownProtection = slowDown({
  windowMs: 15 * 60 * 1000, // 15分钟
  delayAfter: 50, // 50个请求后开始延迟
  delayMs: 500, // 每个请求延迟500ms
  maxDelayMs: 20000, // 最大延迟20秒
});

/**
 * 输入验证和清理中间件
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 递归清理对象
    const sanitizeObject = (obj: any, depth = 0): any => {
      if (depth > securityConfig.validation.maxObjectDepth) {
        throw new Error('Object depth limit exceeded');
      }

      if (obj === null || obj === undefined) {
        return obj;
      }

      if (typeof obj === 'string') {
        // 检查字符串长度
        if (obj.length > securityConfig.validation.maxStringLength) {
          throw new Error('String length limit exceeded');
        }

        // SQL注入检测
        for (const pattern of securityConfig.validation.sqlInjectionPatterns) {
          if (pattern.test(obj)) {
            log.warn('SQL injection attempt detected', {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              input: obj.substring(0, 100),
            });
            throw new Error('Potentially malicious input detected');
          }
        }

        // XSS检测
        for (const pattern of securityConfig.validation.xssPatterns) {
          if (pattern.test(obj)) {
            log.warn('XSS attempt detected', {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              input: obj.substring(0, 100),
            });
            throw new Error('Potentially malicious input detected');
          }
        }

        return obj.trim();
      }

      if (Array.isArray(obj)) {
        if (obj.length > securityConfig.validation.maxArrayLength) {
          throw new Error('Array length limit exceeded');
        }
        return obj.map(item => sanitizeObject(item, depth + 1));
      }

      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value, depth + 1);
        }
        return sanitized;
      }

      return obj;
    };

    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // 清理路径参数
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    log.error('Input sanitization failed', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    ResponseUtil.error(res, 'Invalid input data', 400);
  }
};

/**
 * IP过滤中间件
 */
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  if (!securityConfig.ipFilter.enabled) {
    return next();
  }

  const clientIp = req.ip;

  // 检查黑名单
  if (securityConfig.ipFilter.blacklist.includes(clientIp)) {
    log.warn('Blocked IP attempt', { ip: clientIp });
    return ResponseUtil.error(res, 'Access denied', 403);
  }

  // 检查白名单（如果配置了白名单）
  if (securityConfig.ipFilter.whitelist.length > 0) {
    if (!securityConfig.ipFilter.whitelist.includes(clientIp)) {
      log.warn('Non-whitelisted IP attempt', { ip: clientIp });
      return ResponseUtil.error(res, 'Access denied', 403);
    }
  }

  next();
};

/**
 * API密钥验证中间件
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!securityConfig.apiKey.enabled) {
    return next();
  }

  const apiKey = req.headers[securityConfig.apiKey.headerName.toLowerCase()] as string ||
                 req.query[securityConfig.apiKey.queryParam] as string;

  if (!apiKey) {
    return ResponseUtil.error(res, 'API key required', 401);
  }

  try {
    // 验证API密钥格式
    if (!apiKey.startsWith(securityConfig.apiKey.prefix)) {
      return ResponseUtil.error(res, 'Invalid API key format', 401);
    }

    // 这里应该从数据库验证API密钥
    // const isValid = await validateApiKey(apiKey);
    // if (!isValid) {
    //   return ResponseUtil.error(res, 'Invalid API key', 401);
    // }

    next();
  } catch (error) {
    log.error('API key validation failed', { error, apiKey: apiKey.substring(0, 10) + '...' });
    ResponseUtil.error(res, 'API key validation failed', 500);
  }
};

/**
 * 威胁检测中间件
 */
export const threatDetection = (req: Request, res: Response, next: NextFunction) => {
  if (!securityConfig.threatDetection.enabled) {
    return next();
  }

  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip;

  // 检测可疑的User-Agent
  for (const pattern of securityConfig.threatDetection.anomalyDetection.suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      log.warn('Suspicious User-Agent detected', {
        ip,
        userAgent,
        url: req.url,
      });
      
      // 可以选择阻止或标记
      // return ResponseUtil.error(res, 'Access denied', 403);
    }
  }

  // 检测异常请求模式
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
  ];

  for (const header of suspiciousHeaders) {
    const value = req.get(header);
    if (value && value !== ip) {
      log.warn('Potential proxy/spoofing attempt', {
        ip,
        header,
        value,
      });
    }
  }

  next();
};

/**
 * 会话安全中间件
 */
export const sessionSecurity = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  try {
    const userId = req.user.id;
    const currentIp = req.ip;
    const currentUserAgent = req.get('User-Agent') || '';

    // 检查会话绑定
    if (securityConfig.session.ipBinding || securityConfig.session.userAgentBinding) {
      // 这里应该从会话存储中获取原始IP和User-Agent
      // const session = await getSession(userId);
      
      // if (securityConfig.session.ipBinding && session.ip !== currentIp) {
      //   log.warn('Session IP mismatch', {
      //     userId,
      //     originalIp: session.ip,
      //     currentIp,
      //   });
      //   return ResponseUtil.error(res, 'Session security violation', 403);
      // }

      // if (securityConfig.session.userAgentBinding && session.userAgent !== currentUserAgent) {
      //   log.warn('Session User-Agent mismatch', {
      //     userId,
      //     originalUserAgent: session.userAgent.substring(0, 50),
      //     currentUserAgent: currentUserAgent.substring(0, 50),
      //   });
      //   return ResponseUtil.error(res, 'Session security violation', 403);
      // }
    }

    // 检查并发会话数
    // const activeSessions = await getActiveSessionCount(userId);
    // if (activeSessions > securityConfig.session.maxConcurrentSessions) {
    //   log.warn('Too many concurrent sessions', { userId, activeSessions });
    //   return ResponseUtil.error(res, 'Too many active sessions', 403);
    // }

    next();
  } catch (error) {
    log.error('Session security check failed', { error, userId: req.user.id });
    ResponseUtil.error(res, 'Session validation failed', 500);
  }
};

/**
 * 数据脱敏中间件（响应时使用）
 */
export const dataMasking = (req: Request, res: Response, next: NextFunction) => {
  if (!securityConfig.dataMasking.enabled) {
    return next();
  }

  const originalJson = res.json;
  res.json = function(data: any) {
    const maskedData = maskSensitiveData(data);
    return originalJson.call(this, maskedData);
  };

  next();
};

/**
 * 脱敏敏感数据
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const masked = { ...data };
  
  for (const [key, value] of Object.entries(masked)) {
    if (typeof value === 'string') {
      // 手机号脱敏
      if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
        const pattern = securityConfig.dataMasking.patterns.phone;
        const replacement = securityConfig.dataMasking.replacement.phone;
        if (pattern.test(value)) {
          masked[key] = value.replace(pattern, replacement);
        }
      }
      
      // 邮箱脱敏
      if (key.toLowerCase().includes('email')) {
        const pattern = securityConfig.dataMasking.patterns.email;
        const replacement = securityConfig.dataMasking.replacement.email;
        if (pattern.test(value)) {
          masked[key] = value.replace(pattern, replacement);
        }
      }
      
      // 身份证脱敏
      if (key.toLowerCase().includes('idcard') || key.toLowerCase().includes('identity')) {
        const pattern = securityConfig.dataMasking.patterns.idCard;
        const replacement = securityConfig.dataMasking.replacement.idCard;
        if (pattern.test(value)) {
          masked[key] = value.replace(pattern, replacement);
        }
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    }
  }

  return masked;
}

export default {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  slowDownProtection,
  inputSanitization,
  ipFilter,
  apiKeyAuth,
  threatDetection,
  sessionSecurity,
  dataMasking,
};
