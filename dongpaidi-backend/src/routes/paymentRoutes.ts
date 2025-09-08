import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import Joi from 'joi';

// 简单的认证中间件
const authenticate = (req: any, res: any, next: any) => {
  // 简单的模拟认证，实际应该验证JWT token
  req.user = {
    id: 'current-user',
    email: 'user@dongpaidi.com',
    nickname: '当前用户',
  };
  next();
};

// 简单的验证中间件
const validate = (schema: any, source = 'body') => (req: any, res: any, next: any) => {
  const { error } = schema.validate(req[source]);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      code: 400,
    });
  }
  next();
};

const router = Router();
const paymentController = new PaymentController();

// 验证schemas
const createOrderSchema = Joi.object({
  title: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  amount: Joi.number().required().min(1).max(1000000), // 1分到10000元
  productType: Joi.string().required().valid('work', 'appointment', 'vip', 'other'),
  productId: Joi.string().required(),
  productInfo: Joi.object().optional(),
  expiresAt: Joi.date().optional(),
});

const wechatJSAPIPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  openid: Joi.string().required(),
});

const wechatNativePaymentSchema = Joi.object({
  orderId: Joi.string().required(),
});

const alipayPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
});

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().required().min(1),
  reason: Joi.string().optional().max(200),
});

const queryParamsSchema = Joi.object({
  page: Joi.number().optional().min(1).default(1),
  limit: Joi.number().optional().min(1).max(100).default(20),
});

const paymentQuerySchema = Joi.object({
  method: Joi.string().required().valid('wechat', 'alipay'),
});

// 订单管理路由
router.post('/orders', 
  authenticate, 
  validate(createOrderSchema), 
  paymentController.createOrder
);

router.get('/orders/:orderId', 
  authenticate, 
  paymentController.getOrder
);

router.get('/orders', 
  authenticate, 
  validate(queryParamsSchema, 'query'), 
  paymentController.getUserOrders
);

// 微信支付路由
router.post('/wechat/jsapi', 
  authenticate, 
  validate(wechatJSAPIPaymentSchema), 
  paymentController.createWechatJSAPIPayment
);

router.post('/wechat/native', 
  authenticate, 
  validate(wechatNativePaymentSchema), 
  paymentController.createWechatNativePayment
);

router.post('/wechat/notify', 
  paymentController.handleWechatNotify
);

// 支付宝支付路由
router.post('/alipay/page', 
  authenticate, 
  validate(alipayPaymentSchema), 
  paymentController.createAlipayPagePayment
);

router.post('/alipay/wap', 
  authenticate, 
  validate(alipayPaymentSchema), 
  paymentController.createAlipayWapPayment
);

router.post('/alipay/qr', 
  authenticate, 
  validate(alipayPaymentSchema), 
  paymentController.createAlipayQRPayment
);

router.post('/alipay/notify', 
  paymentController.handleAlipayNotify
);

// 支付查询路由
router.get('/query/:paymentNo', 
  authenticate, 
  validate(paymentQuerySchema, 'query'), 
  paymentController.queryPayment
);

// 退款路由
router.post('/refund', 
  authenticate, 
  validate(refundSchema), 
  paymentController.requestRefund
);

// 统计路由
router.get('/stats',
  authenticate,
  paymentController.getPaymentStats
);

// 管理员路由
router.get('/admin/stats',
  paymentController.getAdminPaymentStats
);

router.get('/admin/orders',
  paymentController.getAdminOrders
);

export default router;
