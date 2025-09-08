// 摄影师专业工作台
import { simpleAuthService } from '../../utils/simple-auth.js'
import { AnimationService } from '../../utils/animation-service.js'

Page({
  data: {
    // 用户信息
    photographerInfo: null,
    
    // 今日数据
    todayStats: {
      views: 0,
      likes: 0,
      bookings: 0,
      earnings: 0
    },

    // 本周数据
    weekStats: {
      totalViews: 0,
      totalLikes: 0,
      totalBookings: 0,
      totalEarnings: 0,
      growthRate: 0
    },

    // 待处理事项
    pendingTasks: [],

    // 最新订单
    recentOrders: [],

    // 作品表现
    topWorks: [],

    // 快捷操作
    quickActions: [
      {
        key: 'publish_work',
        label: '发布作品',
        icon: 'camera',
        color: '#1890ff',
        path: '/pages/release/work'
      },
      {
        key: 'manage_appointment',
        label: '管理约拍',
        icon: 'calendar',
        color: '#52c41a',
        path: '/pages/appointment/manage'
      },
      {
        key: 'view_earnings',
        label: '查看收益',
        icon: 'money',
        color: '#faad14',
        path: '/pages/earnings/index'
      },
      {
        key: 'edit_profile',
        label: '编辑资料',
        icon: 'edit',
        color: '#722ed1',
        path: '/pages/profile/edit'
      }
    ],

    // 专业工具
    professionalTools: [
      {
        key: 'portfolio_manager',
        label: '作品集管理',
        description: '整理和展示您的摄影作品',
        icon: 'folder',
        color: '#1890ff'
      },
      {
        key: 'client_manager',
        label: '客户管理',
        description: '管理客户信息和拍摄记录',
        icon: 'team',
        color: '#52c41a'
      },
      {
        key: 'pricing_calculator',
        label: '报价计算器',
        description: '智能计算拍摄服务价格',
        icon: 'calculator',
        color: '#faad14'
      },
      {
        key: 'schedule_manager',
        label: '档期管理',
        description: '管理拍摄时间安排',
        icon: 'time',
        color: '#ff7875'
      }
    ],

    // 页面状态
    loading: true,
    refreshing: false
  },

  onLoad() {
    this.initDashboard()
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData(true)
  },

  // 初始化工作台
  async initDashboard() {
    try {
      // 检查用户身份
      const currentUser = simpleAuthService.getCurrentUser()
      if (!currentUser || !currentUser.is_photographer) {
        wx.showModal({
          title: '权限不足',
          content: '此页面仅限摄影师用户访问',
          showCancel: false,
          success: () => {
            wx.switchTab({ url: '/pages/discover/index' })
          }
        })
        return
      }

      this.setData({ photographerInfo: currentUser })
      
      // 加载数据
      await this.loadDashboardData()
      
      // 启动页面动画
      this.startPageAnimations()

    } catch (error) {
      console.error('初始化工作台失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载工作台数据
  async loadDashboardData() {
    try {
      // 并行加载各种数据
      const [
        todayStats,
        weekStats, 
        pendingTasks,
        recentOrders,
        topWorks
      ] = await Promise.all([
        this.loadTodayStats(),
        this.loadWeekStats(),
        this.loadPendingTasks(),
        this.loadRecentOrders(),
        this.loadTopWorks()
      ])

      this.setData({
        todayStats,
        weekStats,
        pendingTasks,
        recentOrders,
        topWorks
      })

    } catch (error) {
      console.error('加载数据失败:', error)
    }
  },

  // 加载今日统计
  async loadTodayStats() {
    // 模拟数据
    return {
      views: 156,
      likes: 23,
      bookings: 3,
      earnings: 897
    }
  },

  // 加载本周统计
  async loadWeekStats() {
    // 模拟数据
    return {
      totalViews: 1234,
      totalLikes: 189,
      totalBookings: 12,
      totalEarnings: 3456,
      growthRate: 15.6
    }
  },

  // 加载待处理事项
  async loadPendingTasks() {
    // 模拟数据
    return [
      {
        id: 1,
        type: 'booking_request',
        title: '新的约拍请求',
        description: '张小姐想预约人像拍摄',
        priority: 'high',
        time: '2小时前'
      },
      {
        id: 2,
        type: 'payment_pending',
        title: '待确认收款',
        description: '李先生的拍摄费用待确认',
        priority: 'medium',
        time: '5小时前'
      },
      {
        id: 3,
        type: 'review_request',
        title: '客户评价提醒',
        description: '请及时回复王女士的评价',
        priority: 'low',
        time: '1天前'
      }
    ]
  },

  // 加载最新订单
  async loadRecentOrders() {
    // 模拟数据
    return [
      {
        id: 'order_001',
        client: '张小姐',
        service: '人像写真',
        amount: 599,
        status: 'confirmed',
        date: '2025-01-15'
      },
      {
        id: 'order_002', 
        client: '李先生',
        service: '商业拍摄',
        amount: 1299,
        status: 'completed',
        date: '2025-01-12'
      }
    ]
  },

  // 加载热门作品
  async loadTopWorks() {
    // 模拟数据
    return [
      {
        id: 'work_001',
        title: '城市夜景',
        cover: 'https://picsum.photos/300/400?random=1',
        views: 1234,
        likes: 89
      },
      {
        id: 'work_002',
        title: '人像写真',
        cover: 'https://picsum.photos/300/400?random=2', 
        views: 987,
        likes: 67
      }
    ]
  },

  // 刷新数据
  async refreshData(isPullRefresh = false) {
    if (isPullRefresh) {
      this.setData({ refreshing: true })
    }

    try {
      await this.loadDashboardData()
      
      if (isPullRefresh) {
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      }
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      })
    } finally {
      this.setData({ refreshing: false })
      if (isPullRefresh) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 启动页面动画
  startPageAnimations() {
    // 统计卡片依次显示
    const cards = ['.stats-card', '.tasks-card', '.orders-card', '.works-card']
    
    cards.forEach((selector, index) => {
      setTimeout(() => {
        const animation = AnimationService.listItemEnter(index)
        // 这里需要具体的动画实现
      }, index * 100)
    })
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset
    
    if (action.path) {
      wx.navigateTo({
        url: action.path
      })
    }
  },

  // 待处理事项点击
  onTaskTap(e) {
    const { task } = e.currentTarget.dataset
    
    // 根据任务类型跳转到相应页面
    switch (task.type) {
      case 'booking_request':
        wx.navigateTo({
          url: `/pages/appointment/detail?id=${task.id}`
        })
        break
      case 'payment_pending':
        wx.navigateTo({
          url: `/pages/earnings/detail?id=${task.id}`
        })
        break
      case 'review_request':
        wx.navigateTo({
          url: `/pages/reviews/detail?id=${task.id}`
        })
        break
    }
  },

  // 查看更多统计
  onViewMoreStats() {
    wx.navigateTo({
      url: '/pages/photographer/analytics'
    })
  },

  // 查看所有订单
  onViewAllOrders() {
    wx.navigateTo({
      url: '/pages/photographer/orders'
    })
  }
})
