import request from '~/api/request';
import { simpleAuthService } from '../../utils/simple-auth.js';
import { getEnvConfig } from '../../config/index.js';

Page({
  data: {
    phoneNumber: '',
    isPhoneNumber: false,
    isCheck: false,
    isSubmit: false,
    isPasswordLogin: false,
    passwordInfo: {
      account: '',
      password: '',
    },
    radioValue: '',
    // 多平台支持
    platformInfo: {},
    showMultiPlatformOption: false,
  },

  onLoad() {
    // 获取平台信息
    const platformInfo = simpleAuthService.getPlatformInfo();
    const envConfig = getEnvConfig();
    console.log('🔍 登录页面平台信息:', platformInfo);
    console.log('🔧 环境配置:', envConfig);

    this.setData({
      platformInfo,
      showMultiPlatformOption: !platformInfo.isWechatMiniProgram,
      showTestEntry: envConfig.showTestEntry
    });
  },

  /* 自定义功能函数 */
  changeSubmit() {
    if (this.data.isPasswordLogin) {
      if (this.data.passwordInfo.account !== '' && this.data.passwordInfo.password !== '' && this.data.isCheck) {
        this.setData({ isSubmit: true });
      } else {
        this.setData({ isSubmit: false });
      }
    } else if (this.data.isPhoneNumber && this.data.isCheck) {
      this.setData({ isSubmit: true });
    } else {
      this.setData({ isSubmit: false });
    }
  },

  // 手机号变更
  onPhoneInput(e) {
    const isPhoneNumber = /^[1][3,4,5,7,8,9][0-9]{9}$/.test(e.detail.value);
    this.setData({
      isPhoneNumber,
      phoneNumber: e.detail.value,
    });
    this.changeSubmit();
  },

  // 用户协议选择变更
  onCheckChange(e) {
    const { value } = e.detail;
    this.setData({
      radioValue: value,
      isCheck: value === 'agree',
    });
    this.changeSubmit();
  },

  onAccountChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, account: e.detail.value } });
    this.changeSubmit();
  },

  onPasswordChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, password: e.detail.value } });
    this.changeSubmit();
  },

  // 切换登录方式
  changeLogin() {
    this.setData({ isPasswordLogin: !this.data.isPasswordLogin, isSubmit: false });
  },

  async login() {
    if (this.data.isPasswordLogin) {
      const res = await request('/login/postPasswordLogin', 'post', { data: this.data.passwordInfo });
      if (res.success) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.switchTab({
          url: `/pages/my/index`,
        });
      }
    } else {
      const res = await request('/login/getSendMessage', 'get');
      if (res.success) {
        wx.navigateTo({
          url: `/pages/loginCode/loginCode?phoneNumber=${this.data.phoneNumber}`,
        });
      }
    }
  },

  // 微信快速登录
  async onWechatLogin() {
    try {
      wx.showLoading({ title: '登录中...' });

      const result = await simpleAuthService.loginWithWechat();

      wx.hideLoading();

      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/discover/index'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('微信登录失败:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      });
    }
  },

  // 跳转到多平台登录页面
  onGoToMultiPlatformLogin() {
    wx.navigateTo({
      url: '/pages/login/multi-platform-login'
    });
  },

  // 跳转到登录测试页面（开发环境）
  onGoToTestLogin() {
    wx.navigateTo({
      url: '/pages/login/test-login'
    });
  },

  // 跳转到登录测试页面（开发环境）
  onGoToTestLogin() {
    wx.navigateTo({
      url: '/pages/login/test-login'
    });
  },
});
