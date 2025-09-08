import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建用户测试数据...');

  // 创建测试用户
  const users = [
    {
      nickname: '摄影爱好者小王',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      bio: '热爱摄影的业余爱好者，专注人像和风景摄影',
      platform: 'wechat',
      isPhotographer: true,
      photographerLevel: 'intermediate',
      specialties: JSON.stringify(['人像摄影', '风景摄影']),
      equipment: JSON.stringify(['佳能5D4', '24-70mm f/2.8']),
      isVerified: true,
    },
    {
      nickname: '模特小李',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616c6d4e6e8?w=100',
      bio: '专业模特，有丰富的拍摄经验',
      platform: 'wechat',
      isModel: true,
      modelExperience: 'professional',
      isVerified: true,
    },
    {
      nickname: '风景摄影达人',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      bio: '专业风景摄影师，走遍大江南北',
      platform: 'wechat',
      isPhotographer: true,
      photographerLevel: 'professional',
      specialties: JSON.stringify(['风景摄影', '自然摄影']),
      equipment: JSON.stringify(['尼康D850', '14-24mm f/2.8', '70-200mm f/2.8']),
      isVerified: true,
    },
    {
      nickname: '新手摄影师',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      bio: '刚入门的摄影新手，正在学习中',
      platform: 'wechat',
      isPhotographer: true,
      photographerLevel: 'beginner',
      specialties: JSON.stringify(['人像摄影']),
      equipment: JSON.stringify(['佳能EOS R6']),
      isVerified: false,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
    console.log(`创建用户: ${user.nickname} (${user.id})`);
  }

  console.log(`\n用户测试数据创建完成！`);
  console.log(`创建了 ${createdUsers.length} 个用户`);
  console.log(`- 摄影师: ${createdUsers.filter(u => u.isPhotographer).length} 个`);
  console.log(`- 模特: ${createdUsers.filter(u => u.isModel).length} 个`);
  console.log(`- 已认证: ${createdUsers.filter(u => u.isVerified).length} 个`);
}

main()
  .catch((e) => {
    console.error('创建用户测试数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
