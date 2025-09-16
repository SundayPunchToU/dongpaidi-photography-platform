// 懂拍帝摄影平台 - 统一API客户端
// 替换Supabase客户端，对接自建后端API服务
// 版本: 1.0.1
// 创建时间: 2024-09-16
// 更新时间: 2025-01-16
//
// 🎯 主要功能:
// - 统一HTTP请求处理
// - 自动Token管理和刷新
// - 请求重试机制
// - 完整的错误处理
// - 业务API封装
//
// 🔧 技术特性:
// - 支持请求/响应拦截器
// - 环境感知配置
// - 自动日志记录
// - TypeScript友好

import { config } from '../config/index.js'

/**
 * API客户端配置
 */
const API_CONFIG = {
  // 根据环境自动选择API地址
  BASE_URL: (() => {
    // 在微信小程序中获取环境信息
    if (typeof wx !== 'undefined') {
      const accountInfo = wx.getAccountInfoSync()
      const isDev = accountInfo.miniProgram.envVersion === 'develop'
      
      if (isDev) {
        // 开发环境 - 本地后端
        return 'http://localhost:3000/api/v1'
      } else {
        // 生产环境 - 云服务器后端
        return 'https://your-domain.com/api/v1'
      }
    }
    
    // 默认本地开发环境
    return 'http://localhost:3000/api/v1'
  })(),
  
  // 请求超时时间
  TIMEOUT: 10000,
  
  // 重试配置
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000,
}

/**
 * 统一API客户端类
 * 提供标准化的HTTP请求方法和错误处理
 */
