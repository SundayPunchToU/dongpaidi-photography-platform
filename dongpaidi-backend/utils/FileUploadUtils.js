/**
 * 懂拍帝摄影平台 - 文件上传工具类
 * 
 * 功能说明：
 * - 提供文件上传相关的工具函数
 * - 包含文件验证、路径处理、文件名生成等核心功能
 * - 确保文件上传的安全性和规范性
 * 
 * 创建时间: 2025-09-17
 * 开发者: Augment Agent
 * 版本: 1.0.0
 * 
 * 依赖关系:
 * - path: Node.js内置模块，用于路径处理
 * - crypto: Node.js内置模块，用于生成随机字符串
 * 
 * 架构说明:
 * - 采用静态方法设计，便于在各个模块中直接调用
 * - 所有方法都包含详细的参数验证和错误处理
 * - 遵循安全优先原则，防止路径遍历和文件类型伪造攻击
 * 
 * 主要类/函数:
 * - FileUploadUtils: 主工具类
 * - validateFileType: 文件类型验证
 * - validateFileSize: 文件大小验证
 * - generateSafeFilename: 安全文件名生成
 * - sanitizeFilename: 文件名安全处理
 * - buildFilePath: 构建安全的文件路径
 */

const path = require('path');
const crypto = require('crypto');

/**
 * 文件上传工具类
 * 提供文件上传过程中需要的各种工具方法
 */
class FileUploadUtils {
  
  /**
   * 支持的文件MIME类型配置
   * 
   * 安全考虑：
   * - 仅支持常见的图片格式
   * - 每种格式都包含多个可能的MIME类型
   * - 用于第一层文件类型验证
   */
  static ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  /**
   * 文件头签名配置
   * 
   * 安全考虑：
   * - 通过文件头字节验证真实文件类型
   * - 防止通过修改扩展名或MIME类型进行的伪造攻击
   * - 提供第二层文件类型验证
   */
  static FILE_SIGNATURES = {
    'ffd8ffe0': 'jpeg',  // JPEG JFIF
    'ffd8ffe1': 'jpeg',  // JPEG EXIF
    'ffd8ffe2': 'jpeg',  // JPEG EXIF
    'ffd8ffe3': 'jpeg',  // JPEG EXIF
    'ffd8ffe8': 'jpeg',  // JPEG SPIFF
    '89504e47': 'png',   // PNG
    '52494646': 'webp'   // WebP
  };

  /**
   * 文件大小限制配置
   * 
   * 性能考虑：
   * - 单文件最大10MB，平衡用户体验和服务器性能
   * - 批量上传最多9个文件，控制总体上传量
   */
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static MAX_FILES_COUNT = 9;

