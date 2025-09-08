// 作品上传API服务
import { cloudStorageService } from '../utils/cloud-storage.js';
import { supabase } from '../utils/supabase-client.js';

class WorksUploadService {
  constructor() {
    this.tableName = 'works';
  }

  // 创建新作品记录
  async createWork(workData) {
    try {
      console.log('📝 创建作品记录:', workData);

      // 构建作品数据
      const workRecord = {
        title: workData.title || '新上传的作品',
        description: workData.description || '',
        cover_image: workData.coverImage,
        images: workData.images || [workData.coverImage],
        user_id: workData.userId || 'anonymous',
        user_name: workData.userName || '匿名用户',
        user_avatar: workData.userAvatar || '',
        category: workData.category || 'other',
        tags: workData.tags || [],
        location: workData.location || '',
        camera_params: workData.cameraParams || {},
        stats: {
          likes: 0,
          comments: 0,
          views: 0,
          shares: 0
        },
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 插入到Supabase数据库
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([workRecord])
        .select()
        .single();

      if (error) {
        console.error('❌ 数据库插入失败:', error);
        throw new Error(`数据库插入失败: ${error.message}`);
      }

      console.log('✅ 作品记录创建成功:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ 创建作品记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 完整的作品上传流程
  async uploadWork(imageFile, workInfo = {}) {
    let uploadedFileId = null;
    
    try {
      console.log('🚀 开始完整作品上传流程');

      // 第一步：上传图片到云存储
      console.log('📤 步骤1: 上传图片到云存储');
      const uploadResult = await cloudStorageService.uploadImage(imageFile.tempFilePath);
      
      if (!uploadResult.success) {
        throw new Error('图片上传失败');
      }

      uploadedFileId = uploadResult.fileId;
      console.log('✅ 图片上传成功:', uploadResult.url);

      // 第二步：创建作品记录
      console.log('📝 步骤2: 创建作品数据库记录');
      const workData = {
        title: workInfo.title || '新上传的作品',
        description: workInfo.description || '通过手机上传的精彩作品',
        coverImage: uploadResult.url,
        images: [uploadResult.url],
        userId: workInfo.userId || this.generateUserId(),
        userName: workInfo.userName || '摄影爱好者',
        userAvatar: workInfo.userAvatar || 'https://i.pravatar.cc/100?img=99',
        category: workInfo.category || 'photography',
        tags: workInfo.tags || ['手机摄影', '原创作品'],
        location: workInfo.location || '',
        cameraParams: workInfo.cameraParams || {},
        source: imageFile.source || 'upload'
      };

      const createResult = await this.createWork(workData);
      
      if (!createResult.success) {
        // 如果数据库插入失败，删除已上传的图片
        console.warn('⚠️ 数据库插入失败，清理已上传的图片');
        try {
          await cloudStorageService.deleteImage(uploadedFileId);
        } catch (deleteError) {
          console.error('清理图片失败:', deleteError);
        }
        throw new Error(createResult.error);
      }

      console.log('🎉 作品上传完成!');
      return {
        success: true,
        data: {
          work: createResult.data,
          imageUrl: uploadResult.url,
          fileId: uploadedFileId
        }
      };

    } catch (error) {
      console.error('❌ 作品上传流程失败:', error);
      
      // 清理已上传的文件
      if (uploadedFileId) {
        try {
          await cloudStorageService.deleteImage(uploadedFileId);
          console.log('🧹 已清理失败上传的图片');
        } catch (cleanupError) {
          console.error('清理图片失败:', cleanupError);
        }
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成用户ID（临时方案）
  generateUserId() {
    // 尝试从存储中获取用户ID
    try {
      let userId = wx.getStorageSync('user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        wx.setStorageSync('user_id', userId);
      }
      return userId;
    } catch (error) {
      return `temp_${Date.now()}`;
    }
  }

  // 获取用户上传的作品列表
  async getUserWorks(userId, page = 1, pageSize = 10) {
    try {
      const offset = (page - 1) * pageSize;
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`获取用户作品失败: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        hasMore: data && data.length === pageSize
      };

    } catch (error) {
      console.error('❌ 获取用户作品失败:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // 删除作品
  async deleteWork(workId, userId) {
    try {
      // 首先获取作品信息
      const { data: work, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', workId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !work) {
        throw new Error('作品不存在或无权限删除');
      }

      // 删除云存储中的图片
      if (work.images && work.images.length > 0) {
        for (const imageUrl of work.images) {
          try {
            // 从URL提取fileId（这里需要根据实际存储服务调整）
            await cloudStorageService.deleteImage(imageUrl);
          } catch (deleteError) {
            console.warn('删除图片失败:', deleteError);
          }
        }
      }

      // 删除数据库记录
      const { error: deleteError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', workId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`删除作品记录失败: ${deleteError.message}`);
      }

      return {
        success: true,
        message: '作品删除成功'
      };

    } catch (error) {
      console.error('❌ 删除作品失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建单例实例
const worksUploadService = new WorksUploadService();

export { worksUploadService };
export default worksUploadService;
