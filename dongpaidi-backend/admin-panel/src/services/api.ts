import axios, { AxiosResponse } from 'axios'
import { message } from 'antd'
// import { useAuthStore } from '@/stores/authStore'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 动态获取token，避免循环依赖
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const { state } = JSON.parse(authStorage)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const { response } = error

    if (response?.status === 401) {
      // 未授权，清除登录状态
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (response?.status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else if (response?.data?.message) {
      message.error(response.data.message)
    } else {
      message.error('请求失败，请稍后重试')
    }

    return Promise.reject(error)
  }
)

// API接口定义
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  code: number
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 认证相关API
export const authApi = {
  // 管理员登录
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; tokens: any }>>('/admin/login', credentials),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<ApiResponse<any>>('/auth/me'),

  // 刷新token
  refreshToken: () =>
    api.post<ApiResponse<{ tokens: any }>>('/auth/refresh'),
}

// 用户管理API
export const userApi = {
  // 获取用户列表
  getUsers: (params?: {
    page?: number
    limit?: number
    keyword?: string
    platform?: string
    isVerified?: boolean
  }) =>
    api.get<PaginatedResponse<any>>('/users', { params }),

  // 获取用户详情
  getUserById: (id: string) =>
    api.get<ApiResponse<any>>(`/users/${id}`),

  // 更新用户状态
  updateUserStatus: (id: string, data: { isVerified?: boolean; status?: string }) =>
    api.patch<ApiResponse<any>>(`/users/${id}/status`, data),

  // 删除用户
  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),

  // 获取用户统计
  getUserStats: () =>
    api.get<ApiResponse<{
      total: number
      verified: number
      active: number
      newToday: number
    }>>('/users/stats'),
}

// 作品管理API
export const workApi = {
  // 获取作品列表
  getWorks: (params?: {
    page?: number
    limit?: number
    keyword?: string
    category?: string
    status?: string
    userId?: string
  }) =>
    api.get<PaginatedResponse<any>>('/works', { params }),

  // 获取作品详情
  getWorkById: (id: string) =>
    api.get<ApiResponse<any>>(`/works/${id}`),

  // 更新作品状态
  updateWorkStatus: (id: string, data: { status: string; reason?: string }) =>
    api.patch<ApiResponse<any>>(`/works/${id}/status`, data),

  // 删除作品
  deleteWork: (id: string) =>
    api.delete<ApiResponse<null>>(`/works/${id}`),

  // 获取作品统计
  getWorkStats: () =>
    api.get<ApiResponse<{
      total: number
      published: number
      pending: number
      rejected: number
      newToday: number
    }>>('/works/stats'),
}

// 约拍管理API
export const appointmentApi = {
  // 获取约拍列表
  getAppointments: (params?: {
    page?: number
    limit?: number
    keyword?: string
    status?: string
    photographerId?: string
  }) =>
    api.get<PaginatedResponse<any>>('/appointments', { params }),

  // 获取约拍详情
  getAppointmentById: (id: string) =>
    api.get<ApiResponse<any>>(`/appointments/${id}`),

  // 更新约拍状态
  updateAppointmentStatus: (id: string, data: { status: string; reason?: string }) =>
    api.patch<ApiResponse<any>>(`/appointments/${id}/status`, data),

  // 获取约拍统计
  getAppointmentStats: () =>
    api.get<ApiResponse<{
      total: number
      open: number
      inProgress: number
      completed: number
      cancelled: number
      photographerSeek: number
      modelSeek: number
      newToday: number
    }>>('/appointments/stats'),
}

// 系统统计API
export const statsApi = {
  // 获取总体统计
  getOverallStats: () =>
    api.get<ApiResponse<{
      users: number
      works: number
      appointments: number
      messages: number
    }>>('/stats'),

  // 获取趋势数据
  getTrendData: (period: 'week' | 'month' | 'year') =>
    api.get<ApiResponse<{
      dates: string[]
      users: number[]
      works: number[]
      appointments: number[]
    }>>(`/stats/trend?period=${period}`),
}

// 消息管理API
export const messageApi = {
  // 获取对话列表
  getConversations: () =>
    api.get<ApiResponse<any[]>>('/messages/conversations'),

  // 获取对话消息
  getConversationMessages: (otherUserId: string, params?: any) =>
    api.get<PaginatedResponse<any>>(`/messages/conversations/${otherUserId}`, { params }),

  // 发送消息
  sendMessage: (data: any) =>
    api.post<ApiResponse<any>>('/messages', data),

  // 获取未读消息数量
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/messages/unread-count'),

  // 标记消息已读
  markAsRead: (otherUserId: string) =>
    api.put<ApiResponse<null>>(`/messages/conversations/${otherUserId}/read`),

  // 删除消息
  deleteMessage: (messageId: string) =>
    api.delete<ApiResponse<null>>(`/messages/${messageId}`),

  // 发送系统消息
  sendSystemMessage: (data: any) =>
    api.post<ApiResponse<any>>('/messages/system', data),
}

// 支付管理API
export const paymentApi = {
  // 创建订单
  createOrder: (data: any) =>
    api.post<ApiResponse<any>>('/payments/orders', data),

  // 获取订单详情
  getOrder: (orderId: string) =>
    api.get<ApiResponse<any>>(`/payments/orders/${orderId}`),

  // 获取用户订单列表
  getUserOrders: (params?: any) =>
    api.get<PaginatedResponse<any>>('/payments/orders', { params }),

  // 获取管理员订单列表
  getAdminOrders: (params?: any) =>
    api.get<PaginatedResponse<any>>('/payments/admin/orders', { params }),

  // 微信支付下单
  createWechatPayment: (data: any) =>
    api.post<ApiResponse<any>>('/payments/wechat/jsapi', data),

  // 微信扫码支付下单
  createWechatNativePayment: (data: any) =>
    api.post<ApiResponse<any>>('/payments/wechat/native', data),

  // 支付宝网页支付下单
  createAlipayPagePayment: (data: any) =>
    api.post<ApiResponse<any>>('/payments/alipay/page', data),

  // 支付宝手机支付下单
  createAlipayWapPayment: (data: any) =>
    api.post<ApiResponse<any>>('/payments/alipay/wap', data),

  // 支付宝扫码支付下单
  createAlipayQRPayment: (data: any) =>
    api.post<ApiResponse<any>>('/payments/alipay/qr', data),

  // 查询支付结果
  queryPayment: (paymentNo: string, method: string) =>
    api.get<ApiResponse<any>>(`/payments/query/${paymentNo}?method=${method}`),

  // 申请退款
  requestRefund: (data: any) =>
    api.post<ApiResponse<any>>('/payments/refund', data),

  // 获取支付统计
  getStats: () =>
    api.get<ApiResponse<any>>('/payments/stats'),

  // 获取管理员支付统计
  getAdminStats: () =>
    api.get<ApiResponse<any>>('/payments/admin/stats'),
}

export default api
