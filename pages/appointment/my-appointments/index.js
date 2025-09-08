// 我的约拍页面
Page({
  data: {
    myAppointments: []
  },

  onLoad() {
    this.loadMyAppointments();
  },

  async loadMyAppointments() {
    // 模拟加载我的约拍
    this.setData({ myAppointments: [] });
  }
});
