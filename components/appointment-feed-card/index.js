// 朋友圈风格约拍卡片组件
Component({
  properties: {
    appointment: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 卡片点击
    onCardTap(e) {
      e.stopPropagation();
      this.triggerEvent('cardtap', {
        appointment: this.properties.appointment
      });
    },

    // 用户头像点击
    onUserTap(e) {
      e.stopPropagation();
      const { userId } = e.currentTarget.dataset;
      this.triggerEvent('usertap', {
        userId: userId
      });
    },

    // 申请按钮点击
    onApplyTap(e) {
      e.stopPropagation();
      const { appointment } = e.currentTarget.dataset;
      this.triggerEvent('apply', {
        appointment: appointment
      });
    }
  }
});
