/**
 * 日志工具
 * 统一的日志记录系统
 */

const fs = require('fs');
const path = require('path');
const { logging } = require('../config');

/**
 * 日志级别
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * 获取当前时间戳
 * @returns {string} 格式化的时间戳
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 额外的元数据
 * @returns {string} 格式化的日志字符串
 */
function formatLogMessage(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

/**
 * 写入日志文件
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 额外的元数据
 */
function writeToFile(level, message, meta = {}) {
  if (!logging.enableFile) return;

  try {
    // 确保日志目录存在
    if (!fs.existsSync(logging.logDir)) {
      fs.mkdirSync(logging.logDir, { recursive: true });
    }

    const logMessage = formatLogMessage(level, message, meta);
    const logFile = path.join(logging.logDir, `${level}.log`);
    
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    console.error('Failed to write log file:', error);
  }
}

/**
 * 输出到控制台
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 额外的元数据
 */
function writeToConsole(level, message, meta = {}) {
  if (!logging.enableConsole) return;

  const logMessage = formatLogMessage(level, message, meta);
  
  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'info':
      console.info(logMessage);
      break;
    case 'debug':
      console.log(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

/**
 * 检查是否应该记录该级别的日志
 * @param {string} level - 日志级别
 * @returns {boolean} 是否应该记录
 */
function shouldLog(level) {
  const currentLevel = LOG_LEVELS[logging.level.toUpperCase()] || LOG_LEVELS.INFO;
  const messageLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  return messageLevel <= currentLevel;
}

/**
 * 记录日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 额外的元数据
 */
function log(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  writeToConsole(level, message, meta);
  writeToFile(level, message, meta);
}

/**
 * Logger类
 */
class Logger {
  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外的元数据
   */
  error(message, meta = {}) {
    log('error', message, meta);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外的元数据
   */
  warn(message, meta = {}) {
    log('warn', message, meta);
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外的元数据
   */
  info(message, meta = {}) {
    log('info', message, meta);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外的元数据
   */
  debug(message, meta = {}) {
    log('debug', message, meta);
  }

  /**
   * 记录HTTP请求日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {number} duration - 请求处理时间（毫秒）
   */
  request(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this[level](`${req.method} ${req.url} - ${res.statusCode}`, meta);
  }
}

// 创建全局logger实例
const logger = new Logger();

module.exports = logger;
