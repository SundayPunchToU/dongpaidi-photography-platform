// 约拍相关Mock数据
// 推荐栏目 - 约拍成功后的分享内容
const mockRecommendedShares = [
  {
    id: 'share_001',
    publisherId: 'user_030',
    publisherName: '小清新模特',
    publisherAvatar: '/static/avatars/model6.jpg',
    type: 'success_share',
    shareType: 'model_thanks', // 模特感谢摄影师
    title: '和摄影师大大的完美合作',
    feedText: '感谢 @光影大师 的专业拍摄！第一次拍夜景人像就有这么好的效果，摄影师很有耐心，指导我摆pose，灯光运用也很棒！期待下次合作～',
    timeText: '2024-02-28',
    previewImages: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop'
    ],
    totalImages: 25,
    location: {
      city: '上海',
      district: '外滩'
    },
    equipment: '夜景拍摄',
    collaborator: '光影大师',
    likes: 89,
    comments: 23,
    createdAt: '2024-02-28T20:30:00Z'
  },
  {
    id: 'share_002',
    publisherId: 'user_031',
    publisherName: '街拍摄影师',
    publisherAvatar: '/static/avatars/photographer8.jpg',
    type: 'success_share',
    shareType: 'photographer_praise', // 摄影师夸赞模特
    title: '遇到了超棒的模特',
    feedText: '今天和 @时尚小姐姐 合作拍摄街拍，模特表现力超强！每个pose都很到位，服装搭配也很有品味。这组片子效果太赞了！推荐给大家～',
    timeText: '2024-02-27',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop'
    ],
    totalImages: 18,
    location: {
      city: '深圳',
      district: '南山区'
    },
    equipment: 'Sony A7M4 + 35mm',
    collaborator: '时尚小姐姐',
    likes: 156,
    comments: 42,
    createdAt: '2024-02-27T16:45:00Z'
  },
  {
    id: 'share_003',
    publisherId: 'user_032',
    publisherName: '古风小仙女',
    publisherAvatar: '/static/avatars/model7.jpg',
    type: 'success_share',
    shareType: 'location_praise', // 对拍摄地点的认可
    title: '拙政园真的太美了',
    feedText: '苏州拙政园的古风拍摄太棒了！感谢 @古风摄影师 带我发现了这么多绝美的机位，每一个角度都像画一样。汉服和古典园林真的是绝配！',
    timeText: '2024-02-26',
    previewImages: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop'
    ],
    totalImages: 12,
    location: {
      city: '苏州',
      district: '拙政园'
    },
    equipment: '古典园林',
    collaborator: '古风摄影师',
    likes: 78,
    comments: 15,
    createdAt: '2024-02-26T14:20:00Z'
  },
  {
    id: 'share_004',
    publisherId: 'user_033',
    publisherName: '专业摄影师',
    publisherAvatar: '/static/avatars/photographer9.jpg',
    type: 'success_share',
    shareType: 'equipment_praise', // 对设备机位的认可
    title: '新设备首拍效果惊艳',
    feedText: '刚入手的Sony FX3第一次拍人像，效果太惊艳了！感谢 @舞蹈小姐姐 的完美配合，这个机位的动态捕捉能力真的强，每一帧都是大片！',
    timeText: '2024-02-25',
    previewImages: [
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop'
    ],
    totalImages: 16,
    location: {
      city: '广州',
      district: '天河区'
    },
    equipment: 'Sony FX3 + 专业灯光',
    collaborator: '舞蹈小姐姐',
    likes: 124,
    comments: 28,
    createdAt: '2024-02-25T19:30:00Z'
  },
  {
    id: 'share_005',
    publisherId: 'user_034',
    publisherName: '新手小白',
    publisherAvatar: '/static/avatars/model8.jpg',
    type: 'success_share',
    shareType: 'growth_share', // 成长分享
    title: '第一次约拍的美好回忆',
    feedText: '人生第一次约拍就遇到了这么好的摄影师！@耐心老师 真的超级有耐心，教了我很多拍照技巧。从紧张到放松，现在看到照片觉得自己美美哒～',
    timeText: '2024-02-24',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
    ],
    totalImages: 8,
    location: {
      city: '杭州',
      district: '西湖区'
    },
    equipment: '新手友好拍摄',
    collaborator: '耐心老师',
    likes: 45,
    comments: 12,
    createdAt: '2024-02-24T15:20:00Z'
  },
  {
    id: 'share_006',
    publisherId: 'user_035',
    publisherName: '海边女孩',
    publisherAvatar: '/static/avatars/model9.jpg',
    type: 'success_share',
    shareType: 'location_praise',
    title: '青岛日出太震撼了',
    feedText: '5点起床真的值了！青岛第一海水浴场的日出太震撼了！感谢 @风光大师 的专业指导，逆光剪影效果绝了。虽然冷但是拍出来的片子太美了！',
    timeText: '2024-02-23',
    previewImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
    ],
    totalImages: 22,
    location: {
      city: '青岛',
      district: '第一海水浴场'
    },
    equipment: 'Nikon D850 + 日出',
    collaborator: '风光大师',
    likes: 198,
    comments: 56,
    createdAt: '2024-02-23T18:45:00Z'
  }
];

