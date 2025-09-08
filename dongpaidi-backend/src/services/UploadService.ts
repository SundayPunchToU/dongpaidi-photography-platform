import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config';
import { log } from '@/config/logger';
import { UploadedFile, UploadResult } from '@/types';
import { BusinessError } from '@/middleware/error';

/**
 * 文件上传服务类
 */
export class UploadService {
  private uploadPath: string;
  private tempPath: string;

  constructor() {
    this.uploadPath = config.upload.path;
    this.tempPath = config.upload.tempPath;
    this.ensureDirectories();
  }

  /**
   * 上传单张图片
   */
  async uploadImage(file: UploadedFile): Promise<UploadResult> {
    try {
      // 验证文件类型
      if (!this.isValidImageType(file.mimetype)) {
        throw new BusinessError('不支持的图片格式');
      }

      // 验证文件大小
      if (!this.isValidFileSize(file.size)) {
        throw new BusinessError('图片文件过大');
      }

      // 生成唯一文件名
      const filename = this.generateFilename(file.originalname);
      const filepath = path.join(this.uploadPath, filename);

      // 处理图片（压缩、格式转换）
      await this.processImage(file.buffer, filepath);

      // 生成访问URL
      const url = this.generateFileUrl(filename);

      log.info('Image uploaded successfully', { 
        filename, 
        originalName: file.originalname,
        size: file.size 
      });

      return {
        success: true,
        url,
        filename,
        message: '图片上传成功',
      };
    } catch (error: any) {
      log.error('Image upload failed', { 
        error: error.message, 
        filename: file.originalname 
      });
      
      return {
        success: false,
        message: error.message || '图片上传失败',
      };
    }
  }

  /**
   * 批量上传图片
   */
  async uploadMultipleImages(files: UploadedFile[]): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadImage(file);
      results.push(result);
    }

    return results;
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.uploadPath, filename);
      await fs.unlink(filepath);
      
      log.info('File deleted successfully', { filename });
      return true;
    } catch (error: any) {
      log.error('File deletion failed', { error: error.message, filename });
      return false;
    }
  }

  /**
   * 处理图片（压缩、格式转换、生成缩略图）
   */
  private async processImage(buffer: Buffer, outputPath: string): Promise<void> {
    try {
      // 获取图片信息
      const metadata = await sharp(buffer).metadata();
      
      // 基础处理：压缩质量、格式转换
      let processor = sharp(buffer)
        .jpeg({ quality: config.business.image.quality })
        .withMetadata();

      // 如果图片过大，进行尺寸压缩
      if (metadata.width && metadata.width > 2048) {
        processor = processor.resize(2048, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // 保存处理后的图片
      await processor.toFile(outputPath);

      // 生成缩略图
      await this.generateThumbnails(buffer, outputPath);
    } catch (error: any) {
      log.error('Image processing failed', { error: error.message });
      throw new BusinessError('图片处理失败');
    }
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnails(buffer: Buffer, originalPath: string): Promise<void> {
    const thumbnailSizes = config.business.image.thumbnailSizes;
    const { dir, name, ext } = path.parse(originalPath);

    for (const size of thumbnailSizes) {
      try {
        const thumbnailPath = path.join(dir, `${name}_${size}${ext}`);
        
        await sharp(buffer)
          .resize(size, size, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: config.business.image.quality })
          .toFile(thumbnailPath);
      } catch (error: any) {
        log.warn('Thumbnail generation failed', { 
          error: error.message, 
          size, 
          originalPath 
        });
      }
    }
  }

  /**
   * 验证图片类型
   */
  private isValidImageType(mimetype: string): boolean {
    return config.upload.allowedTypes.includes(mimetype);
  }

  /**
   * 验证文件大小
   */
  private isValidFileSize(size: number): boolean {
    return size <= config.upload.maxSize;
  }

  /**
   * 生成唯一文件名
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${timestamp}_${uuid}${ext}`;
  }

  /**
   * 生成文件访问URL
   */
  private generateFileUrl(filename: string): string {
    // 在开发环境下返回本地URL，生产环境下应该返回CDN URL
    if (config.server.isDevelopment) {
      return `http://localhost:${config.server.port}/uploads/${filename}`;
    }
    
    // 生产环境下的CDN URL
    return `https://cdn.dongpaidi.com/images/${filename}`;
  }

  /**
   * 确保上传目录存在
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(this.tempPath, { recursive: true });
    } catch (error: any) {
      log.error('Failed to create upload directories', { error: error.message });
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string): Promise<any> {
    try {
      const filepath = path.join(this.uploadPath, filename);
      const stats = await fs.stat(filepath);
      
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error: any) {
      throw new BusinessError('文件不存在');
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.tempPath);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(this.tempPath, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
          log.info('Temp file cleaned up', { file });
        }
      }
    } catch (error: any) {
      log.error('Temp file cleanup failed', { error: error.message });
    }
  }
}

export default UploadService;
