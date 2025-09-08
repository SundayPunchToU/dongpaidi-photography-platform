import AlipaySdk from 'alipay-sdk';
import { PaymentService, PaymentMethod, PaymentStatus } from './PaymentService';

// 支付宝配置接口
interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
}

// 支付宝下单参数
interface AlipayOrderParams {
  orderId: string;
  amount: number; // 以分为单位，需要转换为元
  subject: string;
  body?: string;
  userId: string;
}

export class AlipayService {
  private alipaySdk: AlipaySdk;
  private config: AlipayConfig;
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
    
    // 从环境变量获取配置
    this.config = {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3000/api/v1/payments/alipay/notify',
      returnUrl: process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/payment/success',
    };

    // 初始化支付宝SDK
    this.alipaySdk = new AlipaySdk({
      appId: this.config.appId,
      privateKey: this.config.privateKey,
      alipayPublicKey: this.config.alipayPublicKey,
      gateway: this.config.gateway,
      timeout: 5000,
      camelCase: true,
    });
  }

  /**
   * 创建支付宝网页支付订单
   */
  async createPagePayOrder(params: AlipayOrderParams) {
    try {
      // 创建支付记录
      const payment = await this.paymentService.createPayment({
        orderId: params.orderId,
        method: PaymentMethod.ALIPAY,
        amount: params.amount,
        userId: params.userId,
      });

      // 调用支付宝统一收单下单并支付页面接口
      const formData = await this.alipaySdk.pageExec('alipay.trade.page.pay', {
        bizContent: {
          outTradeNo: payment.paymentNo,
          productCode: 'FAST_INSTANT_TRADE_PAY',
          totalAmount: (params.amount / 100).toFixed(2), // 转换为元
          subject: params.subject,
          body: params.body,
          timeoutExpress: '30m', // 30分钟超时
        },
        notifyUrl: this.config.notifyUrl,
        returnUrl: this.config.returnUrl,
      });

      return {
        payment,
        formData, // 返回表单数据，前端可以直接提交
      };
    } catch (error) {
      console.error('支付宝网页支付下单失败:', error);
      throw new Error('支付宝网页支付下单失败');
    }
  }

  /**
   * 创建支付宝手机网站支付订单
   */
  async createWapPayOrder(params: AlipayOrderParams) {
    try {
      // 创建支付记录
      const payment = await this.paymentService.createPayment({
        orderId: params.orderId,
        method: PaymentMethod.ALIPAY,
        amount: params.amount,
        userId: params.userId,
      });

      // 调用支付宝手机网站支付接口
      const formData = await this.alipaySdk.pageExec('alipay.trade.wap.pay', {
        bizContent: {
          outTradeNo: payment.paymentNo,
          productCode: 'QUICK_WAP_WAY',
          totalAmount: (params.amount / 100).toFixed(2), // 转换为元
          subject: params.subject,
          body: params.body,
          timeoutExpress: '30m',
        },
        notifyUrl: this.config.notifyUrl,
        returnUrl: this.config.returnUrl,
      });

      return {
        payment,
        formData,
      };
    } catch (error) {
      console.error('支付宝手机网站支付下单失败:', error);
      throw new Error('支付宝手机网站支付下单失败');
    }
  }

  /**
   * 创建支付宝扫码支付订单
   */
  async createQRPayOrder(params: AlipayOrderParams) {
    try {
      // 创建支付记录
      const payment = await this.paymentService.createPayment({
        orderId: params.orderId,
        method: PaymentMethod.ALIPAY,
        amount: params.amount,
        userId: params.userId,
      });

      // 调用支付宝统一收单线下交易预创建接口
      const result = await this.alipaySdk.exec('alipay.trade.precreate', {
        bizContent: {
          outTradeNo: payment.paymentNo,
          totalAmount: (params.amount / 100).toFixed(2), // 转换为元
          subject: params.subject,
          body: params.body,
          timeoutExpress: '30m',
        },
        notifyUrl: this.config.notifyUrl,
      });

      if (result.code !== '10000') {
        throw new Error(`支付宝下单失败: ${result.msg}`);
      }

      return {
        payment,
        qrCode: result.qrCode, // 二维码内容
      };
    } catch (error) {
      console.error('支付宝扫码支付下单失败:', error);
      throw new Error('支付宝扫码支付下单失败');
    }
  }

  /**
   * 处理支付宝支付回调通知
   */
  async handleNotify(params: Record<string, any>) {
    try {
      // 验证签名
      const isValid = this.alipaySdk.checkNotifySign(params);
      if (!isValid) {
        throw new Error('签名验证失败');
      }

      // 处理支付结果
      const paymentStatus = this.mapAlipayStatus(params.trade_status);
      
      await this.paymentService.handlePaymentCallback({
        paymentNo: params.out_trade_no,
        thirdPartyId: params.trade_no,
        status: paymentStatus,
        paidAt: paymentStatus === PaymentStatus.SUCCESS ? new Date(params.gmt_payment) : undefined,
        thirdPartyData: params,
      });

      return 'success';
    } catch (error) {
      console.error('处理支付宝支付回调失败:', error);
      return 'fail';
    }
  }

  /**
   * 查询支付结果
   */
  async queryPayment(paymentNo: string) {
    try {
      const result = await this.alipaySdk.exec('alipay.trade.query', {
        bizContent: {
          outTradeNo: paymentNo,
        },
      });

      if (result.code !== '10000') {
        throw new Error(`查询支付结果失败: ${result.msg}`);
      }

      const paymentStatus = this.mapAlipayStatus(result.tradeStatus);
      
      // 更新支付状态
      if (paymentStatus !== PaymentStatus.PENDING) {
        await this.paymentService.handlePaymentCallback({
          paymentNo: result.outTradeNo,
          thirdPartyId: result.tradeNo,
          status: paymentStatus,
          paidAt: paymentStatus === PaymentStatus.SUCCESS ? new Date(result.sendPayDate) : undefined,
          thirdPartyData: result,
        });
      }

      return result;
    } catch (error) {
      console.error('查询支付宝支付结果失败:', error);
      throw new Error('查询支付结果失败');
    }
  }

  /**
   * 申请退款
   */
  async refund(paymentNo: string, refundAmount: number, refundReason?: string) {
    try {
      const result = await this.alipaySdk.exec('alipay.trade.refund', {
        bizContent: {
          outTradeNo: paymentNo,
          refundAmount: (refundAmount / 100).toFixed(2), // 转换为元
          refundReason: refundReason || '用户申请退款',
        },
      });

      if (result.code !== '10000') {
        throw new Error(`支付宝退款失败: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('支付宝退款失败:', error);
      throw new Error('申请退款失败');
    }
  }

  /**
   * 查询退款结果
   */
  async queryRefund(paymentNo: string, refundNo: string) {
    try {
      const result = await this.alipaySdk.exec('alipay.trade.fastpay.refund.query', {
        bizContent: {
          outTradeNo: paymentNo,
          outRequestNo: refundNo,
        },
      });

      if (result.code !== '10000') {
        throw new Error(`查询退款结果失败: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('查询支付宝退款结果失败:', error);
      throw new Error('查询退款结果失败');
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(paymentNo: string) {
    try {
      const result = await this.alipaySdk.exec('alipay.trade.close', {
        bizContent: {
          outTradeNo: paymentNo,
        },
      });

      if (result.code !== '10000') {
        throw new Error(`关闭订单失败: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('关闭支付宝订单失败:', error);
      throw new Error('关闭订单失败');
    }
  }

  /**
   * 映射支付宝支付状态到系统状态
   */
  private mapAlipayStatus(tradeStatus: string): PaymentStatus {
    switch (tradeStatus) {
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        return PaymentStatus.SUCCESS;
      case 'TRADE_CLOSED':
        return PaymentStatus.CANCELLED;
      case 'WAIT_BUYER_PAY':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * 验证同步返回结果
   */
  verifyReturn(params: Record<string, any>): boolean {
    return this.alipaySdk.checkNotifySign(params);
  }
}
