// 简化的上传服务 - 避免复杂的模块依赖
class SimpleUploadService {
  constructor() {
    this.uploading = false;
  }

  // 简化的图片上传方法
  async uploadImage(tempFilePath, source = 'unknown') {
    console.log('🚀 开始简化上传流程:', tempFilePath);
    
    try {
      this.uploading = true;
      
      // 第一步：模拟云存储上传
      const uploadResult = await this.simulateCloudUpload(tempFilePath);
      
      if (!uploadResult.success) {
        throw new Error('图片上传失败');
      }

      // 第二步：模拟数据库保存
      const workData = this.createWorkData(uploadResult, source);
      const saveResult = await this.simulateDataSave(workData);
      
      if (!saveResult.success) {
        throw new Error('数据保存失败');
      }

      console.log('✅ 简化上传完成');
      return {
        success: true,
        data: {
          work: saveResult.work,
          imageUrl: uploadResult.url
        }
      };

    } catch (error) {
      console.error('❌ 简化上传失败:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.uploading = false;
    }
  }

  // 模拟云存储上传
  async simulateCloudUpload(tempFilePath) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟95%成功率
        if (Math.random() > 0.05) {
          const mockUrl = `https://mock-cdn.example.com/images/${Date.now()}.jpg`;
          resolve({
            success: true,
            url: mockUrl,
            fileId: `file_${Date.now()}`
          });
        } else {
          resolve({
            success: false,
            error: '网络连接失败'
          });
        }
      }, 1500); // 模拟1.5秒上传时间
    });
  }

  // 创建作品数据
  createWorkData(uploadResult, source) {
    return {
      id: `work_${Date.now()}`,
      title: '手机摄影作品',
      description: `通过${source === 'camera' ? '拍照' : '相册'}上传的精彩作品`,
      cover_image: uploadResult.url,
      images: [uploadResult.url],
      user_id: this.getCurrentUserId(),
      user_name: this.getCurrentUserName(),
      user_avatar: this.getCurrentUserAvatar(),
      category: 'photography',
      tags: ['手机摄影', '原创作品'],
      stats: { likes: 0, comments: 0, views: 1 },
      created_at: new Date().toISOString(),
      source: source
    };
  }

  // 模拟数据库保存
  async simulateDataSave(workData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟保存到本地存储
        try {
          const existingWorks = wx.getStorageSync('uploaded_works') || [];
          existingWorks.unshift(workData); // 添加到开头
          
          // 只保留最近50个作品
          if (existingWorks.length > 50) {
            existingWorks.splice(50);
          }
          
          wx.setStorageSync('uploaded_works', existingWorks);
          
          resolve({
            success: true,
            work: workData
          });
        } catch (error) {
          resolve({
            success: false,
            error: '本地存储失败'
          });
        }
      }, 500); // 模拟0.5秒保存时间
    });
  }

  // 获取已上传的作品
  getUploadedWorks() {
    try {
      return wx.getStorageSync('uploaded_works') || [];
    } catch (error) {
      console.error('获取已上传作品失败:', error);
      return [];
    }
  }

  // 获取当前用户ID
  getCurrentUserId() {
    try {
      let userId = wx.getStorageSync('simple_user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        wx.setStorageSync('simple_user_id', userId);
      }
      return userId;
    } catch (error) {
      return `temp_${Date.now()}`;
    }
  }

  // 获取当前用户名
  getCurrentUserName() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      return userInfo?.nickName || '摄影爱好者';
    } catch (error) {
      return '摄影爱好者';
    }
  }

  // 获取当前用户头像
  getCurrentUserAvatar() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      return userInfo?.avatarUrl || 'https://i.pravatar.cc/100?img=99';
    } catch (error) {
      return 'https://i.pravatar.cc/100?img=99';
    }
  }

  // 删除作品
  deleteWork(workId) {
    try {
      const works = this.getUploadedWorks();
      const filteredWorks = works.filter(work => work.id !== workId);
      wx.setStorageSync('uploaded_works', filteredWorks);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 清空所有上传的作品
  clearAllWorks() {
    try {
      wx.removeStorageSync('uploaded_works');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const simpleUploadService = new SimpleUploadService();

// 导出服务
module.exports = {
  simpleUploadService
};
