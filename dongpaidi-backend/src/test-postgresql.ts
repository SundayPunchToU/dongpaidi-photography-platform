import 'module-alias/register';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { log } from './config/logger';

/**
 * PostgreSQL连接测试
 */
async function testPostgreSQLConnection() {
  console.log('🔍 测试PostgreSQL连接...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.database.url
      }
    }
  });

  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ PostgreSQL连接成功');

    // 测试基本查询
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 数据库版本:', result);

    // 测试表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 数据库表:', tables);

    // 测试用户表操作
    console.log('🧪 测试用户表操作...');
    
    // 创建测试用户
    const testUser = await prisma.user.create({
      data: {
        nickname: 'PostgreSQL测试用户',
        platform: 'test',
        specialties: ['测试', 'PostgreSQL'],
        equipment: ['测试设备'],
        portfolioImages: [],
      }
    });
    console.log('✅ 测试用户创建成功:', testUser.nickname);

    // 查询用户
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        nickname: true,
        platform: true,
        specialties: true,
        createdAt: true,
      }
    });
    console.log('📋 用户列表:', users);

    // 测试作品表操作
    console.log('🧪 测试作品表操作...');
    
    const testWork = await prisma.work.create({
      data: {
        title: 'PostgreSQL测试作品',
        description: '这是一个测试作品',
        images: ['https://example.com/test1.jpg', 'https://example.com/test2.jpg'],
        tags: ['测试', 'PostgreSQL', '数据库'],
        category: 'test',
        userId: testUser.id,
        coverImage: 'https://example.com/test1.jpg',
        shootingInfo: {
          camera: 'Test Camera',
          lens: 'Test Lens',
          settings: 'Test Settings'
        }
      }
    });
    console.log('✅ 测试作品创建成功:', testWork.title);

    // 测试复杂查询
    console.log('🧪 测试复杂查询...');
    
    const worksWithUser = await prisma.work.findMany({
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            platform: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            collections: true,
          }
        }
      },
      take: 5,
    });
    console.log('📋 作品列表（含用户信息）:', JSON.stringify(worksWithUser, null, 2));

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await prisma.work.delete({ where: { id: testWork.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ 测试数据清理完成');

    console.log('🎉 PostgreSQL测试完成！所有功能正常');

  } catch (error) {
    console.error('❌ PostgreSQL测试失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 测试JSON字段功能
async function testJSONFields() {
  console.log('🔍 测试JSON字段功能...');
  
  const prisma = new PrismaClient();

  try {
    // 测试复杂JSON数据
    const complexUser = await prisma.user.create({
      data: {
        nickname: 'JSON测试用户',
        platform: 'test',
        specialties: ['人像摄影', '风景摄影', '街拍'],
        equipment: ['Canon EOS R5', '85mm f/1.4', '24-70mm f/2.8'],
        portfolioImages: [
          {
            url: 'https://example.com/portfolio1.jpg',
            title: '作品1',
            description: '这是第一个作品'
          },
          {
            url: 'https://example.com/portfolio2.jpg',
            title: '作品2',
            description: '这是第二个作品'
          }
        ],
      }
    });

    console.log('✅ 复杂JSON用户创建成功');
    console.log('📋 用户专长:', complexUser.specialties);
    console.log('📋 用户设备:', complexUser.equipment);
    console.log('📋 作品集:', complexUser.portfolioImages);

    // 测试JSON查询
    const usersWithSpecialty = await prisma.user.findMany({
      where: {
        specialties: {
          has: '人像摄影'
        }
      }
    });
    console.log('📋 擅长人像摄影的用户:', usersWithSpecialty.length);

    // 清理
    await prisma.user.delete({ where: { id: complexUser.id } });
    console.log('✅ JSON测试完成');

  } catch (error) {
    console.error('❌ JSON字段测试失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  try {
    log.info('开始PostgreSQL功能测试');
    
    await testPostgreSQLConnection();
    await testJSONFields();
    
    log.info('PostgreSQL功能测试完成');
  } catch (error) {
    log.error('PostgreSQL功能测试失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { testPostgreSQLConnection, testJSONFields };
