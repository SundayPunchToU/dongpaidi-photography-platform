// Supabase配置和API封装
import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 请替换为您的实际配置
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// ==================== 用户相关API ====================

/**
 * 微信登录
 * @param {Object} userInfo - 微信用户信息
 * @returns {Object} 用户数据
 */
export async function loginWithWechat(userInfo) {
  try {
    // 获取微信openid（需要后端支持）
    const openid = await getWechatOpenId()
    
    // 查找或创建用户
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single()

    if (error && error.code === 'PGRST116') {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          openid: openid,
          nickname: userInfo.nickName,
          avatar_url: userInfo.avatarUrl,
          gender: userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : 'other'
        })
        .select()
        .single()

      if (createError) throw createError
      user = newUser
    } else if (error) {
      throw error
    }

    // 更新最后活跃时间
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    return { user, error: null }
  } catch (error) {
    console.error('登录失败:', error)
    return { user: null, error }
  }
}

/**
 * 获取微信OpenID（需要云函数支持）
 */
async function getWechatOpenId() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 这里需要调用您的后端API来获取openid
          // 暂时返回模拟数据
          resolve(`openid_${Date.now()}`)
        } else {
          reject(new Error('获取微信code失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 更新用户信息
 * @param {string} userId - 用户ID
 * @param {Object} updates - 更新数据
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// ==================== 作品相关API ====================

/**
 * 发布作品
 * @param {Object} workData - 作品数据
 */
export async function publishWork(workData) {
  const { data, error } = await supabase
    .from('works')
    .insert({
      ...workData,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      users:user_id (
        id, nickname, avatar_url, is_photographer, is_model
      )
    `)
    .single()

  if (!error) {
    // 更新用户作品数量
    await supabase.rpc('increment_user_works_count', {
      user_id: workData.user_id
    })
  }

  return { data, error }
}

/**
 * 获取作品列表
 * @param {Object} params - 查询参数
 */
export async function getWorks(params = {}) {
  const {
    page = 1,
    limit = 20,
    category = null,
    userId = null,
    tag = null,
    orderBy = 'created_at'
  } = params

  let query = supabase
    .from('works')
    .select(`
      *,
      users:user_id (
        id, nickname, avatar_url, is_photographer, is_model
      )
    `)
    .eq('status', 'published')

  // 添加筛选条件
  if (category) query = query.eq('category', category)
  if (userId) query = query.eq('user_id', userId)
  if (tag) query = query.contains('tags', [tag])

  // 排序和分页
  query = query
    .order(orderBy, { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data, error } = await query

  return { data, error }
}

/**
 * 获取作品详情
 * @param {string} workId - 作品ID
 */
export async function getWorkDetail(workId) {
  const { data, error } = await supabase
    .from('works')
    .select(`
      *,
      users:user_id (
        id, nickname, avatar_url, bio, is_photographer, is_model,
        following_count, followers_count, works_count
      )
    `)
    .eq('id', workId)
    .single()

  if (!error) {
    // 增加浏览量
    await supabase.rpc('increment_work_views', { work_id: workId })
  }

  return { data, error }
}

// ==================== 社交互动API ====================

/**
 * 切换点赞状态
 * @param {string} targetId - 目标ID（作品或评论）
 * @param {string} targetType - 目标类型
 * @param {string} userId - 用户ID
 */
export async function toggleLike(targetId, targetType, userId) {
  try {
    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single()

    if (existingLike) {
      // 取消点赞
      await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      // 减少点赞数
      await supabase.rpc('decrement_like_count', {
        target_id: targetId,
        target_type: targetType
      })

      return { isLiked: false, error: null }
    } else {
      // 添加点赞
      await supabase
        .from('likes')
        .insert({
          user_id: userId,
          target_id: targetId,
          target_type: targetType
        })

      // 增加点赞数
      await supabase.rpc('increment_like_count', {
        target_id: targetId,
        target_type: targetType
      })

      return { isLiked: true, error: null }
    }
  } catch (error) {
    return { isLiked: false, error }
  }
}

/**
 * 关注/取消关注用户
 * @param {string} followingId - 被关注用户ID
 * @param {string} followerId - 关注者ID
 */
export async function toggleFollow(followingId, followerId) {
  try {
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (existingFollow) {
      // 取消关注
      await supabase
        .from('follows')
        .delete()
        .eq('id', existingFollow.id)

      // 更新关注数量
      await supabase.rpc('update_follow_counts', {
        following_id: followingId,
        follower_id: followerId,
        action: 'unfollow'
      })

      return { isFollowing: false, error: null }
    } else {
      // 添加关注
      await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })

      // 更新关注数量
      await supabase.rpc('update_follow_counts', {
        following_id: followingId,
        follower_id: followerId,
        action: 'follow'
      })

      return { isFollowing: true, error: null }
    }
  } catch (error) {
    return { isFollowing: false, error }
  }
}

/**
 * 发表评论
 * @param {Object} commentData - 评论数据
 */
export async function addComment(commentData) {
  const { data, error } = await supabase
    .from('comments')
    .insert(commentData)
    .select(`
      *,
      users:user_id (
        id, nickname, avatar_url
      )
    `)
    .single()

  if (!error) {
    // 更新作品评论数
    await supabase.rpc('increment_work_comments', {
      work_id: commentData.work_id
    })
  }

  return { data, error }
}

/**
 * 获取评论列表
 * @param {string} workId - 作品ID
 */
export async function getComments(workId, page = 1, limit = 20) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      users:user_id (
        id, nickname, avatar_url
      )
    `)
    .eq('work_id', workId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return { data, error }
}

// ==================== 约拍相关API ====================

/**
 * 发布约拍需求
 * @param {Object} appointmentData - 约拍数据
 */
export async function publishAppointment(appointmentData) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointmentData,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
    })
    .select(`
      *,
      users:publisher_id (
        id, nickname, avatar_url, is_photographer, is_model
      )
    `)
    .single()

  return { data, error }
}

/**
 * 获取约拍列表
 * @param {Object} params - 查询参数
 */
export async function getAppointments(params = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    location = null,
    category = null
  } = params

  let query = supabase
    .from('appointments')
    .select(`
      *,
      users:publisher_id (
        id, nickname, avatar_url, is_photographer, is_model
      )
    `)
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())

  if (type) query = query.eq('type', type)
  if (location) query = query.ilike('location', `%${location}%`)
  if (category) query = query.eq('category', category)

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data, error } = await query
  return { data, error }
}

