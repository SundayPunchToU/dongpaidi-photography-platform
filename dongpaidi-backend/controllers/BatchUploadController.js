/**
 * 懂拍帝摄影平台 - 批量文件上传控制器
 *
 * 功能说明：
 * - 处理批量文件上传请求
 * - 提供文件验证和安全检查
 * - 集成图片处理和缩略图生成
 * - 支持上传进度跟踪
 * - 完整的错误处理和日志记录
 *
 * 创建时间: 2025-09-17
 * 开发者: Augment Agent
 * 版本: 1.0.0
 *
 * 依赖关系:
 * - FileUploadUtils: 文件上传工具类
 * - ImageProcessingService: 图片处理服务
 * - multer: 文件上传中间件
 * - fs/promises: Node.js文件系统异步操作
 *
 * 架构说明:
 * - 采用控制器模式，分离业务逻辑和路由处理
 * - 所有方法都是异步的，支持高并发处理
 * - 提供统一的响应格式和错误处理
 * - 集成现有的认证和会话管理系统
 * - 支持事务性操作，确保数据一致性
 *
 * 主要方法:
 * - getUploadConfig: 获取上传配置信息
 * - uploadSingleImage: 单图上传处理
 * - uploadBatchImages: 批量图片上传处理
 * - processUploadedFiles: 处理上传的文件
 * - generateFileUrls: 生成文件访问URL
 *
 * 安全特性:
 * - 文件类型和大小验证
 * - 路径遍历攻击防护
 * - 文件名安全处理
 * - 上传数量限制
 * - 会话认证检查
 */

const fs = require('fs').promises;
const path = require('path');
const FileUploadUtils = require('../utils/FileUploadUtils');
const ImageProcessingService = require('../services/ImageProcessingService');

/**
 * 批量文件上传控制器类
 * 提供完整的文件上传处理功能
 */
class BatchUploadController {

  /**
   * 构造函数
   *
   * @param {Object} options - 配置选项
   * @param {string} options.uploadPath - 上传文件存储根路径
   * @param {boolean} options.enableLogging - 是否启用日志记录
   */
  constructor(options = {}) {
    this.uploadPath = options.uploadPath || path.join(process.cwd(), 'uploads');
    this.enableLogging = options.enableLogging !== false;

    // 初始化图片处理服务
    this.imageService = new ImageProcessingService({
      uploadPath: this.uploadPath,
      enableLogging: this.enableLogging
    });

    if (this.enableLogging) {
      console.log('📤 BatchUploadController 初始化完成');
      console.log(`   上传路径: ${this.uploadPath}`);
    }
  }

  /**
   * 获取上传配置信息
   *
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   *
   * 响应格式：
   * {
   *   "success": true,
   *   "data": {
   *     "maxFileSize": 10485760,
   *     "maxFileCount": 9,
   *     "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
   *     "allowedExtensions": [".jpg", ".jpeg", ".png", ".webp"]
   *   }
   * }
   *
   * @example
   * GET /api/v1/upload/config
   */
  async getUploadConfig(req, res) {
    try {
      if (this.enableLogging) {
        console.log('📋 获取上传配置请求');
      }

      const config = {
        maxFileSize: FileUploadUtils.MAX_FILE_SIZE,
        maxFileCount: FileUploadUtils.MAX_FILES_COUNT,
        allowedTypes: FileUploadUtils.ALLOWED_MIME_TYPES,
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        uploadPath: '/uploads/images/',
        thumbnailSizes: ImageProcessingService.THUMBNAIL_SIZES.map(size => ({
          name: size.name,
          width: size.width,
          height: size.height
        })),
        qualitySettings: ImageProcessingService.QUALITY_SETTINGS
      };

      res.json({
        success: true,
        message: '上传配置获取成功',
        data: config
      });

      if (this.enableLogging) {
        console.log('✅ 上传配置返回成功');
      }

    } catch (error) {
      console.error('❌ 获取上传配置失败:', error);

      res.status(500).json({
        success: false,
        message: '获取上传配置失败',
        error: this.enableLogging ? error.message : '服务器内部错误'
      });
    }
  }

