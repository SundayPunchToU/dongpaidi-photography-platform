// 导入必要的工具和API
import request from '../../api/request.js';
import { projectResetTool } from '../../utils/project-reset.js';
import { worksAPI, userAPI } from '../../utils/supabase-client.js';

Page({
  data: {
    works: [
      {
        id: 'test_001',
        userId: 'user_001',
        userName: '光影大师',
        userAvatar: 'https://i.pravatar.cc/100?img=1',
        title: '城市夜景人像',
        coverImage: 'https://picsum.photos/400/600?random=1',
        imageWidth: 400,
        imageHeight: 600,
        stats: { likes: 156, comments: 23, views: 1200 },
        isLiked: false
      },
      {
        id: 'test_002',
        userId: 'user_002',
        userName: '自然之眼',
        userAvatar: 'https://i.pravatar.cc/100?img=2',
        title: '晨雾中的山峦',
        coverImage: 'https://picsum.photos/400/400?random=2',
        imageWidth: 400,
        imageHeight: 400,
        stats: { likes: 89, comments: 12, views: 800 },
        isLiked: true
      },
      {
        id: 'test_003',
        userId: 'user_003',
        userName: '街拍达人',
        userAvatar: 'https://i.pravatar.cc/100?img=3',
        title: '雨后的街道',
        coverImage: 'https://picsum.photos/400/700?random=3',
        imageWidth: 400,
        imageHeight: 700,
        stats: { likes: 234, comments: 45, views: 1800 },
        isLiked: false
      },
      {
        id: 'test_004',
        userId: 'user_004',
        userName: '小清新',
        userAvatar: 'https://i.pravatar.cc/100?img=4',
        title: '午后阳光',
        coverImage: 'https://picsum.photos/400/450?random=4',
        imageWidth: 400,
        imageHeight: 450,
        stats: { likes: 67, comments: 8, views: 450 },
        isLiked: false
      },
      {
        id: 'test_005',
        userId: 'user_005',
        userName: '建筑师',
        userAvatar: 'https://i.pravatar.cc/100?img=5',
        title: '现代建筑之美',
        coverImage: 'https://picsum.photos/400/550?random=5',
        imageWidth: 400,
        imageHeight: 550,
        stats: { likes: 123, comments: 19, views: 890 },
        isLiked: true
      },
      {
        id: 'test_006',
        userId: 'user_006',
        userName: '花卉摄影师',
        userAvatar: 'https://i.pravatar.cc/100?img=6',
        title: '春日樱花',
        coverImage: 'https://picsum.photos/400/650?random=6',
        imageWidth: 400,
        imageHeight: 650,
        stats: { likes: 78, comments: 15, views: 560 },
        isLiked: false
      },
      {
        id: 'test_007',
        userId: 'user_007',
        userName: '时尚摄影师',
        userAvatar: 'https://i.pravatar.cc/100?img=7',
        title: '都市时尚大片',
        coverImage: 'https://picsum.photos/400/500?random=7',
        imageWidth: 400,
        imageHeight: 500,
        stats: { likes: 245, comments: 32, views: 1500 },
        isLiked: true
      },
      {
        id: 'test_008',
        userId: 'user_008',
        userName: '风光大师',
        userAvatar: 'https://i.pravatar.cc/100?img=8',
        title: '日落金山',
        coverImage: 'https://picsum.photos/400/300?random=8',
        imageWidth: 400,
        imageHeight: 300,
        stats: { likes: 189, comments: 28, views: 980 },
        isLiked: false
      },
      {
        id: 'test_009',
        userId: 'user_009',
        userName: '小清新女孩',
        userAvatar: 'https://i.pravatar.cc/100?img=9',
        title: '咖啡店的午后',
        coverImage: 'https://picsum.photos/400/600?random=9',
        imageWidth: 400,
        imageHeight: 600,
        stats: { likes: 92, comments: 18, views: 650 },
        isLiked: false
      },
      {
        id: 'test_010',
        userId: 'user_010',
        userName: '建筑摄影师',
        userAvatar: 'https://i.pravatar.cc/100?img=10',
        title: '现代建筑线条',
        coverImage: 'https://picsum.photos/400/700?random=10',
        imageWidth: 400,
        imageHeight: 700,
        stats: { likes: 134, comments: 21, views: 890 },
        isLiked: true
      }
    ],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    // 专题标签 - 得物风格
    topics: [
      { id: 'hot', name: '热门', isHot: true },
      { id: 'casual', name: '随手拍' },
      { id: 'portrait', name: '人像' },
      { id: 'landscape', name: '风光' },
      { id: 'street', name: '街拍' },
      { id: 'night', name: '夜景' },
      { id: 'wedding', name: '婚纱' },
      { id: 'travel', name: '旅行' },
      { id: 'art', name: '艺术' },
      { id: 'commercial', name: '商业' },
      { id: 'pet', name: '宠物' },
      { id: 'food', name: '美食' },
      { id: 'architecture', name: '建筑' }
    ],
    categories: [
      { id: 'portrait', name: '人像', icon: 'user' },
      { id: 'landscape', name: '风光', icon: 'location' },
      { id: 'street', name: '街拍', icon: 'walk' },
      { id: 'commercial', name: '商业', icon: 'shop' },
      { id: 'art', name: '艺术', icon: 'palette' }
    ],
    selectedCategory: 'all',
    selectedTopic: 'hot', // 默认选中热门
    showCategoryPopup: false,
    // 上传相关状态
    uploading: false,
    uploadProgress: 0,
    uploadingImage: null,
    showUploadSuccess: false
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'discover'
      });
    }
  },

  // 🧪 测试Supabase连接
  async testSupabaseConnection() {
    try {
      // 测试基础连接
      const { data, error } = await worksAPI.getList(1, 5)

      if (error) {
        wx.showModal({
          title: '后端连接失败',
          content: `错误类型: ${error.code || 'unknown'}\n错误信息: ${error.message || JSON.stringify(error)}`,
          showCancel: false
        })
        return false
      }

      console.log('✅ Supabase连接成功，获取到数据:', data)
      console.log('📊 数据详情:', {
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0]
      })

      if (Array.isArray(data) && data.length === 0) {
        console.log('💡 数据库为空')
        wx.showModal({
          title: '数据库为空',
          content: '请先在Supabase Table Editor中手动添加测试数据，然后点击"刷新数据"按钮',
          confirmText: '我已添加',
          cancelText: '稍后添加',
          success: (res) => {
            if (res.confirm) {
              this.loadWorks() // 直接刷新数据
            }
          }
        })
      } else if (Array.isArray(data) && data.length > 0) {
        console.log('🎉 发现数据！详细信息:', data)
        wx.showModal({
          title: '数据读取成功！',
          content: `成功读取到${data.length}条作品数据！\n第一条作品：${data[0]?.title || '无标题'}`,
          showCancel: false,
          confirmText: '查看数据',
          success: () => {
            // 直接加载这些数据到瀑布流
            this.loadSupabaseData(data)
          }
        })
      } else {
        console.log('⚠️ 数据格式异常:', data)
        wx.showModal({
          title: '数据格式异常',
          content: `返回的数据格式不正确: ${typeof data}`,
          showCancel: false
        })
      }
      return true

    } catch (error) {
      console.error('❌ 连接测试异常:', error)
      wx.showModal({
        title: '连接测试失败',
        content: `请检查网络连接和API配置\n错误: ${error.message || error}`,
        showCancel: false
      })
      return false
    }
  },

  // ✏️ 测试简单写入功能
  async testSimpleInsert() {
    try {
      console.log('✏️ 开始测试简单写入...')
      wx.showLoading({ title: '测试写入...' })

      // 测试最简单的用户数据写入（只包含必需字段）
      const simpleUser = {
        openid: `simple_test_${Date.now()}`,
        nickname: '简单测试用户'
      }

      console.log('📤 尝试写入简单用户数据:', simpleUser)

      // 直接调用Supabase insert API
      const result = await supabase.insert('users', simpleUser)

      console.log('📥 写入结果:', result)

      wx.hideLoading()

      if (result.error) {
        console.error('❌ 写入失败:', result.error)
        wx.showModal({
          title: '写入测试失败',
          content: `错误信息: ${result.error.message || JSON.stringify(result.error)}`,
          showCancel: false
        })
      } else {
        console.log('✅ 写入成功!')
        wx.showModal({
          title: '写入测试成功！',
          content: '成功创建了一个简单的测试用户，现在可以正常使用写入功能了！',
          showCancel: false,
          success: () => {
            // 重新读取数据验证
            this.testSupabaseConnection()
          }
        })
      }

    } catch (error) {
      wx.hideLoading()
      console.error('❌ 写入测试异常:', error)
      wx.showModal({
        title: '写入测试异常',
        content: `异常信息: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 🎯 加载Supabase数据到瀑布流
  loadSupabaseData(supabaseData) {
    try {
      console.log('🔄 转换Supabase数据格式...', supabaseData)

      // 转换数据格式以适配现有瀑布流组件
      const works = supabaseData.map((work, index) => ({
        id: work.id || `supabase_${index}`,
        userId: work.user_id || 'unknown',
        userName: work.users?.nickname || work.nickname || '匿名用户',
        userAvatar: work.users?.avatar_url || work.avatar_url || '/static/default-avatar.png',
        title: work.title || '无标题',
        description: work.description || '暂无描述',
        coverImage: work.cover_image || work.images?.[0] || '/static/placeholder.jpg',
        imageWidth: 400,
        imageHeight: 400 + Math.random() * 400, // 瀑布流随机高度
        stats: {
          likes: work.like_count || 0,
          comments: work.comment_count || 0,
          views: work.view_count || 0
        },
        isLiked: false,
        tags: work.tags || [],
        category: work.category || 'art',
        location: work.location || '未知地点'
      }))

      console.log('✅ 数据转换完成:', works)

      // 更新页面数据
      this.setData({
        works: works,
        loading: false,
        hasMore: false
      })

      wx.showToast({
        title: `加载${works.length}条真实数据！`,
        icon: 'success'
      })

    } catch (error) {
      console.error('❌ 数据转换失败:', error)
      wx.showToast({
        title: '数据转换失败',
        icon: 'error'
      })
    }
  },

  // ✏️ 测试简单写入功能
  async testSimpleInsert() {
    try {
      console.log('✏️ 开始测试简单写入...')
      wx.showLoading({ title: '测试写入...' })

      // 测试最简单的用户数据写入
      const simpleUser = {
        openid: `simple_test_${Date.now()}`,
        nickname: '简单测试用户'
      }

      console.log('📤 尝试写入简单用户数据:', simpleUser)

      // 直接调用Supabase insert API
      const { data, error } = await supabase.insert('users', simpleUser)

      console.log('📥 写入结果:', { data, error })

      wx.hideLoading()

      if (error) {
        console.error('❌ 写入失败:', error)
        wx.showModal({
          title: '写入测试失败',
          content: `错误代码: ${error.code || 'unknown'}\n错误信息: ${error.message || JSON.stringify(error)}`,
          showCancel: false
        })
      } else {
        console.log('✅ 写入成功!')
        wx.showModal({
          title: '写入测试成功！',
          content: '成功创建了一个简单的测试用户',
          showCancel: false,
          success: () => {
            // 重新读取数据验证
            this.testSupabaseConnection()
          }
        })
      }

    } catch (error) {
      wx.hideLoading()
      console.error('❌ 写入测试异常:', error)
      wx.showModal({
        title: '写入测试异常',
        content: `异常信息: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 🎯 添加测试数据
  async addTestData() {
    try {
      console.log('🎯 开始添加测试数据...')
      wx.showLoading({ title: '创建测试数据...' })

      // 1. 先创建测试用户
      console.log('👤 创建测试用户...')
      const testUser = {
        openid: `test_user_${Date.now()}`,
        nickname: '测试摄影师',
        avatar_url: 'https://i.pravatar.cc/100?img=1',
        bio: '专业摄影师，擅长人像和风光摄影',
        is_photographer: true,
        location: '上海市'
      }

      console.log('📤 调用userAPI.login...', testUser)
      const userResult = await userAPI.login(testUser.openid, testUser)
      console.log('📥 用户创建结果:', userResult)

      if (userResult.error) {
        console.error('❌ 用户创建失败:', userResult.error)
        throw new Error(`用户创建失败: ${JSON.stringify(userResult.error)}`)
      }

      console.log('✅ 测试用户创建成功:', userResult.data)

      // 2. 创建测试作品
      const testWorks = [
        {
          title: '夕阳下的城市剪影',
          description: '在城市高楼间捕捉到的美丽夕阳，光影交错展现都市美感',
          images: ['https://picsum.photos/400/600?random=1'],
          cover_image: 'https://picsum.photos/400/600?random=1',
          tags: ['城市', '夕阳', '剪影'],
          category: 'landscape',
          location: '上海外滩',
          user_id: userResult.data.id
        },
        {
          title: '咖啡店里的午后时光',
          description: '温暖的午后阳光透过窗户洒在咖啡杯上',
          images: ['https://picsum.photos/400/500?random=2'],
          cover_image: 'https://picsum.photos/400/500?random=2',
          tags: ['咖啡', '生活', '温暖'],
          category: 'portrait',
          location: '北京朝阳区',
          user_id: userResult.data.id
        },
        {
          title: '街头摄影作品',
          description: '捕捉城市街头的真实瞬间',
          images: ['https://picsum.photos/400/700?random=3'],
          cover_image: 'https://picsum.photos/400/700?random=3',
          tags: ['街拍', '人文', '黑白'],
          category: 'street',
          location: '广州天河区',
          user_id: userResult.data.id
        }
      ]

      // 批量创建作品
      for (const work of testWorks) {
        const workResult = await worksAPI.publish(work)
        console.log('✅ 测试作品创建成功:', workResult)

        if (workResult.error) {
          console.error('❌ 作品创建失败:', workResult.error)
        }
      }

      wx.hideLoading()
      wx.showToast({
        title: '测试数据添加成功！',
        icon: 'success'
      })

      // 刷新页面数据
      setTimeout(() => {
        this.loadWorks()
      }, 1000)

    } catch (error) {
      wx.hideLoading()
      console.error('❌ 添加测试数据失败:', error)
      wx.showModal({
        title: '添加测试数据失败',
        content: `错误信息: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  async onLoad() {
    console.log('🏠 发现页面加载');

    // 初始化作品缓存
    try {
      const res = await request('/works', 'GET', {});
      this.allWorksCache = res.data.list || [];

      // 默认显示热门作品
      this.filterWorksByTopic('hot');
    } catch (error) {
      console.error('初始化作品数据失败:', error);
    }

    // 自动修复常见问题
    setTimeout(() => {
      projectResetTool.fixCommonIssues();
    }, 500);

    // 检查并恢复未完成的上传
    setTimeout(() => {
      this.recoverUploadState();
    }, 1000);
  },

  async onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      await this.loadWorks(true);
    }
  },

  async onRefresh() {
    this.setData({ refreshing: true, page: 1, hasMore: true });
    await this.loadWorks();
    this.setData({ refreshing: false });
  },



  // 加载作品列表
  async loadWorks(loadMore = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { page, pageSize, selectedCategory } = this.data;
      const currentPage = loadMore ? page + 1 : 1;

      const params = {
        page: currentPage,
        pageSize,
        category: selectedCategory === 'all' ? '' : selectedCategory
      };

      // 🚀 优先使用Supabase数据
      console.log('🔍 从Supabase加载作品数据...', params);

      const supabaseResult = await worksAPI.getList(currentPage, pageSize, params.category || null);

      let newWorks = [];

      if (supabaseResult.error) {
        console.error('❌ Supabase加载失败，使用模拟数据:', supabaseResult.error);
        // 如果Supabase失败，回退到模拟数据
        const res = await request('/works', 'GET', params);
        newWorks = res.data.list || [];
      } else if (supabaseResult.data && supabaseResult.data.length > 0) {
        console.log('✅ 从Supabase加载到数据:', supabaseResult.data.length, '条');
        // 转换Supabase数据格式
        newWorks = supabaseResult.data.map(work => ({
          id: work.id,
          userId: work.user_id,
          userName: work.users?.nickname || '匿名用户',
          userAvatar: work.users?.avatar_url || '/static/default-avatar.png',
          title: work.title,
          description: work.description,
          coverImage: work.cover_image || '/static/placeholder.jpg',
          imageWidth: 400,
          imageHeight: 400 + Math.random() * 400,
          stats: {
            likes: work.like_count || 0,
            comments: work.comment_count || 0,
            views: work.view_count || 0
          },
          isLiked: false,
          tags: work.tags || [],
          category: work.category,
          location: work.location
        }));
      } else {
        console.log('📋 Supabase数据为空，使用模拟数据');
        // 如果Supabase没有数据，使用模拟数据
        const res = await request('/works', 'GET', params);
        newWorks = res.data.list || [];
      }



      // 模拟网络延迟，让用户看到加载效果
      if (!loadMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 为每个作品添加随机的图片尺寸（模拟真实数据）
      const worksWithSize = newWorks.map(work => ({
        ...work,
        imageWidth: work.imageWidth || 400,
        imageHeight: work.imageHeight || (400 + Math.random() * 400) // 400-800的随机高度
      }));

      // 更新数据状态
      const hasMore = newWorks.length >= pageSize;

      this.setData({
        works: loadMore ? [...this.data.works, ...worksWithSize] : worksWithSize,
        page: currentPage,
        hasMore: hasMore,
        loading: false
      });

      console.log(`✅ 作品加载完成: ${worksWithSize.length}条, 页码: ${currentPage}, 还有更多: ${hasMore}`);

      // 如果是第一页，合并本地上传的作品
      if (currentPage === 1 && !loadMore) {
        this.mergeUploadedWorks();
      }

    } catch (error) {
      console.error('加载作品失败:', error);
      this.setData({ loading: false });
    }
  },

  // 合并本地上传的作品
  mergeUploadedWorks() {
    try {
      const uploadedWorks = simpleUploadService.getUploadedWorks();
      if (uploadedWorks.length > 0) {
        console.log(`🔄 合并 ${uploadedWorks.length} 个本地上传的作品`);

        // 转换为标准格式
        const formattedWorks = uploadedWorks.map(work => ({
          id: work.id,
          userId: work.user_id,
          userName: work.user_name,
          userAvatar: work.user_avatar,
          title: work.title,
          coverImage: work.cover_image,
          images: work.images,
          imageWidth: 400,
          imageHeight: 600,
          stats: work.stats,
          isLiked: false,
          isNew: true, // 标记为新上传
          category: work.category,
          tags: work.tags,
          createdAt: work.created_at,
          source: work.source
        }));

        // 合并到现有作品列表
        const currentWorks = this.data.works;
        const mergedWorks = [...formattedWorks, ...currentWorks];

        this.setData({ works: mergedWorks });
        console.log('✅ 本地作品合并完成');
      }
    } catch (error) {
      console.error('❌ 合并本地作品失败:', error);
    }
  },

  // 分类选择
  onCategoryTap() {
    this.setData({ showCategoryPopup: true });
  },

  onCategoryPopupChange(e) {
    this.setData({ showCategoryPopup: e.detail.visible });
  },

  onCloseCategoryPopup() {
    this.setData({ showCategoryPopup: false });
  },

  async onCategorySelect(e) {
    const { category } = e.currentTarget.dataset;
    this.setData({
      selectedCategory: category,
      page: 1,
      hasMore: true,
      showCategoryPopup: false
    });
    await this.loadWorks();
  },

  // 作品点击
  onWorkTap(e) {
    try {
      const { work } = e.detail;
      if (work && work.id) {
        wx.navigateTo({
          url: `/pages/works-detail/detail/index?id=${work.id}`
        });
      }
    } catch (error) {
      console.error('作品点击错误:', error);
    }
  },

  // 点赞作品
  async onWorkLike(e) {
    try {
      const { work, isLiked, newLikeCount } = e.detail;

      console.log('❤️ 收到点赞事件:', {
        workTitle: work.title,
        isLiked,
        newLikeCount
      });

      // 🎯 更新UI状态
      const works = this.data.works.map(item => {
        if (item.id === work.id) {
          return {
            ...item,
            isLiked: isLiked,
            stats: {
              ...item.stats,
              likes: newLikeCount
            }
          };
        }
        return item;
      });

      this.setData({ works });

      console.log('✅ 点赞状态已更新');

    } catch (error) {
      console.error('❌ 点赞事件处理失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 用户点击
  onUserTap(e) {
    try {
      const { userId } = e.detail;
      if (userId) {
        wx.navigateTo({
          url: `/pages/user/photographer-detail/index?id=${userId}`
        });
      }
    } catch (error) {
      console.error('用户点击错误:', error);
    }
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  },

  // 上传作品 - 照片选择功能
  onUploadTap() {
    wx.showActionSheet({
      itemList: ['📷 拍照', '🖼️ 从相册选择'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.takePhoto();
        } else if (res.tapIndex === 1) {
          this.chooseFromAlbum();
        }
      },
      fail: (err) => {
        console.log('用户取消选择', err);
      }
    });
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.handleImageSelected(tempFilePath, 'camera');
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.handleImageSelected(tempFilePath, 'album');
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 处理选中的图片
  handleImageSelected(tempFilePath, source) {
    console.log('📷 选中图片:', tempFilePath, '来源:', source);

    // 显示图片预览和编辑界面
    this.showImagePreview(tempFilePath, source);
  },

  // 显示图片预览
  showImagePreview(tempFilePath, source) {
    wx.showModal({
      title: '📷 确认上传',
      content: '是否要上传这张照片到您的作品集？',
      confirmText: '上传',
      cancelText: '重选',
      success: (res) => {
        if (res.confirm) {
          this.uploadImage(tempFilePath, source);
        } else {
          // 用户选择重选，重新打开选择界面
          this.onUploadTap();
        }
      }
    });
  },

  // 专题点击
  onTopicTap(e) {
    try {
      const { topic } = e.currentTarget.dataset;
      if (topic && topic.id) {
        // 更新选中状态
        this.setData({
          selectedTopic: topic.id
        });

        // 根据专题筛选作品
        this.filterWorksByTopic(topic.id);
      }
    } catch (error) {
      console.error('专题点击错误:', error);
    }
  },

  // 根据专题筛选作品
  async filterWorksByTopic(topicId) {
    try {
      this.setData({ loading: true });

      // 如果没有缓存所有作品，先获取
      if (!this.allWorksCache) {
        const res = await request('/works', 'GET', {});
        this.allWorksCache = res.data.list || [];
      }

      let filteredWorks = this.allWorksCache;

      // 如果不是热门，根据专题筛选
      if (topicId !== 'hot') {
        // 根据专题ID映射到category
        const topicCategoryMap = {
          'casual': 'casual',
          'portrait': 'portrait',
          'landscape': 'landscape',
          'street': 'street',
          'night': 'portrait', // 夜景归类到人像
          'wedding': 'portrait', // 婚纱归类到人像
          'travel': 'landscape', // 旅行归类到风光
          'art': 'art',
          'commercial': 'commercial',
          'pet': 'casual', // 宠物归类到随手拍
          'food': 'casual', // 美食归类到随手拍
          'architecture': 'commercial' // 建筑归类到商业
        };

        const category = topicCategoryMap[topicId];
        if (category) {
          filteredWorks = this.allWorksCache.filter(work => work.category === category);
        }
      }

      // 为作品添加随机尺寸
      const worksWithSize = filteredWorks.map(work => ({
        ...work,
        imageWidth: work.imageWidth || 400,
        imageHeight: work.imageHeight || (400 + Math.random() * 400)
      }));

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      this.setData({
        works: worksWithSize,
        loading: false,
        page: 1,
        hasMore: false
      });

    } catch (error) {
      console.error('专题筛选错误:', error);
      this.setData({ loading: false });
    }
  },

  // 生成测试数据
  generateTestWorks() {
    const titles = [
      '城市夜景人像', '晨雾中的山峦', '雨后的街道', '午后阳光', '现代建筑之美',
      '春日樱花', '都市时尚大片', '日落金山', '咖啡店的午后', '现代建筑线条',
      '可爱的金毛', '城市霓虹夜', '海边婚纱照', '精致下午茶', '西藏雪山',
      '古城墙韵味', '森林深处', '海浪拍岸', '田野风光', '都市夜色',
      '花海盛开', '雪景如画', '湖光山色', '古典建筑', '现代艺术',
      '宠物写真', '美食诱惑', '旅行足迹', '人文纪实', '创意摄影'
    ];

    const userNames = [
      '光影大师', '自然之眼', '街拍达人', '小清新', '建筑师',
      '花卉摄影师', '时尚摄影师', '风光大师', '小清新女孩', '建筑摄影师',
      '宠物摄影师', '夜景专家', '婚纱摄影师', '美食摄影师', '旅行摄影师'
    ];

    return Array.from({ length: 30 }, (_, index) => {
      const heights = [280, 320, 380, 420, 480, 520, 580, 620, 680, 720];
      const randomHeight = heights[Math.floor(Math.random() * heights.length)];

      return {
        id: `work_${String(index + 1).padStart(3, '0')}`,
        userId: `user_${String((index % 15) + 1).padStart(3, '0')}`,
        userName: userNames[index % userNames.length],
        userAvatar: `https://i.pravatar.cc/100?img=${(index % 50) + 1}`,
        title: titles[index % titles.length],
        coverImage: `https://picsum.photos/400/${randomHeight}?random=${index + 1}`,
        imageWidth: 400,
        imageHeight: randomHeight,
        category: 'portrait',
        tags: ['摄影', '艺术'],
        stats: {
          likes: Math.floor(Math.random() * 500) + 20,
          comments: Math.floor(Math.random() * 50) + 5,
          views: Math.floor(Math.random() * 2000) + 200
        },
        isLiked: Math.random() > 0.7,
        createdAt: new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString()
      };
    });
  },



  // 上传图片到云存储和数据库
  async uploadImage(tempFilePath, source) {
    console.log('🚀 开始真实上传流程:', tempFilePath);

    // 保存上传状态，用于意外中断后的恢复
    this.savePendingUpload(tempFilePath, source);

    this.setData({
      uploading: true,
      uploadProgress: 0,
      uploadingImage: tempFilePath
    });

    try {
      // 显示上传进度
      wx.showLoading({
        title: '正在上传...',
        mask: true
      });

      // 使用简化的上传服务

      // 上传进度模拟
      const progressInterval = setInterval(() => {
        const currentProgress = this.data.uploadProgress;
        if (currentProgress < 85) {
          this.setData({ uploadProgress: currentProgress + 15 });
        }
      }, 300);

      // 执行简化的上传流程
      console.log('📤 调用简化上传服务...');
      const uploadResult = await simpleUploadService.uploadImage(tempFilePath, source);

      clearInterval(progressInterval);
      this.setData({ uploadProgress: 100 });

      wx.hideLoading();

      if (uploadResult.success) {
        console.log('✅ 上传成功:', uploadResult.data);

        // 清除待处理的上传状态
        this.clearPendingUpload();

        // 添加到本地作品列表（立即显示）
        await this.addNewWorkToList(uploadResult.data);

        // 显示成功提示
        this.showUploadSuccess();

        // 刷新作品列表以确保数据同步
        setTimeout(() => {
          this.refreshWorksFromDatabase();
        }, 2000);

      } else {
        throw new Error(uploadResult.error || '上传失败');
      }

    } catch (error) {
      console.error('❌ 真实上传失败:', error);
      wx.hideLoading();

      this.setData({
        uploading: false,
        uploadProgress: 0,
        uploadingImage: null
      });

      // 显示详细错误信息并提供重试选项
      const errorMessage = this.getErrorMessage(error);
      wx.showModal({
        title: '上传失败',
        content: errorMessage,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.uploadImage(tempFilePath, source);
          }
        }
      });
    }
  },

  // 获取当前用户ID
  getCurrentUserId() {
    try {
      return wx.getStorageSync('user_id') || `user_${Date.now()}`;
    } catch (error) {
      return `temp_${Date.now()}`;
    }
  },

  // 获取当前用户名
  getCurrentUserName() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      return userInfo?.nickName || '摄影爱好者';
    } catch (error) {
      return '摄影爱好者';
    }
  },

  // 获取当前用户头像
  getCurrentUserAvatar() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      return userInfo?.avatarUrl || 'https://i.pravatar.cc/100?img=99';
    } catch (error) {
      return 'https://i.pravatar.cc/100?img=99';
    }
  },

  // 获取友好的错误信息
  getErrorMessage(error) {
    const message = error.message || error.toString();

    if (message.includes('网络')) {
      return '网络连接异常，请检查网络后重试';
    } else if (message.includes('存储')) {
      return '图片存储失败，请稍后重试';
    } else if (message.includes('数据库')) {
      return '数据保存失败，请稍后重试';
    } else if (message.includes('权限')) {
      return '上传权限不足，请重新登录';
    } else {
      return `上传失败：${message}`;
    }
  },

  // 上传状态恢复机制
  async recoverUploadState() {
    try {
      // 检查是否有未完成的上传
      const pendingUpload = wx.getStorageSync('pending_upload');
      if (pendingUpload) {
        console.log('🔄 发现未完成的上传，尝试恢复...');

        wx.showModal({
          title: '发现未完成的上传',
          content: '检测到有未完成的照片上传，是否继续？',
          confirmText: '继续上传',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.uploadImage(pendingUpload.tempFilePath, pendingUpload.source);
            } else {
              wx.removeStorageSync('pending_upload');
            }
          }
        });
      }
    } catch (error) {
      console.warn('恢复上传状态失败:', error);
    }
  },

  // 保存上传状态（用于恢复）
  savePendingUpload(tempFilePath, source) {
    try {
      wx.setStorageSync('pending_upload', {
        tempFilePath,
        source,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('保存上传状态失败:', error);
    }
  },

  // 清除上传状态
  clearPendingUpload() {
    try {
      wx.removeStorageSync('pending_upload');
    } catch (error) {
      console.warn('清除上传状态失败:', error);
    }
  },

  // 添加新作品到列表顶部（立即显示）
  async addNewWorkToList(uploadData) {
    const work = uploadData.work;
    const newWork = {
      id: work.id,
      userId: work.user_id,
      userName: work.user_name || '我',
      userAvatar: work.user_avatar || 'https://i.pravatar.cc/100?img=99',
      title: work.title || '刚刚上传的作品',
      coverImage: work.cover_image,
      images: work.images || [work.cover_image],
      imageWidth: 400,
      imageHeight: 600,
      stats: work.stats || { likes: 0, comments: 0, views: 1 },
      isLiked: false,
      isNew: true, // 标记为新上传
      category: work.category,
      tags: work.tags || [],
      createdAt: work.created_at,
      source: uploadData.source || 'upload'
    };

    // 添加到作品列表顶部
    const currentWorks = this.data.works;
    this.setData({
      works: [newWork, ...currentWorks]
    });

    console.log('✅ 新作品已添加到列表顶部');
  },

  // 从数据库刷新作品列表
  async refreshWorksFromDatabase() {
    try {
      console.log('🔄 从数据库刷新作品列表...');

      // 重置页码，重新加载第一页
      this.setData({
        page: 1,
        hasMore: true
      });

      // 重新加载作品数据
      await this.loadWorks(false); // false表示不是加载更多，而是刷新

      console.log('✅ 作品列表刷新完成');
    } catch (error) {
      console.error('❌ 刷新作品列表失败:', error);
    }
  },

  // 显示上传成功提示
  showUploadSuccess() {
    this.setData({
      uploading: false,
      uploadProgress: 0,
      uploadingImage: null,
      showUploadSuccess: true
    });

    wx.showToast({
      title: '🎉 上传成功！',
      icon: 'success',
      duration: 2000
    });

    // 2秒后隐藏成功标识
    setTimeout(() => {
      this.setData({ showUploadSuccess: false });
    }, 2000);

    // 10秒后移除新上传标识
    setTimeout(() => {
      this.removeNewUploadFlag();
    }, 10000);
  },

  // 移除新上传标识
  removeNewUploadFlag() {
    const works = this.data.works.map(work => {
      if (work.isNew) {
        return { ...work, isNew: false };
      }
      return work;
    });

    this.setData({ works });
    console.log('🏷️ 已移除新上传标识');
  }
});
