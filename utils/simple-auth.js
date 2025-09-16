// 简化的微信小程序认证服务 - 重构版本
// 版本: 2.0.0
// 更新时间: 2025-01-16
//
// 🎯 重构改进:
// - 集成新的API客户端
// - 支持微信登录和手机号登录
// - 完善Token管理机制
// - 添加自动刷新功能
// - 提升错误处理能力
//
// 🔧 主要功能:
// - 用户认证状态管理
// - 多种登录方式支持
// - 安全的Token存储
// - 向后兼容的API

import { UserService } from './api.js'

class SimpleAuthService {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.init();
  }

  // 初始化认证状态
  init() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      const accessToken = wx.getStorageSync('access_token');

      if (userInfo && isLoggedIn && accessToken) {
        this.userInfo = userInfo;
        this.isLoggedIn = true;
        console.log('✅ 认证状态初始化成功:', userInfo.nickname);
      } else {
        console.log('ℹ️ 用户未登录');
      }
    } catch (error) {
      console.warn('❌ 初始化认证状态失败:', error);
    }
  }

  // 获取用户信息
  getUserInfo() {
    return this.userInfo;
  }

  // 检查登录状态
  isAuthenticated() {
    return this.isLoggedIn;
  }

  // 检查登录状态（兼容方法）
  checkLoginStatus() {
    return UserService.checkLoginStatus();
  }

  // 获取当前用户（兼容方法）
  getCurrentUser() {
    return this.userInfo;
  }

  // 微信登录 - 使用新的API客户端
  async loginWithWechat() {
    try {
      const result = await UserService.login();

      if (result.success) {
        this.userInfo = result.user;
        this.isLoggedIn = true;
        console.log('✅ 微信登录成功:', result.user.nickname);
        return { success: true, data: result.user };
      } else {
        console.error('❌ 微信登录失败:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ 微信登录异常:', error);
      return { success: false, error: error.message || '登录失败' };
    }
  }

  // 手机号登录
  async loginWithPhone(phone, code) {
    try {
      const result = await UserService.loginWithPhone(phone, code);

      if (result.success) {
        this.userInfo = result.user;
        this.isLoggedIn = true;
        console.log('✅ 手机号登录成功:', result.user.nickname);
        return { success: true, data: result.user };
      } else {
        console.error('❌ 手机号登录失败:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ 手机号登录异常:', error);
      return { success: false, error: error.message || '登录失败' };
    }
  }

  // 通用登录方法（兼容旧版本）
  async login(options = {}) {
    if (options.phone && options.code) {
      return this.loginWithPhone(options.phone, options.code);
    } else {
      return this.loginWithWechat();
    }
  }

  // 登出 - 使用新的API客户端
  async logout() {
    try {
      // 调用UserService的登出方法
      await UserService.logout();

      // 更新本地状态
      this.userInfo = null;
      this.isLoggedIn = false;

      console.log('✅ 用户已登出');
      return { success: true };
    } catch (error) {
      console.error('❌ 登出失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取平台信息
  getPlatformInfo() {
    try {
      // 使用新的API替代已废弃的getSystemInfoSync
      const deviceInfo = wx.getDeviceInfo();
      const windowInfo = wx.getWindowInfo();
      const appBaseInfo = wx.getAppBaseInfo();

      return {
        platform: deviceInfo.platform,
        version: appBaseInfo.version,
        supportedLoginMethods: ['wechat', 'phone'],
        canUseGetUserProfile: wx.canIUse('getUserProfile'),
        canUseGetUserInfo: wx.canIUse('getUserInfo')
      };
    } catch (error) {
      // 降级处理：如果新API不可用，使用旧API
      console.warn('使用新API失败，降级到旧API:', error);
      const systemInfo = wx.getSystemInfoSync();
      return {
        platform: systemInfo.platform,
        version: systemInfo.version,
        supportedLoginMethods: ['wechat', 'phone'],
        canUseGetUserProfile: wx.canIUse('getUserProfile'),
        canUseGetUserInfo: wx.canIUse('getUserInfo')
      };
    }
  }

  // 检查登录状态
  checkLoginStatus() {
    return this.isLoggedIn;
  }

  // 获取当前用户
  getCurrentUser() {
    return this.userInfo;
  }

  // 微信登录
  async loginWithWechat() {
    try {
      // 获取微信用户信息
      const userProfile = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善用户资料',
          success: resolve,
          fail: reject
        });
      });

      const userInfo = {
        id: 'user_' + Date.now(),
        nickname: userProfile.userInfo.nickName,
        avatar: userProfile.userInfo.avatarUrl,
        gender: userProfile.userInfo.gender,
        city: userProfile.userInfo.city,
        province: userProfile.userInfo.province
      };

      const result = await this.login(userInfo);
      return result;
    } catch (error) {
      console.error('微信登录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 发送验证码（模拟）
  async sendVerificationCode(phone, type = 'login') {
    try {
      // 模拟发送验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 在开发环境中显示验证码
      if (typeof wx !== 'undefined') {
        wx.showModal({
          title: '验证码',
          content: `验证码：${code}（仅开发环境显示）`,
          showCancel: false
        });
      }

      // 保存验证码到本地存储（仅用于测试）
      wx.setStorageSync(`verification_code_${phone}`, code);

      return { success: true, message: '验证码发送成功' };
    } catch (error) {
      console.error('发送验证码失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 手机号登录（模拟）
  async loginWithPhone(phone, code) {
    try {
      // 验证验证码
      const savedCode = wx.getStorageSync(`verification_code_${phone}`);
      if (savedCode !== code) {
        return { success: false, message: '验证码错误' };
      }

      // 创建用户信息
      const userInfo = {
        id: 'user_' + Date.now(),
        nickname: `用户${phone.slice(-4)}`,
        avatar: '/static/default-avatar.png',
        phone: phone
      };

      const result = await this.login(userInfo);

      // 清除验证码
      wx.removeStorageSync(`verification_code_${phone}`);

      return result;
    } catch (error) {
      console.error('手机号登录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 游客登录
  async guestLogin() {
    try {
      const guestId = 'guest_' + Date.now();
      const userInfo = {
        id: guestId,
        nickname: `游客${guestId.slice(-6)}`,
        avatar: '/static/default-avatar.png',
        isGuest: true
      };

      const result = await this.login(userInfo);
      return result;
    } catch (error) {
      console.error('游客登录失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const simpleAuthService = new SimpleAuthService();

export { simpleAuthService };
export default simpleAuthService;
