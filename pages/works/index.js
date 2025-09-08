// 商城页面
Page({
  data: {
    products: [],
    categories: [
      { id: 'camera', name: '相机设备', icon: 'camera' },
      { id: 'lens', name: '镜头配件', icon: 'view-module' },
      { id: 'lighting', name: '灯光道具', icon: 'lightbulb' },
      { id: 'accessories', name: '周边配件', icon: 'shop' }
    ],
    banners: [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=200&fit=crop',
        title: '新品上市'
      }
    ]
  },

  onLoad() {
    this.loadProducts();
  },

  loadProducts() {
    // 模拟商品数据
    const mockProducts = [
      {
        id: 'product_001',
        name: '佳能EOS R5相机',
        price: 25999,
        originalPrice: 28999,
        image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop',
        sales: 128,
        rating: 4.8
      },
      {
        id: 'product_002', 
        name: '索尼FE 85mm镜头',
        price: 4299,
        originalPrice: 4899,
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=300&h=300&fit=crop',
        sales: 89,
        rating: 4.9
      }
    ];

    this.setData({ products: mockProducts });
  },

  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/works/category/index?id=${category.id}`
    });
  },

  onProductTap(e) {
    const { product } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/works/detail/index?id=${product.id}`
    });
  }
});
