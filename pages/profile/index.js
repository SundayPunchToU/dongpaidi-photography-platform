const app = getApp();
// 🔧 修复: 导入新的API服务类
import { UserService, WorksService } from '../../utils/api.js';
// 导入网络检测
import { networkChecker } from '../../utils/network-check.js';

Page({
  data: {
    userInfo: null,
    userStats: {
      worksCount: 0,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      ordersCount: 0
    },
    myWorks: [],
    myAppointments: [],
    currentTab: 'works',
    loading: false,

    // 专业摄影师数据
    pendingEarnings: 0,
    pendingOrders: 0,

    // 用户等级配置
    userLevels: {
      'beginner': { icon: 'user', title: '摄影新手' },
      'amateur': { icon: 'star', title: '摄影爱好者' },
      'professional': { icon: 'crown', title: '专业摄影师' },
      'master': { icon: 'trophy', title: '摄影大师' }
    }
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'profile'
      });
    }

    // 每次显示页面时刷新数据（但不重复检查登录状态）
    if (this.data.userInfo) {
      this.loadUserStats();
      this.loadMyWorks();
    } else {
      this.initPage();
    }
  },

  // 初始化页面
  initPage() {
    // 先从缓存中获取用户信息
    const cachedUserInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = wx.getStorageSync('isLoggedIn');

    if (cachedUserInfo && isLoggedIn) {
      // 更新全局状态
      app.globalData.userInfo = cachedUserInfo;
      this.setData({ userInfo: cachedUserInfo });
      this.loadUserStats();
      this.loadMyWorks();
    } else {
      // 显示登录提示，而不是直接跳转
      this.showLoginPrompt();
    }
  },

  // 显示登录提示
  showLoginPrompt() {
    wx.showModal({
      title: '需要登录',
      content: '请先登录后查看个人信息',
      confirmText: '微信登录',
      cancelText: '返回',
      success: async (res) => {
        if (res.confirm) {
          await this.handleWechatLogin()
        } else {
          wx.switchTab({ url: '/pages/discover/index' });
        }
      }
    });
  },

  // 🔐 处理微信登录（真机环境优化）
  async handleWechatLogin() {
    try {
      console.log('🔐 真机环境登录开始...')

      // 第一步：检查网络连接
      const networkStatus = await networkChecker.checkConnection()
      if (!networkStatus.isConnected) {
        wx.showModal({
          title: '网络连接失败',
          content: '请检查网络连接后重试',
          showCancel: false
        })
        return
      }

      console.log('📶 网络连接正常:', networkStatus.networkType)

      // 第二步：显示登录选项
      wx.showActionSheet({
        itemList: ['微信授权登录', '游客模式体验'],
        success: async (res) => {
          if (res.tapIndex === 0) {
            await this.performWechatLogin()
          } else {
            await this.performGuestLogin()
          }
        },
        fail: () => {
          console.log('用户取消登录选择')
        }
      })

    } catch (error) {
      console.error('❌ 登录流程异常:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    }
  },

  // 执行微信登录
  async performWechatLogin() {
    try {
      wx.showLoading({ title: '微信登录中...' })

      const result = await authService.login()

      wx.hideLoading()

      if (result.success) {
        console.log('✅ 微信登录成功:', result.user)
        await this.updateUserInterface(result.user)

        wx.showToast({
          title: '登录成功！',
          icon: 'success'
        })
      } else {
        console.error('❌ 微信登录失败:', result.message)

        // 真机环境下的错误处理
        if (result.message.includes('拒绝授权')) {
          wx.showModal({
            title: '授权失败',
            content: '需要授权才能使用完整功能，是否尝试游客模式？',
            confirmText: '游客模式',
            cancelText: '重试',
            success: async (res) => {
              if (res.confirm) {
                await this.performGuestLogin()
              }
            }
          })
        } else {
          wx.showModal({
            title: '登录失败',
            content: result.message + '\n\n是否尝试游客模式？',
            confirmText: '游客模式',
            cancelText: '取消',
            success: async (res) => {
              if (res.confirm) {
                await this.performGuestLogin()
              }
            }
          })
        }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 微信登录异常:', error)
      wx.showToast({
        title: '登录异常',
        icon: 'error'
      })
    }
  },

  // 执行游客登录
  async performGuestLogin() {
    try {
      wx.showLoading({ title: '游客登录中...' })

      const result = await authService.guestLogin()

      wx.hideLoading()

      if (result.success) {
        console.log('✅ 游客登录成功:', result.user)
        await this.updateUserInterface(result.user)

        wx.showModal({
          title: '游客模式',
          content: '已进入游客模式，可以体验大部分功能。随时可以切换到微信登录获得完整体验。',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: result.message || '游客登录失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 游客登录异常:', error)
      wx.showToast({
        title: '登录异常',
        icon: 'error'
      })
    }
  },

  // 更新用户界面
  async updateUserInterface(user) {
    this.setData({
      userInfo: {
        nickName: user.nickname,
        avatarUrl: user.avatar_url,
        city: user.location,
        tags: user.specialties || []
      }
    })

    // 加载用户数据
    this.loadUserStats()
    this.loadMyWorks()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 🔧 修复: 使用新的API服务类加载用户统计数据
  async loadUserStats() {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (currentUser.success && currentUser.user) {
        const stats = {
          worksCount: currentUser.user.worksCount || 0,
          followersCount: currentUser.user.followersCount || 0,
          followingCount: currentUser.user.followingCount || 0
        };
        this.setData({ userStats: stats });
      } else {
        // 使用默认统计数据
        const mockStats = {
          worksCount: 0,
          followersCount: 0,
          followingCount: 0
        };
        this.setData({ userStats: mockStats });
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
      this.setData({ userStats: { worksCount: 0, followersCount: 0, followingCount: 0 } });
    }
  },

  // 🔧 修复: 使用新的API服务类加载我的作品
  async loadMyWorks() {
    try {
      const result = await WorksService.getMyWorks({ page: 1, limit: 20 });
      if (result.success && result.data) {
        this.setData({ myWorks: result.data.items || [] });
      } else {
        console.error('加载我的作品失败:', result.error);
        this.setData({ myWorks: [] });
      }
    } catch (error) {
      console.error('加载我的作品异常:', error);
      this.setData({ myWorks: [] });
    }
  },

  // 加载我的约拍
  async loadMyAppointments() {
    try {
      // 这里应该调用真实的API获取用户约拍
      const mockAppointments = [];
      this.setData({ myAppointments: mockAppointments });
    } catch (error) {
      console.error('加载我的约拍失败:', error);
    }
  },

  // Tab切换
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ currentTab: tab });
    
    if (tab === 'appointments' && this.data.myAppointments.length === 0) {
      this.loadMyAppointments();
    }
  },

  // 编辑资料
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/user/profile-edit/index'
    });
  },

  // 设置
  onSettings() {
    wx.navigateTo({
      url: '/pages/user/settings/index'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 🔐 使用认证服务登出
          authService.logout()

          // 清除全局状态
          app.globalData.userInfo = null;

          // 重新初始化页面
          this.initPage();

          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  // 作品点击
  onWorkTap(e) {
    const { work } = e.detail;
    wx.navigateTo({
      url: `/pages/works/detail/index?id=${work.id}`
    });
  },

  // 约拍点击
  onAppointmentTap(e) {
    const { appointment } = e.detail;
    wx.navigateTo({
      url: `/pages/appointment/detail/index?id=${appointment.id}`
    });
  },

  // 上传作品
  onUploadWork() {
    wx.navigateTo({
      url: '/pages/works/upload/index'
    });
  },

  // 专业摄影师功能方法

  // 获取用户等级图标
  getUserLevelIcon() {
    const { userInfo, userLevels } = this.data
    const level = userInfo?.level || 'beginner'
    return userLevels[level]?.icon || 'user'
  },

  // 获取用户标题
  getUserTitle() {
    const { userInfo, userLevels } = this.data
    const level = userInfo?.level || 'beginner'
    return userLevels[level]?.title || '摄影爱好者'
  },

  // 收益管理
  onEarningsTap() {
    wx.navigateTo({
      url: '/pages/photographer/earnings'
    })
  },

  // 订单管理
  onOrdersTap() {
    wx.navigateTo({
      url: '/pages/photographer/orders'
    })
  },

  // 数据分析
  onAnalyticsTap() {
    wx.navigateTo({
      url: '/pages/photographer/analytics'
    })
  },

  // 专业设置
  onSettingsTap() {
    wx.navigateTo({
      url: '/pages/photographer/settings'
    })
  },

  // 查看全部作品
  onViewAllWorks() {
    wx.navigateTo({
      url: `/pages/profile/works?userId=${this.data.userInfo.id}`
    })
  },

  // 格式化数字显示
  formatCount(count) {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w'
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k'
    }
    return count.toString()
  }
});
