import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建消息种子数据...');

  try {
    // 获取现有用户
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, nickname: true },
    });

    if (users.length < 2) {
      console.log('需要至少2个用户才能创建消息数据');
      return;
    }

    console.log(`找到 ${users.length} 个用户，开始创建消息...`);

    // 创建消息数据
    const messages = [
      // 用户1和用户2的对话
      {
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '你好！我看了你的作品，拍摄技术很棒！',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2天前
      },
      {
        senderId: users[1].id,
        receiverId: users[0].id,
        content: '谢谢夸奖！你也是摄影师吗？',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30), // 2天前+30分钟
        isRead: true,
      },
      {
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '是的，我主要拍人像。有机会可以合作一下！',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60), // 2天前+1小时
        isRead: true,
      },
      {
        senderId: users[1].id,
        receiverId: users[0].id,
        content: '好啊！我正好想拍一组新的写真',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 30), // 1天前+30分钟
        isRead: true,
      },
      {
        senderId: users[0].id,
        receiverId: users[1].id,
        content: '那我们约个时间详细聊聊吧',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12小时前
        isRead: false,
      },

      // 用户1和用户3的对话（如果有第3个用户）
      ...(users.length >= 3 ? [
        {
          senderId: users[2].id,
          receiverId: users[0].id,
          content: '看到你发布的约拍信息，我很感兴趣',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6小时前
          isRead: true,
        },
        {
          senderId: users[0].id,
          receiverId: users[2].id,
          content: '太好了！你是模特吗？',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5小时前
          isRead: true,
        },
        {
          senderId: users[2].id,
          receiverId: users[0].id,
          content: '是的，有3年的拍摄经验',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4小时前
          isRead: false,
        },
      ] : []),

      // 用户2和用户4的对话（如果有第4个用户）
      ...(users.length >= 4 ? [
        {
          senderId: users[1].id,
          receiverId: users[3].id,
          content: '你的风景摄影作品很有意境',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8小时前
          isRead: true,
        },
        {
          senderId: users[3].id,
          receiverId: users[1].id,
          content: '谢谢！我比较喜欢拍自然风光',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7), // 7小时前
          isRead: true,
        },
        {
          senderId: users[1].id,
          receiverId: users[3].id,
          content: '有时间一起去外拍吗？',
          type: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3小时前
          isRead: false,
        },
      ] : []),

      // 系统消息示例
      {
        senderId: 'system',
        receiverId: users[0].id,
        content: '欢迎使用懂拍帝平台！您的账户已通过实名认证。',
        type: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7天前
        isRead: true,
      },
      {
        senderId: 'system',
        receiverId: users[1].id,
        content: '您有新的约拍申请，请及时查看处理。',
        type: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
        isRead: false,
      },
    ];

    // 批量创建消息
    for (const messageData of messages) {
      try {
        await prisma.message.create({
          data: messageData,
        });
        console.log(`创建消息: ${messageData.senderId} -> ${messageData.receiverId}`);
      } catch (error) {
        console.error('创建消息失败:', error);
      }
    }

    console.log(`✅ 成功创建 ${messages.length} 条消息`);

    // 显示统计信息
    const totalMessages = await prisma.message.count();
    const unreadMessages = await prisma.message.count({
      where: { isRead: false },
    });

    console.log('\n📊 消息统计:');
    console.log(`总消息数: ${totalMessages}`);
    console.log(`未读消息数: ${unreadMessages}`);

    // 显示每个用户的消息统计
    console.log('\n👥 用户消息统计:');
    for (const user of users) {
      const sentCount = await prisma.message.count({
        where: { senderId: user.id },
      });
      const receivedCount = await prisma.message.count({
        where: { receiverId: user.id },
      });
      const unreadCount = await prisma.message.count({
        where: { receiverId: user.id, isRead: false },
      });

      console.log(`${user.nickname} (${user.id}):`);
      console.log(`  发送: ${sentCount} 条`);
      console.log(`  接收: ${receivedCount} 条`);
      console.log(`  未读: ${unreadCount} 条`);
    }

  } catch (error) {
    console.error('创建消息种子数据失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
