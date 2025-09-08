const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// 中间件
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true,
}));

app.use(express.json());
app.use(express.static('.'));

// 简单的认证中间件
const authenticate = (req, res, next) => {
  req.user = {
    id: 'current-user',
    email: 'admin@dongpaidi.com',
    nickname: '当前用户',
  };
  next();
};

// 支付统计API
app.get('/api/v1/payments/admin/stats', async (req, res) => {
  try {
    const [
      totalOrders,
      paidOrders,
      totalAmount,
      todayOrders,
      pendingOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.payment.aggregate({
        where: { status: 'success' },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.count({ where: { status: 'pending' } }),
    ]);

    const stats = {
      totalOrders,
      paidOrders,
      totalAmount: totalAmount._sum.amount || 0,
      todayOrders,
      pendingOrders,
      successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(2) : '0.00',
    };

    res.json({
      success: true,
      data: stats,
      message: '获取支付统计成功',
    });
  } catch (error) {
    console.error('获取支付统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付统计失败',
    });
  }
});

// 管理员订单列表API
app.get('/api/v1/payments/admin/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, method, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { title: { contains: search } },
        { user: { nickname: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentNo: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    const result = {
      items: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      message: '获取订单列表成功',
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
    });
  }
});

// 创建订单API
app.post('/api/v1/payments/orders', authenticate, async (req, res) => {
  try {
    const { title, description, amount, productType, productId, productInfo } = req.body;
    
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const order = await prisma.order.create({
      data: {
        orderNo,
        title,
        description,
        amount: Number(amount),
        userId: req.user.id,
        productType,
        productId,
        productInfo: productInfo ? JSON.stringify(productInfo) : null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({
      success: true,
      data: order,
      message: '订单创建成功',
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
    });
  }
});

// 申请退款API
app.post('/api/v1/payments/refund', authenticate, async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在',
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: '只能对成功的支付申请退款',
      });
    }

    const refundNo = `REF${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        amount: Number(amount) * 100, // 转换为分
        reason,
        paymentId,
        userId: payment.userId,
        status: 'success', // 模拟退款成功
        refundedAt: new Date(),
      },
      include: {
        payment: {
          include: { order: true },
        },
      },
    });

    // 更新支付状态为已退款
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' },
    });

    // 更新订单状态为已退款
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'refunded' },
    });

    res.status(201).json({
      success: true,
      data: refund,
      message: '退款申请成功',
    });
  } catch (error) {
    console.error('申请退款失败:', error);
    res.status(500).json({
      success: false,
      message: '申请退款失败',
    });
  }
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝支付系统运行正常',
    timestamp: new Date(),
    endpoints: {
      stats: '/api/v1/payments/admin/stats',
      orders: '/api/v1/payments/admin/orders',
      createOrder: 'POST /api/v1/payments/orders',
      refund: 'POST /api/v1/payments/refund',
    },
  });
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    database: 'connected',
  });
});

// 启动服务器
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🚀 支付系统服务器启动成功`);
  console.log(`📡 HTTP服务器运行在端口 ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📊 支付统计: http://localhost:${PORT}/api/v1/payments/admin/stats`);
  console.log(`📋 订单列表: http://localhost:${PORT}/api/v1/payments/admin/orders`);
  console.log(`💳 健康检查: http://localhost:${PORT}/api/v1/health`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  await prisma.$disconnect();
  process.exit(0);
});
