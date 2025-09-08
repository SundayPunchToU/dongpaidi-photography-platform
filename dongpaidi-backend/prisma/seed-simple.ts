import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子数据初始化...');

  try {
    // 创建管理员用户
    console.log('创建管理员用户...');
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@dongpaidi.com' },
      update: {},
      create: {
        email: 'admin@dongpaidi.com',
        nickname: '系统管理员',
        platform: 'admin',
        isVerified: true,
        specialties: JSON.stringify(['管理', '运营']),
        equipment: JSON.stringify([]),
        portfolioImages: JSON.stringify([]),
      },
    });

    console.log(`✅ 管理员用户创建成功: ${admin.nickname} (${admin.email})`);

    // 创建测试用户
    console.log('创建测试用户...');
    
    const user1 = await prisma.user.create({
      data: {
        nickname: '摄影师小王',
        platform: 'wechat',
        bio: '专业人像摄影师，擅长婚纱摄影和写真拍摄',
        specialties: JSON.stringify(['人像摄影', '婚纱摄影', '写真']),
        equipment: JSON.stringify(['Canon EOS R5', '85mm f/1.4', '24-70mm f/2.8']),
        location: '北京市朝阳区',
        portfolioImages: JSON.stringify([]),
      },
    });

    const user2 = await prisma.user.create({
      data: {
        nickname: '风景摄影达人',
        platform: 'wechat',
        bio: '热爱自然风光摄影，足迹遍布祖国大江南北',
        specialties: JSON.stringify(['风景摄影', '自然摄影', '旅行摄影']),
        equipment: JSON.stringify(['Nikon D850', '14-24mm f/2.8', '70-200mm f/2.8']),
        location: '上海市浦东新区',
        portfolioImages: JSON.stringify([]),
      },
    });

    console.log(`✅ 测试用户创建成功: ${user1.nickname}, ${user2.nickname}`);

    // 创建测试作品
    console.log('创建测试作品...');
    
    const work1 = await prisma.work.create({
      data: {
        title: '春日樱花盛开',
        description: '在公园里拍摄的樱花盛开美景，粉色花瓣飘洒如雪',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
          'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=800',
        ]),
        tags: JSON.stringify(['樱花', '春天', '自然', '粉色']),
        category: 'nature',
        location: '北京玉渊潭公园',
        shootingInfo: JSON.stringify({
          camera: 'Canon EOS R5',
          lens: '85mm f/1.4',
          settings: 'f/2.8, 1/500s, ISO 200',
        }),
        userId: user1.id,
        coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
        likeCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        commentCount: Math.floor(Math.random() * 20),
      },
    });

    console.log(`✅ 测试作品创建成功: ${work1.title}`);

    console.log('🎉 数据库种子数据初始化完成！');
    console.log('');
    console.log('📋 登录信息：');
    console.log('  管理员邮箱：admin@dongpaidi.com');
    console.log('  管理员密码：admin123456');

  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
