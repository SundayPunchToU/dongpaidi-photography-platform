import axios from 'axios';
import { db } from '@/config/database';
import { config } from '@/config';
import { JwtUtil } from '@/utils/jwt';
import { log } from '@/config/logger';
import { 
  LoginDto, 
  AuthTokens, 
  WechatUserInfo, 
  WechatLoginResponse,
  CreateUserDto,
  ID 
} from '@/types';
import { BusinessError, NotFoundError } from '@/middleware/error';

/**
 * 认证服务类
 */
export class AuthService {
  /**
   * 微信小程序登录
   */
  async wechatLogin(loginData: LoginDto): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      const { code, userInfo } = loginData;
      
      if (!code) {
        throw new BusinessError('微信登录code不能为空');
      }

      // 1. 通过code获取openid
      const wechatResponse = await this.getWechatOpenId(code);
      
      if (!wechatResponse.openid) {
        throw new BusinessError('微信登录失败，请重试');
      }

      // 2. 查找或创建用户
      let user = await db.prisma.user.findUnique({
        where: { openid: wechatResponse.openid },
      });

      if (!user) {
        // 创建新用户
        const createUserData: CreateUserDto = {
          openid: wechatResponse.openid,
          platform: 'wechat',
          nickname: userInfo?.nickname || '微信用户',
          avatarUrl: userInfo?.avatarUrl || '',
        };

        user = await this.createUser(createUserData);
        log.info('New wechat user created', { userId: user.id, openid: wechatResponse.openid });
      } else {
        // 更新用户最后活跃时间
        user = await db.prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      }

      // 3. 生成JWT tokens
      const tokens = JwtUtil.generateTokens(user.id, 'wechat');

      log.info('Wechat login successful', { userId: user.id });

      return {
        user: this.formatUserResponse(user),
        tokens,
      };
    } catch (error: any) {
      log.error('Wechat login failed', { error: error.message, code: loginData.code });
      throw error;
    }
  }

  /**
   * 手机号登录
   */
  async phoneLogin(loginData: LoginDto): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      const { phone, code } = loginData;
      
      if (!phone || !code) {
        throw new BusinessError('手机号和验证码不能为空');
      }

      // 1. 验证短信验证码
      const isValidCode = await this.verifySmsCode(phone, code);
      if (!isValidCode) {
        throw new BusinessError('验证码错误或已过期');
      }

      // 2. 查找或创建用户
      let user = await db.prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        // 创建新用户
        const createUserData: CreateUserDto = {
          phone,
          platform: 'wechat', // 默认平台，后续可以根据客户端类型调整
          nickname: `用户${phone.slice(-4)}`,
        };

        user = await this.createUser(createUserData);
        log.info('New phone user created', { userId: user.id, phone });
      } else {
        // 更新用户最后活跃时间
        user = await db.prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      }

      // 3. 生成JWT tokens
      const tokens = JwtUtil.generateTokens(user.id, user.platform);

      log.info('Phone login successful', { userId: user.id });

      return {
        user: this.formatUserResponse(user),
        tokens,
      };
    } catch (error: any) {
      log.error('Phone login failed', { error: error.message, phone: loginData.phone });
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = JwtUtil.verifyToken(refreshToken);
      
      // 验证用户是否存在且状态正常
      const user = await db.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, status: true, platform: true },
      });

      if (!user) {
        throw new NotFoundError('用户不存在');
      }

      if (user.status !== 'active') {
        throw new BusinessError('账户已被暂停');
      }

      // 生成新的token对
      const tokens = JwtUtil.generateTokens(user.id, user.platform);

      log.info('Token refreshed', { userId: user.id });

      return tokens;
    } catch (error: any) {
      log.error('Token refresh failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId: ID): Promise<any> {
    const user = await db.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            works: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return this.formatUserResponse(user);
  }

  /**
   * 创建用户
   */
  private async createUser(userData: CreateUserDto): Promise<any> {
    return db.prisma.user.create({
      data: {
        ...userData,
        specialties: '[]',
        equipment: '[]',
      },
    });
  }

  /**
   * 获取微信OpenID
   */
  private async getWechatOpenId(code: string): Promise<WechatLoginResponse> {
    try {
      const response = await axios.get(config.wechat.loginUrl, {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.appSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
        timeout: 10000,
      });

      if (response.data.errcode) {
        throw new BusinessError(`微信登录失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new BusinessError('微信服务暂时不可用，请稍后重试');
      }
      throw error;
    }
  }

  /**
   * 验证短信验证码（模拟实现）
   */
  private async verifySmsCode(phone: string, code: string): Promise<boolean> {
    // TODO: 实现真实的短信验证码验证逻辑
    // 这里暂时使用模拟验证，开发环境下验证码为 123456
    if (config.server.isDevelopment && code === '123456') {
      return true;
    }

    // 生产环境需要实现真实的验证逻辑
    // 1. 从Redis中获取验证码
    // 2. 比较验证码是否匹配
    // 3. 检查是否过期
    // 4. 删除已使用的验证码

    log.warn('SMS code verification not implemented', { phone, code });
    return false;
  }

  /**
   * 格式化用户响应数据
   */
  private formatUserResponse(user: any): any {
    const { 
      id, 
      nickname, 
      avatarUrl, 
      bio, 
      isPhotographer, 
      isModel, 
      isVerified,
      location,
      specialties,
      equipment,
      createdAt,
      _count 
    } = user;

    return {
      id,
      nickname,
      avatarUrl,
      bio,
      isPhotographer,
      isModel,
      isVerified,
      location,
      specialties,
      equipment,
      stats: {
        worksCount: _count?.works || 0,
        followersCount: _count?.followers || 0,
        followingCount: _count?.following || 0,
        totalLikes: user.totalLikes || 0,
      },
      createdAt,
    };
  }
}

export default AuthService;
