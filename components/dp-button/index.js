// 懂拍帝定制按钮组件 - 基于TDesign
Component({
  properties: {
    // 按钮类型
    type: {
      type: String,
      value: 'primary' // primary, secondary, outline, text, danger
    },
    // 按钮尺寸
    size: {
      type: String,
      value: 'medium' // small, medium, large
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否加载中
    loading: {
      type: Boolean,
      value: false
    },
    // 图标
    icon: {
      type: String,
      value: ''
    },
    // 按钮文本
    text: {
      type: String,
      value: ''
    },
    // 是否块级按钮
    block: {
      type: Boolean,
      value: false
    },
    // 是否圆形按钮
    round: {
      type: Boolean,
      value: false
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    // 按钮样式映射
    typeStyles: {
      'primary': 'dp-button-primary',
      'secondary': 'dp-button-secondary', 
      'outline': 'dp-button-outline',
      'text': 'dp-button-text',
      'danger': 'dp-button-danger'
    },
    
    sizeStyles: {
      'small': 'dp-button-small',
      'medium': '',
      'large': 'dp-button-large'
    }
  },

  methods: {
    // 按钮点击事件
    onButtonTap(e) {
      const { disabled, loading } = this.data
      
      if (disabled || loading) {
        return
      }

      // 触发点击事件
      this.triggerEvent('tap', e.detail)
      
      // 添加触觉反馈
      wx.vibrateShort({
        type: 'light'
      })
    },

    // 获取按钮样式类
    getButtonClass() {
      const { type, size, disabled, loading, block, round } = this.data
      
      let classes = ['dp-button']
      
      // 类型样式
      if (this.data.typeStyles[type]) {
        classes.push(this.data.typeStyles[type])
      }
      
      // 尺寸样式
      if (this.data.sizeStyles[size]) {
        classes.push(this.data.sizeStyles[size])
      }
      
      // 状态样式
      if (disabled) {
        classes.push('dp-button-disabled')
      }
      
      if (loading) {
        classes.push('dp-button-loading')
      }
      
      if (block) {
        classes.push('dp-button-block')
      }
      
      if (round) {
        classes.push('dp-button-round')
      }
      
      return classes.join(' ')
    },

    // 获取图标名称
    getIconName() {
      const { loading, icon } = this.data
      
      if (loading) {
        return 'loading'
      }
      
      return icon
    }
  }
})
