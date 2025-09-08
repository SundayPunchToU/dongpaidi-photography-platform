// 作品详情页
Page({
  data: {
    workId: '',
    workDetail: null,
    loading: true,
    currentImageIndex: 0,
    showParams: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ workId: options.id });
      this.loadWorkDetail();
    }
  },

  // 加载作品详情
  async loadWorkDetail() {
    try {
      // 模拟API调用
      const mockDetail = {
        id: 'work_001',
        title: '城市夜景人像',
        description: '在城市的霓虹灯下，捕捉最美的瞬间。这组作品拍摄于上海外滩，利用城市的霓虹灯光营造出梦幻的氛围效果。',
        images: [
          '/static/works/work1_1.jpg',
          '/static/works/work1_2.jpg', 
          '/static/works/work1_3.jpg'
        ],
        user: {
          id: 'user_001',
          name: '光影大师',
          avatar: '/static/avatars/photographer1.jpg',
          isFollowed: false
        },
        stats: {
          likes: 156,
          comments: 23,
          views: 1200,
          shares: 8
        },
        isLiked: false,
        isCollected: false
      };
      
      this.setData({
        workDetail: mockDetail,
        loading: false
      });
    } catch (error) {
      console.error('加载作品详情失败:', error);
      this.setData({ loading: false });
    }
  },

  // 图片切换
  onImageChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  // 点赞
  async onLikeTap() {
    const { workDetail } = this.data;
    // 模拟点赞API调用
    this.setData({
      'workDetail.isLiked': !workDetail.isLiked,
      'workDetail.stats.likes': workDetail.isLiked ? workDetail.stats.likes - 1 : workDetail.stats.likes + 1
    });
  },

  // 收藏
  async onCollectTap() {
    const { workDetail } = this.data;
    // 模拟收藏API调用
    this.setData({
      'workDetail.isCollected': !workDetail.isCollected
    });
  },

  // 关注用户
  async onFollowTap() {
    const { workDetail } = this.data;
    // 模拟关注API调用
    this.setData({
      'workDetail.user.isFollowed': !workDetail.user.isFollowed
    });
  },

  // 查看用户主页
  onUserTap() {
    const { workDetail } = this.data;
    wx.navigateTo({
      url: `/pages/user/photographer-detail/index?id=${workDetail.user.id}`
    });
  },

  // 分享
  onShareTap() {
    // 分享功能
    wx.showShareMenu({
      withShareTicket: true
    });
  }
});
