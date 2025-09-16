// 小程序API服务层 - 连接自建后端API
// 版本: 2.1.0 (阶段3代码质量优化)
// 更新时间: 2025-01-16
//
// 🎯 重构改进:
// - 统一使用新的API客户端
// - 完善错误处理和日志记录
// - 实现真实API调用，移除Mock数据
// - 添加完整的业务逻辑封装
// - 提升代码可读性和可维护性
// - 统一错误处理系统 (阶段3新增)
//
// 📋 服务类说明:
// - UserService: 用户认证和管理
// - WorksService: 作品发布和管理
// - SocialService: 社交功能
// - AppointmentService: 约拍系统
// - FileService: 文件上传
// - MessageService: 消息系统

import {
  apiClient,
  authAPI,
  userAPI,
  worksAPI,
  appointmentAPI,
  messageAPI,
  uploadAPI,
  socialAPI
} from './api-client.js'
import { errorHandler, ErrorTypes, ErrorSeverity, createError } from './error-handler.js'

// ==================== 用户服务 ====================

class UserService {
  /**
   * 微信登录
   * 🔧 修复: 适配后端ResponseUtil响应格式
   */
  static async login() {
    try {
      // 获取微信登录code
      const loginResult = await this.getWechatLoginCode()

      // 获取微信用户信息
      const userInfo = await this.getWechatUserInfo()

      // 调用后端API登录
      const result = await authAPI.wechatLogin(loginResult.code, userInfo)

      if (result.success && result.data) {
        // 后端返回格式: { success: true, data: { user: {...}, tokens: {...} }, message: "登录成功" }
        const { user, tokens } = result.data

        // 保存用户信息和token到本地存储
        wx.setStorageSync('userInfo', user)
        wx.setStorageSync('access_token', tokens.accessToken)
        wx.setStorageSync('refresh_token', tokens.refreshToken)
        wx.setStorageSync('isLoggedIn', true)

        console.log('✅ 微信登录成功:', user.nickname || user.name)
        return { success: true, user: user }
      } else {
        console.error('❌ 微信登录失败:', result.error || result.message)
        return { success: false, error: result.error || result.message || '登录失败' }
      }
    } catch (error) {
      console.error('❌ 微信登录异常:', error)
      return { success: false, error: error.message || '登录失败' }
    }
  }

