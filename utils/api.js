// 小程序API服务层 - 连接Supabase后端
import {
  supabase,
  userAPI,
  worksAPI,
  fileAPI
} from './supabase-client.js'

// ==================== 用户服务 ====================

class UserService {
  /**
   * 微信登录
   */
  static async login() {
    try {
      // 获取微信用户信息
      const userInfo = await this.getWechatUserInfo()
      
      // 调用Supabase登录
      const result = await userAPI.login(userInfo.openid || 'temp_openid', userInfo)
      
      if (result.user) {
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', result.user)
        wx.setStorageSync('isLoggedIn', true)
      }
      
      return result
    } catch (error) {
      console.error('登录失败:', error)
      return { user: null, error }
    }
  }

  /**
   * 获取微信用户信息
   */
  static getWechatUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => resolve(res.userInfo),
        fail: reject
      })
    })
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(updates) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    const result = await userAPI.updateProfile(userInfo.id, updates)
    
    if (result.data) {
      // 更新本地存储
      wx.setStorageSync('userInfo', result.data)
    }
    
    return result
  }

  /**
   * 登出
   */
  static logout() {
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('isLoggedIn')
    wx.reLaunch({ url: '/pages/discover/index' })
  }
}

// ==================== 作品服务 ====================

class WorksService {
  /**
   * 发布作品
   */
  static async publish(workData) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    const result = await worksAPI.publish({
      ...workData,
      user_id: userInfo.id
    })

    return result
  }

  /**
   * 获取作品列表
   */
  static async getList(params = {}) {
    const result = await worksAPI.getList(params.page, params.limit, params.category)
    
    // 转换数据格式以适配现有前端代码
    if (result.data) {
      result.data = result.data.map(work => ({
        id: work.id,
        userId: work.user_id,
        userName: work.users?.nickname || '匿名用户',
        userAvatar: work.users?.avatar_url || '/static/default-avatar.png',
        title: work.title,
        description: work.description,
        coverImage: work.cover_image || work.images?.[0],
        images: work.images || [],
        tags: work.tags || [],
        category: work.category,
        location: work.location,
        stats: {
          likes: work.like_count || 0,
          comments: work.comment_count || 0,
          views: work.view_count || 0
        },
        isLiked: false, // 需要单独查询
        createdAt: work.created_at,
        imageWidth: 400, // 默认宽度
        imageHeight: 400 + Math.random() * 400 // 随机高度用于瀑布流
      }))
    }

    return result
  }

  /**
   * 获取作品详情
   */
  static async getDetail(workId) {
    const result = await worksAPI.getDetail(workId)
    
    if (result.data) {
      // 转换数据格式
      const work = result.data
      result.data = {
        id: work.id,
        title: work.title,
        description: work.description,
        images: work.images || [],
        tags: work.tags || [],
        location: work.location,
        shootingInfo: work.shooting_info || {},
        author: {
          id: work.users?.id,
          name: work.users?.nickname,
          avatar: work.users?.avatar_url,
          description: work.users?.bio,
          isFollowed: false // 需要单独查询
        },
        viewCount: work.view_count || 0,
        likeCount: work.like_count || 0,
        commentCount: work.comment_count || 0,
        collectCount: work.collect_count || 0,
        isLiked: false, // 需要单独查询
        isCollected: false, // 需要单独查询
        publishTime: this.formatTime(work.created_at)
      }
    }

    return result
  }

  /**
   * 点赞作品
   */
  static async like(workId) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    // 暂时返回模拟结果，后续需要在supabase-client.js中实现toggleLike方法
    return { success: true, message: '点赞功能待实现' }
  }

  /**
   * 格式化时间
   */
  static formatTime(timestamp) {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now - time
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return time.toLocaleDateString()
  }
}

// ==================== 社交服务 ====================

class SocialService {
  /**
   * 关注用户
   */
  static async follow(userId) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    // 暂时返回模拟结果，后续需要在supabase-client.js中实现toggleFollow方法
    return { success: true, message: '关注功能待实现' }
  }

  /**
   * 发表评论
   */
  static async comment(workId, content, parentId = null) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    // 暂时返回模拟结果，后续需要在supabase-client.js中实现addComment方法
    return { success: true, message: '评论功能待实现' }
  }

  /**
   * 获取评论列表
   */
  static async getCommentList(workId, page = 1) {
    // 暂时返回模拟结果，后续需要在supabase-client.js中实现getComments方法
    return { data: [], error: null }
  }
}

// ==================== 约拍服务 ====================

class AppointmentService {
  /**
   * 发布约拍需求
   */
  static async publish(appointmentData) {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) throw new Error('用户未登录')

    // 暂时返回模拟结果，后续需要在supabase-client.js中实现publishAppointment方法
    return { success: true, message: '约拍发布功能待实现' }
  }

  /**
   * 获取约拍列表
   */
  static async getList(params = {}) {
    // 暂时返回模拟结果，后续需要在supabase-client.js中实现getAppointments方法
    const result = { data: [], error: null }
    
    // 转换数据格式以适配现有前端
    if (result.data) {
      result.data = result.data.map(appointment => ({
        id: appointment.id,
        publisherId: appointment.publisher_id,
        publisherName: appointment.users?.nickname,
        publisherAvatar: appointment.users?.avatar_url,
        type: appointment.type,
        title: appointment.title,
        description: appointment.description,
        category: appointment.category,
        budget: {
          min: appointment.budget_min,
          max: appointment.budget_max,
          type: appointment.budget_type
        },
        location: appointment.location,
        preferredDate: appointment.preferred_date,
        requirements: appointment.requirements,
        applicantCount: appointment.applicant_count,
        status: appointment.status,
        createdAt: appointment.created_at,
        expiresAt: appointment.expires_at
      }))
    }

    return result
  }
}

// ==================== 文件服务 ====================

class FileService {
  /**
   * 上传单张图片
   */
  static async uploadSingle(tempFilePath) {
    try {
      wx.showLoading({ title: '上传中...' })
      
      const result = await fileAPI.uploadImage(tempFilePath)
      
      wx.hideLoading()
      
      if (result.error) {
        wx.showToast({ title: '上传失败', icon: 'error' })
        return null
      }
      
      return result.url
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'error' })
      return null
    }
  }

  /**
   * 批量上传图片
   */
  static async uploadMultiple(tempFilePaths) {
    const uploadPromises = tempFilePaths.map(path => this.uploadSingle(path))
    const results = await Promise.all(uploadPromises)
    return results.filter(url => url !== null)
  }

  /**
   * 选择并上传图片
   */
  static chooseAndUpload(count = 1) {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: count,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          try {
            const urls = await this.uploadMultiple(res.tempFilePaths)
            resolve(urls)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  }
}

// ==================== 导出服务 ====================

export {
  UserService,
  WorksService,
  SocialService,
  AppointmentService,
  FileService,
  supabase
}

// ==================== 全局错误处理 ====================

export function handleApiError(error) {
  console.error('API错误:', error)
  
  let message = '操作失败，请重试'
  
  if (error.message) {
    if (error.message.includes('network')) {
      message = '网络连接失败'
    } else if (error.message.includes('unauthorized')) {
      message = '请先登录'
    } else if (error.message.includes('forbidden')) {
      message = '权限不足'
    }
  }
  
  wx.showToast({
    title: message,
    icon: 'error',
    duration: 2000
  })
  
  return message
}
