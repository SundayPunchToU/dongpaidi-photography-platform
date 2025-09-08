import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAppointments() {
  console.log('🌱 开始创建约拍种子数据...');

  try {
    // 获取现有用户
    const users = await prisma.user.findMany();
    if (users.length < 2) {
      console.log('❌ 需要至少2个用户才能创建约拍数据');
      return;
    }

    // 创建约拍数据
    const appointments = [
      {
        publisherId: users[0]!.id,
        title: '寻找专业人像模特 - 商业拍摄',
        description: '我是一名专业摄影师，正在为一个时尚品牌拍摄商业广告，需要一位有经验的女性模特。拍摄风格偏向时尚简约，需要模特有良好的镜头感和表现力。',
        type: 'photographer_seek_model',
        location: '北京市朝阳区',
        shootDate: new Date('2025-09-15T10:00:00Z'),
        budget: 1500.00,
        requirements: JSON.stringify({
          gender: '女性',
          ageRange: '20-30',
          height: '165cm以上',
          experience: '有商业拍摄经验',
          style: '时尚、简约',
          clothing: '需自备基础服装',
        }),
        status: 'open',
      },
      {
        publisherId: users[1]!.id,
        title: '模特寻找摄影师 - 个人写真',
        description: '我是一名业余模特，想要拍摄一组个人写真作品，希望找到一位有创意的摄影师合作。我比较喜欢自然清新的风格，希望能在户外或者有自然光的地方拍摄。',
        type: 'model_seek_photographer',
        location: '上海市徐汇区',
        shootDate: new Date('2025-09-20T14:00:00Z'),
        budget: 800.00,
        requirements: JSON.stringify({
          style: '自然、清新',
          location: '户外或自然光环境',
          duration: '2-3小时',
          deliverables: '精修20张',
          equipment: '专业相机和镜头',
        }),
        status: 'open',
      },
      {
        publisherId: users[0]!.id,
        title: '街拍摄影师招募 - 时尚街拍',
        description: '计划在三里屯、王府井等时尚地标进行街拍创作，寻找有街拍经验的摄影师。这是一个长期合作项目，适合喜欢捕捉都市时尚瞬间的摄影师。',
        type: 'photographer_seek_model',
        location: '北京市朝阳区三里屯',
        shootDate: new Date('2025-09-25T16:00:00Z'),
        budget: 1200.00,
        requirements: JSON.stringify({
          experience: '街拍经验',
          equipment: '便携相机设备',
          style: '时尚街拍',
          flexibility: '能适应户外环境',
        }),
        status: 'open',
      },
      {
        publisherId: users[1]!.id,
        title: '古风摄影合作 - 汉服主题',
        description: '我有一套精美的汉服，希望找到擅长古风摄影的摄影师合作，拍摄一组古风主题的作品。希望摄影师对古风摄影有一定的理解和经验。',
        type: 'model_seek_photographer',
        location: '杭州市西湖区',
        shootDate: new Date('2025-10-01T09:00:00Z'),
        budget: 600.00,
        requirements: JSON.stringify({
          style: '古风、汉服',
          experience: '古风摄影经验',
          location: '古建筑或园林',
          props: '可提供古风道具',
        }),
        status: 'open',
      },
      {
        publisherId: users[0]!.id,
        title: '婚纱摄影助理招募',
        description: '婚纱摄影工作室招募摄影助理，主要负责协助主摄影师完成婚纱照拍摄工作。适合想要学习婚纱摄影的新人，有一定摄影基础优先。',
        type: 'photographer_seek_model',
        location: '广州市天河区',
        shootDate: new Date('2025-09-18T08:00:00Z'),
        budget: 500.00,
        requirements: JSON.stringify({
          role: '摄影助理',
          experience: '摄影基础',
          availability: '周末可工作',
          learning: '愿意学习婚纱摄影',
        }),
        status: 'in_progress',
      },
    ];

    // 批量创建约拍
    for (const appointmentData of appointments) {
      const appointment = await prisma.appointment.create({
        data: appointmentData,
        include: {
          publisher: {
            select: {
              nickname: true,
            },
          },
        },
      });
      console.log(`✅ 创建约拍: ${appointment.title} (发布者: ${appointment.publisher.nickname})`);
    }

    // 创建一些申请数据
    const allAppointments = await prisma.appointment.findMany();
    const applications = [
      {
        appointmentId: allAppointments[0]!.id,
        applicantId: users[1]!.id,
        message: '您好！我是一名有3年商业拍摄经验的模特，对时尚简约风格很有把握。我身高168cm，有丰富的品牌合作经验，希望能有机会合作！',
        status: 'pending',
      },
      {
        appointmentId: allAppointments[1]!.id,
        applicantId: users[0]!.id,
        message: '您好！我是一名专业摄影师，擅长自然光人像摄影。我的作品风格偏向清新自然，正好符合您的需求。可以先看看我的作品集。',
        status: 'accepted',
      },
      {
        appointmentId: allAppointments[2]!.id,
        applicantId: users[1]!.id,
        message: '我对街拍很感兴趣，虽然经验不是很丰富，但是很有热情学习。希望能给我一个机会！',
        status: 'pending',
      },
    ];

    for (const applicationData of applications) {
      const application = await prisma.appointmentApplication.create({
        data: applicationData,
        include: {
          applicant: {
            select: {
              nickname: true,
            },
          },
          appointment: {
            select: {
              title: true,
            },
          },
        },
      });
      console.log(`✅ 创建申请: ${application.applicant.nickname} 申请 "${application.appointment.title}"`);
    }

    console.log('🎉 约拍种子数据创建完成！');
    console.log(`📊 创建了 ${appointments.length} 个约拍和 ${applications.length} 个申请`);

  } catch (error) {
    console.error('❌ 创建约拍种子数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seedAppointments();
}

export default seedAppointments;
