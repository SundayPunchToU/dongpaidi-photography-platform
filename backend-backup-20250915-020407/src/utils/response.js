/**
 * 统一响应格式处理工具
 * 确保所有API端点返回一致的数据结构
 */

/**
 * 创建标准API响应格式
 * @param {boolean} success - 请求是否成功
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} code - HTTP状态码
 * @param {Object} meta - 额外的元数据（如分页信息）
 * @returns {Object} 标准响应对象
 */
function createResponse(success, data = null, message = '', code = 200, meta = null) {
  const response = {
    success,
    message,
    code,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
}

/**
 * 创建成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {Object} meta - 额外的元数据
 * @returns {Object} 成功响应对象
 */
function createSuccessResponse(data = null, message = '操作成功', meta = null) {
  return createResponse(true, data, message, 200, meta);
}

/**
 * 创建错误响应
 * @param {string} message - 错误消息
 * @param {number} code - HTTP状态码
 * @param {*} data - 错误详情数据
 * @returns {Object} 错误响应对象
 */
function createErrorResponse(message = '操作失败', code = 400, data = null) {
  return createResponse(false, data, message, code);
}

/**
 * 创建分页响应
 * @param {Array} data - 数据数组
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {number} total - 总数量
 * @param {string} message - 响应消息
 * @returns {Object} 分页响应对象
 */
function createPaginatedResponse(data, page, limit, total, message = '获取成功') {
  const totalPages = Math.ceil(total / limit);
  
  const meta = {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };

  return createResponse(true, data, message, 200, meta);
}

/**
 * 响应处理中间件
 * 为res对象添加便捷的响应方法
 */
function responseMiddleware(req, res, next) {
  /**
   * 发送成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @param {Object} meta - 额外的元数据
   */
  res.success = function(data = null, message = '操作成功', meta = null) {
    return res.json(createSuccessResponse(data, message, meta));
  };

  /**
   * 发送错误响应
   * @param {string} message - 错误消息
   * @param {number} code - HTTP状态码
   * @param {*} data - 错误详情数据
   */
  res.error = function(message = '操作失败', code = 400, data = null) {
    return res.status(code).json(createErrorResponse(message, code, data));
  };

  /**
   * 发送分页响应
   * @param {Array} data - 数据数组
   * @param {number} page - 当前页码
   * @param {number} limit - 每页数量
   * @param {number} total - 总数量
   * @param {string} message - 响应消息
   */
  res.paginated = function(data, page, limit, total, message = '获取成功') {
    return res.json(createPaginatedResponse(data, page, limit, total, message));
  };

  next();
}

module.exports = {
  createResponse,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  responseMiddleware
};
