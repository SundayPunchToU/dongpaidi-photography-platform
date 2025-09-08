// 相机参数组件
Component({
  properties: {
    // 相机参数数据
    params: {
      type: Object,
      value: {}
    },
    // 是否可编辑
    editable: {
      type: Boolean,
      value: false
    },
    // 显示模式
    mode: {
      type: String,
      value: 'display' // display, edit, compact
    }
  },

  data: {
    // 参数配置
    paramConfigs: {
      aperture: {
        label: '光圈',
        unit: 'f/',
        icon: 'aperture',
        color: '#1890ff'
      },
      shutter: {
        label: '快门',
        unit: 's',
        icon: 'timer',
        color: '#52c41a'
      },
      iso: {
        label: 'ISO',
        unit: '',
        icon: 'brightness',
        color: '#faad14'
      },
      focal_length: {
        label: '焦距',
        unit: 'mm',
        icon: 'focus',
        color: '#722ed1'
      },
      exposure: {
        label: '曝光',
        unit: 'EV',
        icon: 'sun',
        color: '#ff7875'
      }
    }
  },

  methods: {
    // 格式化参数值
    formatParamValue(key, value) {
      const config = this.data.paramConfigs[key]
      if (!config || !value) return ''
      
      switch (key) {
        case 'aperture':
          return `f/${value}`
        case 'shutter':
          if (value >= 1) {
            return `${value}s`
          } else {
            return `1/${Math.round(1/value)}s`
          }
        case 'iso':
          return `ISO ${value}`
        case 'focal_length':
          return `${value}mm`
        case 'exposure':
          return value > 0 ? `+${value}EV` : `${value}EV`
        default:
          return `${config.unit}${value}`
      }
    },

    // 获取显示的参数列表
    getDisplayParams() {
      const { params } = this.data
      
      return Object.entries(params).map(([key, value]) => {
        const config = this.data.paramConfigs[key]
        if (!config || !value) return null
        
        return {
          key,
          label: config.label,
          value: value,
          displayValue: this.formatParamValue(key, value),
          icon: config.icon,
          color: config.color
        }
      }).filter(Boolean)
    },

    // 参数点击
    onParamTap(e) {
      const { param } = e.currentTarget.dataset
      
      this.triggerEvent('paramTap', { param })
    },

    // 编辑参数
    onEditParam(e) {
      const { param } = e.currentTarget.dataset
      
      this.triggerEvent('editParam', { param })
    }
  }
})
