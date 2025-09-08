import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子数据初始化...');

  // 1. 创建管理员用户
  console.log('创建管理员用户...');
  const adminPassword = await bcrypt.hash('admin123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dongpaidi.com' },
    update: {},
    create: {
      email: 'admin@dongpaidi.com',
      nickname: '系统管理员',
      platform: 'admin',
      role: 'admin',
      isVerified: true,
      specialties: JSON.stringify(['管理', '运营']),
      equipment: JSON.stringify([]),
      portfolioImages: JSON.stringify([]),
    },
  });

  console.log(`✅ 管理员用户创建成功: ${admin.nickname} (${admin.email})`);

  // 2. 创建测试用户
  console.log('创建测试用户...');
  const testUsers = [
    {
      nickname: '摄影师小王',
      platform: 'wechat',
      bio: '专业人像摄影师，擅长婚纱摄影和写真拍摄',
      specialties: ['人像摄影', '婚纱摄影', '写真'],
      equipment: ['Canon EOS R5', '85mm f/1.4', '24-70mm f/2.8'],
      location: '北京市朝阳区',
    },
    {
      nickname: '风景摄影达人',
      platform: 'wechat',
      bio: '热爱自然风光摄影，足迹遍布祖国大江南北',
      specialties: ['风景摄影', '自然摄影', '旅行摄影'],
      equipment: ['Nikon D850', '14-24mm f/2.8', '70-200mm f/2.8'],
      location: '上海市浦东新区',
    },
    {
      nickname: '街拍小能手',
      platform: 'wechat',
      bio: '街头摄影爱好者，记录城市生活的美好瞬间',
      specialties: ['街头摄影', '纪实摄影', '黑白摄影'],
      equipment: ['Fujifilm X-T4', '35mm f/1.4', '23mm f/2'],
      location: '广州市天河区',
    },
  ];

  const createdUsers = [];
  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        portfolioImages: [],
      },
    });
    createdUsers.push(user);
    console.log(`✅ 测试用户创建成功: ${user.nickname}`);
  }

  // 3. 创建测试作品
  console.log('创建测试作品...');
  const testWorks = [
    {
      title: '春日樱花盛开',
      description: '在公园里拍摄的樱花盛开美景，粉色花瓣飘洒如雪',
      images: [
        'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
        'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=800',
      ],
      tags: ['樱花', '春天', '自然', '粉色'],
      category: 'nature',
      location: '北京玉渊潭公园',
      shootingInfo: {
        camera: 'Canon EOS R5',
        lens: '85mm f/1.4',
        settings: 'f/2.8, 1/500s, ISO 200',
      },
    },
    {
      title: '都市夜景璀璨',
      description: '城市夜晚的霓虹灯光，展现现代都市的繁华与美丽',
      images: [
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      ],
      tags: ['夜景', '城市', '霓虹', '建筑'],
      category: 'architecture',
      location: '上海外滩',
      shootingInfo: {
        camera: 'Nikon D850',
        lens: '24-70mm f/2.8',
        settings: 'f/8, 30s, ISO 100',
      },
    },
    {
      title: '街头人文瞬间',
      description: '捕捉街头行人的自然瞬间，展现城市生活的真实面貌',
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      ],
      tags: ['街拍', '人文', '黑白', '生活'],
      category: 'street',
      location: '广州北京路步行街',
      shootingInfo: {
        camera: 'Fujifilm X-T4',
        lens: '35mm f/1.4',
        settings: 'f/5.6, 1/125s, ISO 800',
      },
    },
  ];

  for (let i = 0; i < testWorks.length; i++) {
    const workData = testWorks[i];
    const user = createdUsers[i];
    
    const work = await prisma.work.create({
      data: {
        ...workData,
        userId: user.id,
        coverImage: workData.images[0],
        likeCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        commentCount: Math.floor(Math.random() * 20),
      },
    });
    
    console.log(`✅ 测试作品创建成功: ${work.title}`);
  }

  // 4. 创建测试约拍信息
  console.log('创建测试约拍信息...');
  const appointment = await prisma.appointment.create({
    data: {
      title: '春日外景人像拍摄',
      description: '寻找模特进行春日外景人像拍摄，地点在公园或校园',
      photographerId: createdUsers[0].id,
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      location: '北京市朝阳公园',
      duration: 120, // 2小时
      budget: 500.00,
      requirements: {
        modelType: '女性模特',
        style: '清新自然',
        clothing: '春装、连衣裙',
        props: '花束、帽子',
      },
      status: 'open',
    },
  });

  console.log(`✅ 测试约拍创建成功: ${appointment.title}`);

  console.log('🎉 数据库种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