  /**
   * 验证文件类型
   * 
   * @param {Object} file - 文件对象，包含mimetype和buffer属性
   * @param {string} file.mimetype - 文件的MIME类型
   * @param {Buffer} file.buffer - 文件的二进制数据
   * @returns {Object} 验证结果 {isValid: boolean, message: string, detectedType: string}
   * 
   * @throws {Error} 当参数无效时抛出错误
   * 
   * 安全机制：
   * 1. MIME类型检查 - 第一层验证
   * 2. 文件头签名检查 - 第二层验证，防止伪造
   * 3. 双重验证确保文件类型的真实性
   * 
   * @example
   * const result = FileUploadUtils.validateFileType({
   *   mimetype: 'image/jpeg',
   *   buffer: fileBuffer
   * });
   * if (!result.isValid) {
   *   console.error(result.message);
   * }
   */
  static validateFileType(file) {
    try {
      // 参数验证
      if (!file || typeof file !== 'object') {
        return {
          isValid: false,
          message: '无效的文件对象',
          detectedType: null
        };
      }

      if (!file.mimetype || !file.buffer) {
        return {
          isValid: false,
          message: '文件对象缺少必要属性',
          detectedType: null
        };
      }

      // 第一层验证：MIME类型检查
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        return {
          isValid: false,
          message: `不支持的文件类型: ${file.mimetype}`,
          detectedType: null
        };
      }

      // 第二层验证：文件头签名检查
      if (file.buffer.length < 4) {
        return {
          isValid: false,
          message: '文件数据不完整',
          detectedType: null
        };
      }

      const fileSignature = file.buffer.slice(0, 4).toString('hex').toLowerCase();
      const detectedType = this.FILE_SIGNATURES[fileSignature];

      if (!detectedType) {
        return {
          isValid: false,
          message: '文件格式验证失败，可能是伪造的图片文件',
          detectedType: null
        };
      }

      return {
        isValid: true,
        message: '文件类型验证通过',
        detectedType: detectedType
      };

    } catch (error) {
      return {
        isValid: false,
        message: `文件类型验证出错: ${error.message}`,
        detectedType: null
      };
    }
  }

  /**
   * 验证文件大小
   * 
   * @param {number} fileSize - 文件大小（字节）
   * @returns {Object} 验证结果 {isValid: boolean, message: string}
   * 
   * 性能考虑：
   * - 限制单文件大小防止服务器内存溢出
   * - 提供友好的错误信息，包含具体的大小限制
   * 
   * @example
   * const result = FileUploadUtils.validateFileSize(file.size);
   * if (!result.isValid) {
   *   console.error(result.message);
   * }
   */
  static validateFileSize(fileSize) {
    try {
      if (typeof fileSize !== 'number' || fileSize < 0) {
        return {
          isValid: false,
          message: '无效的文件大小'
        };
      }

      if (fileSize === 0) {
        return {
          isValid: false,
          message: '文件为空'
        };
      }

      if (fileSize > this.MAX_FILE_SIZE) {
        const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
        return {
          isValid: false,
          message: `文件过大 (${fileSizeMB}MB)，最大允许 ${maxSizeMB}MB`
        };
      }

      return {
        isValid: true,
        message: '文件大小验证通过'
      };

    } catch (error) {
      return {
        isValid: false,
        message: `文件大小验证出错: ${error.message}`
      };
    }
  }

  /**
   * 验证批量上传文件数量
   * 
   * @param {number} filesCount - 文件数量
   * @returns {Object} 验证结果 {isValid: boolean, message: string}
   * 
   * 性能考虑：
   * - 限制批量上传数量防止服务器负载过高
   * - 提供明确的数量限制信息
   */
  static validateFilesCount(filesCount) {
    try {
      if (typeof filesCount !== 'number' || filesCount < 0) {
        return {
          isValid: false,
          message: '无效的文件数量'
        };
      }

      if (filesCount === 0) {
        return {
          isValid: false,
          message: '请选择要上传的文件'
        };
      }

      if (filesCount > this.MAX_FILES_COUNT) {
        return {
          isValid: false,
          message: `文件数量过多 (${filesCount}个)，最多允许 ${this.MAX_FILES_COUNT}个`
        };
      }

      return {
        isValid: true,
        message: '文件数量验证通过'
      };

    } catch (error) {
      return {
        isValid: false,
        message: `文件数量验证出错: ${error.message}`
      };
    }
  }

  /**
   * 生成安全的文件名
   *
   * @param {string} originalName - 原始文件名
   * @returns {string} 安全的文件名
   *
   * 安全机制：
   * - 使用时间戳确保文件名唯一性
   * - 添加随机字符串防止文件名猜测攻击
   * - 清理原始文件名中的特殊字符
   * - 限制文件名长度防止文件系统问题
   *
   * 文件名格式: {timestamp}-{randomString}-{cleanBaseName}.{ext}
   *
   * @example
   * const safeFilename = FileUploadUtils.generateSafeFilename('我的照片.jpg');
   * // 输出: 1726567890123-a8b9c2d1-我的照片.jpg
   */
  static generateSafeFilename(originalName) {
    try {
      if (!originalName || typeof originalName !== 'string') {
        throw new Error('无效的原始文件名');
      }

      // 生成时间戳
      const timestamp = Date.now();

      // 生成8位随机字符串
      const randomString = crypto.randomBytes(4).toString('hex');

      // 提取文件扩展名
      const ext = path.extname(originalName).toLowerCase();

      // 提取并清理基础文件名
      const baseName = path.basename(originalName, ext);
      const cleanBaseName = this.sanitizeFilename(baseName);

      // 限制基础文件名长度（避免文件名过长）
      const maxBaseNameLength = 50;
      const truncatedBaseName = cleanBaseName.length > maxBaseNameLength
        ? cleanBaseName.substring(0, maxBaseNameLength)
        : cleanBaseName;

      // 组合最终文件名
      return `${timestamp}-${randomString}-${truncatedBaseName}${ext}`;

    } catch (error) {
      // 如果生成失败，使用纯时间戳和随机字符串
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(4).toString('hex');
      return `${timestamp}-${randomString}-upload.jpg`;
    }
  }

  /**
   * 清理文件名中的不安全字符
   *
   * @param {string} filename - 需要清理的文件名
   * @returns {string} 清理后的安全文件名
   *
   * 安全机制：
   * - 移除路径遍历字符 (../, ..\)
   * - 替换特殊字符为安全字符
   * - 保留中文字符和基本字母数字
   * - 移除开头和结尾的点号
   *
   * @example
   * const safe = FileUploadUtils.sanitizeFilename('../../../etc/passwd');
   * // 输出: etc-passwd
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed';
    }

    return filename
      // 移除路径遍历字符
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      // 替换特殊字符为连字符，保留中文、字母、数字
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.]/g, '-')
      // 移除多个连续的连字符
      .replace(/-+/g, '-')
      // 移除开头和结尾的点号和连字符
      .replace(/^[.-]+|[.-]+$/g, '')
      // 确保不为空
      || 'unnamed';
  }

  /**
   * 构建安全的文件存储路径
   *
   * @param {string} type - 文件类型 ('original', 'compressed', 'thumbnails/150x150' 等)
   * @param {string} filename - 文件名
   * @param {Date} [date] - 日期对象，默认为当前日期
   * @returns {string} 完整的文件存储路径
   *
   * 路径格式: uploads/images/{type}/{YYYY}/{MM}/{DD}/{filename}
   *
   * 架构说明：
   * - 按日期分层存储，避免单目录文件过多
   * - 支持不同类型的文件存储（原图、压缩图、缩略图）
   * - 路径安全验证，防止目录遍历攻击
   *
   * @example
   * const filePath = FileUploadUtils.buildFilePath('original', 'photo.jpg');
   * // 输出: uploads/images/original/2025/09/17/photo.jpg
   */
  static buildFilePath(type, filename, date = new Date()) {
    try {
      // 参数验证
      if (!type || typeof type !== 'string') {
        throw new Error('无效的文件类型');
      }

      if (!filename || typeof filename !== 'string') {
        throw new Error('无效的文件名');
      }

      // 安全检查：防止路径遍历
      const safeType = type.replace(/\.\./g, '').replace(/[\/\\]/g, '/');
      const safeFilename = path.basename(filename); // 确保只是文件名，不包含路径

      // 构建日期路径
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // 组合完整路径
      return path.join('uploads', 'images', safeType, year.toString(), month, day, safeFilename);

    } catch (error) {
      throw new Error(`构建文件路径失败: ${error.message}`);
    }
  }

  /**
   * 构建文件访问URL
   *
   * @param {string} filePath - 文件存储路径
   * @param {string} [baseUrl] - 基础URL，默认使用当前服务器
   * @returns {string} 完整的文件访问URL
   *
   * @example
   * const url = FileUploadUtils.buildFileUrl('uploads/images/original/2025/09/17/photo.jpg');
   * // 输出: http://152.136.155.183/uploads/images/original/2025/09/17/photo.jpg
   */
  static buildFileUrl(filePath, baseUrl = 'http://152.136.155.183') {
    try {
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('无效的文件路径');
      }

      // 确保路径以正斜杠开头
      const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

      // 移除baseUrl末尾的斜杠，避免双斜杠
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      return `${cleanBaseUrl}${normalizedPath}`;

    } catch (error) {
      throw new Error(`构建文件URL失败: ${error.message}`);
    }
  }

  /**
   * 获取文件扩展名（小写）
   *
   * @param {string} filename - 文件名
   * @returns {string} 文件扩展名（包含点号，如 '.jpg'）
   */
  static getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    return path.extname(filename).toLowerCase();
  }

  /**
   * 检查是否为支持的图片扩展名
   *
   * @param {string} filename - 文件名
   * @returns {boolean} 是否为支持的图片格式
   */
  static isSupportedImageExtension(filename) {
    const ext = this.getFileExtension(filename);
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    return supportedExtensions.includes(ext);
  }
}

module.exports = FileUploadUtils;
