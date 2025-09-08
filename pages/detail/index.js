// 小红书风格详情页面
Page({
  data: {
    workId: '',
    currentImageIndex: 0,
    images: [],
    workInfo: {
      title: '',
      description: '',
      tags: [],
      author: {
        id: '',
        name: '',
        avatar: '',
        description: '',
        isFollowed: false
      },
      shootingInfo: {
        camera: '',
        lens: '',
        aperture: '',
        shutter: '',
        iso: '',
      },
      location: '',
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      collectCount: 0,
      isLiked: false,
      isCollected: false,
      publishTime: ''
    },
    comments: []
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ workId: id });
      this.loadWorkDetail(id);
    }
  },

  // 加载作品详情
  loadWorkDetail(id) {
    wx.showLoading({ title: '加载中...' });
    
    // 模拟数据加载
    setTimeout(() => {
      const mockData = {
        images: [
          '/static/image1.png',
          '/static/image2.png',
          '/static/image3.png'
        ],
        workInfo: {
          title: '夕阳下的城市剪影',
          description: '在城市的高楼间捕捉到的美丽夕阳，光影交错间展现出都市的另一面美感。这张照片拍摄于黄昏时分，利用逆光营造出强烈的剪影效果。',
          tags: ['城市摄影', '夕阳', '剪影', '风光', '建筑'],
          author: {
            id: 'user123',
            name: '摄影师小王',
            avatar: '/static/avatar1.png',
            description: '专业风光摄影师，擅长城市和自然风光拍摄',
            isFollowed: false
          },
          shootingInfo: {
            camera: 'Canon EOS R5',
            lens: 'RF 24-70mm f/2.8L',
            aperture: 'f/8.0',
            shutter: '1/125s',
            iso: 'ISO 100'
          },
          location: '上海外滩',
          viewCount: 1234,
          likeCount: 89,
          commentCount: 23,
          collectCount: 45,
          isLiked: false,
          isCollected: false,
          publishTime: '2小时前'
        },
        comments: [
          {
            id: 'comment1',
            user: {
              name: '摄影爱好者',
              avatar: '/static/avatar2.png'
            },
            content: '太美了！这个角度拍得真好，光影效果很棒！',
            timeAgo: '1小时前',
            likeCount: 5,
            isLiked: false
          },
          {
            id: 'comment2',
            user: {
              name: '城市探索者',
              avatar: '/static/avatar3.png'
            },
            content: '请问这是在哪个位置拍的？我也想去试试',
            timeAgo: '30分钟前',
            likeCount: 2,
            isLiked: true
          }
        ]
      };
      
      this.setData({
        images: mockData.images,
        workInfo: mockData.workInfo,
        comments: mockData.comments
      });
      
      wx.hideLoading();
    }, 800);
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // 切换点赞状态
  toggleLike() {
    const { workInfo } = this.data;
    const newLiked = !workInfo.isLiked;
    const newCount = newLiked ? workInfo.likeCount + 1 : workInfo.likeCount - 1;
    
    this.setData({
      'workInfo.isLiked': newLiked,
      'workInfo.likeCount': newCount
    });

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' });
    
    // 显示反馈
    wx.showToast({
      title: newLiked ? '已点赞' : '取消点赞',
      icon: 'none',
      duration: 1000
    });
  },

  // 切换收藏状态
  toggleCollect() {
    const { workInfo } = this.data;
    const newCollected = !workInfo.isCollected;
    const newCount = newCollected ? workInfo.collectCount + 1 : workInfo.collectCount - 1;
    
    this.setData({
      'workInfo.isCollected': newCollected,
      'workInfo.collectCount': newCount
    });

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' });
    
    // 显示反馈
    wx.showToast({
      title: newCollected ? '已收藏' : '取消收藏',
      icon: 'none',
      duration: 1000
    });
  },

  // 切换关注状态
  toggleFollow() {
    const { workInfo } = this.data;
    const newFollowed = !workInfo.author.isFollowed;
    
    this.setData({
      'workInfo.author.isFollowed': newFollowed
    });

    wx.showToast({
      title: newFollowed ? '已关注' : '取消关注',
      icon: 'none',
      duration: 1000
    });
  },

  // 查看用户资料
  viewProfile() {
    wx.navigateTo({
      url: `/pages/profile/index?userId=${this.data.workInfo.author.id}`
    });
  },

  // 点赞评论
  likeComment(e) {
    const { id } = e.currentTarget.dataset;
    const { comments } = this.data;
    
    const commentIndex = comments.findIndex(comment => comment.id === id);
    if (commentIndex !== -1) {
      const comment = comments[commentIndex];
      const newLiked = !comment.isLiked;
      const newCount = newLiked ? comment.likeCount + 1 : comment.likeCount - 1;
      
      this.setData({
        [`comments[${commentIndex}].isLiked`]: newLiked,
        [`comments[${commentIndex}].likeCount`]: newCount
      });
    }
  },

  // 回复评论
  replyComment(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({
      title: '回复功能开发中',
      icon: 'none'
    });
  },

  // 显示评论输入框
  showCommentModal() {
    wx.showToast({
      title: '评论功能开发中',
      icon: 'none'
    });
  },

  // 分享功能
  onShare() {
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        const actions = ['微信好友', '朋友圈', '复制链接'];
        wx.showToast({
          title: `分享到${actions[res.tapIndex]}`,
          icon: 'none'
        });
      }
    });
  },

  // 更多操作
  onMore() {
    wx.showActionSheet({
      itemList: ['举报', '不感兴趣', '屏蔽作者'],
      success: (res) => {
        const actions = ['举报', '不感兴趣', '屏蔽作者'];
        wx.showToast({
          title: actions[res.tapIndex],
          icon: 'none'
        });
      }
    });
  }
});
