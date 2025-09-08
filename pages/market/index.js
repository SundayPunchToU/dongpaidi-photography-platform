// 相机市场页面 - 推荐相机、相机交易、相机租赁
Page({
  data: {
    // 当前选中的标签页
    activeTab: 0,
    tabs: [
      { id: 'recommend', name: '推荐相机' },
      { id: 'trade', name: '相机交易' },
      { id: 'rental', name: '相机租赁' }
    ],

    // 推荐相机数据
    recommendedCameras: [],

    // 相机交易数据
    tradeCameras: [],

    // 相机租赁数据
    rentalCameras: [],

    loading: true,
    searchKeyword: ''
  },

  onLoad() {
    this.initMarketData();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'market'
      });
    }
  },

  // 标签页切换
  onTabChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ activeTab: index });
  },

  // 初始化市场数据
  initMarketData() {
    this.setData({ loading: true });

    // 推荐相机数据 - 热门和新品推荐
    const recommendedCameras = [
      {
        id: 'rec_001',
        name: 'Canon EOS R5 全画幅微单',
        price: 25800,
        originalPrice: 28800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop&q=95',
        brand: 'Canon',
        rating: 4.9,
        reviewCount: 1256,
        tags: ['全画幅', '8K视频', '专业级', '热门'],
        features: ['4500万像素', '8K RAW内录', '8档机身防抖', '双CFexpress卡槽', '1053点对焦系统', '12fps连拍'],
        reason: '专业摄影师首选，风光人像双绝，8K视频内录开创先河'
      },
      {
        id: 'rec_002',
        name: 'Sony A7R V 全画幅微单',
        price: 26800,
        originalPrice: 29800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&h=400&fit=crop&q=95',
        brand: 'Sony',
        rating: 4.8,
        reviewCount: 892,
        tags: ['全画幅', '6100万像素', '新品', '高解析'],
        features: ['6100万像素', '8档机身防抖', '693点相位检测', '4K 60p视频', '像素位移拍摄', '双卡槽'],
        reason: '超高像素传感器，风光摄影的终极利器，每一个细节都纤毫毕现'
      },
      {
        id: 'rec_003',
        name: 'Nikon Z9 全画幅微单',
        price: 32800,
        originalPrice: 35800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop&q=95',
        brand: 'Nikon',
        rating: 4.9,
        reviewCount: 567,
        tags: ['全画幅', '旗舰', '无裁切8K', '专业'],
        features: ['4571万像素', '8K 30p无裁切', '493点混合对焦', '双CFexpress Type B', '120fps连拍', '内置竖拍手柄'],
        reason: '尼康百年技艺的集大成者，野生动物和体育摄影的王者之选'
      },
      {
        id: 'rec_004',
        name: 'Fujifilm X-T5 APS-C微单',
        price: 11800,
        originalPrice: 13800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop&q=95',
        brand: 'Fujifilm',
        rating: 4.7,
        reviewCount: 423,
        tags: ['APS-C', '胶片模拟', '复古', '街拍'],
        features: ['4020万像素', '19种胶片模拟', '7档机身防抖', '4K 60p视频', '三向翻折屏', '双卡槽'],
        reason: '富士胶片百年传承，街拍文艺青年的心头好，每一张都有胶片的温度'
      },
      {
        id: 'rec_005',
        name: 'Leica Q2 全画幅便携',
        price: 38800,
        originalPrice: 42800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=600&h=400&fit=crop&q=95',
        brand: 'Leica',
        rating: 4.9,
        reviewCount: 156,
        tags: ['全画幅', '便携', '徕卡', '奢华'],
        features: ['4730万像素', '28mm f/1.7 Summilux', '德国手工制造', '经典红点设计', '4K视频', '防尘防滴'],
        reason: '德系精工典范，街拍艺术家的终极选择，每一张都是艺术品'
      },
      {
        id: 'rec_006',
        name: 'Hasselblad X2D 100C 中画幅',
        price: 58800,
        originalPrice: 65800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop&q=95',
        brand: 'Hasselblad',
        rating: 5.0,
        reviewCount: 89,
        tags: ['中画幅', '1亿像素', '顶级', '商业'],
        features: ['1亿像素', '16bit色彩深度', '15档动态范围', '瑞典制造', '模块化设计', 'CFexpress Type B'],
        reason: '中画幅王者，商业摄影的终极武器，色彩科学的巅峰之作'
      },
      {
        id: 'rec_007',
        name: 'Phase One XF IQ4 150MP',
        price: 128800,
        originalPrice: 148800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop&q=95',
        brand: 'Phase One',
        rating: 5.0,
        reviewCount: 23,
        tags: ['中画幅', '1.5亿像素', '顶级', '艺术'],
        features: ['1.5亿像素', '16bit RAW', '15档动态范围', '丹麦制造', '模块化系统', 'IQ4数字后背'],
        reason: '摄影界的劳斯莱斯，艺术创作的终极工具，每一帧都是传世之作'
      },
      {
        id: 'rec_008',
        name: 'Pentax K-1 Mark II 全画幅单反',
        price: 12800,
        originalPrice: 15800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop&q=95',
        brand: 'Pentax',
        rating: 4.6,
        reviewCount: 234,
        tags: ['全画幅', '单反', '防护', '性价比'],
        features: ['3640万像素', '5轴机身防抖', '防尘防滴', '像素位移', '双卡槽', '天体追踪'],
        reason: '理光宾得的匠心之作，风光摄影师的秘密武器，极致性价比'
      },
      {
        id: 'rec_009',
        name: 'Olympus OM-1 M43旗舰',
        price: 16800,
        originalPrice: 19800,
        type: 'recommend',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=600&h=400&fit=crop&q=95',
        brand: 'Olympus',
        rating: 4.7,
        reviewCount: 345,
        tags: ['M43', '便携', '防护', '鸟类'],
        features: ['2037万像素', '8.5档防抖', 'IP53防护', '1053点对焦', '120fps连拍', '计算摄影'],
        reason: 'M43系统的集大成者，野生动物摄影的轻量化解决方案'
      }
    ];

    // 相机交易数据 - 二手和全新相机买卖
    const tradeCameras = [
      {
        id: 'trade_001',
        name: 'Canon EOS 5D Mark IV 二手',
        price: 12800,
        originalPrice: 18800,
        condition: '95新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=95',
        seller: '摄影师小王',
        sellerRating: 4.9,
        location: '北京·朝阳区',
        tags: ['二手', '95新', '全画幅', '包装齐全'],
        features: ['3040万像素', '4K视频', '双卡槽', '61点对焦'],
        description: '个人自用，成色很新，配件齐全，支持当面验货',
        publishTime: '2小时前'
      },
      {
        id: 'trade_002',
        name: 'Fujifilm X-T5 全新未拆封',
        price: 9800,
        originalPrice: 11800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        seller: '器材商城',
        sellerRating: 5.0,
        location: '上海·浦东新区',
        tags: ['全新', '未拆封', 'APS-C', '胶片模拟'],
        features: ['4020万像素', '胶片模拟', '5轴防抖', '4K 60p'],
        description: '全新未拆封，支持7天无理由退换，全国联保',
        publishTime: '1天前'
      },
      {
        id: 'trade_003',
        name: 'Sony A7 III 二手套机',
        price: 8800,
        originalPrice: 15800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        seller: '摄影工作室',
        sellerRating: 4.8,
        location: '广州·天河区',
        tags: ['二手', '9成新', '套机', '28-70mm'],
        features: ['2420万像素', '693点对焦', '5轴防抖', '4K视频'],
        description: '工作室升级设备，诚心出售，含28-70mm镜头',
        publishTime: '3小时前'
      },
      {
        id: 'trade_004',
        name: 'Canon R6 Mark II 全新',
        price: 15800,
        originalPrice: 17800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=95',
        seller: '佳能授权店',
        sellerRating: 5.0,
        location: '深圳·南山区',
        tags: ['全新', '行货', '联保', '热门'],
        features: ['2420万像素', '8档防抖', '4K 60p', '双卡槽'],
        description: '佳能官方授权经销商，全新行货，三年质保',
        publishTime: '5小时前'
      },
      {
        id: 'trade_005',
        name: 'Nikon Z6 III 二手机身',
        price: 12800,
        originalPrice: 16800,
        condition: '8成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        seller: '尼康摄影工作室',
        sellerRating: 4.8,
        location: '广州·天河区',
        tags: ['二手', '8成新', '机身', '工作室'],
        features: ['2450万像素', '5轴防抖', '4K 120p', '双卡槽'],
        description: '工作室升级设备，诚心出售，使用痕迹轻微',
        publishTime: '3小时前'
      },
      {
        id: 'trade_006',
        name: 'Leica Q2 Monochrom',
        price: 42800,
        originalPrice: 48800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400&h=300&fit=crop&q=95',
        seller: '徕卡收藏家',
        sellerRating: 5.0,
        location: '北京·海淀区',
        tags: ['二手', '黑白', '收藏级', '稀有'],
        features: ['4730万像素', '黑白传感器', '28mm f/1.7', '德国制造'],
        description: '黑白专用版本，收藏级成色，附原装配件',
        publishTime: '1天前'
      },
      {
        id: 'trade_007',
        name: 'Sony A7C 紧凑全画幅',
        price: 9800,
        originalPrice: 13800,
        condition: '8成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        seller: '旅行摄影师小美',
        sellerRating: 4.8,
        location: '厦门·思明区',
        tags: ['二手', '紧凑', '旅行', '轻便'],
        features: ['2420万像素', '5轴防抖', '紧凑机身', '翻转屏'],
        description: '旅行专用相机，轻便好用，女生也能轻松驾驭',
        publishTime: '1天前'
      },
      {
        id: 'trade_008',
        name: 'Olympus OM-1 黑色',
        price: 13800,
        originalPrice: 16800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        seller: '奥林巴斯专卖店',
        sellerRating: 4.8,
        location: '杭州·西湖区',
        tags: ['全新', 'M43', '防护', '鸟类'],
        features: ['2037万像素', '8.5档防抖', 'IP53防护', '120fps'],
        description: '全新M43旗舰，野生动物摄影利器',
        publishTime: '8小时前'
      },
      {
        id: 'trade_009',
        name: 'Pentax K-1 II 单反',
        price: 8800,
        originalPrice: 12800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        seller: '风光摄影师老张',
        sellerRating: 4.7,
        location: '西安·雁塔区',
        tags: ['二手', '单反', '防护', '风光'],
        features: ['3640万像素', '5轴防抖', '防尘防滴', '像素位移'],
        description: '风光摄影专用，防护性能出色，成色很好',
        publishTime: '12小时前'
      },
      {
        id: 'trade_010',
        name: 'Canon EOS R 入门套机',
        price: 7800,
        originalPrice: 12800,
        condition: '8成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop&q=95',
        seller: '摄影新手小李',
        sellerRating: 4.6,
        location: '成都·锦江区',
        tags: ['二手', '入门', '套机', '性价比'],
        features: ['3030万像素', '全画幅', '24-105mm镜头', '翻转屏'],
        description: '新手入门首选，含24-105镜头，成色良好',
        publishTime: '6小时前'
      },
      {
        id: 'trade_011',
        name: 'Sony A7R IV 高像素',
        price: 16800,
        originalPrice: 23800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        seller: '商业摄影师',
        sellerRating: 4.9,
        location: '上海·徐汇区',
        tags: ['二手', '高像素', '商业', '风光'],
        features: ['6100万像素', '567点对焦', '5轴防抖', '4K视频'],
        description: '商业摄影专用，超高像素，细节丰富',
        publishTime: '4小时前'
      },
      {
        id: 'trade_012',
        name: 'Fujifilm X-H2S 视频机',
        price: 14800,
        originalPrice: 17800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        seller: '富士影像专营店',
        sellerRating: 4.9,
        location: '北京·西城区',
        tags: ['全新', '视频', 'APS-C', '专业'],
        features: ['2616万像素', '6.2K视频', '40fps连拍', '双卡槽'],
        description: '视频拍摄专业机型，全新行货，两年保修',
        publishTime: '10小时前'
      },
      {
        id: 'trade_013',
        name: 'Nikon D850 经典单反',
        price: 9800,
        originalPrice: 16800,
        condition: '8成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        seller: '单反爱好者',
        sellerRating: 4.7,
        location: '天津·和平区',
        tags: ['二手', '单反', '经典', '高像素'],
        features: ['4575万像素', '153点对焦', '4K视频', '双卡槽'],
        description: '尼康经典高像素单反，成色良好，快门数较低',
        publishTime: '1天前'
      },
      {
        id: 'trade_014',
        name: 'Canon EOS RP 入门全画幅',
        price: 5800,
        originalPrice: 8800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        seller: '学生摄影师',
        sellerRating: 4.5,
        location: '南京·鼓楼区',
        tags: ['二手', '入门', '全画幅', '学生'],
        features: ['2620万像素', '全画幅', '轻便', '翻转屏'],
        description: '学生党首选，全画幅入门机，价格实惠',
        publishTime: '2天前'
      },
      {
        id: 'trade_015',
        name: 'Sony A6700 APS-C新品',
        price: 7800,
        originalPrice: 9800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        seller: '索尼专卖店',
        sellerRating: 5.0,
        location: '深圳·福田区',
        tags: ['全新', 'APS-C', '视频', '性价比'],
        features: ['2600万像素', '5轴防抖', '4K 120p', 'AI对焦'],
        description: '最新APS-C机型，视频功能强大，全新行货',
        publishTime: '6小时前'
      },
      {
        id: 'trade_016',
        name: 'Fujifilm X-Pro3 胶片风',
        price: 8800,
        originalPrice: 12800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        seller: '胶片摄影师',
        sellerRating: 4.8,
        location: '苏州·姑苏区',
        tags: ['二手', '胶片风', '旁轴', '文艺'],
        features: ['2610万像素', '胶片模拟', '隐藏屏幕', '防护'],
        description: '胶片风格专业机，文艺青年最爱，成色很好',
        publishTime: '8小时前'
      },
      {
        id: 'trade_017',
        name: 'Panasonic S5 II 全画幅',
        price: 11800,
        originalPrice: 15800,
        condition: '全新',
        type: 'new',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        seller: '松下影像专营',
        sellerRating: 4.7,
        location: '重庆·渝中区',
        tags: ['全新', '全画幅', '视频', '性价比'],
        features: ['2420万像素', '5轴防抖', '6K视频', '双卡槽'],
        description: '性价比全画幅新选择，视频功能出色',
        publishTime: '12小时前'
      },
      {
        id: 'trade_018',
        name: 'Canon EOS 6D Mark II',
        price: 6800,
        originalPrice: 11800,
        condition: '8成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400&h=300&fit=crop&q=95',
        seller: '摄影爱好者老刘',
        sellerRating: 4.6,
        location: '青岛·市南区',
        tags: ['二手', '全画幅', '入门', '单反'],
        features: ['2620万像素', '45点对焦', '翻转屏', 'WiFi'],
        description: '全画幅入门单反，操控简单，适合新手',
        publishTime: '1天前'
      },
      {
        id: 'trade_019',
        name: 'Sony A7S III 视频专业',
        price: 19800,
        originalPrice: 25800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        seller: '视频制作公司',
        sellerRating: 4.9,
        location: '广州·番禺区',
        tags: ['二手', '视频', '专业', '低光'],
        features: ['1210万像素', '4K 120p', '15档动态范围', '双卡槽'],
        description: '视频拍摄专业机型，低光性能出色，公司升级出售',
        publishTime: '2天前'
      },
      {
        id: 'trade_020',
        name: 'Nikon Z5 入门全画幅',
        price: 6800,
        originalPrice: 9800,
        condition: '9成新',
        type: 'used',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        seller: '摄影初学者',
        sellerRating: 4.4,
        location: '长沙·岳麓区',
        tags: ['二手', '入门', '全画幅', '性价比'],
        features: ['2432万像素', '5轴防抖', '4K视频', '双卡槽'],
        description: '全画幅入门首选，价格实惠，成色不错',
        publishTime: '3天前'
      }
    ];

    // 相机租赁数据 - 以高端相机、大疆、影石、运动相机、无人机为主
    const rentalCameras = [
      {
        id: 'rent_001',
        name: 'Sony FX3 电影机套装',
        price: 480,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        shop: '专业影像租赁',
        shopRating: 4.9,
        location: '北京·朝阳区',
        tags: ['电影机', '专业', '视频', '全画幅'],
        features: ['1210万像素', '4K 120p', 'S-Log3', '双卡槽', '专业套装'],
        rentalPeriod: '1天起租',
        deposit: 12000,
        rentCount: 89,
        description: '专业电影拍摄设备，含监视器、稳定器、三脚架全套配件'
      },
      {
        id: 'rent_002',
        name: 'DJI Ronin 4D 一体机',
        price: 680,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        shop: '大疆专业租赁',
        shopRating: 5.0,
        location: '深圳·南山区',
        tags: ['大疆', '一体机', '稳定器', '专业'],
        features: ['6K ProRes RAW', '4轴稳定器', 'LiDAR对焦', '无线图传'],
        rentalPeriod: '1天起租',
        deposit: 18000,
        rentCount: 156,
        description: '大疆最新一体化电影机，集成稳定器和无线图传系统'
      },
      {
        id: 'rent_003',
        name: 'Insta360 X3 全景相机',
        price: 120,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        shop: '影石设备租赁',
        shopRating: 4.8,
        location: '上海·浦东新区',
        tags: ['影石', '全景', 'VR', '创意'],
        features: ['5.7K 360°视频', '防水设计', 'AI剪辑', '实时拼接'],
        rentalPeriod: '1天起租',
        deposit: 2500,
        rentCount: 234,
        description: '360度全景拍摄，VR内容创作首选，含专业三脚架'
      },
      {
        id: 'rent_004',
        name: 'GoPro Hero 12 Black',
        price: 80,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400&h=300&fit=crop&q=95',
        shop: '极限运动器材',
        shopRating: 4.7,
        location: '广州·天河区',
        tags: ['运动相机', 'GoPro', '防水', '极限'],
        features: ['2700万像素', '5.3K视频', '超强防抖', '10米防水'],
        rentalPeriod: '1天起租',
        deposit: 1500,
        rentCount: 445,
        description: '极限运动专用，超强防抖防水，含丰富配件包'
      },
      {
        id: 'rent_005',
        name: 'DJI Mini 4 Pro 无人机',
        price: 200,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        shop: '大疆无人机租赁',
        shopRating: 4.9,
        location: '杭州·西湖区',
        tags: ['大疆', '无人机', '航拍', '便携'],
        features: ['4K HDR视频', '34分钟续航', '避障系统', '10公里图传'],
        rentalPeriod: '1天起租',
        deposit: 4000,
        rentCount: 678,
        description: '便携航拍无人机，4K HDR拍摄，含备用电池和收纳包'
      },
      {
        id: 'rent_006',
        name: 'Canon EOS R5 C 电影机',
        price: 520,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=95',
        shop: '佳能专业租赁',
        shopRating: 4.8,
        location: '北京·海淀区',
        tags: ['佳能', '电影机', '8K', '专业'],
        features: ['4500万像素', '8K RAW内录', 'Canon Log 3', '主动散热'],
        rentalPeriod: '1天起租',
        deposit: 15000,
        rentCount: 78,
        description: '佳能旗舰电影机，8K内录，专业视频制作首选'
      },
      {
        id: 'rent_007',
        name: 'DJI Action 4 运动相机',
        price: 60,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        shop: '大疆运动设备',
        shopRating: 4.7,
        location: '深圳·福田区',
        tags: ['大疆', '运动相机', '防水', '小巧'],
        features: ['4K 120fps', '超强防抖', '10米防水', '磁吸设计'],
        rentalPeriod: '1天起租',
        deposit: 1200,
        rentCount: 567,
        description: '大疆运动相机，磁吸设计，含多种运动配件'
      },
      {
        id: 'rent_008',
        name: 'Insta360 ONE RS 模块化',
        price: 150,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        shop: '影石创新租赁',
        shopRating: 4.8,
        location: '上海·静安区',
        tags: ['影石', '模块化', '全景', '运动'],
        features: ['6K全景', '4K广角', '1英寸传感器', '模块化设计'],
        rentalPeriod: '1天起租',
        deposit: 2800,
        rentCount: 234,
        description: '模块化设计，可切换全景和广角镜头，创意拍摄利器'
      },
      {
        id: 'rent_009',
        name: 'DJI Mavic 3 Pro 无人机',
        price: 350,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        shop: '大疆航拍租赁',
        shopRating: 5.0,
        location: '成都·高新区',
        tags: ['大疆', '无人机', '航拍', '三摄'],
        features: ['4/3 CMOS', '5.1K视频', '46分钟续航', '15公里图传'],
        rentalPeriod: '1天起租',
        deposit: 8000,
        rentCount: 345,
        description: '大疆旗舰无人机，三摄系统，专业航拍首选'
      },
      {
        id: 'rent_010',
        name: 'Canon C70 摄像机套装',
        price: 450,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=95',
        shop: '佳能影像中心',
        shopRating: 4.8,
        location: '上海·静安区',
        tags: ['摄像机', '专业', 'RF卡口', '紧凑'],
        features: ['Super35传感器', '4K 120p', 'Canon Log', 'RF镜头'],
        rentalPeriod: '1天起租',
        deposit: 12000,
        rentCount: 67,
        description: '专业视频拍摄套装，含监视器、三脚架等配件'
      },
      {
        id: 'rent_011',
        name: 'DJI Air 3 双摄无人机',
        price: 280,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        shop: '大疆航拍专营',
        shopRating: 4.9,
        location: '深圳·宝安区',
        tags: ['大疆', '无人机', '双摄', '航拍'],
        features: ['双摄系统', '4K HDR', '46分钟续航', '20公里图传'],
        rentalPeriod: '1天起租',
        deposit: 6000,
        rentCount: 456,
        description: '双摄无人机，广角+长焦双镜头，航拍创作更灵活'
      },
      {
        id: 'rent_012',
        name: 'Insta360 GO 3 拇指相机',
        price: 50,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        shop: '影石迷你设备',
        shopRating: 4.6,
        location: '北京·西城区',
        tags: ['影石', '拇指相机', '便携', '创意'],
        features: ['2.7K视频', '超小体积', '磁吸佩戴', 'AI剪辑'],
        rentalPeriod: '1天起租',
        deposit: 800,
        rentCount: 789,
        description: '世界最小相机，磁吸佩戴，解放双手记录生活'
      },
      {
        id: 'rent_013',
        name: 'Sony A7R V 高像素套装',
        price: 380,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=300&fit=crop&q=95',
        shop: '索尼高端租赁',
        shopRating: 4.9,
        location: '上海·徐汇区',
        tags: ['索尼', '高像素', '风光', '商业'],
        features: ['6100万像素', '8档防抖', '693点对焦', '24-70mm f/2.8'],
        rentalPeriod: '1天起租',
        deposit: 10000,
        rentCount: 123,
        description: '超高像素全画幅，风光商业摄影首选，含专业镜头'
      },
      {
        id: 'rent_014',
        name: 'DJI Pocket 2 口袋云台',
        price: 90,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&q=95',
        shop: '大疆便携设备',
        shopRating: 4.7,
        location: '杭州·滨江区',
        tags: ['大疆', '口袋云台', '便携', '稳定'],
        features: ['6400万像素', '4K 60fps', '3轴机械云台', '超小体积'],
        rentalPeriod: '1天起租',
        deposit: 1800,
        rentCount: 567,
        description: '口袋大小的专业云台相机，旅行拍摄最佳伴侣'
      },
      {
        id: 'rent_015',
        name: 'Leica SL3 全画幅套装',
        price: 580,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1495121553079-4c61bcce1894?w=400&h=300&fit=crop&q=95',
        shop: '徕卡专业租赁',
        shopRating: 5.0,
        location: '北京·朝阳区',
        tags: ['徕卡', '全画幅', '奢华', '专业'],
        features: ['6000万像素', '8K视频', '德国制造', '24-70mm f/2.8'],
        rentalPeriod: '1天起租',
        deposit: 20000,
        rentCount: 45,
        description: '徕卡旗舰全画幅，德系精工，高端商业拍摄首选'
      },
      {
        id: 'rent_016',
        name: 'DJI FPV 穿越机',
        price: 180,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        shop: '大疆FPV专营',
        shopRating: 4.8,
        location: '深圳·龙华区',
        tags: ['大疆', 'FPV', '穿越机', '竞速'],
        features: ['4K 60fps', '150km/h极速', '沉浸式飞行', '超低延迟'],
        rentalPeriod: '1天起租',
        deposit: 5000,
        rentCount: 234,
        description: 'FPV穿越机，沉浸式飞行体验，极限运动拍摄利器'
      },
      {
        id: 'rent_017',
        name: 'Insta360 Ace Pro 运动相机',
        price: 100,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        shop: '影石运动设备',
        shopRating: 4.7,
        location: '广州·越秀区',
        tags: ['影石', '运动相机', '8K', 'AI'],
        features: ['8K视频', '1/1.3英寸传感器', 'AI降噪', '防水防震'],
        rentalPeriod: '1天起租',
        deposit: 2000,
        rentCount: 345,
        description: '影石旗舰运动相机，8K拍摄，AI智能降噪'
      },
      {
        id: 'rent_018',
        name: 'Canon EOS R6 Mark II 套装',
        price: 280,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=95',
        shop: '佳能器材租赁',
        shopRating: 4.8,
        location: '武汉·江汉区',
        tags: ['佳能', '全画幅', '套装', '热门'],
        features: ['2420万像素', '8档防抖', '4K 60p', '24-105mm镜头'],
        rentalPeriod: '1天起租',
        deposit: 7000,
        rentCount: 234,
        description: '佳能热门机型，婚礼活动拍摄首选，含专业镜头'
      },
      {
        id: 'rent_019',
        name: 'DJI Inspire 3 专业无人机',
        price: 800,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=95',
        shop: '大疆专业航拍',
        shopRating: 5.0,
        location: '北京·顺义区',
        tags: ['大疆', '专业无人机', '电影级', '航拍'],
        features: ['8K ProRes RAW', '28分钟续航', '双操控', '15公里图传'],
        rentalPeriod: '1天起租',
        deposit: 25000,
        rentCount: 89,
        description: '大疆专业电影级无人机，8K RAW拍摄，双人操控'
      },
      {
        id: 'rent_020',
        name: 'Insta360 Link 网络摄像头',
        price: 40,
        type: 'rental',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=95',
        shop: '影石办公设备',
        shopRating: 4.6,
        location: '深圳·南山区',
        tags: ['影石', '网络摄像头', '直播', 'AI'],
        features: ['4K视频', 'AI追踪', '自动构图', 'USB即插即用'],
        rentalPeriod: '3天起租',
        deposit: 600,
        rentCount: 456,
        description: 'AI智能网络摄像头，直播会议首选，自动追踪构图'
      }
    ];

    this.setData({
      recommendedCameras,
      tradeCameras,
      rentalCameras,
      loading: false
    });
  },

  // 相机详情点击
  onCameraClick(e) {
    const { camera } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/market/detail/index?id=${camera.id}&type=${camera.type}`
    });
  },

  // 搜索相机
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    const { searchKeyword } = this.data;
    if (searchKeyword.trim()) {
      wx.navigateTo({
        url: `/pages/market/search/index?keyword=${encodeURIComponent(searchKeyword)}`
      });
    }
  },

  // 发布相机交易
  onPublishTrade() {
    wx.navigateTo({
      url: '/pages/market/publish/index?type=trade'
    });
  },

  // 发布相机租赁
  onPublishRental() {
    wx.navigateTo({
      url: '/pages/market/publish/index?type=rental'
    });
  }
});
