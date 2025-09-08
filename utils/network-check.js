// 网络连接检测工具
class NetworkChecker {
  constructor() {
    this.isOnline = true
    this.networkType = 'unknown'
    this.init()
  }

  // 初始化网络监听
  init() {
    // 获取初始网络状态
    wx.getNetworkType({
      success: (res) => {
        this.networkType = res.networkType
        this.isOnline = res.networkType !== 'none'
        console.log('📶 初始网络状态:', res.networkType)
      }
    })

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.isOnline = res.isConnected
      this.networkType = res.networkType
      console.log('📶 网络状态变化:', {
        isConnected: res.isConnected,
        networkType: res.networkType
      })
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接断开',
          icon: 'error'
        })
      }
    })
  }

  // 检查网络连接
  checkConnection() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          const isConnected = res.networkType !== 'none'
          resolve({
            isConnected: isConnected,
            networkType: res.networkType
          })
        },
        fail: () => {
          resolve({
            isConnected: false,
            networkType: 'unknown'
          })
        }
      })
    })
  }

  // 测试Supabase连接
  async testSupabaseConnection() {
    try {
      console.log('🔍 测试Supabase连接...')
      
      // 检查基础网络
      const networkStatus = await this.checkConnection()
      if (!networkStatus.isConnected) {
        throw new Error('网络连接断开')
      }
      
      console.log('📶 网络状态正常:', networkStatus.networkType)
      
      // 测试Supabase API连接
      const testResult = await wx.request({
        url: 'https://vvnsqiprcrepvcoypmpg.supabase.co/rest/v1/',
        method: 'GET',
        header: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bnNxaXByY3JlcHZjb3ltcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyNzI4NzQsImV4cCI6MjA0MDg0ODg3NH0.Ej8Fy6Nh2Qm9Xw5Kp7Rt4LkHv5nnX9pZe2kYDVErBSUL'
        }
      })
      
      console.log('✅ Supabase连接测试成功')
      return { success: true, message: 'Supabase连接正常' }
      
    } catch (error) {
      console.error('❌ Supabase连接测试失败:', error)
      return { success: false, message: 'Supabase连接失败' }
    }
  }

  // 显示网络状态
  showNetworkStatus() {
    wx.showModal({
      title: '网络状态',
      content: `连接状态: ${this.isOnline ? '已连接' : '断开'}\n网络类型: ${this.networkType}`,
      showCancel: false
    })
  }
}

// 创建全局网络检测实例
export const networkChecker = new NetworkChecker()

// 导出便捷方法
export const {
  checkConnection,
  testSupabaseConnection,
  showNetworkStatus
} = networkChecker
