// 作品详情页 - 得物风格
Page({
  data: {
    workId: '',
    workDetail: null,
    loading: true,
    currentImageIndex: 0,
    commentTab: 'hot',
    comments: [],
    statusBarHeight: 88
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ workId: id });
      this.loadWorkDetail(id);
      this.loadComments(id);
    }

    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 44;
    this.setData({
      statusBarHeight: statusBarHeight * 2 // rpx单位
    });
  },

  // 加载作品详情
  async loadWorkDetail(id) {
    try {
      this.setData({ loading: true });

      // 模拟API调用 - 根据传入的ID加载对应作品
      // 这里应该根据实际的作品ID从服务器获取数据
      const mockDetails = {
        'test_001': {
          id: 'test_001',
          title: '城市夜景人像',
          description: '在城市的霓虹灯下，捕捉最美的瞬间。这组作品拍摄于上海外滩，利用城市的霓虹灯光营造出梦幻的氛围效果。\n\n拍摄技巧：利用城市霓虹灯作为背景光源，营造梦幻氛围。',
          images: [
            'https://picsum.photos/400/600?random=1', // 与首页coverImage保持一致
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=600&h=800&fit=crop'
          ],
          user: {
            id: 'user_001',
            name: '光影大师',
            avatar: 'https://i.pravatar.cc/100?img=1',
            description: '专业摄影师 | 人像·风光·街拍',
            isFollowed: false
          },
          stats: { likes: 156, comments: 23, views: 1200, collections: 42 },
          tags: ['夜景摄影', '人像摄影', '城市风光', '霓虹灯', '上海外滩'],
          category: '夜景人像',
          params: {
            camera: 'Canon EOS R5',
            lens: 'RF 85mm f/1.2L',
            iso: 'ISO 1600',
            aperture: 'f/1.8',
            shutter: '1/125s',
            location: '上海外滩'
          },
          isLiked: false,
          isCollected: false,
          relatedTags: true
        },
        'test_002': {
          id: 'test_002',
          title: '晨雾中的山峦',
          description: '清晨时分，山峦被薄雾轻柔地包围，阳光透过云层洒向大地，形成了这幅如诗如画的自然美景。\n\n这是在黄山拍摄的日出时刻，等待了3个小时才捕捉到这个完美瞬间。',
          images: [
            'https://picsum.photos/400/400?random=2', // 与首页coverImage保持一致
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=600&fit=crop'
          ],
          user: {
            id: 'user_002',
            name: '自然之眼',
            avatar: 'https://i.pravatar.cc/100?img=2',
            description: '风光摄影师 | 专注自然美景',
            isFollowed: false
          },
          stats: { likes: 89, comments: 12, views: 800, collections: 28 },
          tags: ['风光摄影', '山峦', '晨雾', '日出', '黄山', '自然风景'],
          category: '风光摄影',
          params: {
            camera: 'Sony A7R4',
            lens: 'FE 24-70mm f/2.8',
            iso: 'ISO 100',
            aperture: 'f/8',
            shutter: '1/60s',
            location: '黄山'
          },
          isLiked: true,
          isCollected: false,
          relatedTags: true
        },
        'test_003': {
          id: 'test_003',
          title: '雨后的街道',
          description: '雨后的街道总是特别迷人，湿润的路面反射着街灯的光芒，营造出一种诗意的氛围。这张照片拍摄于北京三里屯的一个雨夜，捕捉到了城市夜晚独特的韵味。',
          images: [
            'https://picsum.photos/400/700?random=3', // 与首页coverImage保持一致
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=700&fit=crop'
          ],
          user: {
            id: 'user_003',
            name: '街拍达人',
            avatar: 'https://i.pravatar.cc/100?img=3',
            description: '专注街头摄影 | 记录城市生活',
            isFollowed: false
          },
          stats: { likes: 234, comments: 45, views: 1800, collections: 67 },
          tags: ['街拍', '雨景', '夜晚', '反射', '城市', '三里屯'],
          category: '街头摄影',
          params: {
            camera: 'Sony A7R4',
            lens: 'FE 35mm f/1.8',
            iso: 'ISO 1600',
            aperture: 'f/2.0',
            shutter: '1/125s',
            location: '北京三里屯'
          },
          isLiked: false,
          isCollected: false,
          relatedTags: true
        },
        'test_004': {
          id: 'test_004',
          title: '午后阳光',
          description: '温暖的午后阳光透过窗帘洒在桌案上，营造出宁静而温馨的氛围。这种简单的生活场景往往最能触动人心。',
          images: [
            'https://picsum.photos/400/450?random=4', // 与首页coverImage保持一致
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=450&fit=crop'
          ],
          user: {
            id: 'user_004',
            name: '小清新',
            avatar: 'https://i.pravatar.cc/100?img=4',
            description: '记录生活中的美好瞬间',
            isFollowed: false
          },
          stats: { likes: 67, comments: 8, views: 450, collections: 23 },
          tags: ['生活', '阳光', '静物', '温馨', '日系'],
          category: '生活摄影',
          params: {
            camera: 'Fujifilm X-T4',
            lens: 'XF 56mm f/1.2',
            iso: 'ISO 400',
            aperture: 'f/1.8',
            shutter: '1/200s',
            location: '杭州西湖区'
          },
          isLiked: false,
          isCollected: false,
          relatedTags: true
        },
        'test_005': {
          id: 'test_005',
          title: '现代建筑之美',
          description: '现代建筑的线条和光影交织，展现出独特的几何美学。这座建筑位于深圳南山区，是现代城市建筑的典型代表。',
          images: [
            'https://picsum.photos/400/550?random=5', // 与首页coverImage保持一致
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=550&fit=crop'
          ],
          user: {
            id: 'user_005',
            name: '建筑师',
            avatar: 'https://i.pravatar.cc/100?img=5',
            description: '建筑摄影爱好者 | 几何美学',
            isFollowed: true
          },
          stats: { likes: 123, comments: 19, views: 890, collections: 45 },
          tags: ['建筑', '几何', '现代', '线条', '深圳'],
          category: '建筑摄影',
          params: {
            camera: 'Nikon Z7',
            lens: 'NIKKOR Z 24-70mm f/2.8',
            iso: 'ISO 200',
            aperture: 'f/8.0',
            shutter: '1/250s',
            location: '深圳南山区'
          },
          isLiked: true,
          isCollected: false,
          relatedTags: true
        }
      };

      // 获取对应ID的作品详情，如果没有则使用默认数据
      const workDetail = mockDetails[id] || mockDetails['test_001'];

      this.setData({
        workDetail: workDetail,
        loading: false
      });
    } catch (error) {
      console.error('加载作品详情失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载评论
  async loadComments(workId) {
    try {
      // 模拟评论数据
      const mockComments = [
        {
          id: 'comment_001',
          user: {
            id: 'user_002',
            name: '摄影小白',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
          },
          content: '这个夜景拍得太棒了！请问用的什么参数？',
          timeText: '2小时前',
          likes: 3,
          isLiked: false
        },
        {
          id: 'comment_002',
          user: {
            id: 'user_003',
            name: '夜景爱好者',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
          },
          content: '光影效果绝了！学到了 👍',
          timeText: '5小时前',
          likes: 8,
          isLiked: true
        },
        {
          id: 'comment_003',
          user: {
            id: 'user_004',
            name: '城市探索者',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          },
          content: '外滩的夜景永远不会让人失望',
          timeText: '1天前',
          likes: 2,
          isLiked: false
        },
        {
          id: 'comment_004',
          user: {
            id: 'user_005',
            name: '人像摄影师',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
          },
          content: '模特的表情和姿态都很自然，构图也很棒！',
          timeText: '2天前',
          likes: 5,
          isLiked: false
        },
        {
          id: 'comment_005',
          user: {
            id: 'user_006',
            name: '后期达人',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
          },
          content: '后期调色很有感觉，能分享一下思路吗？',
          timeText: '3天前',
          likes: 1,
          isLiked: false
        }
      ];

      this.setData({ comments: mockComments });
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  },

  // 返回上一页
  onBackTap() {
    wx.navigateBack();
  },

  // 图片切换
  onImageChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  // 图片预览
  onImagePreview(e) {
    const { index } = e.currentTarget.dataset;
    const { workDetail } = this.data;
    wx.previewImage({
      current: workDetail.images[index],
      urls: workDetail.images
    });
  },

  // 用户点击
  onUserTap(e) {
    const { userId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/user/photographer-detail/index?id=${userId}`
    });
  },

  // 关注用户
  async onFollowTap() {
    const { workDetail } = this.data;
    try {
      // 模拟关注API调用
      this.setData({
        'workDetail.user.isFollowed': !workDetail.user.isFollowed
      });

      wx.showToast({
        title: workDetail.user.isFollowed ? '已关注' : '取消关注',
        icon: 'success'
      });
    } catch (error) {
      console.error('关注操作失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 点赞作品
  async onLikeTap() {
    const { workDetail } = this.data;
    try {
      const newLikedState = !workDetail.isLiked;
      const newLikesCount = newLikedState ? workDetail.stats.likes + 1 : workDetail.stats.likes - 1;

      this.setData({
        'workDetail.isLiked': newLikedState,
        'workDetail.stats.likes': newLikesCount
      });

      wx.showToast({
        title: newLikedState ? '已点赞' : '取消点赞',
        icon: 'success'
      });
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  },

  // 收藏作品
  async onCollectTap() {
    const { workDetail } = this.data;
    try {
      const newCollectedState = !workDetail.isCollected;
      const newCollectionsCount = newCollectedState ? workDetail.stats.collections + 1 : workDetail.stats.collections - 1;

      this.setData({
        'workDetail.isCollected': newCollectedState,
        'workDetail.stats.collections': newCollectionsCount
      });

      wx.showToast({
        title: newCollectedState ? '已收藏' : '取消收藏',
        icon: 'success'
      });
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  },

  // 分享
  onShareTap() {
    const { workDetail } = this.data;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 评论标签切换
  onCommentTabTap(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ commentTab: tab });
    // 这里可以重新加载对应类型的评论
    this.loadComments(this.data.workId, tab);
  },

  // 评论点赞
  onCommentLike(e) {
    const { comment } = e.currentTarget.dataset;
    const comments = this.data.comments.map(item => {
      if (item.id === comment.id) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1
        };
      }
      return item;
    });
    this.setData({ comments });
  },

  // 评论回复
  onCommentReply(e) {
    const { comment } = e.currentTarget.dataset;
    // 这里可以打开回复输入框或跳转到回复页面
    wx.showToast({
      title: '回复功能开发中',
      icon: 'none'
    });
  },

  // 评论输入
  onCommentInputTap() {
    // 这里可以打开评论输入框或跳转到评论页面
    wx.showToast({
      title: '评论功能开发中',
      icon: 'none'
    });
  },

  // 评论按钮点击
  onCommentTap() {
    this.onCommentInputTap();
  },

  // 相关搜索点击
  onRelatedSearchTap() {
    const { workDetail } = this.data;
    wx.navigateTo({
      url: `/pages/search/works/index?keyword=${workDetail.category}`
    });
  }
});
