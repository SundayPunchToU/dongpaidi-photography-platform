import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorks() {
  console.log('开始创建作品种子数据...');

  // 获取现有用户
  const users = await prisma.user.findMany({
    take: 5,
  });

  if (users.length === 0) {
    console.log('没有找到用户，请先运行用户种子数据');
    return;
  }

  // 作品分类
  const categories = [
    'portrait',      // 人像
    'landscape',     // 风景
    'street',        // 街拍
    'commercial',    // 商业
    'art',          // 艺术
    'wedding',      // 婚礼
    'fashion',      // 时尚
    'nature',       // 自然
    'architecture', // 建筑
    'food'          // 美食
  ];

  // 示例作品数据
  const worksData = [
    {
      title: '城市夜景',
      description: '繁华都市的夜晚，霓虹灯闪烁，车水马龙。使用长曝光技术捕捉城市的动态美。',
      category: 'landscape',
      location: '上海外滩',
      tags: ['夜景', '城市', '长曝光', '霓虹灯'],
      images: [
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'
      ],
      shootingInfo: {
        camera: 'Canon EOS R5',
        lens: '24-70mm f/2.8',
        settings: 'f/8, 30s, ISO 100'
      },
      price: 299.00,
      isPremium: true,
    },
    {
      title: '清晨人像',
      description: '清晨的第一缕阳光洒在模特脸上，温暖而柔和。自然光拍摄，展现最真实的美。',
      category: 'portrait',
      location: '杭州西湖',
      tags: ['人像', '自然光', '清晨', '温暖'],
      images: [
        'https://images.unsplash.com/photo-1494790108755-2616c6d4e6e8?w=800',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'
      ],
      shootingInfo: {
        camera: 'Sony A7R IV',
        lens: '85mm f/1.4',
        settings: 'f/1.8, 1/250s, ISO 200'
      },
      price: 199.00,
      isPremium: false,
    },
    {
      title: '街头瞬间',
      description: '捕捉街头的精彩瞬间，记录城市生活的真实写照。黑白处理增强了画面的戏剧性。',
      category: 'street',
      location: '北京三里屯',
      tags: ['街拍', '黑白', '瞬间', '生活'],
      images: [
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
      ],
      shootingInfo: {
        camera: 'Fujifilm X-T4',
        lens: '35mm f/1.4',
        settings: 'f/2.8, 1/500s, ISO 800'
      },
      price: 0,
      isPremium: false,
    },
    {
      title: '时尚大片',
      description: '时尚摄影作品，展现模特的优雅气质。精心的布光和后期处理，打造杂志级别的视觉效果。',
      category: 'fashion',
      location: '广州CBD',
      tags: ['时尚', '商业', '布光', '后期'],
      images: [
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'
      ],
      shootingInfo: {
        camera: 'Canon EOS 5D Mark IV',
        lens: '70-200mm f/2.8',
        settings: 'f/4, 1/125s, ISO 400'
      },
      price: 599.00,
      isPremium: true,
    },
    {
      title: '建筑之美',
      description: '现代建筑的几何美学，通过独特的角度和构图展现建筑的艺术性。',
      category: 'architecture',
      location: '深圳平安金融中心',
      tags: ['建筑', '几何', '现代', '艺术'],
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800'
      ],
      shootingInfo: {
        camera: 'Nikon D850',
        lens: '14-24mm f/2.8',
        settings: 'f/8, 1/60s, ISO 100'
      },
      price: 0,
      isPremium: false,
    },
    {
      title: '自然风光',
      description: '大自然的壮美景色，山川河流在镜头下展现出震撼人心的力量。',
      category: 'nature',
      location: '四川九寨沟',
      tags: ['自然', '风光', '山川', '震撼'],
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
      ],
      shootingInfo: {
        camera: 'Canon EOS R6',
        lens: '16-35mm f/2.8',
        settings: 'f/11, 1/30s, ISO 100'
      },
      price: 399.00,
      isPremium: true,
    },
    {
      title: '美食摄影',
      description: '精致美食的视觉盛宴，通过专业的布光和构图展现食物的诱人魅力。',
      category: 'food',
      location: '成都宽窄巷子',
      tags: ['美食', '静物', '布光', '诱人'],
      images: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'
      ],
      shootingInfo: {
        camera: 'Sony A7 III',
        lens: '90mm f/2.8 Macro',
        settings: 'f/5.6, 1/60s, ISO 400'
      },
      price: 0,
      isPremium: false,
    },
    {
      title: '婚礼纪实',
      description: '记录人生最美好的时刻，捕捉新人的幸福瞬间和宾客的真挚祝福。',
      category: 'wedding',
      location: '苏州园林',
      tags: ['婚礼', '纪实', '幸福', '真挚'],
      images: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800'
      ],
      shootingInfo: {
        camera: 'Canon EOS R5',
        lens: '24-105mm f/4',
        settings: 'f/4, 1/200s, ISO 800'
      },
      price: 1299.00,
      isPremium: true,
    }
  ];

  // 创建作品
  for (let i = 0; i < worksData.length; i++) {
    const workData = worksData[i];
    const user = users[i % users.length]; // 循环分配给不同用户

    try {
      const work = await prisma.work.create({
        data: {
          userId: user.id,
          title: workData.title,
          description: workData.description,
          category: workData.category,
          location: workData.location,
          tags: JSON.stringify(workData.tags),
          images: JSON.stringify(workData.images),
          coverImage: workData.images[0],
          shootingInfo: JSON.stringify(workData.shootingInfo),
          price: workData.price,
          isPremium: workData.isPremium,
          status: 'published',
          // 随机生成一些统计数据
          likeCount: Math.floor(Math.random() * 100) + 10,
          commentCount: Math.floor(Math.random() * 50) + 5,
          viewCount: Math.floor(Math.random() * 1000) + 100,
          shareCount: Math.floor(Math.random() * 20) + 1,
          collectCount: Math.floor(Math.random() * 30) + 5,
        },
      });

      console.log(`✅ 创建作品: ${work.title} (ID: ${work.id})`);
    } catch (error) {
      console.error(`❌ 创建作品失败: ${workData.title}`, error);
    }
  }

  console.log('作品种子数据创建完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  seedWorks()
    .catch((e) => {
      console.error('作品种子数据创建失败:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedWorks;