// ==================== 文件上传API ====================

/**
 * 上传图片到Supabase Storage
 * @param {string} filePath - 本地文件路径
 * @param {string} bucket - 存储桶名称
 */
export async function uploadImage(filePath, bucket = 'images') {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, filePath)

    if (error) throw error

    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: null, error }
  }
}

// ==================== 实时订阅API ====================

/**
 * 订阅作品更新
 * @param {Function} callback - 回调函数
 */
export function subscribeToWorks(callback) {
  return supabase
    .channel('works_channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'works' },
      callback
    )
    .subscribe()
}

/**
 * 订阅评论更新
 * @param {string} workId - 作品ID
 * @param {Function} callback - 回调函数
 */
export function subscribeToComments(workId, callback) {
  return supabase
    .channel(`comments_${workId}`)
    .on('postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `work_id=eq.${workId}`
      },
      callback
    )
    .subscribe()
}

// ==================== 数据库函数（需要在Supabase中创建） ====================

/*
在Supabase SQL编辑器中执行以下函数：

-- 增加作品浏览量
CREATE OR REPLACE FUNCTION increment_work_views(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE works SET view_count = view_count + 1 WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;

-- 增加用户作品数量
CREATE OR REPLACE FUNCTION increment_user_works_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET works_count = works_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 增加/减少点赞数
CREATE OR REPLACE FUNCTION increment_like_count(target_id UUID, target_type TEXT)
RETURNS void AS $$
BEGIN
  IF target_type = 'work' THEN
    UPDATE works SET like_count = like_count + 1 WHERE id = target_id;
  ELSIF target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = target_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count(target_id UUID, target_type TEXT)
RETURNS void AS $$
BEGIN
  IF target_type = 'work' THEN
    UPDATE works SET like_count = GREATEST(like_count - 1, 0) WHERE id = target_id;
  ELSIF target_type = 'comment' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = target_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 更新关注数量
CREATE OR REPLACE FUNCTION update_follow_counts(following_id UUID, follower_id UUID, action TEXT)
RETURNS void AS $$
BEGIN
  IF action = 'follow' THEN
    UPDATE users SET followers_count = followers_count + 1 WHERE id = following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = follower_id;
  ELSIF action = 'unfollow' THEN
    UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = following_id;
    UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = follower_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 增加作品评论数
CREATE OR REPLACE FUNCTION increment_work_comments(work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE works SET comment_count = comment_count + 1 WHERE id = work_id;
END;
$$ LANGUAGE plpgsql;
*/
