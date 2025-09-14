/**
 * 错误处理中间件
 * 统一处理应用中的错误和异常
 */

const { createErrorResponse } = require('../utils/response');
const { logging } = require('../config');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 异步错误捕获包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404错误处理中间件
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404
  );
  next(error);
}

/**
 * 全局错误处理中间件
 */
function globalErrorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  if (logging.enableConsole) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError(err);
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError(err);
  }

  // 设置默认错误信息
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  if (!error.message) {
    error.message = 'Internal Server Error';
  }

  // 在开发环境中返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = createErrorResponse(
    error.message,
    error.statusCode,
    isDevelopment ? { stack: error.stack } : null
  );

  res.status(error.statusCode).json(errorResponse);
}

/**
 * 处理验证错误
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return new AppError(message, 400);
}

/**
 * 处理类型转换错误
 */
function handleCastError(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

/**
 * 处理重复字段错误
 */
function handleDuplicateFieldError(err) {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
}

/**
 * 处理JWT错误
 */
function handleJWTError() {
  return new AppError('Invalid token. Please log in again!', 401);
}

/**
 * 处理JWT过期错误
 */
function handleJWTExpiredError() {
  return new AppError('Your token has expired! Please log in again.', 401);
}

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  if (logging.enableConsole && logging.level === 'debug') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  }
  next();
}

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
  requestLogger
};
