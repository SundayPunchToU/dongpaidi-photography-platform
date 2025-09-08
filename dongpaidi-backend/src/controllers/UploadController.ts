import { Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '@/services/UploadService';
import { ResponseUtil } from '@/utils/response';
import { asyncHandler } from '@/middleware/error';
import { log } from '@/config/logger';
import { config } from '@/config';
import { AuthenticatedRequest, UploadedFile } from '@/types';

/**
 * 文件上传控制器
 */
export class UploadController {
  private uploadService: UploadService;
  private upload: multer.Multer;

  constructor() {
    this.uploadService = new UploadService();
    this.setupMulter();
  }

  /**
   * 配置multer
   */
  private setupMulter(): void {
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: config.upload.maxSize,
        files: 9, // 最多9张图片
      },
      fileFilter: (req, file, cb) => {
        // 验证文件类型
        if (config.upload.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('不支持的文件类型'));
        }
      },
    });
  }

  /**
   * 获取multer中间件
   */
  getUploadMiddleware() {
    return {
      single: this.upload.single.bind(this.upload),
      multiple: this.upload.array.bind(this.upload),
    };
  }

  /**
   * 上传单张图片
   */
  uploadSingleImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return ResponseUtil.error(res, '请选择要上传的图片', 400);
    }

    const file: UploadedFile = req.file as any;
    const result = await this.uploadService.uploadImage(file);

    if (!result.success) {
      return ResponseUtil.error(res, result.message, 400);
    }

    log.info('Single image uploaded', { 
      userId: req.user.id,
      filename: result.filename,
      originalName: file.originalname,
      size: file.size,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '图片上传成功');
  });

  /**
   * 批量上传图片
   */
  uploadMultipleImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return ResponseUtil.error(res, '请选择要上传的图片', 400);
    }

    const files: UploadedFile[] = req.files as any[];
    
    if (files.length > 9) {
      return ResponseUtil.error(res, '最多只能上传9张图片', 400);
    }

    const results = await this.uploadService.uploadMultipleImages(files);
    
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    log.info('Multiple images uploaded', { 
      userId: req.user.id,
      totalFiles: files.length,
      successCount: successResults.length,
      failedCount: failedResults.length,
      ip: req.ip,
    });

    if (successResults.length === 0) {
      return ResponseUtil.error(res, '所有图片上传失败', 400);
    }

    const responseData = {
      success: successResults,
      failed: failedResults,
      summary: {
        total: files.length,
        successCount: successResults.length,
        failedCount: failedResults.length,
      },
    };

    const message = failedResults.length > 0 
      ? `${successResults.length}张图片上传成功，${failedResults.length}张失败`
      : '所有图片上传成功';

    ResponseUtil.success(res, responseData, message);
  });

  /**
   * 删除文件
   */
  deleteFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename } = req.params;

    if (!filename) {
      return ResponseUtil.error(res, '文件名不能为空', 400);
    }

    // TODO: 验证文件所有权
    // 1. 检查文件是否属于当前用户
    // 2. 检查文件是否正在被使用

    const success = await this.uploadService.deleteFile(filename);

    if (!success) {
      return ResponseUtil.error(res, '文件删除失败', 500);
    }

    log.info('File deleted', { 
      userId: req.user.id,
      filename,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '文件删除成功');
  });

  /**
   * 获取文件信息
   */
  getFileInfo = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    if (!filename) {
      return ResponseUtil.error(res, '文件名不能为空', 400);
    }

    try {
      const fileInfo = await this.uploadService.getFileInfo(filename);
      ResponseUtil.success(res, fileInfo, '获取文件信息成功');
    } catch (error: any) {
      ResponseUtil.notFound(res, '文件不存在');
    }
  });

  /**
   * 获取上传配置信息
   */
  getUploadConfig = asyncHandler(async (req: Request, res: Response) => {
    const uploadConfig = {
      maxSize: config.upload.maxSize,
      maxFiles: 9,
      allowedTypes: config.upload.allowedTypes,
      supportedFormats: ['JPEG', 'PNG', 'WebP'],
      maxDimensions: {
        width: 4096,
        height: 4096,
      },
      thumbnailSizes: config.business.image.thumbnailSizes,
    };

    ResponseUtil.success(res, uploadConfig, '获取上传配置成功');
  });

  /**
   * 清理临时文件（管理员接口）
   */
  cleanupTempFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: 添加管理员权限验证

    const maxAge = req.query.maxAge ? 
      parseInt(req.query.maxAge as string) * 60 * 60 * 1000 : // 小时转毫秒
      24 * 60 * 60 * 1000; // 默认24小时

    await this.uploadService.cleanupTempFiles(maxAge);

    log.info('Temp files cleanup', { 
      userId: req.user.id,
      maxAge,
      ip: req.ip,
    });

    ResponseUtil.success(res, null, '临时文件清理完成');
  });

  /**
   * 图片预处理（压缩、格式转换等）
   */
  preprocessImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return ResponseUtil.error(res, '请选择要处理的图片', 400);
    }

    const file: UploadedFile = req.file as any;
    const options = {
      quality: req.body.quality ? parseInt(req.body.quality) : 80,
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
      format: req.body.format || 'jpeg',
    };

    // TODO: 实现图片预处理逻辑
    // 1. 根据参数调整图片质量
    // 2. 调整图片尺寸
    // 3. 转换图片格式
    // 4. 返回处理后的图片URL

    log.info('Image preprocessing', { 
      userId: req.user.id,
      originalName: file.originalname,
      options,
      ip: req.ip,
    });

    ResponseUtil.success(res, { 
      message: '图片预处理功能开发中' 
    }, '图片预处理完成');
  });

  /**
   * 获取上传统计信息
   */
  getUploadStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // TODO: 实现上传统计功能
    // 1. 用户上传文件数量
    // 2. 用户上传文件总大小
    // 3. 今日上传统计
    // 4. 本月上传统计

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      todayUploads: 0,
      monthlyUploads: 0,
      storageUsed: '0 MB',
      storageLimit: '1 GB',
    };

    ResponseUtil.success(res, stats, '获取上传统计成功');
  });
}

export default UploadController;
