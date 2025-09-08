// 约拍搜索页面
Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: false,
    hasSearched: false,
    autoFocus: false,
    hotKeywords: ['人像约拍', '婚纱摄影', '商业拍摄', '外景拍摄', '室内拍摄'],
    filters: {
      city: '',
      type: 'all',
      budgetRange: 'all'
    }
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
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 热门关键词点击
  onHotKeywordTap(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch();
  },

  // 筛选条件改变
  onFilterChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      'filters.type': type
    });
    // 重新搜索
    if (this.data.hasSearched) {
      this.performSearch();
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 执行搜索
  async performSearch() {
    const { keyword, filters } = this.data;
    if (!keyword.trim()) return;

    this.setData({ loading: true, hasSearched: true });

    try {
      // 模拟搜索API调用
      setTimeout(() => {
        const mockResults = this.generateMockAppointments(keyword, filters);
        this.setData({
          searchResults: mockResults,
          loading: false
        });
      }, 1200);
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
    }
  },

  // 生成模拟约拍数据
  generateMockAppointments(keyword, filters) {
    const mockAppointments = [
      {
        id: 'apt_001',
        title: `${keyword} - 专业约拍`,
        type: '人像摄影',
        location: '上海市',
        budget: '500-1000',
        photographer: {
          name: '专业摄影师',
          avatar: 'https://i.pravatar.cc/100?img=31',
          rating: 4.8
        },
        date: '2024-01-15',
        status: 'available'
      },
      {
        id: 'apt_002',
        title: `${keyword} 创意拍摄`,
        type: '创意摄影',
        location: '北京市',
        budget: '800-1500',
        photographer: {
          name: '创意摄影师',
          avatar: 'https://i.pravatar.cc/100?img=32',
          rating: 4.9
        },
        date: '2024-01-20',
        status: 'available'
      }
    ];

    // 根据筛选条件过滤
    if (filters.type !== 'all') {
      return mockAppointments.filter(apt =>
        apt.type.includes(filters.type)
      );
    }

    return mockAppointments;
  },

  // 约拍点击
  onAppointmentTap(e) {
    const { appointment } = e.detail;
    wx.navigateTo({
      url: `/pages/appointment/detail/index?id=${appointment.id}`
    });
  }
});
