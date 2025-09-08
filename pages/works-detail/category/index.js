// 商品分类页
Page({
  data: {
    categories: [
      { id: 'camera', name: '相机设备', count: 128 },
      { id: 'lens', name: '镜头配件', count: 89 },
      { id: 'lighting', name: '灯光道具', count: 56 },
      { id: 'accessories', name: '周边配件', count: 234 }
    ]
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadCategoryProducts(id);
    }
  },

  loadCategoryProducts(categoryId) {
    // 加载分类商品
    console.log('加载分类商品:', categoryId);
  },

  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    // 跳转到分类商品列表
    console.log('选择分类:', category);
  }
});
