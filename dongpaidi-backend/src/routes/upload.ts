import { Router } from 'express';
import { UploadController } from '@/controllers/UploadController';
import { authenticate } from '@/middleware/auth';

const router = Router();
const uploadController = new UploadController();

/**
 * 文件上传相关路由
 */

// 获取上传配置信息
router.get('/config', uploadController.getUploadConfig);

// 上传单张图片（需要认证）
router.post('/image', 
  authenticate,
  uploadController.getUploadMiddleware().single('image'),
  uploadController.uploadSingleImage
);

// 批量上传图片（需要认证）
router.post('/images', 
  authenticate,
  uploadController.getUploadMiddleware().multiple('images'),
  uploadController.uploadMultipleImages
);

// 图片预处理（需要认证）
router.post('/preprocess', 
  authenticate,
  uploadController.getUploadMiddleware().single('image'),
  uploadController.preprocessImage
);

// 获取文件信息
router.get('/file/:filename', uploadController.getFileInfo);

// 删除文件（需要认证）
router.delete('/file/:filename', 
  authenticate, 
  uploadController.deleteFile
);

// 获取上传统计信息（需要认证）
router.get('/stats', 
  authenticate, 
  uploadController.getUploadStats
);

// 清理临时文件（管理员接口，需要认证）
router.post('/cleanup', 
  authenticate, 
  uploadController.cleanupTempFiles
);

export default router;
