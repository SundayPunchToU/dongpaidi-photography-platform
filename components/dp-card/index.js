// 懂拍帝定制卡片组件
Component({
  properties: {
    // 卡片类型
    type: {
      type: String,
      value: 'default' // default, work, photographer, model
    },
    // 卡片数据
    data: {
      type: Object,
      value: {}
    },
    // 是否显示阴影
    shadow: {
      type: Boolean,
      value: true
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      value: true
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    // 卡片类型样式映射
    typeStyles: {
      'default': 'dp-card',
      'work': 'dp-card dp-card-work',
      'photographer': 'dp-card dp-card-photographer',
      'model': 'dp-card dp-card-model'
    }
  },

  methods: {
    // 卡片点击事件
    onCardTap(e) {
      const { clickable } = this.data
      
      if (!clickable) return

      this.triggerEvent('cardtap', {
        data: this.data.data,
        type: this.data.type
      })
      
      // 添加触觉反馈
      wx.vibrateShort({
        type: 'light'
      })
    },

    // 获取卡片样式类
    getCardClass() {
      const { type, shadow, clickable } = this.data
      
      let classes = [this.data.typeStyles[type] || this.data.typeStyles.default]
      
      if (!shadow) {
        classes.push('no-shadow')
      }
      
      if (!clickable) {
        classes.push('not-clickable')
      }
      
      return classes.join(' ')
    },

    // 格式化数字
    formatCount(count) {
      if (count >= 10000) {
        return (count / 10000).toFixed(1) + 'w'
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k'
      }
      return count.toString()
    },

    // 格式化时间
    formatTime(timeString) {
      const time = new Date(timeString)
      const now = new Date()
      const diff = now - time
      
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (minutes < 60) {
        return `${minutes}分钟前`
      } else if (hours < 24) {
        return `${hours}小时前`
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return time.toLocaleDateString()
      }
    },

    // 作品卡片交互
    onWorkLike(e) {
      e.stopPropagation()
      
      this.triggerEvent('like', {
        workId: this.data.data.id,
        isLiked: !this.data.data.is_liked
      })
    },

    onWorkComment(e) {
      e.stopPropagation()
      
      this.triggerEvent('comment', {
        workId: this.data.data.id
      })
    },

    onWorkShare(e) {
      e.stopPropagation()
      
      this.triggerEvent('share', {
        workId: this.data.data.id
      })
    },

    // 摄影师卡片交互
    onPhotographerFollow(e) {
      e.stopPropagation()
      
      this.triggerEvent('follow', {
        photographerId: this.data.data.id,
        isFollowing: !this.data.data.is_following
      })
    },

    onPhotographerMessage(e) {
      e.stopPropagation()
      
      this.triggerEvent('message', {
        photographerId: this.data.data.id
      })
    }
  }
})
