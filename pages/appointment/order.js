// 约拍订单页面
import { PaymentService } from '../../utils/payment-service.js'
import { simpleAuthService } from '../../utils/simple-auth.js'

Page({
  data: {
    photographerId: '',
    photographerInfo: null,
    orderForm: {
      appointmentTime: '',
      location: '',
      description: '',
      requirements: '',
      amount: 0
    },
    servicePackages: [
      { id: 1, name: '基础套餐', price: 299, duration: '2小时', photos: '20张精修' },
      { id: 2, name: '标准套餐', price: 499, duration: '4小时', photos: '40张精修' },
      { id: 3, name: '高级套餐', price: 799, duration: '6小时', photos: '60张精修' },
      { id: 4, name: '自定义', price: 0, duration: '协商', photos: '协商' }
    ],
    selectedPackage: null,
    submitting: false
  },

  onLoad(options) {
    const { photographerId } = options
    if (photographerId) {
      this.setData({ photographerId })
      this.loadPhotographerInfo(photographerId)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载摄影师信息
  async loadPhotographerInfo(photographerId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', photographerId)
        .eq('is_photographer', true)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      this.setData({
        photographerInfo: data
      })

    } catch (error) {
      console.error('加载摄影师信息失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 选择服务套餐
  onPackageSelect(e) {
    const { package: pkg } = e.currentTarget.dataset
    this.setData({
      selectedPackage: pkg,
      'orderForm.amount': pkg.price
    })
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`orderForm.${field}`]: value
    })
  },

  // 选择约拍时间
  onTimeChange(e) {
    const { value } = e.detail
    this.setData({
      'orderForm.appointmentTime': value
    })
  },

  // 选择拍摄地点
  onLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'orderForm.location': res.address || res.name
        })
      },
      fail: (err) => {
        if (err.errMsg.includes('deny')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置权限以选择拍摄地点',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      }
    })
  },

  // 自定义金额输入
  onAmountInput(e) {
    const { value } = e.detail
    const amount = parseFloat(value) || 0
    
    this.setData({
      'orderForm.amount': amount,
      selectedPackage: { ...this.data.servicePackages[3], price: amount }
    })
  },

  // 提交订单
  async onSubmitOrder() {
    try {
      // 验证登录状态
      if (!simpleAuthService.checkLoginStatus()) {
        wx.showModal({
          title: '需要登录',
          content: '请先登录后再下单',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/login/login'
              })
            }
          }
        })
        return
      }

      // 验证表单
      const validation = this.validateForm()
      if (!validation.valid) {
        wx.showToast({
          title: validation.message,
          icon: 'none'
        })
        return
      }

      this.setData({ submitting: true })
      wx.showLoading({ title: '创建订单中...' })

      // 准备订单数据
      const orderData = {
        photographerId: this.data.photographerId,
        amount: this.data.orderForm.amount,
        appointmentTime: this.data.orderForm.appointmentTime,
        location: this.data.orderForm.location,
        description: this.data.orderForm.description,
        requirements: this.data.orderForm.requirements
      }

      // 创建订单并发起支付
      const result = await PaymentService.createAppointmentOrder(orderData)

      wx.hideLoading()

      if (result.success) {
        // 支付成功
        wx.showModal({
          title: '订单创建成功',
          content: '订单已创建，请等待摄影师确认',
          showCancel: false,
          success: () => {
            // 跳转到订单详情页
            wx.redirectTo({
              url: `/pages/order/detail?id=${result.order.id}`
            })
          }
        })
      } else {
        wx.showToast({
          title: result.message || '创建订单失败',
          icon: 'error'
        })
      }

    } catch (error) {
      wx.hideLoading()
      console.error('提交订单失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'error'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 验证表单
  validateForm() {
    const { orderForm, selectedPackage } = this.data

    if (!selectedPackage) {
      return { valid: false, message: '请选择服务套餐' }
    }

    if (!orderForm.appointmentTime) {
      return { valid: false, message: '请选择约拍时间' }
    }

    // 检查时间是否是未来时间
    const appointmentDate = new Date(orderForm.appointmentTime)
    const now = new Date()
    if (appointmentDate <= now) {
      return { valid: false, message: '约拍时间必须是未来时间' }
    }

    if (!orderForm.location || !orderForm.location.trim()) {
      return { valid: false, message: '请选择拍摄地点' }
    }

    if (!orderForm.description || !orderForm.description.trim()) {
      return { valid: false, message: '请填写拍摄需求' }
    }

    if (orderForm.amount <= 0) {
      return { valid: false, message: '订单金额必须大于0' }
    }

    return { valid: true }
  },

  // 联系摄影师
  onContactPhotographer() {
    const { photographerInfo } = this.data
    if (!photographerInfo) return

    wx.navigateTo({
      url: `/pages/chat/index?userId=${photographerInfo.id}&userName=${photographerInfo.nickname}`
    })
  },

  // 查看摄影师作品
  onViewWorks() {
    const { photographerId } = this.data
    wx.navigateTo({
      url: `/pages/profile/index?userId=${photographerId}`
    })
  },

  // 模拟订单创建
  async createOrderMock(orderData) {
    try {
      console.log('📝 模拟创建订单:', orderData)

      // 模拟网络延迟
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
      return {
        success: false,
        message: '订单创建失败: ' + error.message
      }
    }
  }
})
