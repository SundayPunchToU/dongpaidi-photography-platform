// 约拍卡片组件
Component({
  properties: {
    appointment: {
      type: Object,
      value: {}
    }
  },
  
  methods: {
    onCardTap() {
      const { appointment } = this.properties;
      this.triggerEvent('cardtap', { appointment });
    },
    
    onUserTap(e) {
      const { appointment } = this.properties;
      this.triggerEvent('usertap', { userId: appointment.publisherId });
      e.stopPropagation();
    },
    
    onApplyTap(e) {
      const { appointment } = this.properties;
      this.triggerEvent('apply', { appointment });
      e.stopPropagation();
    }
  },
  
  observers: {
    'appointment.budget': function(budget) {
      let budgetText = '';
      if (budget.negotiable) {
        budgetText = '面议';
      } else if (budget.min === budget.max) {
        budgetText = `¥${budget.min}`;
      } else {
        budgetText = `¥${budget.min}-${budget.max}`;
      }
      this.setData({ budgetText });
    }
  }
});
