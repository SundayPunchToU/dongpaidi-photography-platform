// 摄影师专业信息卡片组件
Component({
  properties: {
    // 摄影师信息
    photographer: {
      type: Object,
      value: {}
    },
    // 显示模式
    mode: {
      type: String,
      value: 'card' // card, list, detail
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 专业等级配置
    levelConfigs: {
      'beginner': {
        label: '新手摄影师',
        color: '#52c41a',
        icon: 'user',
        description: '刚入门的摄影爱好者'
      },
      'amateur': {
        label: '业余摄影师', 
        color: '#1890ff',
        icon: 'camera',
        description: '有一定经验的摄影爱好者'
      },
      'professional': {
        label: '专业摄影师',
        color: '#d4af37',
        icon: 'crown',
        description: '具备专业技能和丰富经验'
      },
      'master': {
        label: '摄影大师',
        color: '#722ed1',
        icon: 'star',
        description: '行业顶尖的摄影专家'
      }
    },

    // 专业标签配置
    specialtyTags: {
      'portrait': { label: '人像', icon: 'user', color: '#ff7875' },
      'landscape': { label: '风光', icon: 'image', color: '#52c41a' },
      'street': { label: '街拍', icon: 'location', color: '#1890ff' },
      'commercial': { label: '商业', icon: 'shop', color: '#d4af37' },
      'wedding': { label: '婚礼', icon: 'heart', color: '#eb2f96' },
      'fashion': { label: '时尚', icon: 'crown', color: '#722ed1' }
    }
  },

  methods: {
    // 获取等级配置
    getLevelConfig() {
      const { photographer } = this.data
      const level = photographer.level || 'beginner'
      return this.data.levelConfigs[level] || this.data.levelConfigs.beginner
    },

    // 获取专业标签
    getSpecialtyTags() {
      const { photographer } = this.data
      const specialties = photographer.specialties || []
      
      return specialties.map(specialty => {
        return this.data.specialtyTags[specialty] || {
          label: specialty,
          icon: 'tag',
          color: '#8c8c8c'
        }
      })
    },

    // 格式化统计数据
    formatStats() {
      const { photographer } = this.data
      
      return {
        works: this.formatNumber(photographer.works_count || 0),
        followers: this.formatNumber(photographer.followers_count || 0),
        likes: this.formatNumber(photographer.total_likes || 0),
        rating: (photographer.rating || 0).toFixed(1),
        orders: this.formatNumber(photographer.completed_orders || 0)
      }
    },

    // 数字格式化
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
      }
      return num.toString()
    },

    // 计算评分星级
    getStarRating() {
      const rating = this.data.photographer.rating || 0
      const fullStars = Math.floor(rating)
      const hasHalfStar = rating % 1 >= 0.5
      
      return {
        fullStars,
        hasHalfStar,
        emptyStars: 5 - fullStars - (hasHalfStar ? 1 : 0)
      }
    },

    // 点击摄影师卡片
    onCardTap() {
      const { photographer } = this.data
      
      this.triggerEvent('tap', {
        photographer
      })

      // 跳转到摄影师详情页
      wx.navigateTo({
        url: `/pages/photographer/detail?id=${photographer.id}`
      })
    },

    // 关注/取消关注
    onFollowTap() {
      const { photographer } = this.data
      
      this.triggerEvent('follow', {
        photographerId: photographer.id,
        isFollowing: !photographer.is_following
      })
    },

    // 联系摄影师
    onContactTap() {
      const { photographer } = this.data
      
      this.triggerEvent('contact', {
        photographer
      })

      // 跳转到聊天页面
      wx.navigateTo({
        url: `/pages/chat/index?userId=${photographer.id}&userName=${photographer.nickname}`
      })
    },

    // 预约拍摄
    onBookTap() {
      const { photographer } = this.data
      
      this.triggerEvent('book', {
        photographer
      })

      // 跳转到预约页面
      wx.navigateTo({
        url: `/pages/appointment/order?photographerId=${photographer.id}`
      })
    },

    // 查看作品集
    onWorksViewTap() {
      const { photographer } = this.data
      
      wx.navigateTo({
        url: `/pages/works/list?photographerId=${photographer.id}`
      })
    }
  }
})
