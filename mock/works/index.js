// 作品相关Mock数据 - 得物风格
const mockWorks = [
  {
    id: 'work_001',
    userId: 'user_001',
    userName: '光影大师',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    title: '城市夜景人像',
    coverImage: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=600&fit=crop',
    imageWidth: 400,
    imageHeight: 600,
    category: 'portrait',
    tags: ['人像', '夜景'],
    stats: { likes: 156, comments: 23, views: 1200 },
    isLiked: false,
    createdAt: '2024-01-15T20:30:00Z'
  },
  {
    id: 'work_002',
    userId: 'user_002',
    userName: '自然之眼',
    userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    title: '晨雾中的山峦',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop',
    imageWidth: 400,
    imageHeight: 500,
    category: 'landscape',
    tags: ['风光', '山景'],
    stats: { likes: 89, comments: 12, views: 800 },
    isLiked: true,
    createdAt: '2024-01-14T06:15:00Z'
  },
  {
    id: 'work_003',
    userId: 'user_003',
    userName: '街拍达人',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    title: '雨后的街道',
    coverImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=700&fit=crop',
    imageWidth: 400,
    imageHeight: 700,
    category: 'street',
    tags: ['街拍', '雨景'],
    stats: { likes: 234, comments: 45, views: 1800 },
    isLiked: false,
    createdAt: '2024-01-13T14:20:00Z'
  },
  {
    id: 'work_casual_001',
    userId: 'user_015',
    userName: '生活记录者',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    title: '午后的咖啡时光',
    coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=450&fit=crop',
    imageWidth: 400,
    imageHeight: 450,
    category: 'casual',
    tags: ['随手拍', '咖啡', '日常'],
    stats: { likes: 67, comments: 8, views: 420 },
    isLiked: false,
    createdAt: '2024-01-16T15:30:00Z'
  },
  {
    id: 'work_casual_002',
    userId: 'user_016',
    userName: '小确幸',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    title: '窗台上的小花',
    coverImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=380&fit=crop',
    imageWidth: 400,
    imageHeight: 380,
    category: 'casual',
    tags: ['随手拍', '花朵', '生活'],
    stats: { likes: 43, comments: 5, views: 280 },
    isLiked: true,
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 'work_casual_003',
    userId: 'user_017',
    userName: '日常观察家',
    userAvatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face',
    title: '地铁里的光影',
    coverImage: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=520&fit=crop',
    imageWidth: 400,
    imageHeight: 520,
    category: 'casual',
    tags: ['随手拍', '地铁', '光影'],
    stats: { likes: 92, comments: 12, views: 650 },
    isLiked: false,
    createdAt: '2024-01-18T08:45:00Z'
  },
  {
    id: 'work_casual_004',
    userId: 'user_018',
    userName: '手机摄影爱好者',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    title: '路边的小猫',
    coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=480&fit=crop',
    imageWidth: 400,
    imageHeight: 480,
    category: 'casual',
    tags: ['随手拍', '小猫', '可爱'],
    stats: { likes: 128, comments: 15, views: 720 },
    isLiked: true,
    createdAt: '2024-01-19T12:20:00Z'
  },
  {
    id: 'work_casual_005',
    userId: 'user_019',
    userName: '城市漫步者',
    userAvatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
    title: '公园里的秋叶',
    coverImage: 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=400&h=350&fit=crop',
    imageWidth: 400,
    imageHeight: 350,
    category: 'casual',
    tags: ['随手拍', '秋叶', '公园'],
    stats: { likes: 76, comments: 9, views: 480 },
    isLiked: false,
    createdAt: '2024-01-20T14:10:00Z'
  },
  {
    id: 'work_casual_006',
    userId: 'user_020',
    userName: '美食记录员',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
    title: '今天的早餐',
    coverImage: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=400&fit=crop',
    imageWidth: 400,
    imageHeight: 400,
    category: 'casual',
    tags: ['随手拍', '早餐', '美食'],
    stats: { likes: 54, comments: 6, views: 320 },
    isLiked: false,
    createdAt: '2024-01-21T07:30:00Z'
  },
  {
    id: 'work_004',
    userId: 'user_004',
    userName: '小清新',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    title: '午后阳光',
    coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=450&fit=crop',
    imageWidth: 400,
    imageHeight: 450,
    category: 'portrait',
    tags: ['清新', '阳光'],
    stats: { likes: 67, comments: 8, views: 450 },
    isLiked: false,
    createdAt: '2024-01-12T16:45:00Z'
  },
  {
    id: 'work_casual_007',
    userId: 'user_021',
    userName: '随拍小能手',
    userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face',
    title: '书店里的安静时光',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop',
    imageWidth: 400,
    imageHeight: 500,
    category: 'casual',
    tags: ['随手拍', '书店', '安静'],
    stats: { likes: 85, comments: 11, views: 560 },
    isLiked: true,
    createdAt: '2024-01-22T16:20:00Z'
  },
  {
    id: 'work_casual_008',
    userId: 'user_022',
    userName: '手机摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=100&h=100&fit=crop&crop=face',
    title: '雨滴在玻璃上',
    coverImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&h=600&fit=crop',
    imageWidth: 400,
    imageHeight: 600,
    category: 'casual',
    tags: ['随手拍', '雨滴', '玻璃'],
    stats: { likes: 112, comments: 18, views: 780 },
    isLiked: false,
    createdAt: '2024-01-23T11:30:00Z'
  },
  {
    id: 'work_casual_009',
    userId: 'user_023',
    userName: '生活观察员',
    userAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face',
    title: '夕阳下的影子',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=320&fit=crop',
    imageWidth: 400,
    imageHeight: 320,
    category: 'casual',
    tags: ['随手拍', '夕阳', '影子'],
    stats: { likes: 73, comments: 7, views: 410 },
    isLiked: true,
    createdAt: '2024-01-24T18:45:00Z'
  },
  {
    id: 'work_005',
    userId: 'user_005',
    userName: '建筑师',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    title: '现代建筑之美',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=550&fit=crop',
    imageWidth: 400,
    imageHeight: 550,
    category: 'commercial',
    tags: ['建筑', '现代'],
    stats: { likes: 123, comments: 19, views: 890 },
    isLiked: true,
    createdAt: '2024-01-11T09:30:00Z'
  },
  {
    id: 'work_006',
    userId: 'user_006',
    userName: '花卉摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    title: '春日樱花',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=650&fit=crop',
    imageWidth: 400,
    imageHeight: 650,
    category: 'art',
    tags: ['花卉', '春天'],
    stats: { likes: 78, comments: 15, views: 560 },
    isLiked: false,
    createdAt: '2024-01-10T11:15:00Z'
  },
  {
    id: 'work_007',
    userId: 'user_007',
    userName: '时尚摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    title: '都市时尚大片',
    coverImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop',
    imageWidth: 400,
    imageHeight: 500,
    category: 'portrait',
    tags: ['时尚', '都市'],
    stats: { likes: 245, comments: 32, views: 1500 },
    isLiked: true,
    createdAt: '2024-01-09T15:30:00Z'
  },
  {
    id: 'work_008',
    userId: 'user_008',
    userName: '风光大师',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    title: '日落金山',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    imageWidth: 400,
    imageHeight: 300,
    category: 'landscape',
    tags: ['日落', '山景'],
    stats: { likes: 189, comments: 28, views: 980 },
    isLiked: false,
    createdAt: '2024-01-08T18:45:00Z'
  },
  {
    id: 'work_009',
    userId: 'user_009',
    userName: '小清新女孩',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    title: '咖啡店的午后',
    coverImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=600&fit=crop',
    imageWidth: 400,
    imageHeight: 600,
    category: 'portrait',
    tags: ['咖啡', '文艺'],
    stats: { likes: 92, comments: 18, views: 650 },
    isLiked: false,
    createdAt: '2024-01-07T14:20:00Z'
  },
  {
    id: 'work_010',
    userId: 'user_010',
    userName: '建筑摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    title: '现代建筑线条',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=700&fit=crop',
    imageWidth: 400,
    imageHeight: 700,
    category: 'commercial',
    tags: ['建筑', '线条'],
    stats: { likes: 134, comments: 21, views: 890 },
    isLiked: true,
    createdAt: '2024-01-06T10:15:00Z'
  },
  {
    id: 'work_011',
    userId: 'user_011',
    userName: '宠物摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    title: '可爱的金毛',
    coverImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=450&fit=crop',
    imageWidth: 400,
    imageHeight: 450,
    category: 'art',
    tags: ['宠物', '可爱'],
    stats: { likes: 167, comments: 35, views: 1200 },
    isLiked: false,
    createdAt: '2024-01-05T16:30:00Z'
  },
  {
    id: 'work_012',
    userId: 'user_012',
    userName: '夜景专家',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    title: '城市霓虹夜',
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=550&fit=crop',
    imageWidth: 400,
    imageHeight: 550,
    category: 'street',
    tags: ['夜景', '霓虹'],
    stats: { likes: 203, comments: 41, views: 1350 },
    isLiked: true,
    createdAt: '2024-01-04T21:00:00Z'
  },
  {
    id: 'work_013',
    userId: 'user_013',
    userName: '婚纱摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    title: '海边婚纱照',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop',
    imageWidth: 400,
    imageHeight: 600,
    category: 'portrait',
    tags: ['婚纱', '海边'],
    stats: { likes: 312, comments: 56, views: 2100 },
    isLiked: false,
    createdAt: '2024-01-03T09:45:00Z'
  },
  {
    id: 'work_014',
    userId: 'user_014',
    userName: '美食摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    title: '精致下午茶',
    coverImage: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    imageWidth: 400,
    imageHeight: 400,
    category: 'commercial',
    tags: ['美食', '下午茶'],
    stats: { likes: 87, comments: 12, views: 540 },
    isLiked: false,
    createdAt: '2024-01-02T15:20:00Z'
  },
  {
    id: 'work_015',
    userId: 'user_015',
    userName: '旅行摄影师',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    title: '西藏雪山',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=750&fit=crop',
    imageWidth: 400,
    imageHeight: 750,
    category: 'landscape',
    tags: ['雪山', '西藏'],
    stats: { likes: 456, comments: 78, views: 3200 },
    isLiked: true,
    createdAt: '2024-01-01T08:00:00Z'
  },
  // 添加更多占位符作品，展示瀑布流效果
  ...Array.from({ length: 30 }, (_, index) => {
    const workId = `work_${String(index + 16).padStart(3, '0')}`;
    const userId = `user_${String((index % 15) + 1).padStart(3, '0')}`;

    // 更多样化的图片尺寸，确保瀑布流效果明显
    const heights = [280, 320, 380, 420, 480, 520, 580, 620, 680, 720, 780];
    const randomHeight = heights[Math.floor(Math.random() * heights.length)];

    const titles = [
      '城市街角光影', '温暖午后时光', '雨后的彩虹', '古建筑之美', '清新人像写真',
      '壮美自然风光', '经典黑白艺术', '色彩的碰撞', '光影的游戏', '情绪的表达',
      '建筑几何美学', '花卉微距特写', '可爱宠物萌照', '精致美食摄影', '旅行足迹记录',
      '夜景霓虹灯火', '日出日落时分', '云海奇观景色', '都市生活节奏', '静物美学艺术',
      '婚纱摄影作品', '儿童天真笑容', '老人岁月痕迹', '运动瞬间捕捉', '音乐会现场',
      '舞蹈优美身姿', '戏剧表演瞬间', '时装秀台风采', '产品商业摄影', '创意概念作品'
    ];

    const userNames = [
      '摄影新手', '光影追逐者', '色彩大师', '构图专家', '情感捕手',
      '自然爱好者', '都市探索者', '艺术创作者', '视觉设计师', '影像记录者',
      '风光摄影师', '人像专家', '街拍达人', '商业摄影师', '艺术摄影家'
    ];

    const categories = ['portrait', 'landscape', 'street', 'commercial', 'art', 'casual'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const tagsByCategory = {
      portrait: ['人像', '写真', '情感', '美女', '帅哥'],
      landscape: ['风光', '自然', '山景', '海景', '日落'],
      street: ['街拍', '都市', '生活', '瞬间', '故事'],
      commercial: ['商业', '产品', '品牌', '广告', '时尚'],
      art: ['艺术', '创意', '概念', '抽象', '实验'],
      casual: ['随手拍', '日常', '生活', '记录', '瞬间']
    };

    const randomTags = tagsByCategory[randomCategory] || ['摄影', '艺术'];
    const selectedTags = randomTags.slice(0, Math.floor(Math.random() * 3) + 1);

    return {
      id: workId,
      userId: userId,
      userName: userNames[index % userNames.length],
      userAvatar: `https://i.pravatar.cc/100?img=${(index % 50) + 1}`,
      title: titles[index % titles.length],
      coverImage: `https://picsum.photos/400/${randomHeight}?random=${index + 100}`,
      imageWidth: 400,
      imageHeight: randomHeight,
      category: randomCategory,
      tags: selectedTags,
      stats: {
        likes: Math.floor(Math.random() * 800) + 20,
        comments: Math.floor(Math.random() * 80) + 2,
        views: Math.floor(Math.random() * 3000) + 200
      },
      isLiked: Math.random() > 0.75,
      createdAt: new Date(Date.now() - (index + 16) * 3 * 60 * 60 * 1000).toISOString()
    };
  })
];

const mockPhotographers = [
  {
    id: 'user_001',
    name: '光影大师',
    avatar: '/static/avatars/photographer1.jpg',
    city: '上海',
    specialty: ['人像', '夜景'],
    worksCount: 45,
    followersCount: 1200,
    isVerified: true,
    rating: 4.8
  },
  {
    id: 'user_002',
    name: '自然之眼', 
    avatar: '/static/avatars/photographer2.jpg',
    city: '杭州',
    specialty: ['风光', '自然'],
    worksCount: 32,
    followersCount: 890,
    isVerified: true,
    rating: 4.9
  }
];

export default [
  {
    path: '/works',
    data: {
      list: mockWorks,
      total: mockWorks.length,
      hasMore: false
    }
  },
  {
    path: '/works/recommended',
    data: {
      list: mockWorks.slice(0, 10)
    }
  },
  {
    path: '/photographers/recommended',
    data: {
      list: mockPhotographers
    }
  }
];
