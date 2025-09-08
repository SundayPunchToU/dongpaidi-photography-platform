// 商品上传页
Page({
  data: {
    productInfo: {
      name: '',
      price: '',
      description: '',
      images: []
    }
  },

  onLoad() {
    // 页面加载
  },

  onNameInput(e) {
    this.setData({
      'productInfo.name': e.detail.value
    });
  },

  onPriceInput(e) {
    this.setData({
      'productInfo.price': e.detail.value
    });
  },

  onDescInput(e) {
    this.setData({
      'productInfo.description': e.detail.value
    });
  },

  onChooseImage() {
    wx.chooseImage({
      count: 9,
      success: (res) => {
        this.setData({
          'productInfo.images': res.tempFilePaths
        });
      }
    });
  },

  onSubmit() {
    wx.showToast({
      title: '提交成功',
      icon: 'success'
    });
  }
});
