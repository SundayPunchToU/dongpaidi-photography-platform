// 小程序专用Supabase客户端
// 由于小程序环境限制，我们使用HTTP请求方式调用Supabase API

// 简化配置，避免复杂的验证导致错误
const CONFIG = {
  SUPABASE_URL: 'https://vvnsqiprcrepvcoypmpg.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bnNxaXByY3JlcHZjb3lwbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mzc5MjksImV4cCI6MjA3MjMxMzkyOX0.9STb2fPk66ox-jdyI9iYouFZllYMIiZUAIQzntEmOY8'
}

console.log('✅ Supabase配置已加载')

const SUPABASE_URL = CONFIG.SUPABASE_URL
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY

class SupabaseClient {
  constructor() {
    this.baseURL = SUPABASE_URL
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }

  // 通用HTTP请求方法
  async request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseURL}/rest/v1/${endpoint}`,
        method: method,
        header: this.headers,
        data: data,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: res.data, error: null })
          } else {
            reject({ data: null, error: res.data })
          }
        },
        fail: (error) => {
          reject({ data: null, error })
        }
      })
    })
  }

  // 查询数据
  async select(table, options = {}) {
    let endpoint = table
    const params = []

    // 添加select字段
    if (options.select) {
      params.push(`select=${options.select}`)
    }

    // 添加过滤条件
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        params.push(`${key}=eq.${value}`)
      })
    }

    // 添加排序
    if (options.order) {
      const { column, ascending = false } = options.order
      params.push(`order=${column}.${ascending ? 'asc' : 'desc'}`)
    }

    // 添加分页
    if (options.range) {
      const [start, end] = options.range
      this.headers['Range'] = `${start}-${end}`
    }

    // 构建完整URL
    if (params.length > 0) {
      endpoint += '?' + params.join('&')
    }

    return this.request('GET', endpoint)
  }

  // 插入数据
  async insert(table, data) {
    return this.request('POST', table, data)
  }

  // 更新数据
  async update(table, data, conditions) {
    let endpoint = table
    const params = []

    // 添加更新条件
    if (conditions.eq) {
      Object.entries(conditions.eq).forEach(([key, value]) => {
        params.push(`${key}=eq.${value}`)
      })
    }

    if (params.length > 0) {
      endpoint += '?' + params.join('&')
    }

    return this.request('PATCH', endpoint, data)
  }

  // 删除数据
  async delete(table, conditions) {
    let endpoint = table
    const params = []

    if (conditions.eq) {
      Object.entries(conditions.eq).forEach(([key, value]) => {
        params.push(`${key}=eq.${value}`)
      })
    }

    if (params.length > 0) {
      endpoint += '?' + params.join('&')
    }

    return this.request('DELETE', endpoint)
  }

  // 调用数据库函数
  async rpc(functionName, params = {}) {
    return this.request('POST', `rpc/${functionName}`, params)
  }

  // 文件上传
  async uploadFile(bucket, fileName, filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.baseURL}/storage/v1/object/${bucket}/${fileName}`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const publicUrl = `${this.baseURL}/storage/v1/object/public/${bucket}/${fileName}`
            resolve({ data: { publicUrl }, error: null })
          } else {
            reject({ data: null, error: res.data })
          }
        },
        fail: reject
      })
    })
  }

  // 获取文件公共URL
  getPublicUrl(bucket, fileName) {
    return `${this.baseURL}/storage/v1/object/public/${bucket}/${fileName}`
  }
}

// 创建全局实例
export const supabase = new SupabaseClient()

// ==================== 业务API封装 ====================

// 用户API
export const userAPI = {
  // 登录
  async login(openid, userInfo) {
    // 先查找用户
    const { data: users } = await supabase.select('users', {
      eq: { openid },
      select: '*'
    })

    if (users && users.length > 0) {
      // 用户存在，更新最后活跃时间
      await supabase.update('users', 
        { last_active_at: new Date().toISOString() },
        { eq: { id: users[0].id } }
      )
      return { data: users[0], error: null }
    } else {
      // 创建新用户
      const newUser = {
        openid,
        nickname: userInfo.nickName,
        avatar_url: userInfo.avatarUrl,
        gender: userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : 'other'
      }
      
      return await supabase.insert('users', newUser)
    }
  },

  // 更新用户信息
  async updateProfile(userId, updates) {
    return await supabase.update('users', updates, { eq: { id: userId } })
  }
}

// 作品API
export const worksAPI = {
  // 发布作品
  async publish(workData) {
    return await supabase.insert('works', workData)
  },

  // 获取作品列表
  async getList(page = 1, limit = 20, category = null) {
    const options = {
      select: `*, users:user_id(id,nickname,avatar_url,is_photographer,is_model)`,
      eq: { status: 'published' },
      order: { column: 'created_at', ascending: false },
      range: [(page - 1) * limit, page * limit - 1]
    }

    if (category) {
      options.eq.category = category
    }

    return await supabase.select('works', options)
  },

  // 获取作品详情
  async getDetail(workId) {
    const { data, error } = await supabase.select('works', {
      eq: { id: workId },
      select: `*, users:user_id(id,nickname,avatar_url,bio,is_photographer,is_model,following_count,followers_count,works_count)`
    })

    if (data && data.length > 0) {
      // 增加浏览量
      await supabase.rpc('increment_work_views', { work_id: workId })
      return { data: data[0], error: null }
    }

    return { data: null, error: error || '作品不存在' }
  }
}

// 社交API
export const socialAPI = {
  // 点赞/取消点赞
  async toggleLike(targetId, targetType, userId) {
    // 检查是否已点赞
    const { data: likes } = await supabase.select('likes', {
      eq: { user_id: userId, target_id: targetId, target_type: targetType }
    })

    if (likes && likes.length > 0) {
      // 取消点赞
      await supabase.delete('likes', { eq: { id: likes[0].id } })
      await supabase.rpc('decrement_like_count', { target_id: targetId, target_type: targetType })
      return { isLiked: false, error: null }
    } else {
      // 添加点赞
      await supabase.insert('likes', {
        user_id: userId,
        target_id: targetId,
        target_type: targetType
      })
      await supabase.rpc('increment_like_count', { target_id: targetId, target_type: targetType })
      return { isLiked: true, error: null }
    }
  },

  // 关注/取消关注
  async toggleFollow(followingId, followerId) {
    const { data: follows } = await supabase.select('follows', {
      eq: { follower_id: followerId, following_id: followingId }
    })

    if (follows && follows.length > 0) {
      // 取消关注
      await supabase.delete('follows', { eq: { id: follows[0].id } })
      await supabase.rpc('update_follow_counts', {
        following_id: followingId,
        follower_id: followerId,
        action: 'unfollow'
      })
      return { isFollowing: false, error: null }
    } else {
      // 添加关注
      await supabase.insert('follows', {
        follower_id: followerId,
        following_id: followingId
      })
      await supabase.rpc('update_follow_counts', {
        following_id: followingId,
        follower_id: followerId,
        action: 'follow'
      })
      return { isFollowing: true, error: null }
    }
  }
}

// 文件API
export const fileAPI = {
  // 上传图片
  async uploadImage(tempFilePath) {
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
    return await supabase.uploadFile('images', fileName, tempFilePath)
  },

  // 批量上传
  async uploadMultiple(tempFilePaths) {
    const uploadPromises = tempFilePaths.map(path => this.uploadImage(path))
    const results = await Promise.all(uploadPromises)
    return results.map(result => result.data?.publicUrl).filter(Boolean)
  }
}