class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    this.retryTimes = API_CONFIG.RETRY_TIMES
    this.retryDelay = API_CONFIG.RETRY_DELAY
    
    // 请求拦截器队列
    this.requestInterceptors = []
    // 响应拦截器队列
    this.responseInterceptors = []
    
    // 添加默认拦截器
    this.setupDefaultInterceptors()
    
    console.log('✅ API客户端初始化完成', { baseURL: this.baseURL })
  }

  /**
   * 设置默认拦截器
   */
  setupDefaultInterceptors() {
    // 请求拦截器：添加认证头
    this.addRequestInterceptor((config) => {
      const token = wx.getStorageSync('access_token')
      if (token) {
        config.header = {
          ...config.header,
          'Authorization': `Bearer ${token}`
        }
      }
      
      // 添加默认头部
      config.header = {
        'Content-Type': 'application/json',
        ...config.header
      }
      
      return config
    })

    // 响应拦截器：统一错误处理
    this.addResponseInterceptor(
      (response) => {
        // 成功响应处理
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {
            success: true,
            data: response.data,
            statusCode: response.statusCode
          }
        } else {
          throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`)
        }
      },
      (error) => {
        // 错误响应处理
        console.error('API请求错误:', error)
        
        // 处理网络错误
        if (error.errMsg && error.errMsg.includes('timeout')) {
          return {
            success: false,
            error: '请求超时，请检查网络连接',
            code: 'TIMEOUT'
          }
        }
        
        if (error.errMsg && error.errMsg.includes('fail')) {
          return {
            success: false,
            error: '网络连接失败，请检查网络设置',
            code: 'NETWORK_ERROR'
          }
        }
        
        return {
          success: false,
          error: error.message || '请求失败',
          code: error.code || 'UNKNOWN_ERROR'
        }
      }
    )
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({ onFulfilled, onRejected })
  }

  /**
   * 通用HTTP请求方法
   */
  async request(config) {
    // 应用请求拦截器
    let finalConfig = { ...config }
    for (const interceptor of this.requestInterceptors) {
      finalConfig = interceptor(finalConfig) || finalConfig
    }

    // 构建完整URL
    const url = finalConfig.url.startsWith('http') 
      ? finalConfig.url 
      : `${this.baseURL}${finalConfig.url}`

    // 请求配置
    const requestConfig = {
      url,
      method: finalConfig.method || 'GET',
      data: finalConfig.data,
      header: finalConfig.header || {},
      timeout: finalConfig.timeout || this.timeout
    }

    // 执行请求（带重试机制）
    return this.executeWithRetry(requestConfig)
  }

  /**
   * 带重试机制的请求执行
   */
  async executeWithRetry(config, retryCount = 0) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...config,
        success: (response) => {
          // 应用响应拦截器
          let finalResponse = response
          for (const interceptor of this.responseInterceptors) {
            try {
              if (interceptor.onFulfilled) {
                finalResponse = interceptor.onFulfilled(finalResponse) || finalResponse
              }
            } catch (error) {
              if (interceptor.onRejected) {
                finalResponse = interceptor.onRejected(error)
              } else {
                reject(error)
                return
              }
            }
          }
          resolve(finalResponse)
        },
        fail: (error) => {
          // 重试逻辑
          if (retryCount < this.retryTimes) {
            console.log(`请求失败，${this.retryDelay}ms后进行第${retryCount + 1}次重试...`)
            setTimeout(() => {
              this.executeWithRetry(config, retryCount + 1)
                .then(resolve)
                .catch(reject)
            }, this.retryDelay)
          } else {
            // 应用错误拦截器
            let finalError = error
            for (const interceptor of this.responseInterceptors) {
              if (interceptor.onRejected) {
                finalError = interceptor.onRejected(finalError)
                break
              }
            }
            resolve(finalError) // 注意：这里resolve错误响应，而不是reject
          }
        }
      })
    })
  }

  // ==================== 便捷方法 ====================

  /**
   * GET请求
   */
  async get(url, params = {}) {
    const queryString = Object.keys(params).length > 0 
      ? '?' + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
      : ''
    
    return this.request({
      url: url + queryString,
      method: 'GET'
    })
  }

  /**
   * POST请求
   */
  async post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    })
  }

  /**
   * PUT请求
   */
  async put(url, data = {}) {
    return this.request({
      url,
      method: 'PUT',
      data
    })
  }

  /**
   * DELETE请求
   */
  async delete(url) {
    return this.request({
      url,
      method: 'DELETE'
    })
  }

  /**
   * 文件上传
   */
  async upload(url, filePath, formData = {}) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('access_token')
      
      wx.uploadFile({
        url: this.baseURL + url,
        filePath,
        name: 'file',
        formData,
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (response) => {
          try {
            const data = JSON.parse(response.data)
            resolve({
              success: true,
              data,
              statusCode: response.statusCode
            })
          } catch (error) {
            resolve({
              success: false,
              error: '响应数据解析失败',
              code: 'PARSE_ERROR'
            })
          }
        },
        fail: (error) => {
          resolve({
            success: false,
            error: error.errMsg || '上传失败',
            code: 'UPLOAD_ERROR'
          })
        }
      })
    })
  }
}

// 创建全局API客户端实例
export const apiClient = new APIClient()

// 导出便捷方法
export const { get, post, put, delete: del, upload } = apiClient

// ==================== 业务API封装 ====================

/**
 * 用户认证API
 */
export const authAPI = {
  /**
   * 微信登录
   */
  async wechatLogin(code, userInfo) {
    return apiClient.post('/auth/wechat', {
      code,
      userInfo
    })
  },

  /**
   * 手机号登录
   */
  async phoneLogin(phone, code) {
    return apiClient.post('/auth/phone', {
      phone,
      code
    })
  },

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', {
      refreshToken
    })
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    return apiClient.get('/auth/me')
  },

  /**
   * 登出
   */
  async logout() {
    return apiClient.post('/auth/logout')
  }
}

/**
 * 用户管理API
 */
export const userAPI = {
  /**
   * 获取用户详情
   */
  async getUserById(userId) {
    return apiClient.get(`/users/${userId}`)
  },

  /**
   * 更新用户资料
   */
  async updateProfile(updates) {
    return apiClient.put('/users/profile', updates)
  },

  /**
   * 获取用户作品列表
   */
  async getUserWorks(userId, page = 1, limit = 20) {
    return apiClient.get(`/users/${userId}/works`, { page, limit })
  },

  /**
   * 获取用户关注列表
   */
  async getFollowing(userId, page = 1, limit = 20) {
    return apiClient.get(`/users/${userId}/following`, { page, limit })
  },

  /**
   * 获取用户粉丝列表
   */
  async getFollowers(userId, page = 1, limit = 20) {
    return apiClient.get(`/users/${userId}/followers`, { page, limit })
  }
}

/**
 * 作品管理API
 */
export const worksAPI = {
  /**
   * 获取作品列表
   */
  async getList(params = {}) {
    const { page = 1, limit = 20, category, userId, keyword } = params
    return apiClient.get('/works', { page, limit, category, userId, keyword })
  },

  /**
   * 获取作品详情
   */
  async getDetail(workId) {
    return apiClient.get(`/works/${workId}`)
  },

  /**
   * 发布作品
   */
  async publish(workData) {
    return apiClient.post('/works', workData)
  },

  /**
   * 更新作品
   */
  async update(workId, updates) {
    return apiClient.put(`/works/${workId}`, updates)
  },

  /**
   * 删除作品
   */
  async delete(workId) {
    return apiClient.delete(`/works/${workId}`)
  },

  /**
   * 点赞/取消点赞作品
   */
  async toggleLike(workId) {
    return apiClient.post(`/works/${workId}/like`)
  },

  /**
   * 收藏/取消收藏作品
   */
  async toggleCollection(workId) {
    return apiClient.post(`/works/${workId}/collect`)
  },

  /**
   * 获取作品评论
   */
  async getComments(workId, page = 1, limit = 20) {
    return apiClient.get(`/works/${workId}/comments`, { page, limit })
  },

  /**
   * 添加评论
   */
  async addComment(workId, content, parentId = null) {
    return apiClient.post(`/works/${workId}/comments`, {
      content,
      parentId
    })
  }
}

/**
 * 约拍管理API
 */
export const appointmentAPI = {
  /**
   * 获取约拍列表
   */
  async getList(params = {}) {
    const { page = 1, limit = 20, type, status, location } = params
    return apiClient.get('/appointments', { page, limit, type, status, location })
  },

  /**
   * 获取约拍详情
   */
  async getDetail(appointmentId) {
    return apiClient.get(`/appointments/${appointmentId}`)
  },

  /**
   * 发布约拍
   */
  async publish(appointmentData) {
    return apiClient.post('/appointments', appointmentData)
  },

  /**
   * 更新约拍
   */
  async update(appointmentId, updates) {
    return apiClient.put(`/appointments/${appointmentId}`, updates)
  },

  /**
   * 删除约拍
   */
  async delete(appointmentId) {
    return apiClient.delete(`/appointments/${appointmentId}`)
  },

  /**
   * 申请约拍
   */
  async apply(appointmentId, message = '') {
    return apiClient.post(`/appointments/${appointmentId}/apply`, { message })
  },

  /**
   * 获取约拍申请列表
   */
  async getApplications(appointmentId, page = 1, limit = 20) {
    return apiClient.get(`/appointments/${appointmentId}/applications`, { page, limit })
  },

  /**
   * 处理约拍申请
   */
  async handleApplication(applicationId, action, message = '') {
    return apiClient.post(`/appointments/applications/${applicationId}/${action}`, { message })
  }
}

/**
 * 消息管理API
 */
export const messageAPI = {
  /**
   * 获取对话列表
   */
  async getConversations(page = 1, limit = 20) {
    return apiClient.get('/messages/conversations', { page, limit })
  },

  /**
   * 获取对话消息
   */
  async getMessages(conversationId, page = 1, limit = 50) {
    return apiClient.get(`/messages/conversations/${conversationId}`, { page, limit })
  },

  /**
   * 发送消息
   */
  async sendMessage(receiverId, content, type = 'text') {
    return apiClient.post('/messages', {
      receiverId,
      content,
      type
    })
  },

  /**
   * 标记消息已读
   */
  async markAsRead(conversationId) {
    return apiClient.post(`/messages/conversations/${conversationId}/read`)
  }
}

/**
 * 文件上传API
 */
export const uploadAPI = {
  /**
   * 上传单张图片
   */
  async uploadImage(filePath) {
    return apiClient.upload('/upload/image', filePath)
  },

  /**
   * 批量上传图片
   */
  async uploadMultipleImages(filePaths) {
    const uploadPromises = filePaths.map(path => this.uploadImage(path))
    const results = await Promise.all(uploadPromises)
    return results
  },

  /**
   * 获取上传配置
   */
  async getUploadConfig() {
    return apiClient.get('/upload/config')
  }
}

/**
 * 社交功能API
 */
export const socialAPI = {
  /**
   * 关注/取消关注用户
   */
  async toggleFollow(userId) {
    return apiClient.post(`/users/${userId}/follow`)
  },

  /**
   * 获取关注状态
   */
  async getFollowStatus(userId) {
    return apiClient.get(`/users/${userId}/follow-status`)
  },

  /**
   * 举报内容
   */
  async report(targetType, targetId, reason, description = '') {
    return apiClient.post('/social/report', {
      targetType,
      targetId,
      reason,
      description
    })
  }
}
