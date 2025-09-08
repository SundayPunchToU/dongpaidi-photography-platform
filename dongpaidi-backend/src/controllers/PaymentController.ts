import { Request, Response } from 'express';
import { PaymentService, CreateOrderDto, PaymentMethod } from '../services/PaymentService';
import { WechatPayService } from '../services/WechatPayService';
import { AlipayService } from '../services/AlipayService';

// 简单的响应工具
class ResponseUtil {
  static success(res: Response, data: any, message = 'Success', status = 200) {
    res.status(status).json({
      success: true,
      data,
      message,
      code: status,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res: Response, message: string, status = 400, code?: string) {
    res.status(status).json({
      success: false,
      message,
      code: code || status,
      timestamp: new Date().toISOString(),
    });
  }

  static successWithPagination(res: Response, result: any, message = 'Success') {
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      message,
      code: 200,
      timestamp: new Date().toISOString(),
    });
  }
}

// 简单的异步处理器
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 认证请求接口
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

export class PaymentController {
  private paymentService: PaymentService;
  private wechatPayService: WechatPayService;
  private alipayService: AlipayService;

  constructor() {
    this.paymentService = new PaymentService();
    this.wechatPayService = new WechatPayService();
    this.alipayService = new AlipayService();
  }

  /**
   * 创建订单
   */
  createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const orderData: CreateOrderDto = {
      ...req.body,
      userId: req.user.id,
    };

    const order = await this.paymentService.createOrder(orderData);

    console.log('订单创建成功', {
      orderId: order.id,
      orderNo: order.orderNo,
      userId: req.user.id,
      amount: order.amount,
      ip: req.ip,
    });