const mockAppointments = [
  {
    id: 'appointment_001',
    publisherId: 'user_003',
    publisherName: '小清新模特',
    publisherAvatar: '/static/avatars/model1.jpg',
    type: 'model_seek_photographer',
    title: '寻找人像摄影师拍摄清新写真',
    description: '想拍一组清新自然的写真，希望找到有经验的人像摄影师合作。我比较喜欢日系风格，希望在户外或者有自然光的地方拍摄。',
    style: ['清新', '日系', '自然'],
    sampleImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=120&fit=crop'
    ],
    // 朋友圈风格展示数据
    feedText: '南宁约拍滴滴滴，找长期合作的互勉摄特，也接单',
    timeText: '2024-02-26',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop'
    ],
    totalImages: 15,
    equipment: 'Canon 5D4 + 85mm',
    budgetText: '500-800',
    likes: 35,
    location: {
      city: '北京',
      district: '朝阳区',
      address: '朝阳公园附近',
      latitude: 39.9388,
      longitude: 116.4574
    },
    schedule: {
      date: '2024-02-15',
      duration: 3,
      flexibility: true
    },
    budget: {
      min: 500,
      max: 800,
      negotiable: false
    },
    requirements: {
      experience: '有人像拍摄经验，作品风格清新',
      equipment: ['单反相机', '85mm镜头'],
      other: '希望摄影师能提供简单的后期修图'
    },
    status: 'open',
    applicants: ['user_001', 'user_004'],
    applicantCount: 2,
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'appointment_002',
    publisherId: 'user_001',
    publisherName: '光影大师',
    publisherAvatar: '/static/avatars/photographer1.jpg',
    type: 'photographer_seek_model',
    title: '寻找模特拍摄夜景人像大片',
    description: '计划拍摄一组城市夜景人像作品，需要有经验的模特配合。拍摄地点在外滩，主要利用城市灯光营造氛围。',
    style: ['夜景', '都市', '时尚'],
    sampleImages: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop'
    ],
    // 朋友圈风格展示数据
    feedText: '上海外滩夜景人像约拍，寻找有经验的时尚模特合作。主要拍摄都市夜景风格，利用城市霓虹灯光营造氛围感。',
    timeText: '2024-02-26',
    previewImages: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop'
    ],
    totalImages: 8,
    equipment: 'Sony A7R4 + 24-70mm',
    budgetText: '1000-1500',
    likes: 28,
    location: {
      city: '上海',
      district: '黄浦区', 
      address: '外滩',
      latitude: 31.2304,
      longitude: 121.4737
    },
    schedule: {
      date: '2024-02-18',
      duration: 4,
      flexibility: false
    },
    budget: {
      min: 1000,
      max: 1500,
      negotiable: true
    },
    requirements: {
      experience: '有夜景拍摄经验，不怕冷',
      equipment: [],
      other: '需要自备服装道具，提供化妆'
    },
    status: 'open',
    applicants: ['user_005'],
    applicantCount: 1,
    createdAt: '2024-01-22T14:20:00Z'
  },
  {
    id: 'appointment_003',
    publisherId: 'user_006',
    publisherName: '小清新模特',
    publisherAvatar: '/static/avatars/model2.jpg',
    type: 'model_seek_photographer',
    title: '寻找擅长日系风格的摄影师',
    description: '想拍一组日系清新风格的写真，希望在公园或者咖啡厅这样的场景拍摄。我比较喜欢自然光，不要太浓重的妆容。',
    style: ['日系', '清新', '自然光'],
    // 朋友圈风格展示数据
    feedText: '北京约拍，寻找擅长日系风格的摄影师。希望在中关村公园拍摄清新自然的写真，喜欢自然光效果。',
    timeText: '2024-02-23',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop'
    ],
    totalImages: 5,
    equipment: '自然光拍摄',
    budgetText: '300-600',
    likes: 12,
    location: {
      city: '北京',
      district: '海淀区',
      address: '中关村公园',
      latitude: 39.9788,
      longitude: 116.3103
    },
    schedule: {
      date: '2024-02-20',
      duration: 2,
      flexibility: true
    },
    budget: {
      min: 300,
      max: 600,
      negotiable: true
    },
    requirements: {
      experience: '有日系风格拍摄经验',
      equipment: ['相机', '自然光'],
      other: '希望能提供简单指导'
    },
    status: 'open',
    applicants: ['user_007', 'user_008'],
    applicantCount: 2,
    createdAt: '2024-01-23T09:15:00Z'
  },
  {
    id: 'appointment_004',
    publisherId: 'user_009',
    publisherName: '商业摄影师',
    publisherAvatar: '/static/avatars/photographer3.jpg',
    type: 'photographer_seek_model',
    title: '寻找时尚模特拍摄商业大片',
    description: '为品牌拍摄一组时尚商业大片，需要有经验的时尚模特。拍摄风格偏向欧美时尚，需要模特有良好的镜头感和表现力。',
    style: ['时尚', '商业', '欧美'],
    sampleImages: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=120&fit=crop'
    ],
    // 朋友圈风格展示数据
    feedText: '上海静安区专业摄影棚约拍，为知名品牌拍摄时尚商业大片。寻找有经验的时尚模特，要求身高165cm以上，有良好镜头感。',
    timeText: '2024-02-24',
    previewImages: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop'
    ],
    totalImages: 3,
    equipment: '专业摄影棚 + 全套灯光',
    budgetText: '2000-3000',
    likes: 18,
    location: {
      city: '上海',
      district: '静安区',
      address: '专业摄影棚',
      latitude: 31.2252,
      longitude: 121.4581
    },
    schedule: {
      date: '2024-02-25',
      duration: 6,
      flexibility: false
    },
    budget: {
      min: 2000,
      max: 3000,
      negotiable: false
    },
    requirements: {
      experience: '有商业拍摄经验，身高165cm以上',
      equipment: [],
      other: '提供专业化妆师和造型师'
    },
    status: 'open',
    applicants: ['user_010'],
    applicantCount: 1,
    createdAt: '2024-01-24T16:30:00Z'
  },
  {
    id: 'appointment_005',
    publisherId: 'user_011',
    publisherName: '古风爱好者',
    publisherAvatar: '/static/avatars/model3.jpg',
    type: 'model_seek_photographer',
    title: '寻找古风摄影师拍摄汉服写真',
    description: '想拍一组古风汉服写真，地点希望在古典园林或者古建筑。我有自己的汉服，希望摄影师能营造出古典雅致的氛围。',
    style: ['古风', '汉服', '古典'],
    location: {
      city: '苏州',
      district: '姑苏区',
      address: '拙政园',
      latitude: 31.3239,
      longitude: 120.6194
    },
    schedule: {
      date: '2024-03-01',
      duration: 4,
      flexibility: true
    },
    budget: {
      min: 800,
      max: 1200,
      negotiable: true
    },
    requirements: {
      experience: '有古风拍摄经验',
      equipment: ['古风道具', '反光板'],
      other: '希望能协助选景'
    },
    status: 'open',
    applicants: [],
    applicantCount: 0,
    createdAt: '2024-01-25T11:45:00Z',
    // 朋友圈风格展示数据
    feedText: '苏州拙政园古风汉服约拍，寻找有古风拍摄经验的摄影师。我有自己的汉服，希望能营造古典雅致的氛围。',
    timeText: '2024-03-01',
    previewImages: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop'
    ],
    totalImages: 8,
    equipment: '古风道具 + 反光板',
    budgetText: '800-1200',
    likes: 22
  },
  {
    id: 'appointment_006',
    publisherId: 'user_012',
    publisherName: '街拍摄影师',
    publisherAvatar: '/static/avatars/photographer4.jpg',
    type: 'photographer_seek_model',
    title: '寻找街拍模特拍摄都市风格',
    description: '计划在城市街头拍摄一组都市街拍作品，需要有街拍经验的模特。主要在商业区和艺术区拍摄，展现都市女性的独立魅力。',
    style: ['街拍', '都市', '时尚'],
    location: {
      city: '深圳',
      district: '南山区',
      address: '海岸城周边',
      latitude: 22.5193,
      longitude: 113.9347
    },
    schedule: {
      date: '2024-02-28',
      duration: 3,
      flexibility: true
    },
    budget: {
      min: 600,
      max: 1000,
      negotiable: true
    },
    requirements: {
      experience: '有街拍经验，穿搭时尚',
      equipment: [],
      other: '需要自备2-3套服装'
    },
    status: 'open',
    applicants: ['user_013', 'user_014', 'user_015'],
    applicantCount: 3,
    createdAt: '2024-01-26T13:20:00Z',
    // 朋友圈风格展示数据
    feedText: '深圳海岸城街拍约拍，寻找有街拍经验的时尚模特。主要在商业区和艺术区拍摄，展现都市女性独立魅力。',
    timeText: '2024-02-28',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop'
    ],
    totalImages: 18,
    equipment: 'Sony A7M4 + 35mm',
    budgetText: '600-1000',
    likes: 25
  },
  {
    id: 'appointment_007',
    publisherId: 'user_016',
    publisherName: '新手模特',
    publisherAvatar: '/static/avatars/model4.jpg',
    type: 'model_seek_photographer',
    title: '新手模特寻找耐心摄影师',
    description: '我是摄影新手，希望找到一位耐心的摄影师帮我拍摄第一组写真。希望能在拍摄过程中给我一些指导和建议。',
    style: ['新手', '学习', '简约'],
    location: {
      city: '杭州',
      district: '西湖区',
      address: '西湖公园',
      latitude: 30.2741,
      longitude: 120.1551
    },
    schedule: {
      date: '2024-03-05',
      duration: 2,
      flexibility: true
    },
    budget: {
      min: 200,
      max: 400,
      negotiable: true
    },
    requirements: {
      experience: '有耐心，愿意指导新手',
      equipment: ['基础设备即可'],
      other: '希望能教我一些拍照技巧'
    },
    status: 'open',
    applicants: ['user_017'],
    applicantCount: 1,
    createdAt: '2024-01-27T10:30:00Z',
    // 朋友圈风格展示数据
    feedText: '杭州西湖约拍，新手模特寻找耐心摄影师。希望能在拍摄过程中给我指导和建议，一起学习进步！',
    timeText: '2024-03-05',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
    ],
    totalImages: 2,
    equipment: '基础设备即可',
    budgetText: '200-400',
    likes: 8
  },
  {
    id: 'appointment_008',
    publisherId: 'user_018',
    publisherName: '风光摄影师',
    publisherAvatar: '/static/avatars/photographer5.jpg',
    type: 'photographer_seek_model',
    title: '寻找模特拍摄海边日出大片',
    description: '计划在海边拍摄日出主题的人像作品，需要能早起的模特配合。主要拍摄剪影和逆光效果，营造唯美的氛围。',
    style: ['日出', '海边', '逆光'],
    sampleImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=120&fit=crop'
    ],
    // 朋友圈风格展示数据
    feedText: '青岛海边日出约拍，寻找能早起的模特合作。主要拍摄剪影和逆光效果，营造唯美氛围。需要5点起床哦！',
    timeText: '2024-02-28',
    previewImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop'
    ],
    totalImages: 12,
    equipment: 'Nikon D850 + 70-200mm',
    budgetText: '800-1200',
    likes: 42,
    location: {
      city: '青岛',
      district: '市南区',
      address: '第一海水浴场',
      latitude: 36.0671,
      longitude: 120.3826
    },
    schedule: {
      date: '2024-03-08',
      duration: 3,
      flexibility: false
    },
    budget: {
      min: 800,
      max: 1200,
      negotiable: true
    },
    requirements: {
      experience: '能早起，不怕冷',
      equipment: [],
      other: '需要5点起床，提供早餐'
    },
    status: 'open',
    applicants: ['user_019'],
    applicantCount: 1,
    createdAt: '2024-01-28T20:15:00Z'
  },
  {
    id: 'appointment_009',
    publisherId: 'user_020',
    publisherName: '舞蹈老师',
    publisherAvatar: '/static/avatars/model5.jpg',
    type: 'model_seek_photographer',
    title: '寻找摄影师拍摄舞蹈主题写真',
    description: '我是专业舞蹈老师，想拍一组展现舞蹈美感的写真。希望摄影师能捕捉到舞蹈的动态美和力量感。',
    style: ['舞蹈', '动态', '艺术'],
    location: {
      city: '广州',
      district: '天河区',
      address: '舞蹈工作室',
      latitude: 23.1291,
      longitude: 113.2644
    },
    schedule: {
      date: '2024-03-10',
      duration: 4,
      flexibility: true
    },
    budget: {
      min: 1000,
      max: 1500,
      negotiable: false
    },
    requirements: {
      experience: '有动态拍摄经验',
      equipment: ['高速快门相机'],
      other: '工作室有专业灯光设备'
    },
    status: 'open',
    applicants: ['user_021', 'user_022'],
    applicantCount: 2,
    createdAt: '2024-01-29T14:00:00Z',
    // 朋友圈风格展示数据
    feedText: '广州天河区舞蹈工作室约拍，专业舞蹈老师寻找摄影师合作。希望能捕捉舞蹈的动态美和力量感，工作室有专业灯光设备。',
    timeText: '2024-03-10',
    previewImages: [
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=200&h=200&fit=crop'
    ],
    totalImages: 6,
    equipment: '工作室专业灯光',
    budgetText: '1000-1500',
    likes: 15
  },
  {
    id: 'appointment_010',
    publisherId: 'user_023',
    publisherName: '花匠',
    publisherAvatar: '/static/avatars/photographer6.jpg',
    type: 'photographer_seek_model',
    title: '花园主题约拍寻找模特',
    description: '在花园中拍摄一组浪漫唯美的写真作品，需要气质清新的模特配合。主要利用花卉和自然光营造梦幻效果。',
    style: ['花园', '浪漫', '唯美'],
    // 朋友圈风格展示数据
    feedText: '南宁约拍滴滴滴，找长期合作的互勉摄特，也接单',
    timeText: '2024-02-26',
    previewImages: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop'
    ],
    totalImages: 35,
    equipment: 'Canon EOS R5',
    budgetText: '互勉',
    likes: 35,
    location: {
      city: '南宁',
      district: '青秀区',
      address: '南湖公园',
      latitude: 22.8167,
      longitude: 108.3669
    },
    schedule: {
      date: '2024-03-15',
      duration: 4,
      flexibility: true
    },
    budget: {
      min: 0,
      max: 0,
      negotiable: true
    },
    requirements: {
      experience: '气质清新，配合度高',
      equipment: [],
      other: '互勉合作，共同进步'
    },
    status: 'open',
    applicants: ['user_024', 'user_025'],
    applicantCount: 10
  },
  {
    id: 'appointment_011',
    publisherId: 'user_026',
    publisherName: 'IV.3vil Photograph',
    publisherAvatar: '/static/avatars/photographer7.jpg',
    type: 'photographer_seek_model',
    title: '工业风格主题约拍',
    description: '在废弃工厂或工业场景拍摄一组暗黑工业风格的作品，需要有个性的模特配合。主要营造神秘、力量感的视觉效果。',
    style: ['工业风', '暗黑', '个性'],
    // 朋友圈风格展示数据
    feedText: '工业废墟风格约拍，寻找有个性的模特合作。在废弃工厂营造暗黑神秘的氛围，展现不一样的视觉冲击。',
    timeText: '2024-02-26',
    previewImages: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop'
    ],
    totalImages: 8,
    equipment: 'Canon 5D4 + 24-70mm',
    budgetText: '1200-1800',
    likes: 56,
    location: {
      city: '北京',
      district: '朝阳区',
      address: '798艺术区',
      latitude: 39.9888,
      longitude: 116.4963
    },
    schedule: {
      date: '2024-03-12',
      duration: 5,
      flexibility: true
    },
    budget: {
      min: 1200,
      max: 1800,
      negotiable: true
    },
    requirements: {
      experience: '有个性，不怕脏',
      equipment: [],
      other: '提供工业风服装建议'
    },
    status: 'open',
    applicants: ['user_027', 'user_028', 'user_029'],
    applicantCount: 8
  }
];

export default [
  {
    path: '/appointments',
    data: {
      list: mockAppointments,
      total: mockAppointments.length,
      hasMore: false
    }
  },
  {
    path: '/appointments/recommended',
    data: {
      list: mockRecommendedShares,
      total: mockRecommendedShares.length,
      hasMore: false
    }
  },
  {
    path: '/appointments/my',
    data: {
      published: mockAppointments.filter(item => item.publisherId === 'current_user'),
      applied: mockAppointments.filter(item => item.applicants.includes('current_user'))
    }
  }
];
