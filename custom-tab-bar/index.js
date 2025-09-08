const app = getApp();

Component({
  data: {
    value: '', // 初始值设置为空，避免第一次加载时闪烁
    unreadNum: 0, // 未读消息数量
    list: [
      {
        icon: 'home',
        value: 'discover',
        label: '发现',
      },
      {
        icon: 'camera',
        value: 'shoot',
        label: '约拍',
      },
      {
        icon: 'shop',
        value: 'market',
        label: '市场',
      },
      {
        icon: 'chat',
        value: 'message',
        label: '私信',
      },
    ],
  },
  lifetimes: {
    ready() {
      const pages = getCurrentPages();
      const curPage = pages[pages.length - 1];
      if (curPage) {
        const nameRe = /pages\/(\w+)\/index/.exec(curPage.route);
        if (nameRe === null) return;
        if (nameRe[1] && nameRe) {
          // 映射页面名称到TabBar的value
          const pageMap = {
            'discover': 'discover',
            'shoot': 'shoot',
            'market': 'market',
            'message': 'message'
          };
          const tabValue = pageMap[nameRe[1]] || nameRe[1];
          this.setData({
            value: tabValue,
          });
        }
      }

      // 同步全局未读消息数量
      this.setUnreadNum(app.globalData.unreadNum);
      app.eventBus.on('unread-num-change', (unreadNum) => {
        this.setUnreadNum(unreadNum);
      });
    },
  },
  methods: {
    handleChange(e) {
      const { value } = e.detail;
      wx.switchTab({ url: `/pages/${value}/index` });
    },

    // 标签点击处理方法
    handleTabTap(e) {
      const { value } = e.currentTarget.dataset;
      wx.switchTab({ url: `/pages/${value}/index` });

      // 更新选中状态
      this.setData({ value });
    },

    // 发布按钮点击处理
    handlePublishTap() {
      // 添加触觉反馈
      wx.vibrateShort({
        type: 'light'
      });

      // 跳转到现代化发布页面
      wx.navigateTo({
        url: '/pages/release/index'
      });
    },

    /** 设置未读消息数量 */
    setUnreadNum(unreadNum) {
      this.setData({ unreadNum });
    },
  },
});
