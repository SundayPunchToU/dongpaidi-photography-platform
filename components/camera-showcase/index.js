// 摄影器材展示组件 - 差异化特色
Component({
  properties: {
    // 器材信息
    equipment: {
      type: Object,
      value: {}
    },
    // 显示模式
    mode: {
      type: String,
      value: 'compact' // compact, detailed, comparison
    },
    // 是否可交互
    interactive: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 相机品牌配置
    cameraBrands: {
      'canon': {
        name: 'Canon',
        color: '#e60012',
        logo: '/images/brands/canon.png'
      },
      'nikon': {
        name: 'Nikon', 
        color: '#ffcc00',
        logo: '/images/brands/nikon.png'
      },
      'sony': {
        name: 'Sony',
        color: '#000000',
        logo: '/images/brands/sony.png'
      },
      'fujifilm': {
        name: 'Fujifilm',
        color: '#00a650',
        logo: '/images/brands/fujifilm.png'
      }
    },

    // 器材类型图标
    equipmentIcons: {
      'camera': 'camera',
      'lens': 'focus',
      'flash': 'lightbulb',
      'tripod': 'location',
      'filter': 'layers',
      'accessory': 'setting'
    },

    // 拍摄参数标签
    parameterLabels: {
      'aperture': { label: '光圈', unit: 'f/', icon: 'aperture' },
      'shutter': { label: '快门', unit: 's', icon: 'timer' },
      'iso': { label: 'ISO', unit: '', icon: 'brightness' },
      'focal_length': { label: '焦距', unit: 'mm', icon: 'focus' },
      'exposure': { label: '曝光', unit: 'EV', icon: 'sun' }
    }
  },

  methods: {
    // 获取品牌信息
    getBrandInfo() {
      const { equipment } = this.data
      const brand = equipment.brand?.toLowerCase() || 'unknown'
      
      return this.data.cameraBrands[brand] || {
        name: equipment.brand || '未知品牌',
        color: '#8c8c8c',
        logo: '/images/brands/default.png'
      }
    },

    // 格式化器材名称
    formatEquipmentName() {
      const { equipment } = this.data
      
      if (equipment.brand && equipment.model) {
        return `${equipment.brand} ${equipment.model}`
      }
      
      return equipment.name || '未知器材'
    },

    // 获取器材图标
    getEquipmentIcon() {
      const { equipment } = this.data
      const type = equipment.type?.toLowerCase() || 'camera'
      
      return this.data.equipmentIcons[type] || 'camera'
    },

    // 格式化拍摄参数
    formatShootingParams() {
      const { equipment } = this.data
      const params = equipment.shooting_params || {}
      
      return Object.entries(params).map(([key, value]) => {
        const config = this.data.parameterLabels[key]
        if (!config || !value) return null
        
        return {
          key,
          label: config.label,
          value: `${config.unit}${value}`,
          icon: config.icon,
          displayValue: this.formatParamValue(key, value, config.unit)
        }
      }).filter(Boolean)
    },

    // 格式化参数值
    formatParamValue(key, value, unit) {
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
          return `${unit}${value}`
      }
    },

    // 器材卡片点击
    onEquipmentTap() {
      const { equipment, interactive } = this.data
      
      if (!interactive) return

      this.triggerEvent('equipmentTap', {
        equipment
      })

      // 显示器材详情
      this.showEquipmentDetail()
    },

    // 显示器材详情
    showEquipmentDetail() {
      const { equipment } = this.data
      const brandInfo = this.getBrandInfo()
      const params = this.formatShootingParams()
      
      let content = `品牌：${brandInfo.name}\n`
      content += `型号：${equipment.model || '未知'}\n`
      
      if (params.length > 0) {
        content += '\n拍摄参数：\n'
        params.forEach(param => {
          content += `${param.label}：${param.displayValue}\n`
        })
      }

      wx.showModal({
        title: '器材信息',
        content: content,
        showCancel: false,
        confirmText: '了解'
      })
    },

    // 参数标签点击
    onParamTap(e) {
      const { param } = e.currentTarget.dataset
      
      this.triggerEvent('paramTap', {
        parameter: param
      })

      // 显示参数说明
      this.showParameterExplanation(param)
    },

    // 显示参数说明
    showParameterExplanation(param) {
      const explanations = {
        'aperture': '光圈控制景深，数值越小景深越浅',
        'shutter': '快门速度控制曝光时间和运动模糊',
        'iso': 'ISO感光度，数值越高噪点越多',
        'focal_length': '焦距决定视角范围和透视效果',
        'exposure': '曝光补偿调整画面明暗'
      }

      const explanation = explanations[param.key] || '专业摄影参数'

      wx.showToast({
        title: explanation,
        icon: 'none',
        duration: 2000
      })
    },

    // 器材对比
    onCompareEquipment() {
      this.triggerEvent('compare', {
        equipment: this.data.equipment
      })
    },

    // 器材收藏
    onFavoriteEquipment() {
      const { equipment } = this.data
      
      this.triggerEvent('favorite', {
        equipmentId: equipment.id,
        isFavorited: !equipment.is_favorited
      })

      // 更新收藏状态
      this.setData({
        'equipment.is_favorited': !equipment.is_favorited
      })

      wx.showToast({
        title: equipment.is_favorited ? '已取消收藏' : '已收藏',
        icon: 'success'
      })
    },

    // 查看相似器材
    onViewSimilar() {
      const { equipment } = this.data
      
      wx.navigateTo({
        url: `/pages/equipment/similar?brand=${equipment.brand}&type=${equipment.type}`
      })
    }
  }
})
