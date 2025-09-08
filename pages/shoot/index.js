import request from '~/api/request';

Page({
  data: {
    appointments: [],
    leftColumnAppointments: [],
    rightColumnAppointments: [],
    loading: true, // 初始为加载状态
    hasMore: true,
    page: 1,
    pageSize: 10,
    selectedTopic: 'recommended',
    searchKeyword: '', // 搜索关键词
    // 专题标签 - 新的五个栏目
    topics: [
      { id: 'recommended', name: '推荐' },
      { id: 'local', name: '同城' },
      { id: 'hotspot', name: '热门打卡' },
      { id: 'photographer-story', name: '摄影师故事' },
      { id: 'recommended-model', name: '推荐模特' }
    ],
    filters: {
      city: '',
      type: 'all', // all | photographer_seek_model | model_seek_photographer
      budgetRange: 'all'
    },
    // 同城栏目筛选状态
    localFilter: 'all', // all | photographer_seek_model | model_seek_photographer
    showLocalFilter: false, // 是否显示同城筛选弹窗
    // 热门打卡地筛选状态
    hotspotFilter: 'all', // all | asia | europe | america | africa | oceania
    showHotspotFilter: false // 是否显示打卡地筛选弹窗
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'shoot'
      });
    }
  },

  // 修复图片链接的辅助函数 - 为不同类型内容提供丰富多样的图片
  fixImageUrls(data) {
    // 不同主题的图片库
    const imageLibrary = {
      // 古风汉服主题
      hanfu: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop'
      ],
      // 时尚街拍主题
      fashion: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop'
      ],
      // 清新日系主题
      fresh: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=400&fit=crop'
      ],
      // 婚纱主题
      wedding: [
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=400&fit=crop'
      ],
      // 运动健身主题
      fitness: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1506629905607-c52b1b8e8d19?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop'
      ],
      // 旅拍风景主题
      travel: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=400&fit=crop'
      ]
    };

    // 封面图片库
    const coverImageLibrary = {
      hanfu: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=520&fit=crop'
      ],
      fashion: [
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=650&fit=crop'
      ],
      fresh: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=580&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop'
      ],
      wedding: [
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=580&fit=crop',
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=580&fit=crop'
      ],
      fitness: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=550&fit=crop',
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=600&fit=crop'
      ],
      travel: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=580&fit=crop'
      ]
    };

    // 根据内容类型选择合适的图片主题
    const getThemeByContent = (item) => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const content = title + ' ' + description;

      if (content.includes('古风') || content.includes('汉服') || content.includes('古装')) return 'hanfu';
      if (content.includes('街拍') || content.includes('时尚') || content.includes('潮流')) return 'fashion';
      if (content.includes('清新') || content.includes('日系') || content.includes('小清新')) return 'fresh';
      if (content.includes('婚纱') || content.includes('新娘') || content.includes('婚礼')) return 'wedding';
      if (content.includes('运动') || content.includes('健身') || content.includes('瑜伽')) return 'fitness';
      if (content.includes('旅拍') || content.includes('风景') || content.includes('打卡')) return 'travel';

      return 'fashion'; // 默认主题
    };

    // 生成九图数组 - 统一使用九图展示
    const generateImageArray = (theme, itemId) => {
      const images = imageLibrary[theme];
      const count = 9; // 统一使用九图

      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(images[i % images.length]);
      }
      return result;
    };

    if (Array.isArray(data)) {
      return data.map(item => this.fixImageUrls(item));
    } else if (data && typeof data === 'object') {
      const fixed = { ...data };
      const theme = getThemeByContent(fixed);

      // 修复images数组
      if (fixed.images && Array.isArray(fixed.images)) {
        const hasPicksum = fixed.images.some(url => url.includes('picsum.photos'));
        if (hasPicksum) {
          fixed.images = generateImageArray(theme, fixed.id || 'default');
        }
      }

      // 修复coverImage
      if (fixed.coverImage && fixed.coverImage.includes('picsum.photos')) {
        const coverImages = coverImageLibrary[theme];
        const randomIndex = Math.abs((fixed.id || 'default').charCodeAt(0)) % coverImages.length;
        fixed.coverImage = coverImages[randomIndex];
      }

      return fixed;
    }
    return data;
  },

  async onLoad() {
    console.log('约拍页面开始加载...');
    // 初始化约拍缓存
    try {
      this.setData({ loading: true });

      // 模拟加载约拍数据（避免API调用失败）
      this.allAppointmentsCache = [
        {
          id: 'appointment_001',
          title: '寻找人像摄影师拍摄清新写真',
          description: '想拍一组清新自然的写真，希望找到有经验的人像摄影师合作。拍摄风格偏向日系小清新，地点可以在公园或咖啡厅。',
          type: 'model_seek_photographer',
          publisherId: 'user_101',
          publisherName: '小清新模特',
          publisherAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop',
          user: {
            nickname: '小清新模特',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face'
          },
          location: '北京·朝阳区',
          likeCount: 23,
          budget: { min: 300, max: 500, negotiable: true },
          schedule: { date: '2024-03-15', duration: 2 },
          style: ['清新', '日系'],
          status: 'open',
          applicants: 3,
          createdAt: '2024-03-10T10:00:00Z'
        },
        {
          id: 'appointment_002',
          title: '商业产品拍摄，寻找专业模特',
          description: '为新品牌拍摄商业宣传照，需要有经验的商业模特。拍摄内容包括产品展示和生活场景，要求形象气质佳。',
          type: 'photographer_seek_model',
          publisherId: 'user_102',
          publisherName: '商业摄影师',
          publisherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=500&fit=crop',
          user: {
            nickname: '商业摄影师',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
          },
          location: '上海·徐汇区',
          likeCount: 47,
          budget: { min: 800, max: 1200, negotiable: false },
          schedule: { date: '2024-03-18', duration: 4 },
          style: ['商业', '时尚'],
          status: 'open',
          applicants: 7,
          createdAt: '2024-03-11T14:30:00Z'
        },
        {
          id: 'appointment_003',
          title: '古风摄影约拍，汉服小姐姐',
          description: '计划拍摄一组古风主题的照片，已准备好汉服和道具。希望找到擅长古风摄影的摄影师，最好有相关作品经验。',
          type: 'model_seek_photographer',
          publisherId: 'user_103',
          publisherName: '汉服爱好者',
          publisherAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=350&fit=crop',
          user: {
            nickname: '汉服爱好者',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
          },
          location: '杭州·西湖区',
          likeCount: 89,
          budget: { min: 400, max: 600, negotiable: true },
          schedule: { date: '2024-03-20', duration: 3 },
          style: ['古风', '汉服'],
          status: 'open',
          applicants: 5,
          createdAt: '2024-03-12T09:15:00Z'
        },
        {
          id: 'appointment_004',
          title: '街拍约拍，寻找时尚达人',
          description: '想在城市街头拍摄一组时尚街拍，寻找有街拍经验的模特。拍摄地点在三里屯或王府井，风格偏向欧美时尚。',
          type: 'photographer_seek_model',
          publisherId: 'user_104',
          publisherName: '街拍摄影师',
          publisherAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=450&fit=crop',
          user: {
            nickname: '街拍摄影师',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
          },
          location: '北京·朝阳区',
          likeCount: 167,
          budget: { min: 500, max: 800, negotiable: true },
          schedule: { date: '2024-03-22', duration: 3 },
          style: ['街拍', '时尚'],
          status: 'open',
          applicants: 12,
          createdAt: '2024-03-13T16:20:00Z'
        },
        {
          id: 'appointment_005',
          title: '婚纱摄影助理，学习机会',
          description: '新手模特想要积累经验，寻找婚纱摄影师合作。可以免费或低价拍摄，主要是为了学习和积累作品。',
          type: 'model_seek_photographer',
          publisherId: 'user_105',
          publisherName: '新手模特',
          publisherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=380&fit=crop',
          user: {
            nickname: '新手模特',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face'
          },
          location: '上海·浦东新区',
          likeCount: 34,
          budget: { min: 0, max: 200, negotiable: true },
          schedule: { date: '2024-03-25', duration: 2 },
          style: ['婚纱', '浪漫'],
          status: 'open',
          applicants: 2,
          createdAt: '2024-03-14T11:45:00Z'
        },
        {
          id: 'appointment_006',
          title: '夜景人像拍摄，寻找合作模特',
          description: '计划拍摄一组城市夜景人像作品，需要有夜拍经验的模特配合。拍摄时间在晚上7-9点，地点在外滩或陆家嘴。',
          type: 'photographer_seek_model',
          publisherId: 'user_106',
          publisherName: '夜景摄影师',
          publisherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
          coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=420&fit=crop',
          user: {
            nickname: '夜景摄影师',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face'
          },
          location: '上海·黄浦区',
          likeCount: 145,
          budget: { min: 600, max: 1000, negotiable: false },
          schedule: { date: '2024-03-28', duration: 2 },
          style: ['夜景', '都市'],
          status: 'open',
          applicants: 8,
          createdAt: '2024-03-15T13:30:00Z'
        }
      ];

      // 民间年轻摄影师故事数据
      this.photographerStoriesCache = [
        {
          id: 'story_001',
          title: '95后摄影师小陈：从外卖员到人像摄影师的逆袭之路',
          description: '两年前我还在送外卖，偶然接触摄影后彻底改变了人生轨迹。现在月入过万，还收获了爱情。',
          images: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&auto=format&q=80', // 摄影师小陈
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&auto=format&q=80', // 作品1
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&auto=format&q=80', // 作品2
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&auto=format&q=80', // 作品3
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&auto=format&q=80', // 作品4
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&auto=format&q=80', // 作品5
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&auto=format&q=80', // 作品6
            'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=400&fit=crop&auto=format&q=80', // 作品7
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=400&fit=crop&auto=format&q=80'  // 作品8
          ],
          coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format&q=80',
          user: {
            name: '小陈摄影',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
            age: 26,
            location: '杭州·滨江区',
            experience: '2年',
            specialty: '人像摄影',
            equipment: 'Canon R6 + 85mm f/1.4'
          },
          story: {
            background: '外卖员转行',
            achievement: '月入过万',
            style: '清新人像',
            clients: 200
          },
          tags: ['逆袭故事', '人像摄影', '清新风格', '励志'],
          style: ['励志', '人像'],
          likes: 3456,
          collections: 1234,
          shares: 567,
          readCount: 12000,
          imageHeight: 600
        },
        {
          id: 'story_002',
          title: '00后摄影天才小李：用手机拍出单反效果的秘密',
          description: '大学生小李仅用手机就拍出了媲美单反的作品，在小红书爆红，粉丝破10万。',
          images: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&auto=format&q=80', // 摄影师小李
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品1
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品2
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品3
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品4
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品5
            'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品6
            'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=400&fit=crop&auto=format&q=80', // 手机作品7
            'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=400&fit=crop&auto=format&q=80'  // 手机作品8
          ],
          coverImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=580&fit=crop&auto=format&q=80',
          user: {
            name: '手机摄影小李',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
            age: 21,
            location: '北京·海淀区',
            experience: '1年',
            specialty: '手机摄影',
            equipment: 'iPhone 15 Pro Max'
          },
          story: {
            background: '在校大学生',
            achievement: '小红书10万粉丝',
            style: '手机摄影',
            clients: 50
          },
          tags: ['手机摄影', '00后', '小红书网红', '技巧分享'],
          style: ['手机', '技巧'],
          likes: 5678,
          collections: 2345,
          shares: 890,
          readCount: 25000,
          imageHeight: 580
        },
        {
          id: 'story_003',
          title: '文艺女摄影师小雨：咖啡馆里的光影诗人',
          description: '辞职开咖啡馆的文艺女青年，用镜头记录每一个来店里的故事，成为杭州最受欢迎的人像摄影师。',
          images: [
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&auto=format&q=80', // 摄影师小雨
            'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品1
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品2
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品3
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品4
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品5
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品6
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=400&fit=crop&auto=format&q=80', // 咖啡馆作品7
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&auto=format&q=80'  // 咖啡馆作品8
          ],
          coverImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=550&fit=crop&auto=format&q=80',
          user: {
            name: '文艺小雨',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
            age: 28,
            location: '杭州·西湖区',
            experience: '3年',
            specialty: '咖啡馆人像',
            equipment: 'Fujifilm X-T4 + 35mm f/1.4'
          },
          story: {
            background: '咖啡馆老板',
            achievement: '杭州知名人像摄影师',
            style: '文艺咖啡馆',
            clients: 300
          },
          tags: ['文艺摄影', '咖啡馆', '光影大师', '温暖治愈'],
          style: ['文艺', '咖啡馆'],
          likes: 4234,
          collections: 1876,
          shares: 432,
          readCount: 18000,
          imageHeight: 550
        },
        {
          id: 'story_004',
          title: '街拍达人阿杰：捕捉城市里最真实的美',
          description: '从建筑工人到街拍摄影师，阿杰用镜头记录城市中每一个平凡而美好的瞬间。',
          images: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&auto=format&q=80', // 摄影师阿杰
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品1
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品2
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品3
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品4
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品5
            'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品6
            'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=400&fit=crop&auto=format&q=80', // 街拍作品7
            'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=400&fit=crop&auto=format&q=80'  // 街拍作品8
          ],
          coverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=620&fit=crop&auto=format&q=80',
          user: {
            name: '街拍阿杰',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
            age: 29,
            location: '深圳·南山区',
            experience: '4年',
            specialty: '街拍摄影',
            equipment: 'Sony A7R4 + 24-70mm f/2.8'
          },
          story: {
            background: '建筑工人转行',
            achievement: '深圳街拍第一人',
            style: '真实街拍',
            clients: 150
          },
          tags: ['街拍摄影', '城市美学', '真实记录', '平凡之美'],
          style: ['街拍', '城市'],
          likes: 3789,
          collections: 1567,
          shares: 345,
          readCount: 15000,
          imageHeight: 620
        }
      ];

      console.log('约拍数据初始化完成');

      // 直接设置推荐分享数据 - 约拍完成后的喜悦分享
      this.recommendedSharesCache = [
        {
          id: 'share_001',
          title: '感谢@清新摄影师 帮我拍出了梦想中的写真✨',
          images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '小雨同学',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face'
          },
          likes: 328,
          comments: 45,
          location: '北京·朝阳公园',
          shootDate: '2024-03-15',
          description: '第一次约拍就遇到这么专业的摄影师！从选景到后期都超级用心，成片质量太惊艳了！',
          tags: ['约拍成功', '清新写真', '超满意'],
          style: ['清新', '写真'], // 添加style字段以兼容布局函数
          imageHeight: 600
        },
        {
          id: 'share_002',
          title: '夜景约拍大成功！感谢平台让我遇到了@夜景王者',
          images: ['https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=650&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=650&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '都市丽人',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
          },
          likes: 567,
          comments: 89,
          location: '上海·外滩',
          shootDate: '2024-03-12',
          description: '本来担心夜拍效果，没想到摄影师技术这么棒！每一张都是大片既视感💫',
          tags: ['约拍体验', '夜景大片', '技术超赞'],
          style: ['夜景', '都市'], // 添加style字段
          imageHeight: 650
        },
        {
          id: 'share_003',
          title: '古风约拍圆满结束～感谢@汉服摄影工作室',
          images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=550&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=550&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '汉服小仙女',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
          },
          likes: 445,
          comments: 67,
          location: '杭州·西湖',
          shootDate: '2024-03-10',
          description: '从妆造到拍摄全程都很专业，古风韵味拿捏得死死的！姐妹们冲鸭！',
          tags: ['古风约拍', '妆造精美', '强烈推荐'],
          style: ['古风', '汉服'], // 添加style字段
          imageHeight: 550
        },
        {
          id: 'share_004a',
          title: '婚纱约拍圆满成功！感谢@浪漫婚纱摄影',
          description: '和男朋友的婚纱照终于拍完啦！摄影师超级有耐心，每个细节都拍得很用心，我们都很满意～',
          images: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=580&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=580&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '准新娘小美',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face'
          },
          likes: 234,
          comments: 56,
          location: '杭州·西湖',
          shootDate: '2024-03-16',
          tags: ['婚纱照', '浪漫', '西湖美景'],
          style: ['婚纱', '浪漫'],
          imageHeight: 580
        },
        {
          id: 'share_005a',
          title: '运动健身写真，展现最美的自己💪',
          description: '第一次拍运动主题的写真，@健身摄影师 把我的肌肉线条拍得超棒！每一张都充满力量感！',
          images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=550&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=550&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '健身达人Anna',
            avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=60&h=60&fit=crop&crop=face'
          },
          likes: 178,
          comments: 34,
          location: '北京·健身房',
          shootDate: '2024-03-17',
          tags: ['健身写真', '力量美', '运动风'],
          style: ['运动', '健身'],
          imageHeight: 550
        },
        {
          id: 'share_004',
          title: '街拍约拍太成功了！@时尚摄影师Leo 眼光绝了',
          images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '时尚博主Coco',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
          },
          likes: 789,
          comments: 123,
          location: '北京·三里屯',
          shootDate: '2024-03-08',
          description: '第一次尝试街拍约拍，摄影师超会找角度！每个pose都拍得很自然，朋友都说像杂志大片🔥',
          tags: ['街拍约拍', '时尚大片', '摄影师超赞'],
          style: ['街拍', '时尚'], // 添加style字段
          imageHeight: 600
        },
        {
          id: 'share_005',
          title: '婚纱试拍完美收官！感谢@浪漫婚纱摄影',
          images: ['https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=580&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=580&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '准新娘小甜心',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face'
          },
          likes: 892,
          comments: 156,
          location: '上海·外滩',
          shootDate: '2024-03-05',
          description: '通过平台约到的婚纱摄影师真的太专业了！从化妆到拍摄全程贴心指导，成片美到哭😭',
          tags: ['婚纱约拍', '专业团队', '成片超美'],
          style: ['婚纱', '浪漫'], // 添加style字段
          imageHeight: 580
        },
        {
          id: 'share_006',
          title: '毕业写真约拍记录！青春不散场💙',
          images: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=520&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=520&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '毕业季回忆',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face'
          },
          likes: 678,
          comments: 89,
          location: '北京·清华大学',
          shootDate: '2024-03-01',
          description: '和室友一起约拍毕业写真，摄影师超有耐心！帮我们记录下了最美好的校园时光🎓',
          tags: ['毕业写真', '青春记忆', '友谊万岁'],
          style: ['毕业', '青春'], // 添加style字段
          imageHeight: 520
        },
        {
          id: 'share_007',
          title: '咖啡馆约拍初体验，氛围感拉满☕',
          images: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=480&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=480&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '文艺少女小茉',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face'
          },
          likes: 234,
          comments: 34,
          location: '上海·田子坊',
          shootDate: '2024-03-03',
          description: '想要文艺风的照片，摄影师推荐了这家咖啡馆，光线和氛围都太棒了！',
          tags: ['咖啡馆约拍', '文艺风', '光线绝美'],
          style: ['文艺', '咖啡馆'], // 添加style字段
          imageHeight: 480
        },
        {
          id: 'share_008',
          title: '和毛孩子的约拍时光🐕 感谢@宠物摄影师小林',
          images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '铲屎官小雪',
            avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=60&h=60&fit=crop&crop=face'
          },
          likes: 456,
          comments: 78,
          location: '北京·奥森公园',
          shootDate: '2024-02-28',
          description: '第一次给狗狗拍写真，摄影师超有耐心！把我家毛孩子拍得像明星一样✨',
          tags: ['宠物约拍', '萌宠写真', '专业摄影'],
          style: ['宠物', '萌宠'], // 添加style字段
          imageHeight: 600
        },
        {
          id: 'share_009',
          title: '日系约拍完美收官！感谢@日系摄影师小田',
          images: ['https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=500&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=500&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '治愈系少女',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop&crop=face'
          },
          likes: 567,
          comments: 78,
          location: '京都·清水寺',
          shootDate: '2024-02-25',
          description: '一直想拍日系风格，这次约拍真的太满意了！每一张都是治愈系大片🌸',
          tags: ['日系约拍', '治愈系', '樱花季'],
          style: ['日系', '治愈'], // 添加style字段
          imageHeight: 500
        },
        {
          id: 'share_010',
          title: '建筑约拍新体验！几何美学太震撼了',
          images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=580&fit=crop&auto=format&q=80'],
          coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=580&fit=crop&auto=format&q=80',
          imageCount: 9,
          user: {
            name: '建筑系学霸',
            avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=60&h=60&fit=crop&crop=face'
          },
          likes: 445,
          comments: 67,
          location: '上海·陆家嘴',
          shootDate: '2024-02-20',
          description: '第一次尝试建筑人像结合，摄影师的构图太有创意了！现代感十足🏢',
          tags: ['建筑约拍', '几何美学', '现代感'],
          style: ['建筑', '现代'], // 添加style字段
          imageHeight: 580
        }
      ];

      // 初始化同城约拍数据 - 摄影师约模特 & 模特求约摄影师
      this.localAppointmentsCache = [
        {
          id: 'local_001',
          type: 'photographer_seek_model', // 摄影师约模特
          title: '寻找古风模特合作，拍摄汉服主题写真',
          description: '专业摄影师，擅长古风人像，有完整的汉服道具和场景，寻找气质佳的模特合作拍摄。',
          images: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop', // 古风美女1
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop', // 古风美女2
            'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop', // 古风美女3
            'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=300&h=400&fit=crop', // 汉服写真1
            'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=300&h=400&fit=crop', // 汉服写真2
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop', // 汉服写真3
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop', // 古典人像1
            'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=400&fit=crop', // 古典人像2
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=300&h=400&fit=crop'  // 古典人像3
          ],
          coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
          user: {
            name: '古风摄影师·墨染',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
            level: '金牌摄影师',
            experience: '5年经验'
          },
          location: '杭州·西湖',
          budget: '免费互免',
          shootDate: '2024-04-01',
          requirements: ['身高160cm以上', '古典气质', '配合度高'],
          tags: ['古风', '汉服', '人像', '互免'],
          contactInfo: 'VX: gufeng_photo',
          portfolio: 3,
          likes: 89,
          applicants: 12,
          imageHeight: 500
        },
        {
          id: 'local_002',
          type: 'model_seek_photographer', // 模特求约摄影师
          title: '求约专业摄影师拍摄个人写真集',
          description: '想拍一套高质量的个人写真，风格偏向时尚简约，希望找到有经验的摄影师合作。',
          images: [
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop', // 时尚美女1
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop', // 时尚美女2
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', // 时尚美女3
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop', // 个人写真1
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop', // 个人写真2
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop', // 个人写真3
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop', // 商业写真1
            'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=400&fit=crop', // 商业写真2
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=400&fit=crop'  // 商业写真3
          ],
          coverImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
          user: {
            name: '时尚模特·小雅',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
            level: '签约模特',
            experience: '3年经验'
          },
          location: '杭州·西湖区',
          budget: '500-800元',
          shootDate: '2024-04-05',
          requirements: ['有作品集', '后期精修', '商业拍摄经验'],
          tags: ['时尚', '个人写真', '商业', '付费'],
          contactInfo: 'VX: model_xiaoya',
          portfolio: 5,
          likes: 156,
          applicants: 8,
          imageHeight: 600
        },
        {
          id: 'local_003',
          type: 'photographer_seek_model',
          title: '街拍摄影师寻找时尚达人合作',
          description: '专注街头时尚摄影，有丰富的商业拍摄经验，寻找有个性的模特合作街拍项目。',
          images: [
            'https://picsum.photos/300/300?random=301', // 街拍帅哥1
            'https://picsum.photos/300/300?random=302', // 街拍帅哥2
            'https://picsum.photos/300/300?random=303', // 街拍美女1
            'https://picsum.photos/300/300?random=304', // 时尚街拍1
            'https://picsum.photos/300/300?random=305', // 时尚街拍2
            'https://picsum.photos/300/300?random=306', // 时尚街拍3
            'https://picsum.photos/300/300?random=307', // 潮流写真1
            'https://picsum.photos/300/300?random=308', // 潮流写真2
            'https://picsum.photos/300/300?random=309'  // 潮流写真3
          ],
          coverImage: 'https://picsum.photos/400/550?random=301',
          user: {
            name: '街拍摄影师·Leo',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
            level: '资深摄影师',
            experience: '7年经验'
          },
          location: '杭州·湖滨银泰',
          budget: '互免+作品分享',
          shootDate: '2024-04-03',
          requirements: ['时尚感强', '表现力佳', '配合拍摄'],
          tags: ['街拍', '时尚', '商业', '互免'],
          contactInfo: 'VX: streetphoto_leo',
          portfolio: 8,
          likes: 234,
          applicants: 15,
          imageHeight: 550
        },
        {
          id: 'local_004',
          type: 'model_seek_photographer',
          title: '新人模特求约摄影师拍摄作品集',
          description: '刚入行的新人模特，希望找到耐心的摄影师帮忙拍摄作品集，可以互免合作。',
          images: [
            'https://picsum.photos/300/300?random=401', // 清纯美女1
            'https://picsum.photos/300/300?random=402', // 清纯美女2
            'https://picsum.photos/300/300?random=403', // 清纯美女3
            'https://picsum.photos/300/300?random=404', // 校园写真1
            'https://picsum.photos/300/300?random=405', // 校园写真2
            'https://picsum.photos/300/300?random=406', // 校园写真3
            'https://picsum.photos/300/300?random=407', // 青春写真1
            'https://picsum.photos/300/300?random=408', // 青春写真2
            'https://picsum.photos/300/300?random=409'  // 青春写真3
          ],
          coverImage: 'https://picsum.photos/400/520?random=401',
          user: {
            name: '新人模特·小晴',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
            level: '新人模特',
            experience: '1年经验'
          },
          location: '杭州·滨江区',
          budget: '互免合作',
          shootDate: '2024-04-07',
          requirements: ['有耐心', '指导pose', '后期修图'],
          tags: ['新人', '作品集', '互免', '学习'],
          contactInfo: 'VX: newmodel_qing',
          portfolio: 2,
          likes: 67,
          applicants: 6,
          imageHeight: 520
        },
        {
          id: 'local_005',
          type: 'photographer_seek_model',
          title: '婚纱摄影师寻找新娘模特试拍',
          description: '专业婚纱摄影工作室，有完整的婚纱礼服和化妆团队，寻找气质优雅的模特试拍新系列。',
          images: [
            'https://picsum.photos/300/300?random=501', // 婚纱美女1
            'https://picsum.photos/300/300?random=502', // 婚纱美女2
            'https://picsum.photos/300/300?random=503', // 婚纱美女3
            'https://picsum.photos/300/300?random=504', // 新娘写真1
            'https://picsum.photos/300/300?random=505', // 新娘写真2
            'https://picsum.photos/300/300?random=506', // 新娘写真3
            'https://picsum.photos/300/300?random=507', // 婚纱试拍1
            'https://picsum.photos/300/300?random=508', // 婚纱试拍2
            'https://picsum.photos/300/300?random=509'  // 婚纱试拍3
          ],
          coverImage: 'https://picsum.photos/400/580?random=501',
          user: {
            name: '浪漫婚纱摄影',
            avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=60&h=60&fit=crop&crop=face',
            level: '金牌工作室',
            experience: '10年经验'
          },
          location: '杭州·钱江新城',
          budget: '免费+化妆造型',
          shootDate: '2024-04-10',
          requirements: ['身高165cm以上', '气质优雅', '拍摄经验'],
          tags: ['婚纱', '试拍', '免费', '造型'],
          contactInfo: 'VX: romantic_wedding',
          portfolio: 12,
          likes: 345,
          applicants: 23,
          imageHeight: 580
        },
        {
          id: 'local_006',
          type: 'model_seek_photographer',
          title: '舞蹈老师求约摄影师拍摄宣传照',
          description: '专业舞蹈老师，需要拍摄一套宣传照片用于工作室推广，希望找到擅长运动人像的摄影师。',
          images: [
            'https://picsum.photos/300/300?random=601', // 舞蹈美女1
            'https://picsum.photos/300/300?random=602', // 舞蹈美女2
            'https://picsum.photos/300/300?random=603', // 舞蹈美女3
            'https://picsum.photos/300/300?random=604', // 运动写真1
            'https://picsum.photos/300/300?random=605', // 运动写真2
            'https://picsum.photos/300/300?random=606', // 运动写真3
            'https://picsum.photos/300/300?random=607', // 舞蹈写真1
            'https://picsum.photos/300/300?random=608', // 舞蹈写真2
            'https://picsum.photos/300/300?random=609'  // 舞蹈写真3
          ],
          coverImage: 'https://picsum.photos/400/600?random=601',
          user: {
            name: '舞蹈老师·小芸',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
            level: '专业舞者',
            experience: '8年经验'
          },
          location: '杭州·拱墅区',
          budget: '800-1200元',
          shootDate: '2024-04-12',
          requirements: ['运动摄影经验', '动作抓拍', '商业修图'],
          tags: ['舞蹈', '运动', '商业', '付费'],
          contactInfo: 'VX: dance_teacher',
          portfolio: 6,
          likes: 123,
          applicants: 9,
          imageHeight: 600
        },
        {
          id: 'local_007',
          type: 'photographer_seek_model',
          title: '日系摄影师寻找清新模特合作',
          description: '专注日系清新风格，有完整的日系道具和场景，寻找气质清新的模特合作拍摄。',
          images: [
            'https://picsum.photos/300/300?random=701', // 日系美女1
            'https://picsum.photos/300/300?random=702', // 日系美女2
            'https://picsum.photos/300/300?random=703', // 日系美女3
            'https://picsum.photos/300/300?random=704', // 清新写真1
            'https://picsum.photos/300/300?random=705', // 清新写真2
            'https://picsum.photos/300/300?random=706', // 清新写真3
            'https://picsum.photos/300/300?random=707', // 日系人像1
            'https://picsum.photos/300/300?random=708', // 日系人像2
            'https://picsum.photos/300/300?random=709'  // 日系人像3
          ],
          coverImage: 'https://picsum.photos/400/520?random=701',
          user: {
            name: '日系摄影师·小田',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
            level: '专业摄影师',
            experience: '4年经验'
          },
          location: '杭州·西溪湿地',
          budget: '互免合作',
          shootDate: '2024-04-15',
          requirements: ['清新气质', '自然表现', '配合度高'],
          tags: ['日系', '清新', '人像', '互免'],
          contactInfo: 'VX: japanese_style',
          portfolio: 6,
          likes: 178,
          applicants: 11,
          imageHeight: 520
        },
        {
          id: 'local_008',
          type: 'model_seek_photographer',
          title: '健身教练求约运动摄影师',
          description: '专业健身教练，需要拍摄一套运动主题的宣传照，希望找到擅长运动摄影的摄影师。',
          images: [
            'https://picsum.photos/300/300?random=801', // 健身帅哥1
            'https://picsum.photos/300/300?random=802', // 健身帅哥2
            'https://picsum.photos/300/300?random=803', // 健身帅哥3
            'https://picsum.photos/300/300?random=804', // 运动写真1
            'https://picsum.photos/300/300?random=805', // 运动写真2
            'https://picsum.photos/300/300?random=806', // 运动写真3
            'https://picsum.photos/300/300?random=807', // 健身写真1
            'https://picsum.photos/300/300?random=808', // 健身写真2
            'https://picsum.photos/300/300?random=809'  // 健身写真3
          ],
          coverImage: 'https://picsum.photos/400/600?random=801',
          user: {
            name: '健身教练·阿强',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
            level: '专业教练',
            experience: '6年经验'
          },
          location: '杭州·奥体中心',
          budget: '600-1000元',
          shootDate: '2024-04-18',
          requirements: ['运动摄影经验', '动作抓拍', '后期修图'],
          tags: ['健身', '运动', '商业', '付费'],
          contactInfo: 'VX: fitness_coach',
          portfolio: 4,
          likes: 267,
          applicants: 14,
          imageHeight: 600
        },
        {
          id: 'local_009',
          type: 'photographer_seek_model',
          title: '婚纱摄影师寻找新娘模特试拍',
          description: '专业婚纱摄影工作室，新开发了一套浪漫主题，需要找模特试拍，提供精美婚纱和化妆。',
          images: [
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=400&fit=crop'
          ],
          coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=580&fit=crop',
          user: {
            name: '浪漫婚纱工作室',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
            level: '专业工作室',
            experience: '10年经验'
          },
          location: '上海·徐汇区',
          budget: '免费互免',
          shootDate: '2024-04-20',
          requirements: ['气质优雅', '身高165cm以上', '拍摄经验佳'],
          tags: ['婚纱', '浪漫', '试拍', '互免'],
          contactInfo: 'VX: romantic_wedding',
          portfolio: 8,
          likes: 345,
          applicants: 18,
          imageHeight: 580
        },
        {
          id: 'local_010',
          type: 'model_seek_photographer',
          title: '旅拍模特寻找风光摄影师合作',
          description: '即将去云南旅行，希望找到擅长风光人像的摄影师一起创作，可以分摊旅行费用。',
          images: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop'
          ],
          coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          user: {
            name: '旅拍达人·小雪',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
            level: '业余模特',
            experience: '3年经验'
          },
          location: '云南·大理',
          budget: 'AA制旅行费用',
          shootDate: '2024-04-25',
          requirements: ['风光摄影经验', '旅拍经验', '后期能力强'],
          tags: ['旅拍', '风光', '人像', 'AA制'],
          contactInfo: 'VX: travel_model',
          portfolio: 5,
          likes: 189,
          applicants: 8,
          imageHeight: 600
        }
      ];

      // 初始化热门出片打卡地数据 - 全球各地人物摄影作品
      this.hotspotPhotosCache = [
        {
          id: 'hotspot_001',
          title: '东京涩谷街头 | 霓虹夜色下的都市丽人',
          description: '在东京最繁华的涩谷十字路口，捕捉都市女性的独特魅力，霓虹灯光与人物完美融合。',
          images: [
            'https://picsum.photos/300/300?random=1001', // 东京街头1
            'https://picsum.photos/300/300?random=1002', // 东京街头2
            'https://picsum.photos/300/300?random=1003', // 东京街头3
            'https://picsum.photos/300/300?random=1004', // 霓虹夜景1
            'https://picsum.photos/300/300?random=1005', // 霓虹夜景2
            'https://picsum.photos/300/300?random=1006', // 霓虹夜景3
            'https://picsum.photos/300/300?random=1007', // 都市人像1
            'https://picsum.photos/300/300?random=1008', // 都市人像2
            'https://picsum.photos/300/300?random=1009'  // 都市人像3
          ],
          coverImage: 'https://picsum.photos/400/600?random=1001',
          location: '日本·东京·涩谷',
          region: 'asia', // 地区标识
          photographer: '旅拍摄影师·小林',
          style: '都市夜景',
          equipment: 'Sony A7R4 + 85mm f/1.4',
          shootTime: '夜晚 19:00-22:00',
          difficulty: '中等',
          bestSeason: '全年',
          tips: '建议携带三脚架，注意行人安全，选择合适的拍摄角度避开人流',
          tags: ['东京', '涩谷', '夜景', '都市', '霓虹'],
          likes: 1234,
          collections: 567,
          shares: 89,
          imageHeight: 600
        },
        {
          id: 'hotspot_002',
          title: '巴黎埃菲尔铁塔 | 浪漫法式人像写真',
          description: '在世界最浪漫的城市巴黎，以埃菲尔铁塔为背景，拍摄充满法式浪漫的人像作品。',
          images: [
            'https://picsum.photos/300/300?random=1101', // 巴黎美女1
            'https://picsum.photos/300/300?random=1102', // 巴黎美女2
            'https://picsum.photos/300/300?random=1103', // 巴黎美女3
            'https://picsum.photos/300/300?random=1104', // 埃菲尔铁塔1
            'https://picsum.photos/300/300?random=1105', // 埃菲尔铁塔2
            'https://picsum.photos/300/300?random=1106', // 埃菲尔铁塔3
            'https://picsum.photos/300/300?random=1107', // 法式人像1
            'https://picsum.photos/300/300?random=1108', // 法式人像2
            'https://picsum.photos/300/300?random=1109'  // 法式人像3
          ],
          coverImage: 'https://picsum.photos/400/550?random=1101',
          location: '法国·巴黎·埃菲尔铁塔',
          region: 'europe', // 地区标识
          photographer: '欧洲旅拍·Pierre',
          style: '法式浪漫',
          equipment: 'Canon 5D4 + 50mm f/1.2',
          shootTime: '黄昏 17:00-19:00',
          difficulty: '简单',
          bestSeason: '春夏',
          tips: '黄昏时分光线最佳，建议提前占位，注意游客较多需耐心等待',
          tags: ['巴黎', '埃菲尔铁塔', '浪漫', '法式', '黄昏'],
          likes: 2156,
          collections: 892,
          shares: 234,
          imageHeight: 550
        },
        {
          id: 'hotspot_003',
          title: '纽约中央公园 | 秋日金黄人像大片',
          description: '纽约中央公园的秋季是摄影师的天堂，金黄的银杏叶与都市背景形成完美对比。',
          images: [
            'https://picsum.photos/300/300?random=1201', // 纽约秋景1
            'https://picsum.photos/300/300?random=1202', // 纽约秋景2
            'https://picsum.photos/300/300?random=1203', // 纽约秋景3
            'https://picsum.photos/300/300?random=1204', // 中央公园1
            'https://picsum.photos/300/300?random=1205', // 中央公园2
            'https://picsum.photos/300/300?random=1206', // 中央公园3
            'https://picsum.photos/300/300?random=1207', // 秋日人像1
            'https://picsum.photos/300/300?random=1208', // 秋日人像2
            'https://picsum.photos/300/300?random=1209'  // 秋日人像3
          ],
          coverImage: 'https://picsum.photos/400/520?random=1201',
          location: '美国·纽约·中央公园',
          region: 'america', // 地区标识
          photographer: '纽约摄影师·David',
          style: '秋日人像',
          equipment: 'Nikon Z9 + 85mm f/1.8',
          shootTime: '下午 14:00-17:00',
          difficulty: '简单',
          bestSeason: '秋季',
          tips: '10-11月最佳，金黄银杏叶最美，建议穿暖色系服装与环境呼应',
          tags: ['纽约', '中央公园', '秋景', '银杏', '都市'],
          likes: 1876,
          collections: 743,
          shares: 156,
          imageHeight: 520
        },
        {
          id: 'hotspot_004',
          title: '希腊圣托里尼 | 蓝白建筑下的浪漫人像',
          description: '圣托里尼的蓝白建筑是全世界最浪漫的拍摄背景，爱琴海的蓝与建筑的白形成梦幻画面。',
          images: [
            'https://picsum.photos/300/300?random=1301', // 圣托里尼1
            'https://picsum.photos/300/300?random=1302', // 圣托里尼2
            'https://picsum.photos/300/300?random=1303', // 圣托里尼3
            'https://picsum.photos/300/300?random=1304', // 蓝白建筑1
            'https://picsum.photos/300/300?random=1305', // 蓝白建筑2
            'https://picsum.photos/300/300?random=1306', // 蓝白建筑3
            'https://picsum.photos/300/300?random=1307', // 爱琴海人像1
            'https://picsum.photos/300/300?random=1308', // 爱琴海人像2
            'https://picsum.photos/300/300?random=1309'  // 爱琴海人像3
          ],
          coverImage: 'https://picsum.photos/400/580?random=1301',
          location: '希腊·圣托里尼·伊亚小镇',
          region: 'europe', // 地区标识
          photographer: '地中海摄影师·Maria',
          style: '地中海风情',
          equipment: 'Canon R5 + 24-70mm f/2.8',
          shootTime: '日落 18:00-20:00',
          difficulty: '中等',
          bestSeason: '春夏',
          tips: '日落时分最美，建议提前2小时占位，穿白色或蓝色服装最佳',
          tags: ['希腊', '圣托里尼', '蓝白', '爱琴海', '日落'],
          likes: 3245,
          collections: 1234,
          shares: 456,
          imageHeight: 580
        },
        {
          id: 'hotspot_005',
          title: '冰岛蓝湖温泉 | 冰火两重天的梦幻人像',
          description: '冰岛蓝湖的地热温泉与冰雪景观形成强烈对比，是拍摄梦幻人像的绝佳地点。',
          images: [
            'https://picsum.photos/300/300?random=1401', // 冰岛美女1
            'https://picsum.photos/300/300?random=1402', // 冰岛美女2
            'https://picsum.photos/300/300?random=1403', // 冰岛美女3
            'https://picsum.photos/300/300?random=1404', // 蓝湖温泉1
            'https://picsum.photos/300/300?random=1405', // 蓝湖温泉2
            'https://picsum.photos/300/300?random=1406', // 蓝湖温泉3
            'https://picsum.photos/300/300?random=1407', // 冰雪人像1
            'https://picsum.photos/300/300?random=1408', // 冰雪人像2
            'https://picsum.photos/300/300?random=1409'  // 冰雪人像3
          ],
          coverImage: 'https://picsum.photos/400/600?random=1401',
          location: '冰岛·雷克雅未克·蓝湖',
          region: 'europe', // 地区标识
          photographer: '极地摄影师·Erik',
          style: '极地风光',
          equipment: 'Fuji GFX100S + 63mm f/2.8',
          shootTime: '全天 10:00-16:00',
          difficulty: '困难',
          bestSeason: '冬季',
          tips: '需要防水设备，注意保暖，温泉蒸汽可营造梦幻效果',
          tags: ['冰岛', '蓝湖', '温泉', '极地', '梦幻'],
          likes: 2876,
          collections: 1456,
          shares: 234,
          imageHeight: 600
        },
        {
          id: 'hotspot_006',
          title: '马尔代夫水屋 | 碧海蓝天下的度假人像',
          description: '马尔代夫的水上屋是度假人像的经典场景，清澈的海水和无边泳池营造完美背景。',
          images: [
            'https://picsum.photos/300/300?random=1501', // 马尔代夫美女1
            'https://picsum.photos/300/300?random=1502', // 马尔代夫美女2
            'https://picsum.photos/300/300?random=1503', // 马尔代夫美女3
            'https://picsum.photos/300/300?random=1504', // 水屋度假1
            'https://picsum.photos/300/300?random=1505', // 水屋度假2
            'https://picsum.photos/300/300?random=1506', // 水屋度假3
            'https://picsum.photos/300/300?random=1507', // 海边人像1
            'https://picsum.photos/300/300?random=1508', // 海边人像2
            'https://picsum.photos/300/300?random=1509'  // 海边人像3
          ],
          coverImage: 'https://picsum.photos/400/520?random=1501',
          location: '马尔代夫·马累·水上屋',
          region: 'asia', // 地区标识
          photographer: '海岛摄影师·Ahmed',
          style: '海岛度假',
          equipment: 'Canon R6 + 24-105mm f/4',
          shootTime: '日出日落 06:00-08:00, 17:00-19:00',
          difficulty: '简单',
          bestSeason: '全年',
          tips: '防水防沙，利用水面反光，日出日落时分光线最佳',
          tags: ['马尔代夫', '水屋', '海岛', '度假', '碧海'],
          likes: 4567,
          collections: 2134,
          shares: 678,
          imageHeight: 520
        },
        {
          id: 'hotspot_007',
          title: '土耳其卡帕多奇亚 | 热气球下的童话人像',
          description: '卡帕多奇亚的热气球和奇特地貌是摄影师的梦想之地，日出时分的热气球海最为壮观。',
          images: [
            'https://picsum.photos/300/300?random=1601', // 土耳其美女1
            'https://picsum.photos/300/300?random=1602', // 土耳其美女2
            'https://picsum.photos/300/300?random=1603', // 土耳其美女3
            'https://picsum.photos/300/300?random=1604', // 热气球1
            'https://picsum.photos/300/300?random=1605', // 热气球2
            'https://picsum.photos/300/300?random=1606', // 热气球3
            'https://picsum.photos/300/300?random=1607', // 童话人像1
            'https://picsum.photos/300/300?random=1608', // 童话人像2
            'https://picsum.photos/300/300?random=1609'  // 童话人像3
          ],
          coverImage: 'https://picsum.photos/400/580?random=1601',
          location: '土耳其·卡帕多奇亚·格雷梅',
          region: 'asia', // 地区标识
          photographer: '中东摄影师·Mehmet',
          style: '童话奇幻',
          equipment: 'Sony A7R5 + 24-70mm f/2.8',
          shootTime: '日出 05:00-07:00',
          difficulty: '困难',
          bestSeason: '春秋',
          tips: '需要早起看日出，热气球升空时间短暂，建议连拍模式',
          tags: ['土耳其', '卡帕多奇亚', '热气球', '童话', '日出'],
          likes: 3456,
          collections: 1678,
          shares: 345,
          imageHeight: 580
        },
        {
          id: 'hotspot_008',
          title: '印度泰姬陵 | 永恒爱情的见证人像',
          description: '泰姬陵的白色大理石在不同光线下呈现不同色彩，是拍摄浪漫人像的经典地标。',
          images: [
            'https://picsum.photos/300/300?random=1701', // 印度美女1
            'https://picsum.photos/300/300?random=1702', // 印度美女2
            'https://picsum.photos/300/300?random=1703', // 印度美女3
            'https://picsum.photos/300/300?random=1704', // 泰姬陵1
            'https://picsum.photos/300/300?random=1705', // 泰姬陵2
            'https://picsum.photos/300/300?random=1706', // 泰姬陵3
            'https://picsum.photos/300/300?random=1707', // 古典人像1
            'https://picsum.photos/300/300?random=1708', // 古典人像2
            'https://picsum.photos/300/300?random=1709'  // 古典人像3
          ],
          coverImage: 'https://picsum.photos/400/550?random=1701',
          location: '印度·阿格拉·泰姬陵',
          region: 'asia', // 地区标识
          photographer: '印度摄影师·Raj',
          style: '古典建筑',
          equipment: 'Canon R5 + 70-200mm f/2.8',
          shootTime: '日出日落 06:00-08:00, 17:00-19:00',
          difficulty: '中等',
          bestSeason: '冬春',
          tips: '避开正午强光，利用建筑对称性构图，注意游客管理',
          tags: ['印度', '泰姬陵', '古典', '建筑', '爱情'],
          likes: 2234,
          collections: 987,
          shares: 234,
          imageHeight: 550
        },
        {
          id: 'hotspot_009',
          title: '中国张家界 | 阿凡达悬浮山中的仙境人像',
          description: '张家界的石柱群是《阿凡达》的取景地，云雾缭绕的山峰为人像摄影提供了仙境般的背景。',
          images: [
            'https://picsum.photos/300/300?random=1801', // 张家界美女1
            'https://picsum.photos/300/300?random=1802', // 张家界美女2
            'https://picsum.photos/300/300?random=1803', // 张家界美女3
            'https://picsum.photos/300/300?random=1804', // 悬浮山1
            'https://picsum.photos/300/300?random=1805', // 悬浮山2
            'https://picsum.photos/300/300?random=1806', // 悬浮山3
            'https://picsum.photos/300/300?random=1807', // 仙境人像1
            'https://picsum.photos/300/300?random=1808', // 仙境人像2
            'https://picsum.photos/300/300?random=1809'  // 仙境人像3
          ],
          coverImage: 'https://picsum.photos/400/600?random=1801',
          location: '中国·湖南·张家界',
          region: 'asia', // 地区标识
          photographer: '风光摄影师·老张',
          style: '仙境风光',
          equipment: 'Nikon D850 + 14-24mm f/2.8',
          shootTime: '清晨 06:00-09:00',
          difficulty: '困难',
          bestSeason: '春秋',
          tips: '云雾天气最佳，需要早起等待云海，注意山区安全',
          tags: ['张家界', '阿凡达', '仙境', '云海', '山峰'],
          likes: 3789,
          collections: 1567,
          shares: 456,
          imageHeight: 600
        },
        {
          id: 'hotspot_010',
          title: '迪拜帆船酒店 | 奢华都市的时尚人像',
          description: '迪拜帆船酒店的奢华建筑和金色沙滩，为时尚人像摄影提供了完美的都市背景。',
          images: [
            'https://picsum.photos/300/300?random=1901', // 迪拜美女1
            'https://picsum.photos/300/300?random=1902', // 迪拜美女2
            'https://picsum.photos/300/300?random=1903', // 迪拜美女3
            'https://picsum.photos/300/300?random=1904', // 帆船酒店1
            'https://picsum.photos/300/300?random=1905', // 帆船酒店2
            'https://picsum.photos/300/300?random=1906', // 帆船酒店3
            'https://picsum.photos/300/300?random=1907', // 奢华人像1
            'https://picsum.photos/300/300?random=1908', // 奢华人像2
            'https://picsum.photos/300/300?random=1909'  // 奢华人像3
          ],
          coverImage: 'https://picsum.photos/400/580?random=1901',
          location: '阿联酋·迪拜·帆船酒店',
          region: 'asia', // 地区标识
          photographer: '中东摄影师·Omar',
          style: '奢华都市',
          equipment: 'Leica SL2 + 90mm f/2',
          shootTime: '黄昏 16:00-18:00',
          difficulty: '中等',
          bestSeason: '冬春',
          tips: '注意酒店拍摄规定，利用金色建筑反光，黄昏时分最美',
          tags: ['迪拜', '帆船酒店', '奢华', '都市', '金色'],
          likes: 2987,
          collections: 1234,
          shares: 345,
          imageHeight: 580
        },
        {
          id: 'hotspot_011',
          title: '澳洲大洋路 | 海岸公路的自由人像',
          description: '澳大利亚大洋路是世界最美海岸公路之一，十二门徒岩与无边海景为人像摄影提供壮美背景。',
          images: [
            'https://picsum.photos/300/300?random=2001', // 澳洲美女1
            'https://picsum.photos/300/300?random=2002', // 澳洲美女2
            'https://picsum.photos/300/300?random=2003', // 澳洲美女3
            'https://picsum.photos/300/300?random=2004', // 大洋路1
            'https://picsum.photos/300/300?random=2005', // 大洋路2
            'https://picsum.photos/300/300?random=2006', // 大洋路3
            'https://picsum.photos/300/300?random=2007', // 海岸人像1
            'https://picsum.photos/300/300?random=2008', // 海岸人像2
            'https://picsum.photos/300/300?random=2009'  // 海岸人像3
          ],
          coverImage: 'https://picsum.photos/400/520?random=2001',
          location: '澳大利亚·维多利亚州·大洋路',
          region: 'oceania', // 地区标识
          photographer: '澳洲摄影师·Jack',
          style: '海岸风光',
          equipment: 'Canon R6 + 16-35mm f/2.8',
          shootTime: '日出日落 06:00-08:00, 18:00-20:00',
          difficulty: '中等',
          bestSeason: '夏季',
          tips: '注意海风影响，利用岩石作为前景，黄昏时分光线最佳',
          tags: ['澳洲', '大洋路', '海岸', '自由', '壮美'],
          likes: 2456,
          collections: 1123,
          shares: 234,
          imageHeight: 520
        },
        {
          id: 'hotspot_012',
          title: '摩洛哥撒哈拉沙漠 | 金沙夕阳下的异域人像',
          description: '撒哈拉沙漠的金色沙丘在夕阳下呈现出梦幻的色彩，是拍摄异域风情人像的绝佳地点。',
          images: [
            'https://picsum.photos/300/300?random=2101', // 摩洛哥美女1
            'https://picsum.photos/300/300?random=2102', // 摩洛哥美女2
            'https://picsum.photos/300/300?random=2103', // 摩洛哥美女3
            'https://picsum.photos/300/300?random=2104', // 撒哈拉1
            'https://picsum.photos/300/300?random=2105', // 撒哈拉2
            'https://picsum.photos/300/300?random=2106', // 撒哈拉3
            'https://picsum.photos/300/300?random=2107', // 沙漠人像1
            'https://picsum.photos/300/300?random=2108', // 沙漠人像2
            'https://picsum.photos/300/300?random=2109'  // 沙漠人像3
          ],
          coverImage: 'https://picsum.photos/400/600?random=2101',
          location: '摩洛哥·梅尔祖卡·撒哈拉沙漠',
          region: 'africa', // 地区标识
          photographer: '非洲摄影师·Hassan',
          style: '异域风情',
          equipment: 'Nikon Z7 + 24-120mm f/4',
          shootTime: '日出日落 05:30-07:00, 18:00-19:30',
          difficulty: '困难',
          bestSeason: '秋冬',
          tips: '防沙防风，利用沙丘线条构图，骆驼作为道具增加异域感',
          tags: ['摩洛哥', '撒哈拉', '沙漠', '异域', '金沙'],
          likes: 3234,
          collections: 1456,
          shares: 345,
          imageHeight: 600
        },
        {
          id: 'hotspot_013',
          title: '秘鲁马丘比丘 | 失落文明中的神秘人像',
          description: '马丘比丘的古印加遗址坐落在安第斯山脉中，云雾缭绕的古城为人像摄影增添神秘色彩。',
          images: [
            'https://picsum.photos/300/300?random=2201', // 秘鲁美女1
            'https://picsum.photos/300/300?random=2202', // 秘鲁美女2
            'https://picsum.photos/300/300?random=2203', // 秘鲁美女3
            'https://picsum.photos/300/300?random=2204', // 马丘比丘1
            'https://picsum.photos/300/300?random=2205', // 马丘比丘2
            'https://picsum.photos/300/300?random=2206', // 马丘比丘3
            'https://picsum.photos/300/300?random=2207', // 古城人像1
            'https://picsum.photos/300/300?random=2208', // 古城人像2
            'https://picsum.photos/300/300?random=2209'  // 古城人像3
          ],
          coverImage: 'https://picsum.photos/400/580?random=2201',
          location: '秘鲁·库斯科·马丘比丘',
          region: 'america', // 地区标识
          photographer: '南美摄影师·Carlos',
          style: '古文明',
          equipment: 'Sony A7R4 + 24-70mm f/2.8',
          shootTime: '日出 06:00-08:00',
          difficulty: '困难',
          bestSeason: '旱季',
          tips: '需要提前预订门票，云雾天气增加神秘感，注意高原反应',
          tags: ['秘鲁', '马丘比丘', '古文明', '神秘', '云雾'],
          likes: 4123,
          collections: 1789,
          shares: 456,
          imageHeight: 580
        },
        {
          id: 'hotspot_014',
          title: '挪威罗弗敦群岛 | 极光下的梦幻人像',
          description: '罗弗敦群岛的壮美峡湾和极光现象，为人像摄影创造了世界上最梦幻的背景之一。',
          images: [
            'https://picsum.photos/300/300?random=2301', // 挪威美女1
            'https://picsum.photos/300/300?random=2302', // 挪威美女2
            'https://picsum.photos/300/300?random=2303', // 挪威美女3
            'https://picsum.photos/300/300?random=2304', // 罗弗敦1
            'https://picsum.photos/300/300?random=2305', // 罗弗敦2
            'https://picsum.photos/300/300?random=2306', // 罗弗敦3
            'https://picsum.photos/300/300?random=2307', // 极光人像1
            'https://picsum.photos/300/300?random=2308', // 极光人像2
            'https://picsum.photos/300/300?random=2309'  // 极光人像3
          ],
          coverImage: 'https://picsum.photos/400/600?random=2301',
          location: '挪威·诺德兰·罗弗敦群岛',
          region: 'europe', // 地区标识
          photographer: '北欧摄影师·Lars',
          style: '极地风光',
          equipment: 'Nikon Z9 + 14-30mm f/4',
          shootTime: '夜晚 20:00-02:00',
          difficulty: '极难',
          bestSeason: '冬季',
          tips: '需要专业极光预测，保暖设备必备，长曝光技术要求高',
          tags: ['挪威', '罗弗敦', '极光', '峡湾', '梦幻'],
          likes: 5678,
          collections: 2345,
          shares: 678,
          imageHeight: 600
        },
        {
          id: 'hotspot_015',
          title: '中国西湖 | 江南水乡的诗意人像',
          description: '杭州西湖的断桥残雪、柳浪闻莺，每一处都是拍摄古典人像的绝佳背景，四季皆有不同美景。',
          images: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop'
          ],
          coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=580&fit=crop',
          location: '中国·杭州·西湖',
          region: 'asia',
          photographer: '江南摄影师·小雅',
          style: '古典诗意',
          equipment: 'Canon R5 + 85mm f/1.2',
          shootTime: '清晨 6:00-9:00',
          difficulty: '简单',
          bestSeason: '春秋',
          tips: '清晨人少光线柔和，春季柳絮飞舞最美，建议穿古装或素色长裙',
          tags: ['西湖', '江南', '古典', '诗意', '水乡'],
          likes: 3456,
          collections: 1234,
          shares: 567,
          imageHeight: 580
        },
        {
          id: 'hotspot_016',
          title: '中国故宫 | 皇家建筑的庄严人像',
          description: '紫禁城的红墙黄瓦、雕梁画栋，是拍摄古风人像的顶级场所，每一处都充满皇家气派。',
          images: [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=400&fit=crop',
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=300&h=400&fit=crop'
          ],
          coverImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
          location: '中国·北京·故宫',
          region: 'asia',
          photographer: '古建摄影师·老王',
          style: '皇家古风',
          equipment: 'Nikon Z9 + 24-70mm f/2.8',
          shootTime: '上午 9:00-11:00',
          difficulty: '中等',
          bestSeason: '秋季',
          tips: '需要预约门票，避开人流高峰，红墙是最佳背景，建议穿明制汉服',
          tags: ['故宫', '皇家', '古建', '红墙', '汉服'],
          likes: 4567,
          collections: 1890,
          shares: 678,
          imageHeight: 600
        }
      ];

      // 推荐模特数据 - 顶级小红书类型美女
      this.recommendedModelsCache = [
        {
          id: 'model_001',
          title: '清纯系模特小仙女 | 日系写真专业模特',
          description: '专业模特3年经验，擅长日系清新、韩系甜美风格，配合度极高，出片率100%',
          images: [
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女1
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女2
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女3
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女4
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女5
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女6
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女7
            'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=400&fit=crop&auto=format&q=80', // 清纯美女8
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=400&fit=crop&auto=format&q=80'  // 清纯美女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&auto=format&q=80',
          user: {
            name: '小仙女Yuki',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
            age: 22,
            height: '165cm',
            location: '杭州·西湖区',
            experience: '3年',
            verified: true
          },
          specialties: ['日系清新', '韩系甜美', '校园风', '咖啡馆'],
          price: '免费互免',
          availability: '周末可约',
          portfolio: {
            totalShots: 156,
            styles: ['清新', '甜美', '文艺', '校园'],
            rating: 4.9
          },
          tags: ['清纯系', '日系', '专业模特', '配合度高'],
          style: ['清纯', '日系'],
          likes: 2341,
          collections: 1234,
          shares: 456,
          imageHeight: 600
        },
        {
          id: 'model_002',
          title: '气质御姐Luna | 时尚大片专业模特',
          description: '时尚杂志签约模特，擅长欧美风、港风复古，镜头表现力极强，适合商业拍摄',
          images: [
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女1
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女2
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女3
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女4
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女5
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女6
            'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女7
            'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=450&fit=crop&auto=format&q=80', // 御姐美女8
            'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=450&fit=crop&auto=format&q=80'  // 御姐美女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=650&fit=crop&auto=format&q=80',
          user: {
            name: '御姐Luna',
            avatar: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=60&h=60&fit=crop&crop=face',
            age: 26,
            height: '170cm',
            location: '上海·静安区',
            experience: '5年',
            verified: true
          },
          specialties: ['欧美风', '港风复古', '时尚大片', '商业拍摄'],
          price: '800-1500/小时',
          availability: '工作日可约',
          portfolio: {
            totalShots: 324,
            styles: ['时尚', '欧美', '复古', '商业'],
            rating: 4.8
          },
          tags: ['气质御姐', '时尚', '专业模特', '镜头感强'],
          style: ['时尚', '欧美'],
          likes: 4567,
          collections: 2345,
          shares: 789,
          imageHeight: 650
        },
        {
          id: 'model_003',
          title: '甜美少女Mia | 校园风约拍首选',
          description: '在校大学生兼职模特，天然甜美气质，擅长校园风、青春活力风格，价格亲民',
          images: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女1
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女2
            'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女3
            'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女4
            'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女5
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女6
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女7
            'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&h=400&fit=crop&auto=format&q=80', // 甜美少女8
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=300&h=400&fit=crop&auto=format&q=80'  // 甜美少女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=580&fit=crop&auto=format&q=80',
          user: {
            name: '甜美少女Mia',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face',
            age: 20,
            height: '162cm',
            location: '杭州·下沙',
            experience: '1年',
            verified: true
          },
          specialties: ['校园风', '青春活力', '甜美可爱', '学生风'],
          price: '免费互免',
          availability: '周末可约',
          portfolio: {
            totalShots: 89,
            styles: ['甜美', '校园', '青春', '可爱'],
            rating: 4.7
          },
          tags: ['甜美少女', '校园风', '学生模特', '价格亲民'],
          style: ['甜美', '校园'],
          likes: 1876,
          collections: 987,
          shares: 234,
          imageHeight: 580
        },
        {
          id: 'model_004',
          title: '知性女神Sophia | 职场风情专业模特',
          description: '职场白领兼职模特，知性优雅气质，擅长职场风、轻熟女风格，适合商务拍摄',
          images: [
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女1
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女2
            'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女3
            'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女4
            'https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女5
            'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女6
            'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女7
            'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=450&fit=crop&auto=format&q=80', // 知性美女8
            'https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=300&h=450&fit=crop&auto=format&q=80'  // 知性美女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=620&fit=crop&auto=format&q=80',
          user: {
            name: '知性女神Sophia',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face',
            age: 28,
            height: '168cm',
            location: '杭州·钱江新城',
            experience: '4年',
            verified: true
          },
          specialties: ['职场风', '轻熟女', '知性优雅', '商务拍摄'],
          price: '600-1200/小时',
          availability: '工作日晚上可约',
          portfolio: {
            totalShots: 267,
            styles: ['知性', '职场', '优雅', '商务'],
            rating: 4.9
          },
          tags: ['知性女神', '职场风', '轻熟女', '气质佳'],
          style: ['知性', '职场'],
          likes: 3456,
          collections: 1678,
          shares: 567,
          imageHeight: 620
        },
        {
          id: 'model_005',
          title: '古风仙女Iris | 汉服古装专业模特',
          description: '古风摄影专业模特，精通汉服穿搭，古典舞蹈功底，擅长古风、仙侠、宫廷风格',
          images: [
            'https://images.unsplash.com/photo-1509909756405-be0199881695?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女1
            'https://images.unsplash.com/photo-1512310604669-443f26c35f52?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女2
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女3
            'https://images.unsplash.com/photo-1522075469751-3847ae2c4c1a?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女4
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女5
            'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女6
            'https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女7
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=450&fit=crop&auto=format&q=80', // 古风美女8
            'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=300&h=450&fit=crop&auto=format&q=80'  // 古风美女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop&auto=format&q=80',
          user: {
            name: '古风仙女Iris',
            avatar: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=60&h=60&fit=crop&crop=face',
            age: 24,
            height: '166cm',
            location: '杭州·西溪湿地',
            experience: '2年',
            verified: true
          },
          specialties: ['古风', '汉服', '仙侠', '宫廷风'],
          price: '400-800/小时',
          availability: '周末可约',
          portfolio: {
            totalShots: 198,
            styles: ['古风', '仙侠', '汉服', '宫廷'],
            rating: 4.8
          },
          tags: ['古风仙女', '汉服', '古典舞', '仙气飘飘'],
          style: ['古风', '汉服'],
          likes: 2987,
          collections: 1456,
          shares: 398,
          imageHeight: 600
        },
        {
          id: 'model_006',
          title: '运动女神Coco | 健身瑜伽专业模特',
          description: '健身教练兼职模特，完美身材比例，擅长运动风、健身写真、瑜伽主题拍摄',
          images: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女1
            'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女2
            'https://images.unsplash.com/photo-1506629905607-c52b1b8e8d19?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女3
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女4
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女5
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女6
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女7
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&auto=format&q=80', // 运动美女8
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&auto=format&q=80'  // 运动美女9
          ],
          coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=550&fit=crop&auto=format&q=80',
          user: {
            name: '运动女神Coco',
            avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop&crop=face',
            age: 25,
            height: '170cm',
            location: '杭州·奥体中心',
            experience: '3年',
            verified: true
          },
          specialties: ['运动风', '健身写真', '瑜伽主题', '活力四射'],
          price: '500-1000/小时',
          availability: '工作日可约',
          portfolio: {
            totalShots: 234,
            styles: ['运动', '健身', '瑜伽', '活力'],
            rating: 4.9
          },
          tags: ['运动女神', '健身', '完美身材', '专业模特'],
          style: ['运动', '健身'],
          likes: 4123,
          collections: 2098,
          shares: 678,
          imageHeight: 550
        }
      ];

      // 初始化完成后，根据默认选中的专题加载数据

      // 初始化完成后，根据默认选中的专题加载数据
      await this.filterAppointmentsByTopic(this.data.selectedTopic);

      console.log('初始化完成，当前专题:', this.data.selectedTopic);
    } catch (error) {
      console.error('初始化约拍数据失败:', error);
      this.setData({ loading: false });
    }
  },

  async onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      await this.loadAppointments(true);
    }
  },

  async onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    await this.loadAppointments();
    wx.stopPullDownRefresh();
  },

  // 加载约拍列表
  async loadAppointments(loadMore = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const { page, pageSize, filters } = this.data;
      const currentPage = loadMore ? page + 1 : 1;
      
      const params = {
        page: currentPage,
        pageSize,
        ...filters
      };
      
      const res = await request('/appointments', 'GET', params);
      const newAppointments = res.data.list;
      
      this.setData({
        appointments: loadMore ? [...this.data.appointments, ...newAppointments] : newAppointments,
        page: currentPage,
        hasMore: newAppointments.length === pageSize,
        loading: false
      });
    } catch (error) {
      console.error('加载约拍列表失败:', error);
      this.setData({ loading: false });
    }
  },

  // 发布约拍
  onPublishTap() {
    wx.navigateTo({
      url: '/pages/appointment/publish/index'
    });
  },

  // 约拍卡片点击
  onAppointmentTap(e) {
    const { appointment } = e.detail;
    wx.navigateTo({
      url: `/pages/appointment/detail/index?id=${appointment.id}`
    });
  },

  // 申请约拍
  async onApplyTap(e) {
    const { appointment } = e.detail;
    try {
      await request(`/appointments/${appointment.id}/apply`, 'POST');
      wx.showToast({
        title: '申请成功',
        icon: 'success'
      });
      // 刷新当前专题的约拍列表
      this.filterAppointmentsByTopic(this.data.selectedTopic);
    } catch (error) {
      wx.showToast({
        title: '申请失败',
        icon: 'error'
      });
    }
  },

  // 用户头像点击
  onUserTap(e) {
    const { userId } = e.detail;
    wx.navigateTo({
      url: `/pages/user/photographer-detail/index?id=${userId}`
    });
  },

  // 专题点击
  onTopicTap(e) {
    try {
      const { topic } = e.currentTarget.dataset;
      if (topic && topic.id) {
        this.setData({
          selectedTopic: topic.id,
          searchKeyword: '' // 切换专题时清空搜索
        });

        this.filterAppointmentsByTopic(topic.id);
      }
    } catch (error) {
      console.error('专题点击错误:', error);
    }
  },

  // 根据专题筛选约拍
  async filterAppointmentsByTopic(topicId) {
    try {
      this.setData({ loading: true });

      // 如果没有缓存所有约拍，先获取
      if (!this.allAppointmentsCache) {
        const res = await request('/appointments', 'GET', {});
        this.allAppointmentsCache = res.data.list || [];
      }

      let filteredAppointments = this.allAppointmentsCache;

      // 根据专题筛选
      switch (topicId) {
        case 'recommended':
          // 推荐：显示约拍完成后的喜悦分享
          filteredAppointments = this.recommendedSharesCache || [];
          break;
        case 'local':
          // 同城：显示摄影师约模特和模特求约摄影师的广告信息
          let localData = this.fixImageUrls(this.localAppointmentsCache || []);
          // 根据筛选条件过滤
          if (this.data.localFilter !== 'all') {
            localData = localData.filter(item => item.type === this.data.localFilter);
          }
          filteredAppointments = localData;
          break;
        case 'hotspot':
          // 热门出片打卡地：显示全球各地的人物摄影作品
          let hotspotData = this.fixImageUrls(this.hotspotPhotosCache || []);
          // 根据地区筛选条件过滤
          if (this.data.hotspotFilter !== 'all') {
            hotspotData = hotspotData.filter(item => item.region === this.data.hotspotFilter);
          }
          filteredAppointments = hotspotData;
          break;
        case 'photographer-story':
          // 摄影师故事：显示摄影师故事内容
          filteredAppointments = this.photographerStoriesCache || [];
          break;
        case 'recommended-model':
          // 推荐模特：显示专业推荐模特
          filteredAppointments = this.recommendedModelsCache || [];
          break;
      }

      // 使用瀑布流布局
      this.layoutWaterfall(filteredAppointments);

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      this.setData({ loading: false });

    } catch (error) {
      console.error('专题筛选错误:', error);
      this.setData({ loading: false });
    }
  },

  // 瀑布流布局
  layoutWaterfall(appointments) {
    // 确保 appointments 是数组
    if (!appointments || !Array.isArray(appointments)) {
      console.warn('layoutWaterfall: appointments 不是有效数组', appointments);
      this.setData({
        appointments: [],
        leftColumnAppointments: [],
        rightColumnAppointments: []
      });
      return;
    }

    const leftColumn = [];
    const rightColumn = [];
    let leftHeight = 0;
    let rightHeight = 0;

    appointments.forEach(appointment => {
      // 估算卡片高度（基于内容长度和图片）
      const baseHeight = 180; // 基础高度
      const titleHeight = Math.ceil((appointment.title || '').length / 12) * 28;
      const descHeight = Math.ceil((appointment.description || '').length / 20) * 24;

      // 处理不同的图片字段
      let imageHeight = 0;
      if (appointment.sampleImages) {
        imageHeight = appointment.sampleImages.length === 1 ? 160 : 140;
      } else if (appointment.images) {
        imageHeight = appointment.images.length === 1 ? 160 : 140;
      } else if (appointment.coverImage) {
        imageHeight = 160;
      }

      // 处理不同的标签字段
      let tagsHeight = 0;
      if (appointment.style && appointment.style.length > 0) {
        tagsHeight = 40;
      } else if (appointment.tags && appointment.tags.length > 0) {
        tagsHeight = 40;
      }

      const estimatedHeight = baseHeight + titleHeight + descHeight + imageHeight + tagsHeight;

      // 选择较短的列
      if (leftHeight <= rightHeight) {
        leftColumn.push(appointment);
        leftHeight += estimatedHeight;
      } else {
        rightColumn.push(appointment);
        rightHeight += estimatedHeight;
      }
    });

    this.setData({
      appointments: appointments,
      leftColumnAppointments: leftColumn,
      rightColumnAppointments: rightColumn
    });
  },

  // 筛选
  onFilterTap() {
    // 打开筛选弹窗
    wx.showActionSheet({
      itemList: ['全部类型', '摄影师找模特', '模特找摄影师'],
      success: (res) => {
        const types = ['all', 'photographer_seek_model', 'model_seek_photographer'];
        this.setData({
          'filters.type': types[res.tapIndex],
          page: 1,
          hasMore: true
        });
        this.loadAppointments();
      }
    });
  },

  // 分享卡片点击
  onShareTap(e) {
    const { share } = e.detail;
    if (share && share.id) {
      // 显示分享详情
      wx.showModal({
        title: '约拍分享',
        content: `${share.user?.name || share.publisherName}: ${share.title || share.feedText}`,
        showCancel: true,
        cancelText: '关闭',
        confirmText: '查看详情',
        success: (res) => {
          if (res.confirm) {
            // 这里可以跳转到详情页面
            console.log('查看分享详情:', share);
          }
        }
      });
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 搜索确认
  onSearchConfirm(e) {
    const keyword = e.detail.value.trim();
    if (keyword) {
      this.performSearch(keyword);
    }
  },





  // 执行搜索
  async performSearch(keyword) {
    this.setData({ loading: true });

    try {
      // 在当前专题的数据中搜索
      let searchData = [];

      if (this.data.selectedTopic === 'photographer-story') {
        // 在摄影师故事中搜索
        searchData = this.photographerStoriesCache.filter(item =>
          (item.title && item.title.includes(keyword)) ||
          (item.description && item.description.includes(keyword)) ||
          (item.publisherName && item.publisherName.includes(keyword))
        );
      } else {
        // 在约拍数据中搜索
        searchData = this.allAppointmentsCache.filter(item =>
          (item.title && item.title.includes(keyword)) ||
          (item.description && item.description.includes(keyword)) ||
          (item.publisherName && item.publisherName.includes(keyword)) ||
          (item.style && item.style.some(s => s.includes(keyword)))
        );
      }

      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      if (this.data.selectedTopic === 'photographer-story') {
        // 摄影师故事直接显示
        this.layoutWaterfall(searchData);
        this.setData({ loading: false });
      } else {
        this.layoutWaterfall(searchData);
        this.setData({ loading: false });
      }

      // 显示搜索结果提示
      if (searchData.length === 0) {
        wx.showToast({
          title: '未找到相关内容',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
    }
  },

  // 筛选按钮点击
  onFilterTap() {
    wx.showActionSheet({
      itemList: ['全部类型', '摄影师找模特', '模特找摄影师', '按预算筛选', '按城市筛选'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.setData({ 'filters.type': 'all' });
            break;
          case 1:
            this.setData({ 'filters.type': 'photographer_seek_model' });
            break;
          case 2:
            this.setData({ 'filters.type': 'model_seek_photographer' });
            break;
          case 3:
            this.showBudgetFilter();
            break;
          case 4:
            this.showCityFilter();
            break;
        }
        // 重新筛选当前专题
        this.filterAppointmentsByTopic(this.data.selectedTopic);
      }
    });
  },

  // 显示预算筛选
  showBudgetFilter() {
    wx.showActionSheet({
      itemList: ['全部预算', '500以下', '500-1000', '1000-2000', '2000以上'],
      success: (res) => {
        const budgetRanges = ['all', 'low', 'medium', 'high', 'premium'];
        this.setData({ 'filters.budgetRange': budgetRanges[res.tapIndex] });
        this.filterAppointmentsByTopic(this.data.selectedTopic);
      }
    });
  },

  // 显示城市筛选
  showCityFilter() {
    wx.showActionSheet({
      itemList: ['全部城市', '北京', '上海', '杭州', '深圳'],
      success: (res) => {
        const cities = ['', '北京', '上海', '杭州', '深圳'];
        this.setData({ 'filters.city': cities[res.tapIndex] });
        this.filterAppointmentsByTopic(this.data.selectedTopic);
      }
    });
  },

  // 同城栏目筛选方法
  handleLocalFilter() {
    wx.showActionSheet({
      itemList: ['全部类型', '摄影师约模特', '模特求约摄影师'],
      success: (res) => {
        const filterTypes = ['all', 'photographer_seek_model', 'model_seek_photographer'];
        const filterNames = ['全部类型', '摄影师约模特', '模特求约摄影师'];

        this.setData({
          localFilter: filterTypes[res.tapIndex]
        });

        // 重新筛选数据
        this.filterAppointmentsByTopic('local');

        // 显示筛选结果提示
        wx.showToast({
          title: `已筛选：${filterNames[res.tapIndex]}`,
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  // 相机拍照按钮点击
  onCameraTap() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        console.log('选择的图片:', res.tempFiles);
        // 这里可以处理选择的图片，比如跳转到发布页面
        wx.showToast({
          title: '图片选择成功',
          icon: 'success',
          duration: 1500
        });

        // 可以跳转到发布约拍页面
        // wx.navigateTo({
        //   url: '/pages/publish/index'
        // });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  // 热门打卡地筛选方法
  handleHotspotFilter() {
    wx.showActionSheet({
      itemList: ['全部地区', '亚洲', '欧洲', '美洲', '非洲', '大洋洲'],
      success: (res) => {
        const filterTypes = ['all', 'asia', 'europe', 'america', 'africa', 'oceania'];
        const filterNames = ['全部地区', '亚洲', '欧洲', '美洲', '非洲', '大洋洲'];

        this.setData({
          hotspotFilter: filterTypes[res.tapIndex]
        });

        // 重新筛选数据
        this.filterAppointmentsByTopic('hotspot');

        // 显示筛选结果提示
        wx.showToast({
          title: `已筛选：${filterNames[res.tapIndex]}`,
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  // 图片加载成功
  onImageLoad(e) {
    console.log('图片加载成功:', e.detail);
  },

  // 图片加载失败
  onImageError(e) {
    console.error('图片加载失败:', e.detail);
  }
});
