// 发布约拍页面
Page({
  data: {
    type: 'photographer_seek_model', // photographer_seek_model | model_seek_photographer
    title: '',
    description: '',
    style: [],
    location: {
      city: '',
      district: '',
      address: ''
    },
    schedule: {
      date: '',
      duration: 2
    },
    budget: {
      min: 0,
      max: 0,
      negotiable: false
    },
    publishing: false,
    styleOptions: ['清新', '复古', '时尚', '艺术', '街拍', '夜景', '日系', '欧美']
  },

  // 类型切换
  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 风格选择
  onStyleToggle(e) {
    const { style: selectedStyle } = e.currentTarget.dataset;
    const { style } = this.data;
    
    const index = style.indexOf(selectedStyle);
    if (index > -1) {
      style.splice(index, 1);
    } else {
      style.push(selectedStyle);
    }
    
    this.setData({ style });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ 'schedule.date': e.detail.value });
  },

  // 时长调整
  onDurationChange(e) {
    this.setData({ 'schedule.duration': e.detail.value });
  },

  // 预算输入
  onBudgetMinInput(e) {
    this.setData({ 'budget.min': Number(e.detail.value) });
  },

  onBudgetMaxInput(e) {
    this.setData({ 'budget.max': Number(e.detail.value) });
  },

  // 面议切换
  onNegotiableChange(e) {
    this.setData({ 'budget.negotiable': e.detail.value });
  },

  // 发布约拍
  async onPublish() {
    const { title, description, schedule, budget } = this.data;
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    
    if (!schedule.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    this.setData({ publishing: true });
    
    try {
      // 模拟发布API调用
      setTimeout(() => {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }, 2000);
    } catch (error) {
      console.error('发布失败:', error);
      this.setData({ publishing: false });
    }
  }
});
