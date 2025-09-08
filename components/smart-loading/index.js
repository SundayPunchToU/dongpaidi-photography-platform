// 智能加载状态组件
Component({
  properties: {
    // 加载类型
    type: {
      type: String,
      value: 'default' // default, image, upload, payment, search
    },
    // 是否显示
    visible: {
      type: Boolean,
      value: false
    },
    // 加载文案
    text: {
      type: String,
      value: ''
    },
    // 进度值 (0-100)
    progress: {
      type: Number,
      value: 0
    },
    // 是否显示进度
    showProgress: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 不同类型的配置
    typeConfigs: {
      default: {
        icon: 'loading',
        text: '加载中...',
        color: '#1890ff'
      },
      image: {
        icon: 'camera',
        text: '处理图片中...',
        color: '#d4af37'
      },
      upload: {
        icon: 'cloud-upload',
        text: '上传中...',
        color: '#52c41a'
      },
      payment: {
        icon: 'wallet',
        text: '支付处理中...',
        color: '#faad14'
      },
      search: {
        icon: 'search',
        text: 'AI分析中...',
        color: '#722ed1'
      }
    },
    
    // 动画状态
    rotateAnimation: {},
    pulseAnimation: {},
    progressAnimation: {}
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        this.startAnimations()
      } else {
        this.stopAnimations()
      }
    },
    
    'progress': function(progress) {
      if (this.data.showProgress) {
        this.updateProgressAnimation(progress)
      }
    }
  },

  methods: {
    // 开始动画
    startAnimations() {
      this.startRotateAnimation()
      this.startPulseAnimation()
    },

    // 停止动画
    stopAnimations() {
      // 动画会在组件隐藏时自动停止
    },

    // 旋转动画
    startRotateAnimation() {
      const animation = wx.createAnimation({
        duration: 1000,
        timingFunction: 'linear',
        delay: 0
      })

      const rotate = () => {
        animation.rotate(360).step()
        this.setData({
          rotateAnimation: animation.export()
        })

        if (this.data.visible) {
          setTimeout(() => {
            animation.rotate(720).step()
            this.setData({
              rotateAnimation: animation.export()
            })
            setTimeout(rotate, 1000)
          }, 1000)
        }
      }

      rotate()
    },

    // 脉冲动画
    startPulseAnimation() {
      const animation = wx.createAnimation({
        duration: 800,
        timingFunction: 'ease-in-out',
        delay: 0
      })

      const pulse = () => {
        animation.scale(1.1).opacity(0.8).step()
        animation.scale(1).opacity(1).step()
        
        this.setData({
          pulseAnimation: animation.export()
        })

        if (this.data.visible) {
          setTimeout(pulse, 1600)
        }
      }

      pulse()
    },

    // 更新进度动画
    updateProgressAnimation(progress) {
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-out'
      })

      animation.width(`${progress}%`).step()
      
      this.setData({
        progressAnimation: animation.export()
      })
    },

    // 获取当前类型配置
    getCurrentConfig() {
      const { type, text } = this.data
      const config = this.data.typeConfigs[type] || this.data.typeConfigs.default
      
      return {
        ...config,
        text: text || config.text
      }
    }
  }
})
