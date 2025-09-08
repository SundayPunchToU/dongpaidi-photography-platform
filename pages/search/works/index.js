// 摄影作品搜索页面
Page({
  data: {
    keyword: '',
    searchResults: [],
    searchHistory: [],
    hotKeywords: ['人像摄影', '风光摄影', '街拍', '夜景摄影', '婚纱摄影', '商业摄影', '纪实摄影'],
    loading: false,
    hasSearched: false,
    autoFocus: false,
    filterType: 'all'
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({
        keyword: options.keyword,
        autoFocus: false
      });
      this.performSearch();
    } else {
      this.setData({ autoFocus: true });
    }
    this.loadSearchHistory();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 筛选切换
  onFilterTap(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ filterType: type });
    // 重新执行搜索
    if (this.data.hasSearched) {
      this.performSearch();
    }
  },

  // 排序切换
  onSortTap() {
    wx.showActionSheet({
      itemList: ['最新发布', '最多点赞', '最多浏览', '最多评论'],
      success: (res) => {
        console.log('选择排序方式:', res.tapIndex);
        // 这里可以添加排序逻辑
      }
    });
  },

  // 作品点击
  onWorkTap(e) {
    const { work } = e.detail;
    wx.navigateTo({
      url: `/pages/works/detail/index?id=${work.id}`
    });
  },

  // 重新搜索
  onRetrySearch() {
    this.setData({
      keyword: '',
      hasSearched: false,
      autoFocus: true
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 执行搜索
  async performSearch() {
    const { keyword, filterType } = this.data;
    if (!keyword.trim()) return;

    this.setData({ loading: true, hasSearched: true });

    try {
      // 模拟搜索API调用
      setTimeout(() => {
        const mockResults = this.generateMockSearchResults(keyword, filterType);
        this.setData({
          searchResults: mockResults,
          loading: false
        });
        this.saveSearchHistory(keyword);
      }, 1200);
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
    }
  },

  // 生成模拟搜索结果
  generateMockSearchResults(keyword, filterType) {
    const mockWorks = [
      {
        id: 'search_001',
        title: `${keyword} - 专业摄影作品`,
        coverImage: 'https://picsum.photos/400/600?random=101',
        photographer: {
          name: '专业摄影师',
          avatar: 'https://i.pravatar.cc/100?img=21'
        },
        stats: { likes: 156, comments: 23, views: 890 },
        tags: [keyword, '专业摄影']
      },
      {
        id: 'search_002',
        title: `${keyword} 创意作品集`,
        coverImage: 'https://picsum.photos/400/700?random=102',
        photographer: {
          name: '创意摄影师',
          avatar: 'https://i.pravatar.cc/100?img=22'
        },
        stats: { likes: 234, comments: 45, views: 1200 },
        tags: [keyword, '创意摄影']
      }
    ];

    // 根据筛选类型调整结果
    if (filterType !== 'all') {
      return mockWorks.filter(work =>
        work.tags.some(tag => tag.includes(filterType))
      );
    }

    return mockWorks;
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    let history = wx.getStorageSync('search_history') || [];
    history = history.filter(item => item !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10); // 只保留最近10条
    wx.setStorageSync('search_history', history);
    this.setData({ searchHistory: history });
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync('search_history') || [];
    this.setData({ searchHistory: history });
  },

  // 清空搜索历史
  clearSearchHistory() {
    wx.removeStorageSync('search_history');
    this.setData({ searchHistory: [] });
  },

  // 热门关键词点击
  onHotKeywordTap(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch();
  },

  // 历史记录点击
  onHistoryTap(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch();
  }
});
