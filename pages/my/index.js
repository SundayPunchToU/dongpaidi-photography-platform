// 🔧 修复: 使用新的API服务类
import { UserService } from '../../utils/api.js';
import useToastBehavior from '../../behaviors/useToast.js';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    service: [],
    personalInfo: {},
    gridList: [
      {
        name: '全部发布',
        icon: 'root-list',
        type: 'all',
        url: '',
      },
      {
        name: '审核中',
        icon: 'search',
        type: 'progress',
        url: '',
      },
      {
        name: '已发布',
        icon: 'upload',
        type: 'published',
        url: '',
      },
      {
        name: '草稿箱',
        icon: 'file-copy',
        type: 'draft',
        url: '',
      },
    ],

    settingList: [
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.getServiceList();
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    const personalInfo = await this.getPersonalInfo();

    if (Token) {
      this.setData({
        isLoad: true,
        personalInfo,
      });
    }
  },

  // 🔧 修复: 使用新的API服务类获取服务列表
  async getServiceList() {
    try {
      // 这里应该调用真实的服务列表API
      // 暂时使用模拟数据
      const mockService = [
        { name: '在线客服', icon: 'service', contact: 'service@dongpaidi.com' },
        { name: '技术支持', icon: 'help', contact: 'tech@dongpaidi.com' }
      ];
      this.setData({ service: mockService });
    } catch (error) {
      console.error('获取服务列表失败:', error);
    }
  },

  // 🔧 修复: 使用新的API服务类获取个人信息
  async getPersonalInfo() {
    try {
      const result = await UserService.getCurrentUser();
      if (result.success && result.user) {
        return {
          nickname: result.user.nickname || '用户',
          avatar: result.user.avatar || '/static/default-avatar.png',
          level: result.user.level || 1,
          experience: result.user.experience || 0
        };
      } else {
        console.error('获取个人信息失败:', result.error);
        return {
          nickname: '用户',
          avatar: '/static/default-avatar.png',
          level: 1,
          experience: 0
        };
      }
    } catch (error) {
      console.error('获取个人信息异常:', error);
      return {
        nickname: '用户',
        avatar: '/static/default-avatar.png',
        level: 1,
        experience: 0
      };
    }
  },

  onLogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  onEleClick(e) {
    const { name, url } = e.currentTarget.dataset.data;
    if (url) return;
    this.onShowToast('#t-toast', name);
  },
});
