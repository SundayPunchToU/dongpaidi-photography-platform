// app.js
// 导入简化的认证服务
import { simpleAuthService } from './utils/simple-auth.js';
// 导入事件总线
import createBus from './utils/eventBus.js';

App({
  // 初始化事件总线
  eventBus: createBus(),

  async onLaunch() {
    // 全局错误处理
    wx.onError((error) => {
      console.error('小程序全局错误:', error);
    });

    // 全局未处理的Promise拒绝
    wx.onUnhandledRejection((res) => {
      console.error('未处理的Promise拒绝:', res);
    });
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      // console.log(res.hasUpdate)
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    try {
      // 初始化认证状态
      console.log('🚀 初始化认证服务...')
      simpleAuthService.init()

      // 初始化平台信息
      const platformInfo = simpleAuthService.getPlatformInfo()
      this.globalData.platformInfo = platformInfo
      this.globalData.supportedLoginMethods = platformInfo.supportedLoginMethods
      console.log('🔍 平台信息:', platformInfo)

      // 更新全局用户信息
      if (simpleAuthService.checkLoginStatus()) {
        this.globalData.userInfo = simpleAuthService.getCurrentUser()
        console.log('✅ 用户已登录:', this.globalData.userInfo.nickname)
      }

      console.log('✅ 应用初始化完成')
    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
    }
  },
  globalData: {
    userInfo: null,
    userProfile: null, // 用户详细资料（摄影师信息、作品统计等）
    unreadNum: 0, // 未读消息数量
    socket: null, // SocketTask 对象
    location: null, // 用户当前位置
    isPhotographer: false, // 是否为认证摄影师
    followingList: [], // 关注列表
    likedWorks: [], // 点赞的作品
    // 多平台支持
    platformInfo: null, // 平台信息
    supportedLoginMethods: [], // 支持的登录方式
  },

  /** 设置未读消息数量 */
  setUnreadNum(unreadNum) {
    this.globalData.unreadNum = unreadNum;
    // 触发未读消息数量变化事件
    this.eventBus.emit('unread-num-change', unreadNum);
  },

  /** 全局登录方法（多平台支持） */
  async login(options = {}) {
    try {
      wx.showLoading({ title: '登录中...' })

      // 使用新的多平台登录系统
      const result = await simpleAuthService.login(options)

      wx.hideLoading()

      if (result.success) {
        this.globalData.userInfo = result.data

        // 显示登录成功提示
        const welcomeMessage = '欢迎回来！'
        wx.showToast({
          title: welcomeMessage,
          icon: 'success'
        })

        // 触发登录成功事件
        this.eventBus.emit('login-success', {
          user: result.data,
          isNewUser: false,
          platform: 'wechat'
        })

        return result.data
      } else {
        wx.showToast({
          title: result.error || result.message || '登录失败',
          icon: 'error'
        })
        return null
      }
    } catch (error) {
      wx.hideLoading()
      console.error('全局登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
      return null
    }
  },

  /** 手机号登录方法 */
  async loginWithPhone(phone, code) {
    try {
      wx.showLoading({ title: '验证中...' })

      const result = await simpleAuthService.loginWithPhone(phone, code)

      wx.hideLoading()

      if (result.success) {
        this.globalData.userInfo = result.data

        const welcomeMessage = '登录成功！'
        wx.showToast({
          title: welcomeMessage,
          icon: 'success'
        })

        this.eventBus.emit('login-success', {
          user: result.data,
          isNewUser: false,
          platform: 'phone'
        })

        return result.data
      } else {
        wx.showToast({
          title: result.error || result.message || '登录失败',
          icon: 'error'
        })
        return null
      }
    } catch (error) {
      wx.hideLoading()
      console.error('手机号登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
      return null
    }
  },

  /** 全局登出方法 */
  logout() {
    simpleAuthService.logout()
    this.globalData.userInfo = null
    this.eventBus.emit('logout')
  },

  /** 检查登录状态 */
  checkLogin() {
    return simpleAuthService.checkLoginStatus()
  },
});
