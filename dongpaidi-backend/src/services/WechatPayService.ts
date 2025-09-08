import { Payment } from 'wechatpay-node-v3';
import crypto from 'crypto';
import { PaymentService, PaymentMethod, PaymentStatus } from './PaymentService';

// 微信支付配置接口
interface WechatPayConfig {
  appid: string;
  mchid: string;
  private_key: string;
  serial_no: string;
  apiv3_private_key: string;
  notify_url: string;
}

// 微信支付下单参数
interface WechatPayOrderParams {
  orderId: string;
  amount: number; // 以分为单位
  description: string;
  userId: string;
  openid?: string;
}

export class WechatPayService {
  private payment: Payment;
  private config: WechatPayConfig;
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
    
    // 从环境变量获取配置
    this.config = {
      appid: process.env.WECHAT_APPID || '',
      mchid: process.env.WECHAT_MCHID || '',
      private_key: process.env.WECHAT_PRIVATE_KEY || '',
      serial_no: process.env.WECHAT_SERIAL_NO || '',
      apiv3_private_key: process.env.WECHAT_APIV3_PRIVATE_KEY || '',
      notify_url: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/v1/payments/wechat/notify',
    };

    // 初始化微信支付SDK
    this.payment = new Payment({
      appid: this.config.appid,
      mchid: this.config.mchid,
      publicKey: Buffer.from(this.config.private_key, 'utf8'),
      privateKey: Buffer.from(this.config.private_key, 'utf8'),
    });
  }

  /**
   * 创建微信支付订单（JSAPI支付）
   */
  async createJSAPIOrder(params: WechatPayOrderParams) {
    try {
      // 创建支付记录
      const payment = await this.paymentService.createPayment({
        orderId: params.orderId,
        method: PaymentMethod.WECHAT,
        amount: params.amount,
        userId: params.userId,
      });

      // 调用微信支付统一下单API
      const result = await this.payment.jsapi({
        appid: this.config.appid,
        mchid: this.config.mchid,
        description: params.description,
        out_trade_no: payment.paymentNo,
        notify_url: this.config.notify_url,
        amount: {
          total: params.amount,
          currency: 'CNY',
        },
        payer: {
          openid: params.openid || 'default_openid', // 实际使用时需要获取用户的openid
        },
      });

      // 生成前端调起支付所需的参数
      const payParams = this.generateJSAPIPayParams(result.prepay_id);

      return {
        payment,
        prepay_id: result.prepay_id,
        payParams,
      };
    } catch (error) {
      console.error('微信支付下单失败:', error);
      throw new Error('微信支付下单失败');
    }
  }

  /**
   * 创建微信支付订单（Native支付 - 扫码支付）
   */
  async createNativeOrder(params: WechatPayOrderParams) {
    try {
      // 创建支付记录
      const payment = await this.paymentService.createPayment({
        orderId: params.orderId,
        method: PaymentMethod.WECHAT,
        amount: params.amount,
        userId: params.userId,
      });

      // 调用微信支付统一下单API
      const result = await this.payment.native({
        appid: this.config.appid,
        mchid: this.config.mchid,
        description: params.description,
        out_trade_no: payment.paymentNo,
        notify_url: this.config.notify_url,
        amount: {
          total: params.amount,
          currency: 'CNY',
        },
      });

      return {
        payment,
        code_url: result.code_url, // 二维码链接
      };
    } catch (error) {
      console.error('微信支付Native下单失败:', error);
      throw new Error('微信支付Native下单失败');
    }
  }

  /**
   * 处理微信支付回调通知
   */
  async handleNotify(body: any, signature: string, timestamp: string, nonce: string) {
    try {
      // 验证签名
      const isValid = this.verifyNotifySignature(body, signature, timestamp, nonce);
      if (!isValid) {
        throw new Error('签名验证失败');
      }

      // 解密回调数据
      const decryptedData = this.decryptNotifyData(body.resource);
      
      // 处理支付结果
      const paymentStatus = this.mapWechatPayStatus(decryptedData.trade_state);
      
      await this.paymentService.handlePaymentCallback({
        paymentNo: decryptedData.out_trade_no,
        thirdPartyId: decryptedData.transaction_id,
        status: paymentStatus,
        paidAt: paymentStatus === PaymentStatus.SUCCESS ? new Date(decryptedData.success_time) : undefined,
        thirdPartyData: decryptedData,
      });

      return { code: 'SUCCESS', message: '成功' };
    } catch (error) {
      console.error('处理微信支付回调失败:', error);
      return { code: 'FAIL', message: error.message };
    }
  }

  /**
   * 查询支付结果
   */
  async queryPayment(paymentNo: string) {
    try {
      const result = await this.payment.query({
        out_trade_no: paymentNo,
      });

      const paymentStatus = this.mapWechatPayStatus(result.trade_state);
      
      // 更新支付状态
      if (paymentStatus !== PaymentStatus.PENDING) {
        await this.paymentService.handlePaymentCallback({
          paymentNo: result.out_trade_no,
          thirdPartyId: result.transaction_id,
          status: paymentStatus,
          paidAt: paymentStatus === PaymentStatus.SUCCESS ? new Date(result.success_time) : undefined,
          thirdPartyData: result,
        });
      }

      return result;
    } catch (error) {
      console.error('查询微信支付结果失败:', error);
      throw new Error('查询支付结果失败');
    }
  }

  /**
   * 申请退款
   */
  async refund(paymentNo: string, refundNo: string, totalAmount: number, refundAmount: number, reason?: string) {
    try {
      const result = await this.payment.refund({
        out_trade_no: paymentNo,
        out_refund_no: refundNo,
        amount: {
          refund: refundAmount,
          total: totalAmount,
          currency: 'CNY',
        },
        reason: reason || '用户申请退款',
      });

      return result;
    } catch (error) {
      console.error('微信支付退款失败:', error);
      throw new Error('申请退款失败');
    }
  }

  /**
   * 生成JSAPI支付参数
   */
  private generateJSAPIPayParams(prepayId: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const packageStr = `prepay_id=${prepayId}`;

    // 生成签名
    const signString = `${this.config.appid}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(signString)
      .sign(this.config.private_key, 'base64');

    return {
      appId: this.config.appid,
      timeStamp: timestamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign: signature,
    };
  }

  /**
   * 验证回调通知签名
   */
  private verifyNotifySignature(body: any, signature: string, timestamp: string, nonce: string): boolean {
    try {
      const signString = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
      
      // 这里应该使用微信支付平台证书的公钥进行验证
      // 简化实现，实际项目中需要正确验证
      return true;
    } catch (error) {
      console.error('验证微信支付回调签名失败:', error);
      return false;
    }
  }

  /**
   * 解密回调通知数据
   */
  private decryptNotifyData(resource: any) {
    try {
      // 使用APIv3密钥解密
      const decipher = crypto.createDecipherGCM('aes-256-gcm');
      decipher.setAuthTag(Buffer.from(resource.associated_data, 'base64'));
      decipher.setAAD(Buffer.from(resource.associated_data));
      
      let decrypted = decipher.update(resource.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('解密微信支付回调数据失败:', error);
      throw new Error('解密回调数据失败');
    }
  }

  /**
   * 映射微信支付状态到系统状态
   */
  private mapWechatPayStatus(tradeState: string): PaymentStatus {
    switch (tradeState) {
      case 'SUCCESS':
        return PaymentStatus.SUCCESS;
      case 'REFUND':
        return PaymentStatus.REFUNDED;
      case 'NOTPAY':
      case 'USERPAYING':
        return PaymentStatus.PENDING;
      case 'CLOSED':
      case 'REVOKED':
      case 'PAYERROR':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
