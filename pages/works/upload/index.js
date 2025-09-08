// 作品上传页面
Page({
  data: {
    images: [],
    title: '',
    description: '',
    category: '',
    tags: [],
    location: null,
    uploading: false,
    categories: [
      { id: 'portrait', name: '人像' },
      { id: 'landscape', name: '风光' },
      { id: 'street', name: '街拍' },
      { id: 'commercial', name: '商业' },
      { id: 'art', name: '艺术' }
    ],
    categoryKeys: { value: 'id', label: 'name' }
  },

  // 选择图片
  onChooseImage() {
    const { images } = this.data;
    const remainCount = 9 - images.length;
    
    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...images, ...newImages]
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 选择分类
  onCategoryChange(e) {
    this.setData({ category: e.detail.value });
  },

  // 获取位置
  onGetLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        // 这里可以调用地图API获取地址信息
      }
    });
  },

  // 发布作品
  async onPublish() {
    const { images, title, description, category } = this.data;
    
    if (images.length === 0) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
      return;
    }
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    this.setData({ uploading: true });
    
    try {
      // 模拟上传过程
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
      this.setData({ uploading: false });
    }
  }
});
