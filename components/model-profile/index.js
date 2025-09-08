// 模特专用资料组件
Component({
  properties: {
    // 模特信息
    model: {
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
      value: 'view' // view, edit, card
    }
  },

  data: {
    // 模特分类
    modelCategories: {
      'fashion': {
        label: '时尚模特',
        icon: 'crown',
        color: '#722ed1',
        description: '时尚杂志、品牌广告拍摄'
      },
      'portrait': {
        label: '人像模特',
        icon: 'user',
        color: '#ff7875',
        description: '个人写真、艺术人像拍摄'
      },
      'commercial': {
        label: '商业模特',
        icon: 'shop',
        color: '#1890ff',
        description: '产品广告、商业宣传拍摄'
      },
      'art': {
        label: '艺术模特',
        icon: 'star',
        color: '#d4af37',
        description: '艺术创作、概念摄影'
      },
      'fitness': {
        label: '健身模特',
        icon: 'heart',
        color: '#52c41a',
        description: '运动健身、体型展示拍摄'
      }
    },

    // 身材数据配置
    bodyMeasurements: [
      { key: 'height', label: '身高', unit: 'cm', icon: 'arrow-up' },
      { key: 'weight', label: '体重', unit: 'kg', icon: 'scale' },
      { key: 'bust', label: '胸围', unit: 'cm', icon: 'circle' },
      { key: 'waist', label: '腰围', unit: 'cm', icon: 'circle' },
      { key: 'hips', label: '臀围', unit: 'cm', icon: 'circle' },
      { key: 'shoe_size', label: '鞋码', unit: '码', icon: 'shoe' }
    ],

    // 拍摄风格
    shootingStyles: [
      { key: 'sweet', label: '甜美', color: '#ff7875' },
      { key: 'cool', label: '酷帅', color: '#1890ff' },
      { key: 'elegant', label: '优雅', color: '#722ed1' },
      { key: 'sexy', label: '性感', color: '#eb2f96' },
      { key: 'fresh', label: '清新', color: '#52c41a' },
      { key: 'vintage', label: '复古', color: '#d4af37' },
      { key: 'artistic', label: '艺术', color: '#8c8c8c' }
    ],

    // 可拍摄类型
    availableTypes: [
      { key: 'portrait', label: '个人写真', price: '200-500' },
      { key: 'fashion', label: '时尚大片', price: '500-1000' },
      { key: 'commercial', label: '商业广告', price: '1000-3000' },
      { key: 'art', label: '艺术创作', price: '300-800' },
      { key: 'wedding', label: '婚纱摄影', price: '800-2000' }
    ]
  },

  methods: {
    // 获取模特分类配置
    getCategoryConfig() {
      const { model } = this.data
      const category = model.category || 'portrait'
      
      return this.data.modelCategories[category] || this.data.modelCategories.portrait
    },

    // 格式化身材数据
    formatBodyMeasurements() {
      const { model } = this.data
      const measurements = model.body_measurements || {}
      
      return this.data.bodyMeasurements.map(item => ({
        ...item,
        value: measurements[item.key] || '',
        displayValue: measurements[item.key] ? `${measurements[item.key]}${item.unit}` : '未填写'
      })).filter(item => item.value)
    },

    // 获取拍摄风格
    getShootingStyles() {
      const { model } = this.data
      const styles = model.shooting_styles || []
      
      return this.data.shootingStyles.filter(style => 
        styles.includes(style.key)
      )
    },

    // 获取可拍摄类型
    getAvailableTypes() {
      const { model } = this.data
      const types = model.available_types || []
      
      return this.data.availableTypes.filter(type =>
        types.includes(type.key)
      )
    },

    // 计算完整度
    calculateProfileCompleteness() {
      const { model } = this.data
      const requiredFields = [
        'avatar_url', 'nickname', 'bio', 'category',
        'body_measurements', 'shooting_styles', 'available_types',
        'portfolio_images', 'contact_info'
      ]
      
      let completedFields = 0
      requiredFields.forEach(field => {
        if (model[field] && (
          typeof model[field] !== 'object' || 
          (Array.isArray(model[field]) && model[field].length > 0) ||
          Object.keys(model[field]).length > 0
        )) {
          completedFields++
        }
      })
      
      return Math.round((completedFields / requiredFields.length) * 100)
    },

    // 编辑资料
    onEditProfile() {
      wx.navigateTo({
        url: '/pages/model/edit-profile'
      })
    },

    // 查看作品集
    onViewPortfolio() {
      const { model } = this.data
      
      wx.navigateTo({
        url: `/pages/model/portfolio?modelId=${model.id}`
      })
    },

    // 管理档期
    onManageSchedule() {
      wx.navigateTo({
        url: '/pages/model/schedule'
      })
    },

    // 查看约拍邀请
    onViewInvitations() {
      wx.navigateTo({
        url: '/pages/model/invitations'
      })
    },

    // 联系模特
    onContactModel() {
      const { model } = this.data
      
      this.triggerEvent('contact', { model })

      wx.navigateTo({
        url: `/pages/chat/index?userId=${model.id}&userName=${model.nickname}`
      })
    },

    // 邀请拍摄
    onInviteShoot() {
      const { model } = this.data
      
      this.triggerEvent('invite', { model })

      wx.navigateTo({
        url: `/pages/appointment/invite?modelId=${model.id}`
      })
    },

    // 分享模特资料
    onShareProfile() {
      const { model } = this.data
      
      wx.showActionSheet({
        itemList: ['分享给朋友', '生成海报', '复制链接'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.shareToFriend()
              break
            case 1:
              this.generatePoster()
              break
            case 2:
              this.copyProfileLink()
              break
          }
        }
      })
    },

    // 分享给朋友
    shareToFriend() {
      const { model } = this.data
      
      wx.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },

    // 生成海报
    generatePoster() {
      wx.navigateTo({
        url: '/pages/poster/generate?type=model&id=' + this.data.model.id
      })
    },

    // 复制资料链接
    copyProfileLink() {
      const { model } = this.data
      
      wx.setClipboardData({
        data: `懂拍帝模特：${model.nickname}`,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        }
      })
    }
  }
})
