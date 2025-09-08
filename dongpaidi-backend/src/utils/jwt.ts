import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { JwtPayload, AuthTokens, ID } from '@/types';

/**
 * JWT工具类
 */
export class JwtUtil {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(userId: ID, platform: string): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId,
      platform,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'dongpaidi-api',
      audience: 'dongpaidi-client',
    } as jwt.SignOptions);
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(userId: ID, platform: string): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId,
      platform,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'dongpaidi-api',
      audience: 'dongpaidi-client',
    } as jwt.SignOptions);
  }

  /**
   * 生成令牌对
   */
  static generateTokens(userId: ID, platform: string): AuthTokens {
    const accessToken = this.generateAccessToken(userId, platform);
    const refreshToken = this.generateRefreshToken(userId, platform);

    // 解析访问令牌获取过期时间
    const decoded = jwt.decode(accessToken) as JwtPayload;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * 验证令牌
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'dongpaidi-api',
        audience: 'dongpaidi-client',
      }) as JwtPayload;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查令牌是否即将过期
   */
  static isTokenExpiringSoon(token: string, thresholdMinutes = 30): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      const now = Math.floor(Date.now() / 1000);
      const threshold = thresholdMinutes * 60;
      
      return decoded.exp - now < threshold;
    } catch (error) {
      return true;
    }
  }

  /**
   * 从请求头中提取令牌
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }

  /**
   * 刷新访问令牌
   */
  static refreshAccessToken(refreshToken: string): AuthTokens {
    try {
      const decoded = this.verifyToken(refreshToken);
      return this.generateTokens(decoded.userId, decoded.platform);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

export default JwtUtil;
