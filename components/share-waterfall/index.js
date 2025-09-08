// 小红书风格瀑布流组件
Component({
  properties: {
    shares: {
      type: Array,
      value: [],
      observer: function(newShares) {
        this.onSharesChange(newShares);
      }
    }
  },

  data: {
    leftColumn: [],
    rightColumn: [],
    leftHeight: 0,
    rightHeight: 0
  },

  methods: {
    // 监听分享数据变化，重新分配到左右列
    onSharesChange(newShares) {
      if (!newShares || newShares.length === 0) {
        this.setData({
          leftColumn: [],
          rightColumn: [],
          leftHeight: 0,
          rightHeight: 0
        });
        return;
      }

      this.distributeShares(newShares);
    },

    // 分配分享到左右两列，实现瀑布流效果
    distributeShares(shares) {
      const leftColumn = [];
      const rightColumn = [];
      let leftHeight = 0;
      let rightHeight = 0;

      shares.forEach((share) => {
        // 计算图片高度（基于宽高比或随机）
        const imageHeight = this.calculateImageHeight(share);
        const cardHeight = imageHeight + 80; // 图片高度 + 内容区域高度（减少内容区域高度）

        // 选择高度较小的列
        if (leftHeight <= rightHeight) {
          leftColumn.push({...share, imageHeight, cardHeight});
          leftHeight += cardHeight + 6; // 减少间距
        } else {
          rightColumn.push({...share, imageHeight, cardHeight});
          rightHeight += cardHeight + 6;
        }
      });

      this.setData({
        leftColumn,
        rightColumn,
        leftHeight,
        rightHeight
      });
    },

    // 计算图片高度
    calculateImageHeight(share) {
      // 如果有预设高度，使用预设高度
      if (share.imageHeight) {
        return share.imageHeight;
      }

      // 根据图片宽高比计算，默认卡片宽度约为 340rpx
      const cardWidth = 340;

      if (share.imageWidth && share.imageHeight) {
        const ratio = share.imageHeight / share.imageWidth;
        return Math.floor(cardWidth * ratio);
      }

      // 更协调的随机高度范围，参考小红书的卡片比例
      const heightOptions = [240, 280, 320, 360, 400, 440, 480];
      return heightOptions[Math.floor(Math.random() * heightOptions.length)];
    },

    // 分享卡片点击
    onShareTap(e) {
      const { share } = e.currentTarget.dataset;
      this.triggerEvent('sharetap', { share });
    }
  }
});
