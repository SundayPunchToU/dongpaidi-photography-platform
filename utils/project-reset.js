// 项目重置工具 - 清理缓存和状态
class ProjectResetTool {
  constructor() {
    this.resetItems = [
      'uploaded_works',
      'pending_upload', 
      'user_id',
      'simple_user_id',
      'userInfo',
      'isLoggedIn',
      'works_cache',
      'search_history'
    ];
  }

  // 清理所有缓存数据
  clearAllCache() {
    try {
      console.log('🧹 开始清理项目缓存...');
      
      let clearedCount = 0;
      this.resetItems.forEach(key => {
        try {
          wx.removeStorageSync(key);
          clearedCount++;
          console.log(`✅ 已清理: ${key}`);
        } catch (error) {
          console.warn(`⚠️ 清理失败: ${key}`, error);
        }
      });

      console.log(`🎉 缓存清理完成，共清理 ${clearedCount} 项`);
      return { success: true, count: clearedCount };
    } catch (error) {
      console.error('❌ 缓存清理失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 重置用户数据
  resetUserData() {
    try {
      const userKeys = ['user_id', 'simple_user_id', 'userInfo', 'isLoggedIn'];
      userKeys.forEach(key => {
        wx.removeStorageSync(key);
      });
      console.log('✅ 用户数据已重置');
      return { success: true };
    } catch (error) {
      console.error('❌ 用户数据重置失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 重置上传数据
  resetUploadData() {
    try {
      const uploadKeys = ['uploaded_works', 'pending_upload'];
      uploadKeys.forEach(key => {
        wx.removeStorageSync(key);
      });
      console.log('✅ 上传数据已重置');
      return { success: true };
    } catch (error) {
      console.error('❌ 上传数据重置失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取存储使用情况
  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      const details = {
        keys: info.keys,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        usage: ((info.currentSize / info.limitSize) * 100).toFixed(2) + '%'
      };
      
      console.log('📊 存储使用情况:', details);
      return { success: true, data: details };
    } catch (error) {
      console.error('❌ 获取存储信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 检查项目健康状态
  checkProjectHealth() {
    try {
      const health = {
        storage: this.getStorageInfo(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      // 检查关键存储项
      const criticalKeys = ['uploaded_works', 'user_id'];
      health.criticalData = {};
      
      criticalKeys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          health.criticalData[key] = {
            exists: !!data,
            type: typeof data,
            size: data ? JSON.stringify(data).length : 0
          };
        } catch (error) {
          health.criticalData[key] = {
            exists: false,
            error: error.message
          };
        }
      });

      console.log('🏥 项目健康检查:', health);
      return { success: true, data: health };
    } catch (error) {
      console.error('❌ 健康检查失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 修复常见问题
  fixCommonIssues() {
    try {
      console.log('🔧 开始修复常见问题...');
      const fixes = [];

      // 修复1: 确保用户ID存在
      try {
        let userId = wx.getStorageSync('simple_user_id');
        if (!userId) {
          userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          wx.setStorageSync('simple_user_id', userId);
          fixes.push('创建用户ID');
        }
      } catch (error) {
        fixes.push('用户ID修复失败');
      }

      // 修复2: 清理损坏的数据
      try {
        const uploadedWorks = wx.getStorageSync('uploaded_works');
        if (uploadedWorks && !Array.isArray(uploadedWorks)) {
          wx.removeStorageSync('uploaded_works');
          fixes.push('清理损坏的上传数据');
        }
      } catch (error) {
        fixes.push('上传数据检查失败');
      }

      // 修复3: 清理过期的待处理上传
      try {
        const pendingUpload = wx.getStorageSync('pending_upload');
        if (pendingUpload && pendingUpload.timestamp) {
          const age = Date.now() - pendingUpload.timestamp;
          if (age > 24 * 60 * 60 * 1000) { // 超过24小时
            wx.removeStorageSync('pending_upload');
            fixes.push('清理过期的待处理上传');
          }
        }
      } catch (error) {
        fixes.push('待处理上传检查失败');
      }

      console.log(`✅ 修复完成，执行了 ${fixes.length} 项修复:`, fixes);
      return { success: true, fixes: fixes };
    } catch (error) {
      console.error('❌ 修复失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const projectResetTool = new ProjectResetTool();

// 导出工具
export { projectResetTool };
