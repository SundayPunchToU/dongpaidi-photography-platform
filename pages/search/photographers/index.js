// 摄影师搜索页面
Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: false,
    hasSearched: false
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: options.keyword });
      this.performSearch();
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 执行搜索
  async performSearch() {
    const { keyword } = this.data;
    if (!keyword.trim()) return;

    this.setData({ loading: true, hasSearched: true });
    
    try {
      // 模拟搜索API调用
      setTimeout(() => {
        this.setData({
          searchResults: [], // 暂时返回空结果
          loading: false
        });
      }, 1000);
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
    }
  },

  // 摄影师点击
  onPhotographerTap(e) {
    const { photographer } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/user/photographer-detail/index?id=${photographer.id}`
    });
  }
});
