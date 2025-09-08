import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建支付测试数据...');

  // 获取现有用户
  const users = await prisma.user.findMany({
    take: 4,
  });

  if (users.length === 0) {
    console.log('没有找到用户，请先运行用户种子数据');
    return;
  }

  // 创建订单和支付记录
  const orders = [];
  const payments = [];

  // 订单1：已支付的人像摄影服务
  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD1735734938123ABC',
      title: '专业人像摄影服务',
      description: '包含化妆造型、服装搭配、专业拍摄，提供精修照片10张',
      amount: 50000, // 500元
      currency: 'CNY',
      status: 'paid',
      userId: users[0].id,
      productType: 'appointment',
      productId: 'appointment_001',
      productInfo: JSON.stringify({
        duration: '2小时',
        location: '专业摄影棚',
        photographer: '资深摄影师张老师',
        includes: ['化妆造型', '服装搭配', '精修照片10张'],
      }),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      paymentNo: 'PAY1735734938456DEF',
      amount: 50000,
      currency: 'CNY',
      method: 'wechat',
      provider: 'wechatpay',
      status: 'success',
      thirdPartyId: 'wx_4200001234567890123456789012345',
      thirdPartyStatus: 'SUCCESS',
      thirdPartyData: JSON.stringify({
        transaction_id: 'wx_4200001234567890123456789012345',
        trade_state: 'SUCCESS',
        success_time: new Date().toISOString(),
      }),
      orderId: order1.id,
      userId: users[0].id,
      paidAt: new Date(),
    },
  });

  // 订单2：待支付的风景摄影作品
  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD1735734938789GHI',
      title: '高清风景摄影作品',
      description: '专业风景摄影师拍摄的高清数字作品，可用于商业用途',
      amount: 20000, // 200元
      currency: 'CNY',
      status: 'pending',
      userId: users[1].id,
      productType: 'work',
      productId: 'work_001',
      productInfo: JSON.stringify({
        resolution: '4K高清',
        format: 'RAW + JPG',
        license: '商业使用许可',
        delivery: '数字下载',
      }),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      paymentNo: 'PAY1735734938789JKL',
      amount: 20000,
      currency: 'CNY',
      method: 'alipay',
      provider: 'alipay',
      status: 'pending',
      orderId: order2.id,
      userId: users[1].id,
    },
  });

  // 订单3：已退款的VIP会员服务
  const order3 = await prisma.order.create({
    data: {
      orderNo: 'ORD1735734938012MNO',
      title: 'VIP会员年费服务',
      description: '享受平台VIP特权，包含优先约拍、专属客服、作品推广等',
      amount: 99900, // 999元
      currency: 'CNY',
      status: 'refunded',
      userId: users[2].id,
      productType: 'vip',
      productId: 'vip_annual',
      productInfo: JSON.stringify({
        duration: '12个月',
        benefits: ['优先约拍', '专属客服', '作品推广', '无限上传'],
      }),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      paymentNo: 'PAY1735734938012PQR',
      amount: 99900,
      currency: 'CNY',
      method: 'wechat',
      provider: 'wechatpay',
      status: 'refunded',
      thirdPartyId: 'wx_4200001234567890123456789012346',
      thirdPartyStatus: 'REFUND',
      thirdPartyData: JSON.stringify({
        transaction_id: 'wx_4200001234567890123456789012346',
        trade_state: 'REFUND',
        success_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      }),
      orderId: order3.id,
      userId: users[2].id,
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2天前支付
    },
  });

  // 创建退款记录
  const refund1 = await prisma.refund.create({
    data: {
      refundNo: 'REF1735734938345STU',
      amount: 99900,
      reason: '用户申请退款，服务未开始使用',
      status: 'success',
      thirdPartyId: 'wx_refund_1234567890123456789012345',
      thirdPartyStatus: 'SUCCESS',
      thirdPartyData: JSON.stringify({
        refund_id: 'wx_refund_1234567890123456789012345',
        refund_status: 'SUCCESS',
        success_time: new Date().toISOString(),
      }),
      paymentId: payment3.id,
      userId: users[2].id,
      refundedAt: new Date(),
    },
  });

  // 订单4：已过期的摄影器材租赁
  const order4 = await prisma.order.create({
    data: {
      orderNo: 'ORD1735734938678VWX',
      title: '专业摄影器材租赁',
      description: '佳能5D Mark IV + 24-70mm f/2.8L镜头租赁服务',
      amount: 30000, // 300元
      currency: 'CNY',
      status: 'expired',
      userId: users[3].id,
      productType: 'rental',
      productId: 'rental_001',
      productInfo: JSON.stringify({
        equipment: ['佳能5D Mark IV', '24-70mm f/2.8L镜头'],
        duration: '3天',
        deposit: '押金2000元',
      }),
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1小时前过期
    },
  });

  // 订单5：今日新订单
  const order5 = await prisma.order.create({
    data: {
      orderNo: 'ORD1735734938901YZA',
      title: '婚纱摄影套餐',
      description: '专业婚纱摄影，包含外景+内景拍摄，精修照片30张',
      amount: 150000, // 1500元
      currency: 'CNY',
      status: 'pending',
      userId: users[0].id,
      productType: 'appointment',
      productId: 'wedding_package',
      productInfo: JSON.stringify({
        duration: '全天',
        locations: ['外景公园', '专业摄影棚'],
        includes: ['化妆造型', '婚纱礼服', '精修照片30张', '相册制作'],
      }),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后过期
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      paymentNo: 'PAY1735734938901BCD',
      amount: 150000,
      currency: 'CNY',
      method: 'alipay',
      provider: 'alipay',
      status: 'pending',
      orderId: order5.id,
      userId: users[0].id,
    },
  });

  console.log('支付测试数据创建完成！');
  console.log(`创建了 5 个订单：`);
  console.log(`- 已支付订单: 1个`);
  console.log(`- 待支付订单: 2个`);
  console.log(`- 已退款订单: 1个`);
  console.log(`- 已过期订单: 1个`);
  console.log(`创建了 5 个支付记录`);
  console.log(`创建了 1 个退款记录`);

  // 输出统计信息
  const stats = {
    totalOrders: 5,
    paidOrders: 1,
    totalAmount: 50000, // 只有已支付的订单计入总金额
    todayOrders: 2, // 今天创建的订单
    pendingOrders: 2,
    successRate: '20.00', // 1/5 = 20%
  };

  console.log('\n支付统计信息：');
  console.log(`总订单数: ${stats.totalOrders}`);
  console.log(`已支付订单: ${stats.paidOrders}`);
  console.log(`总交易金额: ¥${(stats.totalAmount / 100).toFixed(2)}`);
  console.log(`今日订单: ${stats.todayOrders}`);
  console.log(`待支付订单: ${stats.pendingOrders}`);
  console.log(`支付成功率: ${stats.successRate}%`);
}

main()
  .catch((e) => {
    console.error('创建支付测试数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
