import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// 创建订单DTO
export interface CreateOrderDto {
  userId: string;
  title: string;
  description?: string;
  amount: number; // 以分为单位
  productType: string;
  productId: string;
  productInfo?: any;
  expiresAt?: Date;
}

// 创建支付DTO
export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number; // 以分为单位
  userId: string;
}

// 支付回调数据
export interface PaymentCallbackData {
  paymentNo: string;
  thirdPartyId: string;
  status: PaymentStatus;
  paidAt?: Date;
  thirdPartyData?: any;
}

export class PaymentService {
  /**
   * 创建订单
   */
  async createOrder(data: CreateOrderDto) {
    const orderNo = this.generateOrderNo();
    
    const order = await prisma.order.create({
      data: {
        orderNo,
        title: data.title,
        description: data.description,
        amount: data.amount,
        userId: data.userId,
        productType: data.productType,
        productId: data.productId,
        productInfo: data.productInfo ? JSON.stringify(data.productInfo) : null,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 60 * 1000), // 默认30分钟过期
      },
      include: {
        user: true,
      },
    });

    return order;
  }

  /**
   * 获取订单详情
   */
  async getOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payments: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: { userId },
      }),
    ]);

    return {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 创建支付记录
   */
  async createPayment(data: CreatePaymentDto) {
    // 验证订单
    const order = await this.getOrder(data.orderId);
    
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('订单状态不允许支付');
    }

    if (order.userId !== data.userId) {
      throw new Error('无权限操作此订单');
    }

    // 检查订单是否过期
    if (order.expiresAt && new Date() > order.expiresAt) {
      await this.updateOrderStatus(data.orderId, OrderStatus.EXPIRED);
      throw new Error('订单已过期');
    }

    const paymentNo = this.generatePaymentNo();
    
    const payment = await prisma.payment.create({
      data: {
        paymentNo,
        amount: data.amount,
        method: data.method,
        provider: data.method === PaymentMethod.WECHAT ? 'wechatpay' : 'alipay',
        orderId: data.orderId,
        userId: data.userId,
      },
      include: {
        order: true,
        user: true,
      },
    });

    return payment;
  }

  /**
   * 处理支付回调
   */
  async handlePaymentCallback(data: PaymentCallbackData) {
    const payment = await prisma.payment.findUnique({
      where: { paymentNo: data.paymentNo },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('支付记录不存在');
    }

    // 更新支付状态
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: data.status,
        thirdPartyId: data.thirdPartyId,
        thirdPartyStatus: data.status,
        thirdPartyData: data.thirdPartyData ? JSON.stringify(data.thirdPartyData) : null,
        paidAt: data.paidAt || (data.status === PaymentStatus.SUCCESS ? new Date() : null),
      },
    });

    // 如果支付成功，更新订单状态
    if (data.status === PaymentStatus.SUCCESS) {
      await this.updateOrderStatus(payment.orderId, OrderStatus.PAID);
    }

    return updatedPayment;
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return order;
  }

  /**
   * 申请退款
   */
  async requestRefund(paymentId: string, amount: number, reason?: string, userId?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('支付记录不存在');
    }

    if (userId && payment.userId !== userId) {
      throw new Error('无权限操作此支付记录');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new Error('只能对成功的支付申请退款');
    }

    if (amount > payment.amount) {
      throw new Error('退款金额不能超过支付金额');
    }

    const refundNo = this.generateRefundNo();

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        amount,
        reason,
        paymentId,
        userId: payment.userId,
      },
      include: {
        payment: {
          include: { order: true },
        },
      },
    });

    return refund;
  }

  /**
   * 获取支付统计
   */
  async getPaymentStats(userId?: string) {
    const whereClause = userId ? { userId } : {};

    const [
      totalOrders,
      paidOrders,
      totalAmount,
      todayOrders,
      pendingOrders,
    ] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.count({ where: { ...whereClause, status: OrderStatus.PAID } }),
      prisma.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.count({ where: { ...whereClause, status: OrderStatus.PENDING } }),
    ]);

    return {
      totalOrders,
      paidOrders,
      totalAmount: totalAmount._sum.amount || 0,
      todayOrders,
      pendingOrders,
      successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(2) : '0.00',
    };
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  /**
   * 生成支付流水号
   */
  private generatePaymentNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${timestamp}${random}`;
  }

  /**
   * 生成退款流水号
   */
  private generateRefundNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF${timestamp}${random}`;
  }

  /**
   * 生成签名
   */
  generateSignature(data: Record<string, any>, secret: string): string {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + `&key=${secret}`;
    
    return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  }

  /**
   * 验证签名
   */
  verifySignature(data: Record<string, any>, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return expectedSignature === signature;
  }
}