  /**
   * 单图上传处理
   *
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   *
   * 请求格式：
   * - Content-Type: multipart/form-data
   * - 字段名: image
   * - 请求头: x-session-id
   *
   * 响应格式：
   * {
   *   "success": true,
   *   "data": {
   *     "filename": "1726567890123-a8b9c2d1-photo.jpg",
   *     "originalName": "photo.jpg",
   *     "urls": {
   *       "original": "http://152.136.155.183/uploads/images/original/2025/09/17/...",
   *       "compressed": "http://152.136.155.183/uploads/images/compressed/2025/09/17/...",
   *       "thumbnails": {...}
   *     },
   *     "metadata": {...}
   *   }
   * }
   *
   * @example
   * POST /api/v1/upload/single-image
   * Content-Type: multipart/form-data
   * x-session-id: valid-session-id
   *
   * Body: image=@photo.jpg
   */
  async uploadSingleImage(req, res) {
    try {
      if (this.enableLogging) {
        console.log('📤 单图上传请求开始');
      }

      // 检查文件是否存在
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件'
        });
      }

      // 处理单个文件
      const result = await this.processSingleFile(req.file);

      res.json({
        success: true,
        message: '图片上传成功',
        data: result
      });

      if (this.enableLogging) {
        console.log(`✅ 单图上传完成: ${result.filename}`);
      }

    } catch (error) {
      console.error('❌ 单图上传失败:', error);

      res.status(500).json({
        success: false,
        message: '图片上传失败',
        error: this.enableLogging ? error.message : '服务器内部错误'
      });
    }
  }

  /**
   * 批量图片上传处理
   *
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   *
   * 请求格式：
   * - Content-Type: multipart/form-data
   * - 字段名: images (数组)
   * - 请求头: x-session-id
   *
   * 响应格式：
   * {
   *   "success": true,
   *   "data": {
   *     "results": [...],
   *     "summary": {
   *       "total": 5,
   *       "successful": 4,
   *       "failed": 1,
   *       "successRate": "80.0%"
   *     }
   *   }
   * }
   *
   * @example
   * POST /api/v1/upload/batch-images
   * Content-Type: multipart/form-data
   * x-session-id: valid-session-id
   *
   * Body: images=@photo1.jpg&images=@photo2.jpg&images=@photo3.jpg
   */
  async uploadBatchImages(req, res) {
    try {
      if (this.enableLogging) {
        console.log('📤 批量上传请求开始');
      }

      // 检查文件是否存在
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件'
        });
      }

      // 验证文件数量
      const filesCountValidation = FileUploadUtils.validateFilesCount(req.files.length);
      if (!filesCountValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: filesCountValidation.message
        });
      }

      if (this.enableLogging) {
        console.log(`📊 开始处理 ${req.files.length} 个文件`);
      }

      // 批量处理文件
      const results = await this.processBatchFiles(req.files);

      // 统计处理结果
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      const response = {
        success: true,
        message: `批量上传完成：${successful.length}成功，${failed.length}失败`,
        data: {
          results: results,
          summary: {
            total: req.files.length,
            successful: successful.length,
            failed: failed.length,
            successRate: ((successful.length / req.files.length) * 100).toFixed(1) + '%'
          }
        }
      };

      res.json(response);

      if (this.enableLogging) {
        console.log(`✅ 批量上传完成: ${successful.length}/${req.files.length} 成功`);
      }

    } catch (error) {
      console.error('❌ 批量上传失败:', error);

      res.status(500).json({
        success: false,
        message: '批量上传失败',
        error: this.enableLogging ? error.message : '服务器内部错误'
      });
    }
  }

  /**
   * 处理单个文件
   *
   * @param {Object} file - Multer文件对象
   * @returns {Promise<Object>} 处理结果
   *
   * 处理流程：
   * 1. 文件验证（类型、大小）
   * 2. 生成安全文件名
   * 3. 图片处理（压缩、缩略图）
   * 4. 文件保存
   * 5. 生成访问URL
   *
   * @throws {Error} 当文件处理失败时抛出错误
   */
  async processSingleFile(file) {
    try {
      // 1. 文件验证
      const typeValidation = FileUploadUtils.validateFileType(file);
      if (!typeValidation.isValid) {
        throw new Error(typeValidation.message);
      }

      const sizeValidation = FileUploadUtils.validateFileSize(file.size);
      if (!sizeValidation.isValid) {
        throw new Error(sizeValidation.message);
      }

      // 2. 生成安全文件名
      const safeFilename = FileUploadUtils.generateSafeFilename(file.originalname);

      if (this.enableLogging) {
        console.log(`🔄 处理文件: ${file.originalname} -> ${safeFilename}`);
      }

      // 3. 图片处理
      const processedImages = await this.processImageFile(file.buffer, safeFilename);

      // 4. 文件保存
      const savedFiles = await this.saveProcessedImages(processedImages, safeFilename);

      // 5. 生成访问URL
      const urls = this.generateFileUrls(savedFiles, safeFilename);

      // 6. 提取元数据
      const metadata = await this.imageService.extractMetadata(file.buffer);

      return {
        filename: safeFilename,
        originalName: file.originalname,
        size: file.size,
        urls: urls,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          orientation: metadata.orientation,
          aspectRatio: metadata.aspectRatio
        },
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`文件处理失败 (${file.originalname}): ${error.message}`);
    }
  }

  /**
   * 批量处理文件
   *
   * @param {Array} files - Multer文件对象数组
   * @returns {Promise<Array>} 处理结果数组
   *
   * 性能优化：
   * - 并发处理多个文件
   * - 错误隔离，单个文件失败不影响其他文件
   * - 内存管理，避免大量文件同时处理导致内存溢出
   */
  async processBatchFiles(files) {
    const results = [];
    const concurrency = 3; // 限制并发数，避免内存溢出

    if (this.enableLogging) {
      console.log(`🔄 开始批量处理 ${files.length} 个文件，并发数: ${concurrency}`);
    }

    // 分批处理，控制并发
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchPromises = batch.map(async (file, index) => {
        try {
          const result = await this.processSingleFile(file);

          return {
            index: i + index,
            filename: file.originalname,
            success: true,
            data: result
          };

        } catch (error) {
          if (this.enableLogging) {
            console.error(`❌ 文件处理失败: ${file.originalname} - ${error.message}`);
          }

          return {
            index: i + index,
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (this.enableLogging) {
        const processed = i + batch.length;
        console.log(`📊 批量处理进度: ${processed}/${files.length} (${((processed / files.length) * 100).toFixed(1)}%)`);
      }
    }

    return results;
  }

  /**
   * 处理图片文件
   *
   * @param {Buffer} imageBuffer - 图片二进制数据
   * @param {string} filename - 文件名
   * @returns {Promise<Object>} 处理后的图片数据
   *
   * 处理内容：
   * - 原图保存（高质量）
   * - 压缩图生成（平衡质量和大小）
   * - 多尺寸缩略图生成
   */
  async processImageFile(imageBuffer, filename) {
    try {
      if (this.enableLogging) {
        console.log(`🔍 开始处理图片文件: ${filename}`);
      }

      // 处理原图（高质量保存）
      const originalImage = await this.imageService.processImage(imageBuffer, filename, {
        quality: 'original',
        format: 'jpeg'
      });

      if (this.enableLogging) {
        console.log(`📸 原图处理结果:`, originalImage ? Object.keys(originalImage) : 'undefined');
      }
      // 结构校验：原图
      if (!originalImage || !originalImage.buffer) {
        throw new Error('原图处理结果缺失: originalImage/buffer 未生成');
      }

      // 处理压缩图（Web优化）
      const compressedImage = await this.imageService.processImage(imageBuffer, filename, {
        quality: 'compressed',
        format: 'jpeg'
      });

      if (this.enableLogging) {
        console.log(`🗜️  压缩图处理结果:`, compressedImage ? Object.keys(compressedImage) : 'undefined');
      }
      // 结构校验：压缩图
      if (!compressedImage || !compressedImage.buffer) {
        throw new Error('压缩图处理结果缺失: compressedImage/buffer 未生成');
      }

      // 生成缩略图
      const thumbnails = await this.imageService.generateThumbnails(imageBuffer, filename);

      if (this.enableLogging) {
        console.log(`🖼️  缩略图处理结果:`, Array.isArray(thumbnails) ? `${thumbnails.length}个缩略图` : 'undefined');
      }

      const result = {
        original: originalImage,
        compressed: compressedImage,
        thumbnails: Array.isArray(thumbnails) ? thumbnails : [] // 确保thumbnails是数组
      };

      if (this.enableLogging) {
        console.log(`✅ processImageFile 最终返回结构:`, Object.keys(result));
        console.log(`   - original: ${result.original ? 'exists' : 'undefined'}`);
        console.log(`   - compressed: ${result.compressed ? 'exists' : 'undefined'}`);
        console.log(`   - thumbnails: ${Array.isArray(result.thumbnails) ? result.thumbnails.length + ' items' : 'not array'}`);
      }

      return result;

    } catch (error) {
      if (this.enableLogging) {
        console.error(`❌ processImageFile 处理失败: ${error.message}`);
      }
      throw new Error(`图片处理失败: ${error.message}`);
    }
  }

  /**
   * 保存处理后的图片
   *
   * @param {Object} processedImages - 处理后的图片数据
   * @param {string} filename - 文件名
   * @returns {Promise<Object>} 保存的文件路径信息
   *
   * 保存策略：
   * - 按日期分目录存储
   * - 原图、压缩图、缩略图分别存储
   * - 确保目录存在，自动创建
   */
  async saveProcessedImages(processedImages, filename) {
    try {
      const currentDate = new Date();
      const savedFiles = {};

      // 结构健全性检查，避免空对象导致不可读错误
      const shapeKeys = processedImages ? Object.keys(processedImages) : null;
      if (this.enableLogging) {
        console.log('🔎 保存前处理结果形状(初步):', shapeKeys);
      }
      if (!(processedImages
            && processedImages.original
            && processedImages.original.buffer
            && processedImages.compressed
            && processedImages.compressed.buffer
            && Array.isArray(processedImages.thumbnails))) {
        throw new Error(`处理结果结构异常: ${JSON.stringify({ hasProcessed: !!processedImages, keys: shapeKeys })}`);
      }
      if (this.enableLogging) {
        console.log('🔎 保存前处理结果形状(通过校验):', Object.keys(processedImages));
      }

      // 保存原图
      const originalPath = FileUploadUtils.buildFilePath('original', filename, currentDate);
      await this.ensureDirectoryExists(path.dirname(originalPath));
      await fs.writeFile(originalPath, processedImages.original.buffer);
      savedFiles.original = originalPath;

      // 保存压缩图
      const compressedPath = FileUploadUtils.buildFilePath('compressed', filename, currentDate);
      await this.ensureDirectoryExists(path.dirname(compressedPath));
      await fs.writeFile(compressedPath, processedImages.compressed.buffer);
      savedFiles.compressed = compressedPath;

      // 保存缩略图
      savedFiles.thumbnails = {};
      for (const thumbnail of processedImages.thumbnails) {
        const thumbnailPath = FileUploadUtils.buildFilePath(`thumbnails/${thumbnail.size}`, filename, currentDate);
        await this.ensureDirectoryExists(path.dirname(thumbnailPath));
        await fs.writeFile(thumbnailPath, thumbnail.buffer);
        savedFiles.thumbnails[thumbnail.size] = thumbnailPath;
      }

      if (this.enableLogging) {
        console.log(`💾 文件保存完成: ${filename}`);
        console.log(`   原图: ${originalPath}`);
        console.log(`   压缩图: ${compressedPath}`);
        console.log(`   缩略图: ${Object.keys(savedFiles.thumbnails).length}个`);
      }

      return savedFiles;

    } catch (error) {
      throw new Error(`文件保存失败: ${error.message}`);
    }
  }

  /**
   * 生成文件访问URL
   *
   * @param {Object} savedFiles - 保存的文件路径信息
   * @param {string} filename - 文件名
   * @returns {Object} 文件访问URL集合
   */
  generateFileUrls(savedFiles, filename) {
    try {
      const urls = {
        original: FileUploadUtils.buildFileUrl(savedFiles.original),
        compressed: FileUploadUtils.buildFileUrl(savedFiles.compressed),
        thumbnails: {}
      };

      // 生成缩略图URL
      for (const [size, path] of Object.entries(savedFiles.thumbnails)) {
        urls.thumbnails[size] = FileUploadUtils.buildFileUrl(path);
      }

      return urls;

    } catch (error) {
      throw new Error(`URL生成失败: ${error.message}`);
    }
  }

  /**
   * 确保目录存在
   *
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // 目录不存在，创建目录
      await fs.mkdir(dirPath, { recursive: true });

      if (this.enableLogging) {
        console.log(`📁 创建目录: ${dirPath}`);
      }
    }
  }
}

module.exports = BatchUploadController;
