// 智能导航组件
Component({
  properties: {
    // 当前页面
    currentPage: {
      type: String,
      value: 'home'
    },
    // 用户类型
    userType: {
      type: String,
      value: 'user' // user, photographer, model
    },
    // 是否显示专业功能
    showProfessional: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 基础导航配置
    baseNavItems: [
      {
        key: 'home',
        label: '发现',
        icon: 'home',
        activeIcon: 'home-filled',
        path: '/pages/discover/index'
      },
      {
        key: 'works',
        label: '作品',
        icon: 'image',
        activeIcon: 'image-filled', 
        path: '/pages/works/index'
      },
      {
        key: 'appointment',
        label: '约拍',
        icon: 'calendar',
        activeIcon: 'calendar-filled',
        path: '/pages/appointment/index'
      },
      {
        key: 'message',
        label: '消息',
        icon: 'chat',
        activeIcon: 'chat-filled',
        path: '/pages/message/index',
        badge: 0
      },
      {
        key: 'profile',
        label: '我的',
        icon: 'user',
        activeIcon: 'user-filled',
        path: '/pages/profile/index'
      }
    ],

    // 摄影师专业导航
    photographerNavItems: [
      {
        key: 'dashboard',
        label: '工作台',
        icon: 'dashboard',
        activeIcon: 'dashboard-filled',
        path: '/pages/photographer/dashboard'
      },
      {
        key: 'portfolio',
        label: '作品集',
        icon: 'folder',
        activeIcon: 'folder-filled',
        path: '/pages/photographer/portfolio'
      },
      {
        key: 'orders',
        label: '订单',
        icon: 'order',
        activeIcon: 'order-filled',
        path: '/pages/photographer/orders',
        badge: 0
      },
      {
        key: 'earnings',
        label: '收益',
        icon: 'money',
        activeIcon: 'money-filled',
        path: '/pages/photographer/earnings'
      },
      {
        key: 'settings',
        label: '设置',
        icon: 'setting',
        activeIcon: 'setting-filled',
        path: '/pages/photographer/settings'
      }
    ],

    // 中央发布按钮
    centerButton: {
      icon: 'add',
      activeIcon: 'camera',
      gradient: true
    }
  },

  computed: {
    // 计算当前导航项
    navItems() {
      const { userType, showProfessional } = this.data
      
      if (userType === 'photographer' && showProfessional) {
        return this.data.photographerNavItems
      }
      
      return this.data.baseNavItems
    }
  },

  methods: {
    // 导航项点击
    onNavItemTap(e) {
      const { item } = e.currentTarget.dataset
      const { currentPage } = this.data
      
      if (item.key === currentPage) {
        // 当前页面，触发刷新
        this.triggerEvent('refresh', { page: item.key })
        return
      }

      // 触发导航事件
      this.triggerEvent('navigate', {
        from: currentPage,
        to: item.key,
        path: item.path
      })

      // 执行导航
      if (item.path.includes('tab')) {
        wx.switchTab({ url: item.path })
      } else {
        wx.navigateTo({ url: item.path })
      }
    },

    // 中央按钮点击
    onCenterButtonTap() {
      const { userType } = this.data
      
      this.triggerEvent('centerAction', { userType })

      // 根据用户类型显示不同的发布选项
      if (userType === 'photographer') {
        this.showPhotographerPublishOptions()
      } else {
        this.showUserPublishOptions()
      }
    },

    // 显示摄影师发布选项
    showPhotographerPublishOptions() {
      wx.showActionSheet({
        itemList: [
          '📸 发布作品',
          '📅 发布约拍服务',
          '🎓 发布教程',
          '🛍️ 发布器材推荐'
        ],
        success: (res) => {
          const actions = [
            () => wx.navigateTo({ url: '/pages/release/work' }),
            () => wx.navigateTo({ url: '/pages/release/appointment' }),
            () => wx.navigateTo({ url: '/pages/release/tutorial' }),
            () => wx.navigateTo({ url: '/pages/release/product' })
          ]
          
          if (actions[res.tapIndex]) {
            actions[res.tapIndex]()
          }
        }
      })
    },

    // 显示用户发布选项
    showUserPublishOptions() {
      wx.showActionSheet({
        itemList: [
          '📸 分享作品',
          '🔍 发布约拍需求',
          '❓ 求助提问'
        ],
        success: (res) => {
          const actions = [
            () => wx.navigateTo({ url: '/pages/release/work' }),
            () => wx.navigateTo({ url: '/pages/release/request' }),
            () => wx.navigateTo({ url: '/pages/release/question' })
          ]
          
          if (actions[res.tapIndex]) {
            actions[res.tapIndex]()
          }
        }
      })
    },

    // 更新消息徽章
    updateMessageBadge(count) {
      const navItems = this.data.navItems
      const messageItem = navItems.find(item => item.key === 'message')
      
      if (messageItem) {
        messageItem.badge = count
        this.setData({ navItems })
      }
    },

    // 更新订单徽章
    updateOrderBadge(count) {
      const navItems = this.data.navItems
      const orderItem = navItems.find(item => item.key === 'orders')
      
      if (orderItem) {
        orderItem.badge = count
        this.setData({ navItems })
      }
    },

    // 切换专业模式
    toggleProfessionalMode() {
      const { showProfessional } = this.data
      
      this.setData({
        showProfessional: !showProfessional
      })

      this.triggerEvent('modeChange', {
        professional: !showProfessional
      })
    }
  }
})
