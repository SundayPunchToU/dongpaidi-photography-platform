// 相机设备详情页面
Page({
  data: {
    cameraId: '',
    cameraDetail: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ cameraId: options.id });
      this.loadCameraDetail(options.id);
    }
  },

  async loadCameraDetail(id) {
    try {
      this.setData({ loading: true });
      
      // 模拟加载设备详情数据
      setTimeout(() => {
        const mockDetail = {
          id: id || 'camera_001',
          name: 'Canon EOS R5 全画幅微单相机',
          type: 'rental', // rental, sale, new
          price: '299',
          originalPrice: '399',
          deposit: '5000',
          seller: '专业摄影器材租赁',
          shop: '佳能官方旗舰店',
          sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          sellerRating: '4.9',
          shopRating: '4.8',
          location: '北京·朝阳区',
          images: [
            'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop'
          ],
          description: 'Canon EOS R5是一款专业级全画幅微单相机，配备4500万像素CMOS传感器，支持8K视频录制。机身状况良好，功能正常，适合专业摄影师和摄影爱好者使用。',
          features: [
            '4500万像素全画幅CMOS',
            '8K 30p / 4K 120p视频',
            '机身防抖5轴补偿',
            'DIGIC X影像处理器',
            '双卡槽设计',
            'Wi-Fi + 蓝牙连接'
          ],
          tags: ['全画幅', '微单', '8K视频', '防抖'],
          condition: '95新',
          purchaseDate: '2023年3月',
          warranty: '官方保修1年',
          rentalPeriod: '最短1天，最长30天',
          rentCount: 156,
          availableDates: '即日起至下月底',
          likeCount: 89,
          isLiked: false,
          isCollected: false,
          isFavorited: false,
          viewCount: 1234
        };

        this.setData({
          cameraDetail: mockDetail,
          loading: false
        });
      }, 800);
    } catch (error) {
      console.error('加载设备详情失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 分享设备
  onShareTap() {
    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        const actions = ['friend', 'moments', 'copy'];
        const action = actions[res.tapIndex];
        
        switch (action) {
          case 'friend':
            wx.showToast({ title: '分享给朋友', icon: 'success' });
            break;
          case 'moments':
            wx.showToast({ title: '分享到朋友圈', icon: 'success' });
            break;
          case 'copy':
            wx.setClipboardData({
              data: `设备详情：${this.data.cameraDetail.name}`,
              success: () => {
                wx.showToast({ title: '链接已复制', icon: 'success' });
              }
            });
            break;
        }
      }
    });
  },

  // 收藏设备
  onFavoriteTap() {
    const { cameraDetail } = this.data;
    const newFavorited = !cameraDetail.isFavorited;
    
    this.setData({
      'cameraDetail.isFavorited': newFavorited
    });
    
    wx.showToast({
      title: newFavorited ? '已收藏' : '取消收藏',
      icon: 'success'
    });
  },

  // 图片预览
  onImagePreview(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.cameraDetail;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 卖家/商家头像点击
  onSellerTap() {
    const { cameraDetail } = this.data;
    const sellerId = cameraDetail.sellerId || 'seller_001';
    
    if (cameraDetail.type === 'rental') {
      // 跳转到商家详情
      wx.navigateTo({
        url: `/pages/shop/detail/index?id=${sellerId}`
      });
    } else {
      // 跳转到用户详情
      wx.navigateTo({
        url: `/pages/user/profile/index?id=${sellerId}`
      });
    }
  },

  // 联系卖家/商家
  onContactTap() {
    const { cameraDetail } = this.data;
    const contactType = cameraDetail.type === 'rental' ? '商家' : '卖家';
    
    wx.showActionSheet({
      itemList: [`私信${contactType}`, `电话联系`, `查看${contactType}主页`],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 私信
            wx.navigateTo({
              url: `/pages/message/chat/index?userId=${cameraDetail.sellerId || 'seller_001'}`
            });
            break;
          case 1:
            // 电话联系
            wx.showModal({
              title: '联系电话',
              content: '400-123-4567',
              confirmText: '拨打',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.makePhoneCall({
                    phoneNumber: '400-123-4567'
                  });
                }
              }
            });
            break;
          case 2:
            // 查看主页
            this.onSellerTap();
            break;
        }
      }
    });
  },

  // 点赞设备
  onLikeTap() {
    const { cameraDetail } = this.data;
    const newLiked = !cameraDetail.isLiked;
    const newCount = newLiked ? cameraDetail.likeCount + 1 : cameraDetail.likeCount - 1;
    
    this.setData({
      'cameraDetail.isLiked': newLiked,
      'cameraDetail.likeCount': newCount
    });
    
    wx.showToast({
      title: newLiked ? '已点赞' : '取消点赞',
      icon: 'success'
    });
  },

  // 收藏设备
  onCollectTap() {
    const { cameraDetail } = this.data;
    const newCollected = !cameraDetail.isCollected;
    
    this.setData({
      'cameraDetail.isCollected': newCollected
    });
    
    wx.showToast({
      title: newCollected ? '已收藏' : '取消收藏',
      icon: 'success'
    });
  },

  // 购买/租赁设备
  onPurchaseTap() {
    const { cameraDetail } = this.data;
    const actionType = cameraDetail.type === 'rental' ? '租赁' : '购买';
    
    wx.showModal({
      title: `确认${actionType}`,
      content: `确定要${actionType}这个设备吗？`,
      confirmText: `确认${actionType}`,
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到订单页面
          const orderType = cameraDetail.type === 'rental' ? 'rental' : 'purchase';
          wx.navigateTo({
            url: `/pages/order/create/index?type=${orderType}&itemId=${cameraDetail.id}`
          });
        }
      }
    });
  }
});
