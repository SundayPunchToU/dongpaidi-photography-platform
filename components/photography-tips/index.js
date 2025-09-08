// 摄影技巧分享组件
Component({
  properties: {
    // 技巧信息
    tip: {
      type: Object,
      value: {}
    },
    // 显示模式
    mode: {
      type: String,
      value: 'card' // card, detail, mini
    }
  },

  data: {
    // 技巧分类配置
    tipCategories: {
      'composition': {
        label: '构图技巧',
        icon: 'grid',
        color: '#1890ff',
        gradient: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)'
      },
      'lighting': {
        label: '用光技巧',
        icon: 'lightbulb',
        color: '#faad14',
        gradient: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)'
      },
      'portrait': {
        label: '人像技巧',
        icon: 'user',
        color: '#ff7875',
        gradient: 'linear-gradient(135deg, #ff7875 0%, #ffa39e 100%)'
      },
      'landscape': {
        label: '风光技巧',
        icon: 'image',
        color: '#52c41a',
        gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
      },
      'equipment': {
        label: '器材使用',
        icon: 'setting',
        color: '#722ed1',
        gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)'
      },
      'post_processing': {
        label: '后期处理',
        icon: 'edit',
        color: '#eb2f96',
        gradient: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)'
      }
    },

    // 难度等级配置
    difficultyLevels: {
      'beginner': {
        label: '入门',
        color: '#52c41a',
        icon: 'user'
      },
      'intermediate': {
        label: '进阶',
        color: '#faad14',
        icon: 'star'
      },
      'advanced': {
        label: '高级',
        color: '#ff7875',
        icon: 'crown'
      },
      'professional': {
        label: '专业',
        color: '#722ed1',
        icon: 'trophy'
      }
    }
  },

  methods: {
    // 获取分类配置
    getCategoryConfig() {
      const { tip } = this.data
      const category = tip.category || 'composition'
      
      return this.data.tipCategories[category] || this.data.tipCategories.composition
    },

    // 获取难度配置
    getDifficultyConfig() {
      const { tip } = this.data
      const difficulty = tip.difficulty || 'beginner'
      
      return this.data.difficultyLevels[difficulty] || this.data.difficultyLevels.beginner
    },

    // 格式化阅读时间
    formatReadingTime() {
      const { tip } = this.data
      const wordCount = tip.content?.length || 0
      const readingTime = Math.ceil(wordCount / 200) // 假设每分钟200字
      
      return `${readingTime}分钟阅读`
    },

    // 技巧卡片点击
    onTipTap() {
      const { tip } = this.data
      
      this.triggerEvent('tipTap', { tip })

      // 跳转到技巧详情页
      wx.navigateTo({
        url: `/pages/tips/detail?id=${tip.id}`
      })
    },

    // 收藏技巧
    onFavoriteTip() {
      const { tip } = this.data
      
      this.triggerEvent('favorite', {
        tipId: tip.id,
        isFavorited: !tip.is_favorited
      })

      // 更新收藏状态
      this.setData({
        'tip.is_favorited': !tip.is_favorited
      })

      wx.showToast({
        title: tip.is_favorited ? '已取消收藏' : '已收藏技巧',
        icon: 'success'
      })
    },

    // 分享技巧
    onShareTip() {
      const { tip } = this.data
      
      this.triggerEvent('share', { tip })

      // 显示分享选项
      wx.showActionSheet({
        itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
        success: (res) => {
          const actions = ['friend', 'timeline', 'copy']
          this.handleShare(actions[res.tapIndex], tip)
        }
      })
    },

    // 处理分享
    handleShare(type, tip) {
      switch (type) {
        case 'friend':
          // 分享给朋友
          wx.showToast({
            title: '分享功能开发中',
            icon: 'none'
          })
          break
        case 'timeline':
          // 分享到朋友圈
          wx.showToast({
            title: '朋友圈分享开发中',
            icon: 'none'
          })
          break
        case 'copy':
          // 复制链接
          wx.setClipboardData({
            data: `懂拍帝摄影技巧：${tip.title}`,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              })
            }
          })
          break
      }
    },

    // 查看作者
    onAuthorTap() {
      const { tip } = this.data
      
      if (tip.author && tip.author.id) {
        wx.navigateTo({
          url: `/pages/profile/index?userId=${tip.author.id}`
        })
      }
    },

    // 相关技巧推荐
    onRelatedTips() {
      const { tip } = this.data
      
      wx.navigateTo({
        url: `/pages/tips/related?category=${tip.category}&difficulty=${tip.difficulty}`
      })
    },

    // 实践这个技巧
    onPracticeTip() {
      const { tip } = this.data
      
      this.triggerEvent('practice', { tip })

      // 跳转到拍摄模式
      wx.navigateTo({
        url: `/pages/camera/practice?tipId=${tip.id}`
      })
    }
  }
})