    ResponseUtil.success(res, order, '订单创建成功', 201);
  });

  /**
   * 获取订单详情
   */
  getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;
    
    const order = await this.paymentService.getOrder(orderId);

    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限访问此订单', 403);
    }

    ResponseUtil.success(res, order, '获取订单详情成功');
  });

  /**
   * 获取用户订单列表
   */
  getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    
    const result = await this.paymentService.getUserOrders(
      req.user.id,
      Number(page),
      Number(limit)
    );

    console.log('用户订单列表获取成功', {
      userId: req.user.id,
      resultCount: result.items.length,
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取订单列表成功');
  });

  /**
   * 微信支付下单（JSAPI）
   */
  createWechatJSAPIPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId, openid } = req.body;
    
    const order = await this.paymentService.getOrder(orderId);
    
    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限操作此订单', 403);
    }

    const result = await this.wechatPayService.createJSAPIOrder({
      orderId,
      amount: order.amount,
      description: order.title,
      userId: req.user.id,
      openid,
    });

    console.log('微信JSAPI支付下单成功', {
      orderId,
      paymentId: result.payment.id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '微信支付下单成功');
  });

  /**
   * 微信支付下单（Native扫码）
   */
  createWechatNativePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.body;
    
    const order = await this.paymentService.getOrder(orderId);
    
    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限操作此订单', 403);
    }

    const result = await this.wechatPayService.createNativeOrder({
      orderId,
      amount: order.amount,
      description: order.title,
      userId: req.user.id,
    });

    console.log('微信Native支付下单成功', {
      orderId,
      paymentId: result.payment.id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '微信扫码支付下单成功');
  });

  /**
   * 支付宝网页支付下单
   */
  createAlipayPagePayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.body;
    
    const order = await this.paymentService.getOrder(orderId);
    
    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限操作此订单', 403);
    }

    const result = await this.alipayService.createPagePayOrder({
      orderId,
      amount: order.amount,
      subject: order.title,
      body: order.description,
      userId: req.user.id,
    });

    console.log('支付宝网页支付下单成功', {
      orderId,
      paymentId: result.payment.id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '支付宝网页支付下单成功');
  });

  /**
   * 支付宝手机网站支付下单
   */
  createAlipayWapPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.body;
    
    const order = await this.paymentService.getOrder(orderId);
    
    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限操作此订单', 403);
    }

    const result = await this.alipayService.createWapPayOrder({
      orderId,
      amount: order.amount,
      subject: order.title,
      body: order.description,
      userId: req.user.id,
    });

    console.log('支付宝手机网站支付下单成功', {
      orderId,
      paymentId: result.payment.id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '支付宝手机网站支付下单成功');
  });

  /**
   * 支付宝扫码支付下单
   */
  createAlipayQRPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.body;
    
    const order = await this.paymentService.getOrder(orderId);
    
    // 验证用户权限
    if (order.userId !== req.user.id) {
      return ResponseUtil.error(res, '无权限操作此订单', 403);
    }

    const result = await this.alipayService.createQRPayOrder({
      orderId,
      amount: order.amount,
      subject: order.title,
      body: order.description,
      userId: req.user.id,
    });

    console.log('支付宝扫码支付下单成功', {
      orderId,
      paymentId: result.payment.id,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, result, '支付宝扫码支付下单成功');
  });

  /**
   * 微信支付回调通知
   */
  handleWechatNotify = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['wechatpay-signature'] as string;
    const timestamp = req.headers['wechatpay-timestamp'] as string;
    const nonce = req.headers['wechatpay-nonce'] as string;

    const result = await this.wechatPayService.handleNotify(req.body, signature, timestamp, nonce);

    console.log('微信支付回调处理结果', {
      result,
      ip: req.ip,
    });

    res.json(result);
  });

  /**
   * 支付宝支付回调通知
   */
  handleAlipayNotify = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.alipayService.handleNotify(req.body);

    console.log('支付宝支付回调处理结果', {
      result,
      ip: req.ip,
    });

    res.send(result);
  });

  /**
   * 查询支付结果
   */
  queryPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { paymentNo } = req.params;
    const { method } = req.query;

    let result;
    if (method === PaymentMethod.WECHAT) {
      result = await this.wechatPayService.queryPayment(paymentNo);
    } else if (method === PaymentMethod.ALIPAY) {
      result = await this.alipayService.queryPayment(paymentNo);
    } else {
      return ResponseUtil.error(res, '不支持的支付方式', 400);
    }

    ResponseUtil.success(res, result, '查询支付结果成功');
  });

  /**
   * 申请退款
   */
  requestRefund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { paymentId, amount, reason } = req.body;

    const refund = await this.paymentService.requestRefund(
      paymentId,
      amount,
      reason,
      req.user.id
    );

    console.log('退款申请成功', {
      refundId: refund.id,
      paymentId,
      amount,
      userId: req.user.id,
      ip: req.ip,
    });

    ResponseUtil.success(res, refund, '退款申请成功', 201);
  });

  /**
   * 获取支付统计
   */
  getPaymentStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await this.paymentService.getPaymentStats(req.user.id);

    ResponseUtil.success(res, stats, '获取支付统计成功');
  });

  /**
   * 管理员获取所有支付统计
   */
  getAdminPaymentStats = asyncHandler(async (req: Request, res: Response) => {
    // TODO: 验证管理员权限

    const stats = await this.paymentService.getPaymentStats();

    ResponseUtil.success(res, stats, '获取支付统计成功');
  });

  /**
   * 管理员获取所有订单列表
   */
  getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
    // TODO: 验证管理员权限

    const { page = '1', limit = '20', search, status, method, startDate, endDate } = req.query;

    // 这里应该实现更复杂的查询逻辑，包括搜索、筛选等
    // 暂时返回模拟数据
    const mockOrders = [
      {
        id: 'order1',
        orderNo: 'ORD1735734938123ABC',
        title: '人像摄影服务',
        description: '专业人像摄影，包含化妆造型',
        amount: 50000, // 500元
        status: 'paid',
        productType: 'appointment',
        productId: 'appt1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        user: {
          id: 'user1',
          nickname: '摄影爱好者小王',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        },
        payments: [
          {
            id: 'payment1',
            paymentNo: 'PAY1735734938456DEF',
            amount: 50000,
            method: 'wechat',
            status: 'success',
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'order2',
        orderNo: 'ORD1735734938789GHI',
        title: '风景摄影作品购买',
        description: '高清风景摄影作品数字版权',
        amount: 20000, // 200元
        status: 'pending',
        productType: 'work',
        productId: 'work1',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        user: {
          id: 'user2',
          nickname: '模特小李',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616c6d4e6e8?w=100',
        },
        payments: [
          {
            id: 'payment2',
            paymentNo: 'PAY1735734938789JKL',
            amount: 20000,
            method: 'alipay',
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ],
      },
    ];

    const result = {
      items: mockOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockOrders.length,
        pages: 1,
      },
    };

    console.log('管理员订单列表获取成功', {
      resultCount: result.items.length,
      filters: { search, status, method, startDate, endDate },
      ip: req.ip,
    });

    ResponseUtil.successWithPagination(res, result, '获取订单列表成功');
  });
}
