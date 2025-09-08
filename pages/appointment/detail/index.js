// 约拍详情页面
Page({
  data: {
    appointmentId: '',
    appointmentDetail: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ appointmentId: options.id });
      this.loadAppointmentDetail(options.id);
    }
  },

  async loadAppointmentDetail(id) {
    try {
      this.setData({ loading: true });

      // 模拟加载约拍详情数据
      setTimeout(() => {
        const mockDetail = {
          id: id || 'appointment_001',
          title: '寻找人像摄影师拍摄清新写真',
          description: '想拍一组清新自然的写真，希望找到有经验的人像摄影师合作。拍摄风格偏向日系小清新，地点可以在公园或咖啡厅。希望摄影师有丰富的人像拍摄经验，能够指导pose和表情。',
          type: 'model_seek_photographer',
          publisherId: 'user_101',
          publisherName: '小清新模特',
          publisherAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          publishTime: '2小时前',
          images: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop'
          ],
          shootingTime: '2024年1月15日 下午2:00-5:00',
          location: '北京·朝阳公园',
          budget: '500-800元',
          style: '日系小清新、自然光',
          status: 'open', // open, in_progress, completed, closed
          requirements: '希望摄影师有丰富的人像拍摄经验，能够指导pose和表情。拍摄过程中希望氛围轻松愉快，能够捕捉到自然的表情和状态。如果有化妆师资源更佳。',
          tags: ['人像写真', '日系风格', '自然光', '公园外拍'],
          likeCount: 23,
          collectCount: 8,
          isLiked: false,
          isCollected: false,
          viewCount: 156
        };

        this.setData({
          appointmentDetail: mockDetail,
          loading: false
        });
      }, 800);
    } catch (error) {
      console.error('加载约拍详情失败:', error);
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

  // 分享约拍
  onShareTap() {
    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        const actions = ['friend', 'moments', 'copy'];
        const action = actions[res.tapIndex];

        switch (action) {
          case 'friend':
            // 分享给朋友逻辑
            wx.showToast({ title: '分享给朋友', icon: 'success' });
            break;
          case 'moments':
            // 分享到朋友圈逻辑
            wx.showToast({ title: '分享到朋友圈', icon: 'success' });
            break;
          case 'copy':
            // 复制链接逻辑
            wx.setClipboardData({
              data: `约拍详情：${this.data.appointmentDetail.title}`,
              success: () => {
                wx.showToast({ title: '链接已复制', icon: 'success' });
              }
            });
            break;
        }
      }
    });
  },

  // 图片预览
  onImagePreview(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.appointmentDetail;

    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 发布者头像点击
  onPublisherTap() {
    const { publisherId } = this.data.appointmentDetail;
    wx.navigateTo({
      url: `/pages/user/photographer-detail/index?id=${publisherId}`
    });
  },

  // 联系发布者
  onContactTap() {
    wx.showModal({
      title: '联系方式',
      content: '请通过私信或评论与发布者联系，确认拍摄细节。',
      confirmText: '发私信',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到私信页面
          wx.navigateTo({
            url: `/pages/message/chat/index?userId=${this.data.appointmentDetail.publisherId}`
          });
        }
      }
    });
  },

  // 点赞约拍
  onLikeTap() {
    const { appointmentDetail } = this.data;
    const newLiked = !appointmentDetail.isLiked;
    const newCount = newLiked ? appointmentDetail.likeCount + 1 : appointmentDetail.likeCount - 1;

    this.setData({
      'appointmentDetail.isLiked': newLiked,
      'appointmentDetail.likeCount': newCount
    });

    wx.showToast({
      title: newLiked ? '已点赞' : '取消点赞',
      icon: 'success'
    });
  },

  // 收藏约拍
  onCollectTap() {
    const { appointmentDetail } = this.data;
    const newCollected = !appointmentDetail.isCollected;
    const newCount = newCollected ? appointmentDetail.collectCount + 1 : appointmentDetail.collectCount - 1;

    this.setData({
      'appointmentDetail.isCollected': newCollected,
      'appointmentDetail.collectCount': newCount
    });

    wx.showToast({
      title: newCollected ? '已收藏' : '取消收藏',
      icon: 'success'
    });
  },

  // 申请约拍
  onApplyTap() {
    const { appointmentDetail } = this.data;

    if (appointmentDetail.status !== 'open') {
      wx.showToast({
        title: '该约拍已关闭',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '申请约拍',
      content: '确定要申请这个约拍吗？申请后发布者会收到通知。',
      confirmText: '确定申请',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 模拟申请逻辑
          wx.showLoading({ title: '申请中...' });

          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '申请成功！',
              icon: 'success'
            });

            // 可以跳转到申请记录页面
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/appointment/my-applications/index'
              });
            }, 1500);
          }, 1000);
        }
      }
    });
  }
});
