import { cacheService } from './cache';
import { CacheKeys } from './cacheKeys';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户会话信息
 */
export interface UserSession {
  userId: string;
  sessionId: string;
  deviceId?: string;
  platform?: string;
  ip?: string;
  userAgent?: string;
  loginTime: number;
  lastActiveTime: number;
  expiresAt: number;
}

/**
 * 会话管理器
 */
export class SessionManager {
  // 默认会话过期时间（7天）
  private static readonly DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60; // 7天（秒）
  
  // 会话活跃时间更新间隔（5分钟）
  private static readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5分钟（毫秒）

  /**
   * 创建用户会话
   * @param userId 用户ID
   * @param options 会话选项
   * @returns 会话信息
   */
  async createSession(userId: string, options: {
    deviceId?: string;
    platform?: string;
    ip?: string;
    userAgent?: string;
    ttl?: number;
  } = {}): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = Date.now();
    const ttl = options.ttl || SessionManager.DEFAULT_SESSION_TTL;
    
    const session: UserSession = {
      userId,
      sessionId,
      deviceId: options.deviceId,
      platform: options.platform,
      ip: options.ip,
      userAgent: options.userAgent,
      loginTime: now,
      lastActiveTime: now,
      expiresAt: now + (ttl * 1000),
    };

    // 存储会话信息
    const sessionKey = CacheKeys.user.session(sessionId);
    await cacheService.set(sessionKey, session, ttl);

    // 存储用户的活跃会话列表
    await this.addUserSession(userId, sessionId);

    console.log(`用户会话已创建: ${userId} -> ${sessionId}`);
    return session;
  }

  /**
   * 获取会话信息
   * @param sessionId 会话ID
   * @returns 会话信息
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const sessionKey = CacheKeys.user.session(sessionId);
    const session = await cacheService.get<UserSession>(sessionKey);
    
    if (!session) {
      return null;
    }

    // 检查会话是否过期
    if (Date.now() > session.expiresAt) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * 更新会话活跃时间
   * @param sessionId 会话ID
   * @returns 是否更新成功
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const now = Date.now();
    
    // 如果距离上次更新时间小于间隔，则跳过更新
    if (now - session.lastActiveTime < SessionManager.ACTIVITY_UPDATE_INTERVAL) {
      return true;
    }

    session.lastActiveTime = now;
    
    const sessionKey = CacheKeys.user.session(sessionId);
    const ttl = Math.floor((session.expiresAt - now) / 1000);
    
    if (ttl > 0) {
      await cacheService.set(sessionKey, session, ttl);
      return true;
    }

    return false;
  }

  /**
   * 销毁会话
   * @param sessionId 会话ID
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (session) {
      // 从用户会话列表中移除
      await this.removeUserSession(session.userId, sessionId);
    }

    // 删除会话缓存
    const sessionKey = CacheKeys.user.session(sessionId);
    await cacheService.del(sessionKey);

    console.log(`用户会话已销毁: ${sessionId}`);
  }

  /**
   * 销毁用户的所有会话
   * @param userId 用户ID
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.getUserSessions(userId);
    
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }

    // 清空用户会话列表
    const userSessionsKey = CacheKeys.user.session(`user:${userId}`);
    await cacheService.del(userSessionsKey);

    console.log(`用户所有会话已销毁: ${userId}`);
  }

  /**
   * 获取用户的所有会话ID
   * @param userId 用户ID
   * @returns 会话ID列表
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const userSessionsKey = CacheKeys.user.session(`user:${userId}`);
    const sessionIds = await cacheService.get<string[]>(userSessionsKey);
    return sessionIds || [];
  }

  /**
   * 添加用户会话到列表
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = CacheKeys.user.session(`user:${userId}`);
    const sessionIds = await this.getUserSessions(userId);
    
    if (!sessionIds.includes(sessionId)) {
      sessionIds.push(sessionId);
      await cacheService.set(userSessionsKey, sessionIds, SessionManager.DEFAULT_SESSION_TTL);
    }
  }

  /**
   * 从用户会话列表中移除会话
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = CacheKeys.user.session(`user:${userId}`);
    const sessionIds = await this.getUserSessions(userId);
    
    const index = sessionIds.indexOf(sessionId);
    if (index > -1) {
      sessionIds.splice(index, 1);
      
      if (sessionIds.length > 0) {
        await cacheService.set(userSessionsKey, sessionIds, SessionManager.DEFAULT_SESSION_TTL);
      } else {
        await cacheService.del(userSessionsKey);
      }
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    console.log('开始清理过期会话...');
    
    // 这里可以实现更复杂的清理逻辑
    // 由于Redis会自动过期键，这个方法主要用于清理用户会话列表中的无效引用
    
    // 获取所有用户会话列表键
    const pattern = CacheKeys.user.session('user:*');
    const redis = cacheService['redis'];
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const sessionIds = await cacheService.get<string[]>(key);
      if (!sessionIds) continue;
      
      const validSessionIds: string[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          validSessionIds.push(sessionId);
        }
      }
      
      if (validSessionIds.length !== sessionIds.length) {
        if (validSessionIds.length > 0) {
          await cacheService.set(key, validSessionIds, SessionManager.DEFAULT_SESSION_TTL);
        } else {
          await cacheService.del(key);
        }
      }
    }
    
    console.log('过期会话清理完成');
  }

  /**
   * 获取在线用户数量
   * @returns 在线用户数量
   */
  async getOnlineUserCount(): Promise<number> {
    const pattern = CacheKeys.user.session('user:*');
    const redis = cacheService['redis'];
    const keys = await redis.keys(pattern);
    return keys.length;
  }

  /**
   * 检查用户是否在线
   * @param userId 用户ID
   * @returns 是否在线
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const sessionIds = await this.getUserSessions(userId);
    
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取用户最后活跃时间
   * @param userId 用户ID
   * @returns 最后活跃时间戳
   */
  async getUserLastActiveTime(userId: string): Promise<number | null> {
    const sessionIds = await this.getUserSessions(userId);
    let lastActiveTime = 0;
    
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session && session.lastActiveTime > lastActiveTime) {
        lastActiveTime = session.lastActiveTime;
      }
    }
    
    return lastActiveTime > 0 ? lastActiveTime : null;
  }
}

// 创建会话管理器实例
export const sessionManager = new SessionManager();

export default sessionManager;
