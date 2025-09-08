// 作品分类页面
Page({
  data: {
    categories: [
      { id: 'portrait', name: '人像', icon: 'user', count: 1200 },
      { id: 'landscape', name: '风光', icon: 'location', count: 800 },
      { id: 'street', name: '街拍', icon: 'walk', count: 600 },
      { id: 'commercial', name: '商业', icon: 'shop', count: 400 },
      { id: 'art', name: '艺术', icon: 'palette', count: 300 }
    ]
  },

  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/discover/index?category=${category.id}`
    });
  }
});
