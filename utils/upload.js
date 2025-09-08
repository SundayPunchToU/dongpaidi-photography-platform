// 图片上传服务
import { supabase } from './supabase-client.js'

class UploadService {
  constructor() {
    this.bucket = 'works-images' // Supabase Storage bucket名称
  }

  // 上传单张图片
  async uploadImage(filePath, fileName = null) {
    try {
      console.log('📸 开始上传图片:', filePath)
      
      // 生成唯一文件名
      if (!fileName) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        const extension = this.getFileExtension(filePath)
        fileName = `${timestamp}_${random}.${extension}`
      }
      
      console.log('📝 文件名:', fileName)
      
      // 上传到Supabase Storage
      const result = await supabase.uploadFile(this.bucket, fileName, filePath)
      
      if (result.error) {
        throw new Error(`上传失败: ${result.error.message}`)
      }
      
      // 获取公共URL
      const publicUrl = supabase.getPublicUrl(this.bucket, fileName)
      
      console.log('✅ 图片上传成功:', publicUrl)
      
      return {
        success: true,
        url: publicUrl,
        fileName: fileName,
        message: '上传成功'
      }
      
    } catch (error) {
      console.error('❌ 图片上传失败:', error)
      return {
        success: false,
        url: null,
        fileName: null,
        message: error.message || '上传失败'
      }
    }
  }

  // 批量上传图片
  async uploadMultipleImages(filePaths, onProgress = null) {
    try {
      console.log('📸 开始批量上传图片:', filePaths.length, '张')
      
      const results = []
      const total = filePaths.length
      
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i]
        
        // 更新进度
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            percent: Math.round(((i + 1) / total) * 100)
          })
        }
        
        // 上传单张图片
        const result = await this.uploadImage(filePath)
        results.push(result)
        
        // 如果某张图片上传失败，记录但继续上传其他图片
        if (!result.success) {
          console.warn(`⚠️ 第${i + 1}张图片上传失败:`, result.message)
        }
      }
      
      // 统计上传结果
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      console.log(`📊 批量上传完成: 成功${successCount}张, 失败${failCount}张`)
      
      return {
        success: successCount > 0,
        results: results,
        successCount: successCount,
        failCount: failCount,
        urls: results.filter(r => r.success).map(r => r.url)
      }
      
    } catch (error) {
      console.error('❌ 批量上传异常:', error)
      return {
        success: false,
        results: [],
        successCount: 0,
        failCount: filePaths.length,
        urls: [],
        message: error.message || '批量上传失败'
      }
    }
  }

  // 压缩图片（小程序版本）
  async compressImage(filePath, quality = 0.8) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: filePath,
        quality: quality,
        success: (res) => {
          console.log('✅ 图片压缩成功:', res.tempFilePath)
          resolve(res.tempFilePath)
        },
        fail: (error) => {
          console.warn('⚠️ 图片压缩失败，使用原图:', error)
          resolve(filePath) // 压缩失败时使用原图
        }
      })
    })
  }

  // 获取文件扩展名
  getFileExtension(filePath) {
    const parts = filePath.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : 'jpg'
  }

  // 验证图片格式
  isValidImageFormat(filePath) {
    const extension = this.getFileExtension(filePath).toLowerCase()
    const validFormats = ['jpg', 'jpeg', 'png', 'webp']
    return validFormats.includes(extension)
  }

  // 获取图片信息
  getImageInfo(filePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success: (res) => {
          resolve({
            width: res.width,
            height: res.height,
            path: res.path,
            size: res.size || 0
          })
        },
        fail: reject
      })
    })
  }

  // 删除Supabase Storage中的图片
  async deleteImage(fileName) {
    try {
      const result = await supabase.deleteFile(this.bucket, fileName)
      
      if (result.error) {
        throw new Error(`删除失败: ${result.error.message}`)
      }
      
      console.log('✅ 图片删除成功:', fileName)
      return { success: true }
      
    } catch (error) {
      console.error('❌ 图片删除失败:', error)
      return { 
        success: false, 
        message: error.message || '删除失败' 
      }
    }
  }
}

// 创建全局上传服务实例
export const uploadService = new UploadService()

// 导出便捷方法
export const {
  uploadImage,
  uploadMultipleImages,
  compressImage,
  deleteImage
} = uploadService
