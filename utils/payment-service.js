// 支付服务 - 微信支付集成 (简化版)
// 暂时注释复杂导入
// import { supabase } from './supabase-client.js'
// import { authService } from './auth.js'

class PaymentService {
  constructor() {
    this.paymentInProgress = false
  }

  /**
   * 创建约拍订单并发起支付
   * @param {Object} orderData 订单数据
   */
  async createAppointmentOrder(orderData) {
    try {
      console.log('💰 模拟创建约拍订单:', orderData)

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟成功结果
      return {
        success: true,
        order: {
          id: `order_${Date.now()}`,
          ...orderData,
          status: 'pending_payment',
          created_at: new Date().toISOString()
        },
        message: '订单创建成功'
      }

    } catch (error) {
      console.error('❌ 创建订单失败:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // 简化版查询订单状态
  async queryOrderStatus(orderId) {
    console.log('🔍 模拟查询订单状态:', orderId)
    return {
      success: true,
      order: {
        id: orderId,
        status: 'pending_payment',
        amount: 299
      }
    }
  }

  // 简化版申请退款
  async requestRefund(orderId, reason) {
    console.log('💸 模拟申请退款:', orderId, reason)
    return {
      success: true,
      message: '退款申请已提交'
    }
  }

}

// 创建全局实例
const paymentServiceInstance = new PaymentService()

// 导出便捷方法
export const PaymentService = {
  createAppointmentOrder: (orderData) => paymentServiceInstance.createAppointmentOrder(orderData),
  queryOrderStatus: (orderId) => paymentServiceInstance.queryOrderStatus(orderId),
  requestRefund: (orderId, reason) => paymentServiceInstance.requestRefund(orderId, reason)
}

// 也导出实例
export const paymentService = paymentServiceInstance