  /**
   * 获取微信登录code
   */
  static getWechatLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
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
   * 手机号登录
   * 🔧 修复: 适配后端ResponseUtil响应格式
   */
  static async loginWithPhone(phone, code) {
    try {
      const result = await authAPI.phoneLogin(phone, code)

      if (result.success && result.data) {
        // 后端返回格式: { success: true, data: { user: {...}, tokens: {...} }, message: "登录成功" }
        const { user, tokens } = result.data

        // 保存用户信息和token
        wx.setStorageSync('userInfo', user)
        wx.setStorageSync('access_token', tokens.accessToken)
        wx.setStorageSync('refresh_token', tokens.refreshToken)
        wx.setStorageSync('isLoggedIn', true)

        console.log('✅ 手机号登录成功:', user.nickname || user.name)
        return { success: true, user: user }
      } else {
        console.error('❌ 手机号登录失败:', result.error || result.message)
        return { success: false, error: result.error || result.message || '登录失败' }
      }
    } catch (error) {
      console.error('❌ 手机号登录异常:', error)
      return { success: false, error: error.message || '登录失败' }
    }
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(updates) {
    try {
      const result = await userAPI.updateProfile(updates)

      if (result.success && result.data) {
        // 更新本地存储
        const currentUser = wx.getStorageSync('userInfo')
        const updatedUser = { ...currentUser, ...result.data }
        wx.setStorageSync('userInfo', updatedUser)

        console.log('✅ 用户资料更新成功')
        return { success: true, data: updatedUser }
      } else {
        console.error('❌ 用户资料更新失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 用户资料更新异常:', error)
      return { success: false, error: error.message || '更新失败' }
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser() {
    try {
      const result = await authAPI.getCurrentUser()

      if (result.success && result.data) {
        // 更新本地存储
        wx.setStorageSync('userInfo', result.data)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 获取用户信息异常:', error)
      return { success: false, error: error.message || '获取失败' }
    }
  }

  /**
   * 登出
   */
  static async logout() {
    try {
      // 调用后端登出API
      await authAPI.logout()
    } catch (error) {
      console.error('❌ 后端登出失败:', error)
    } finally {
      // 清除本地存储
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('access_token')
      wx.removeStorageSync('refresh_token')
      wx.removeStorageSync('isLoggedIn')

      console.log('✅ 用户已登出')

      // 跳转到首页
      wx.reLaunch({ url: '/pages/discover/index' })
    }
  }

  /**
   * 检查登录状态
   */
  static checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn')
    const userInfo = wx.getStorageSync('userInfo')
    const accessToken = wx.getStorageSync('access_token')

    return !!(isLoggedIn && userInfo && accessToken)
  }

  /**
   * 刷新Token
   * 🔧 修复: 适配后端ResponseUtil响应格式
   */
  static async refreshToken() {
    try {
      const refreshToken = wx.getStorageSync('refresh_token')
      if (!refreshToken) {
        throw new Error('没有刷新令牌')
      }

      const result = await authAPI.refreshToken(refreshToken)

      if (result.success && result.data) {
        // 后端返回格式: { success: true, data: { accessToken: "...", refreshToken: "..." }, message: "令牌刷新成功" }
        const tokens = result.data

        // 更新token
        wx.setStorageSync('access_token', tokens.accessToken)
        wx.setStorageSync('refresh_token', tokens.refreshToken)

        console.log('✅ Token刷新成功')
        return { success: true }
      } else {
        console.error('❌ Token刷新失败:', result.error || result.message)
        // Token刷新失败，需要重新登录
        this.logout()
        return { success: false, error: result.error || result.message || 'Token刷新失败' }
      }
    } catch (error) {
      console.error('❌ Token刷新异常:', error)
      this.logout()
      return { success: false, error: error.message || 'Token刷新失败' }
    }
  }
}

// ==================== 作品服务 ====================

class WorksService {
  /**
   * 发布作品
   */
  static async publish(workData) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await worksAPI.publish(workData)

      if (result.success) {
        console.log('✅ 作品发布成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 作品发布失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 作品发布异常:', error)
      return { success: false, error: error.message || '发布失败' }
    }
  }

  /**
   * 获取作品列表
   */
  static async getList(params = {}) {
    try {
      const result = await worksAPI.getList(params)

      if (result.success && result.data) {
        // 转换数据格式以适配现有前端代码
        const works = result.data.data || result.data
        const transformedWorks = works.map(work => ({
          id: work.id,
          userId: work.userId || work.user_id,
          userName: work.user?.nickname || work.users?.nickname || '匿名用户',
          userAvatar: work.user?.avatarUrl || work.users?.avatar_url || '/static/default-avatar.png',
          title: work.title,
          description: work.description,
          coverImage: work.coverImage || work.cover_image || (Array.isArray(work.images) ? work.images[0] : null),
          images: Array.isArray(work.images) ? work.images : (work.images ? JSON.parse(work.images) : []),
          tags: Array.isArray(work.tags) ? work.tags : (work.tags ? JSON.parse(work.tags) : []),
          category: work.category,
          location: work.location,
          stats: {
            likes: work.likeCount || work.like_count || 0,
            comments: work.commentCount || work.comment_count || 0,
            views: work.viewCount || work.view_count || 0
          },
          isLiked: work.isLiked || false,
          createdAt: work.createdAt || work.created_at,
          imageWidth: 400, // 默认宽度
          imageHeight: 400 + Math.random() * 400 // 随机高度用于瀑布流
        }))

        return {
          success: true,
          data: transformedWorks,
          pagination: result.data.pagination
        }
      } else {
        console.error('❌ 获取作品列表失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取作品列表异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 获取作品详情
   */
  static async getDetail(workId) {
    try {
      const result = await worksAPI.getDetail(workId)

      if (result.success && result.data) {
        // 转换数据格式
        const work = result.data
        const transformedWork = {
          id: work.id,
          title: work.title,
          description: work.description,
          images: Array.isArray(work.images) ? work.images : (work.images ? JSON.parse(work.images) : []),
          tags: Array.isArray(work.tags) ? work.tags : (work.tags ? JSON.parse(work.tags) : []),
          location: work.location,
          shootingInfo: work.shootingInfo || work.shooting_info || {},
          author: {
            id: work.user?.id || work.users?.id,
            name: work.user?.nickname || work.users?.nickname || '匿名用户',
            avatar: work.user?.avatarUrl || work.users?.avatar_url || '/static/default-avatar.png',
            description: work.user?.bio || work.users?.bio || '',
            isFollowed: work.user?.isFollowed || false
          },
          viewCount: work.viewCount || work.view_count || 0,
          likeCount: work.likeCount || work.like_count || 0,
          commentCount: work.commentCount || work.comment_count || 0,
          collectCount: work.collectCount || work.collect_count || 0,
          isLiked: work.isLiked || false,
          isCollected: work.isCollected || false,
          publishTime: this.formatTime(work.createdAt || work.created_at)
        }

        return { success: true, data: transformedWork }
      } else {
        console.error('❌ 获取作品详情失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 获取作品详情异常:', error)
      return { success: false, error: error.message || '获取失败' }
    }
  }

  /**
   * 点赞/取消点赞作品
   */
  static async toggleLike(workId) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await worksAPI.toggleLike(workId)

      if (result.success) {
        console.log('✅ 点赞操作成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 点赞操作失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 点赞操作异常:', error)
      return { success: false, error: error.message || '操作失败' }
    }
  }

  /**
   * 收藏/取消收藏作品
   */
  static async toggleCollection(workId) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await worksAPI.toggleCollection(workId)

      if (result.success) {
        console.log('✅ 收藏操作成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 收藏操作失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 收藏操作异常:', error)
      return { success: false, error: error.message || '操作失败' }
    }
  }

  /**
   * 获取作品评论列表
   */
  static async getCommentList(workId, page = 1, limit = 20) {
    try {
      const result = await worksAPI.getComments(workId, page, limit)

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取评论列表失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取评论列表异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 添加评论
   */
  static async addComment(workId, content, parentId = null) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await worksAPI.addComment(workId, content, parentId)

      if (result.success) {
        console.log('✅ 评论添加成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 评论添加失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 评论添加异常:', error)
      return { success: false, error: error.message || '评论失败' }
    }
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
   * 关注/取消关注用户
   */
  static async toggleFollow(userId) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await socialAPI.toggleFollow(userId)

      if (result.success) {
        console.log('✅ 关注操作成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 关注操作失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 关注操作异常:', error)
      return { success: false, error: error.message || '操作失败' }
    }
  }

  /**
   * 获取关注状态
   */
  static async getFollowStatus(userId) {
    try {
      if (!UserService.checkLoginStatus()) {
        return { success: true, data: { isFollowing: false } }
      }

      const result = await socialAPI.getFollowStatus(userId)

      if (result.success) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取关注状态失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 获取关注状态异常:', error)
      return { success: false, error: error.message || '获取失败' }
    }
  }

  /**
   * 举报内容
   */
  static async report(targetType, targetId, reason, description = '') {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await socialAPI.report(targetType, targetId, reason, description)

      if (result.success) {
        console.log('✅ 举报提交成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 举报提交失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 举报提交异常:', error)
      return { success: false, error: error.message || '举报失败' }
    }
  }

  // 兼容旧版本API
  /**
   * @deprecated 使用 toggleFollow 替代
   */
  static async follow(userId) {
    return this.toggleFollow(userId)
  }

  /**
   * @deprecated 使用 WorksService.addComment 替代
   */
  static async comment(workId, content, parentId = null) {
    return WorksService.addComment(workId, content, parentId)
  }

  /**
   * @deprecated 使用 WorksService.getCommentList 替代
   */
  static async getCommentList(workId, page = 1) {
    return WorksService.getCommentList(workId, page)
  }
}

// ==================== 约拍服务 ====================

class AppointmentService {
  /**
   * 发布约拍需求
   */
  static async publish(appointmentData) {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await appointmentAPI.publish(appointmentData)

      if (result.success) {
        console.log('✅ 约拍发布成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 约拍发布失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 约拍发布异常:', error)
      return { success: false, error: error.message || '发布失败' }
    }
  }

  /**
   * 获取约拍列表
   */
  static async getList(params = {}) {
    try {
      const result = await appointmentAPI.getList(params)

      if (result.success && result.data) {
        // 转换数据格式以适配现有前端
        const appointments = result.data.data || result.data
        const transformedAppointments = appointments.map(appointment => ({
          id: appointment.id,
          publisherId: appointment.publisherId || appointment.publisher_id,
          publisherName: appointment.publisher?.nickname || appointment.users?.nickname || '匿名用户',
          publisherAvatar: appointment.publisher?.avatarUrl || appointment.users?.avatar_url || '/static/default-avatar.png',
          type: appointment.type,
          title: appointment.title,
          description: appointment.description,
          category: appointment.category,
          budget: appointment.budget || {
            min: appointment.budget_min,
            max: appointment.budget_max,
            type: appointment.budget_type
          },
          location: appointment.location,
          preferredDate: appointment.preferredDate || appointment.preferred_date,
          requirements: appointment.requirements,
          applicantCount: appointment.applicantCount || appointment.applicant_count || 0,
          status: appointment.status,
          createdAt: appointment.createdAt || appointment.created_at,
          expiresAt: appointment.expiresAt || appointment.expires_at
        }))

        return {
          success: true,
          data: transformedAppointments,
          pagination: result.data.pagination
        }
      } else {
        console.error('❌ 获取约拍列表失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取约拍列表异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 获取约拍详情
   */
  static async getDetail(appointmentId) {
    try {
      const result = await appointmentAPI.getDetail(appointmentId)

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取约拍详情失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 获取约拍详情异常:', error)
      return { success: false, error: error.message || '获取失败' }
    }
  }

  /**
   * 申请约拍
   */
  static async apply(appointmentId, message = '') {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await appointmentAPI.apply(appointmentId, message)

      if (result.success) {
        console.log('✅ 约拍申请成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 约拍申请失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 约拍申请异常:', error)
      return { success: false, error: error.message || '申请失败' }
    }
  }

  /**
   * 获取约拍申请列表
   */
  static async getApplications(appointmentId, page = 1, limit = 20) {
    try {
      const result = await appointmentAPI.getApplications(appointmentId, page, limit)

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取申请列表失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取申请列表异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 处理约拍申请
   */
  static async handleApplication(applicationId, action, message = '') {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await appointmentAPI.handleApplication(applicationId, action, message)

      if (result.success) {
        console.log('✅ 申请处理成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 申请处理失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 申请处理异常:', error)
      return { success: false, error: error.message || '处理失败' }
    }
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

      const result = await uploadAPI.uploadImage(tempFilePath)

      wx.hideLoading()

      if (result.success && result.data) {
        console.log('✅ 图片上传成功:', result.data.url)
        return result.data.url
      } else {
        console.error('❌ 图片上传失败:', result.error)
        wx.showToast({ title: result.error || '上传失败', icon: 'error' })
        return null
      }
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 图片上传异常:', error)
      wx.showToast({ title: '上传失败', icon: 'error' })
      return null
    }
  }

  /**
   * 批量上传图片
   */
  static async uploadMultiple(tempFilePaths) {
    try {
      wx.showLoading({ title: `上传中 0/${tempFilePaths.length}` })

      const results = []
      for (let i = 0; i < tempFilePaths.length; i++) {
        wx.showLoading({ title: `上传中 ${i + 1}/${tempFilePaths.length}` })

        const result = await uploadAPI.uploadImage(tempFilePaths[i])
        if (result.success && result.data) {
          results.push(result.data.url)
        } else {
          console.error(`❌ 第${i + 1}张图片上传失败:`, result.error)
        }
      }

      wx.hideLoading()

      if (results.length > 0) {
        console.log(`✅ 成功上传 ${results.length}/${tempFilePaths.length} 张图片`)
        if (results.length < tempFilePaths.length) {
          wx.showToast({
            title: `部分上传失败，成功${results.length}张`,
            icon: 'none'
          })
        }
      } else {
        wx.showToast({ title: '上传失败', icon: 'error' })
      }

      return results
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 批量上传异常:', error)
      wx.showToast({ title: '上传失败', icon: 'error' })
      return []
    }
  }

  /**
   * 获取上传配置
   */
  static async getUploadConfig() {
    try {
      const result = await uploadAPI.getUploadConfig()

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取上传配置失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 获取上传配置异常:', error)
      return { success: false, error: error.message || '获取失败' }
    }
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

  /**
   * 选择单张图片并上传
   */
  static chooseAndUploadSingle() {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          try {
            const url = await this.uploadSingle(res.tempFilePaths[0])
            resolve(url)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  }
}

// ==================== 消息服务 ====================

class MessageService {
  /**
   * 获取对话列表
   */
  static async getConversations(page = 1, limit = 20) {
    try {
      const result = await messageAPI.getConversations(page, limit)

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取对话列表失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取对话列表异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 获取对话消息
   */
  static async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const result = await messageAPI.getMessages(conversationId, page, limit)

      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else {
        console.error('❌ 获取消息失败:', result.error)
        return { success: false, error: result.error, data: [] }
      }
    } catch (error) {
      console.error('❌ 获取消息异常:', error)
      return { success: false, error: error.message || '获取失败', data: [] }
    }
  }

  /**
   * 发送消息
   */
  static async sendMessage(receiverId, content, type = 'text') {
    try {
      if (!UserService.checkLoginStatus()) {
        throw new Error('用户未登录')
      }

      const result = await messageAPI.sendMessage(receiverId, content, type)

      if (result.success) {
        console.log('✅ 消息发送成功')
        return { success: true, data: result.data }
      } else {
        console.error('❌ 消息发送失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 消息发送异常:', error)
      return { success: false, error: error.message || '发送失败' }
    }
  }

  /**
   * 标记消息已读
   */
  static async markAsRead(conversationId) {
    try {
      const result = await messageAPI.markAsRead(conversationId)

      if (result.success) {
        return { success: true }
      } else {
        console.error('❌ 标记已读失败:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 标记已读异常:', error)
      return { success: false, error: error.message || '操作失败' }
    }
  }
}

// ==================== 导出服务 ====================

export {
  UserService,
  WorksService,
  SocialService,
  AppointmentService,
  FileService,
  MessageService,
  // 兼容旧版本
  apiClient as supabase
}

// ==================== 全局错误处理 (阶段3优化) ====================

/**
 * 🔧 阶段3优化: 使用统一错误处理系统
 * @deprecated 建议使用 errorHandler.handle() 替代
 */
export function handleApiError(error) {
  console.warn('⚠️ 使用了旧的错误处理方法，建议升级到统一错误处理系统')

  // 使用新的错误处理系统
  const result = errorHandler.handle(error, { operation: 'legacy_api_error' })
  return result.userMessage
}

/**
 * 🔧 阶段3新增: 统一的服务层错误处理
 */
export function handleServiceError(error, context = {}) {
  // 标准化错误
  let standardError = error
  if (!(error instanceof Error)) {
    standardError = createError(
      typeof error === 'string' ? error : '服务调用失败',
      ErrorTypes.BUSINESS,
      ErrorSeverity.MEDIUM
    )
  }

  // 使用统一错误处理器
  const result = errorHandler.handle(standardError, {
    ...context,
    layer: 'service'
  })

  return {
    success: false,
    error: result.userMessage,
    canRetry: result.canRetry,
    recoveryAction: result.recoveryAction
  }
}

/**
 * 🔧 阶段3新增: 业务逻辑错误创建器
 */
export function createBusinessError(message, severity = ErrorSeverity.MEDIUM, details = null) {
  return createError(message, ErrorTypes.BUSINESS, severity, null, details)
}

/**
 * 🔧 阶段3新增: 验证错误创建器
 */
export function createValidationError(message, field = null) {
  return createError(message, ErrorTypes.VALIDATION, ErrorSeverity.LOW, null, { field })
}
