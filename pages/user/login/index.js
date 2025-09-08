// 登录页面
const app = getApp();

Page({
  data: {
    phone: '',
    code: '',
    loading: false
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  // 返回按钮
  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      // 如果是第一个页面，跳转到发现页
      wx.switchTab({ url: '/pages/discover/index' });
    }
  },

  // 注册按钮
  onRegister() {
    wx.showToast({ title: '注册功能开发中', icon: 'none' });
  },

  // 快速登录（测试用）
  onQuickLogin() {
    this.setData({ loading: true });

    // 模拟快速登录
    setTimeout(() => {
      // 设置全局用户信息
      app.globalData.userInfo = {
        id: 'test_user_001',
        nickName: '测试用户',
        avatarUrl: '/static/default-avatar.png',
        phone: '138****8888',
        city: '北京',
        tags: ['摄影爱好者', '人像摄影']
      };

      // 存储登录状态
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      wx.setStorageSync('isLoggedIn', true);

      wx.showToast({ title: '登录成功', icon: 'success' });

      // 登录成功后的跳转逻辑
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          // 如果是从其他页面跳转过来的，返回上一页
          wx.navigateBack();
        } else {
          // 如果是直接打开登录页，跳转到我的页面
          wx.switchTab({ url: '/pages/profile/index' });
        }
      }, 500);

      this.setData({ loading: false });
    }, 1000);
  },

  async onLogin() {
    const { phone, code } = this.data;

    if (!phone || !code) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      // 模拟登录API
      setTimeout(() => {
        // 设置全局用户信息
        app.globalData.userInfo = {
          id: 'user_' + Date.now(),
          nickName: '用户' + phone.slice(-4),
          avatarUrl: '/static/default-avatar.png',
          phone: phone,
          city: '未设置',
          tags: ['新用户']
        };

        // 存储登录状态
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        wx.setStorageSync('isLoggedIn', true);

        wx.showToast({ title: '登录成功', icon: 'success' });

        // 登录成功后的跳转逻辑
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            // 如果是从其他页面跳转过来的，返回上一页
            wx.navigateBack();
          } else {
            // 如果是直接打开登录页，跳转到我的页面
            wx.switchTab({ url: '/pages/profile/index' });
          }
        }, 500);

        this.setData({ loading: false });
      }, 1000);
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  }
});
