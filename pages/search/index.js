import request from '~/api/request';

Page({
  data: {
    historyWords: [],
    popularWords: [
      '人像摄影', '风光摄影', '街拍', '夜景', '婚纱摄影',
      '商业摄影', '纪实摄影', '建筑摄影', '微距摄影', '航拍'
    ],
    searchValue: '',
    autoFocus: true,
    dialog: {
      title: '确认删除当前历史记录',
      showCancelButton: true,
      message: '',
    },
    dialogShow: false,
  },

  deleteType: 0,
  deleteIndex: '',

  onLoad(options) {
    // 如果从其他页面带参数进入
    if (options.keyword) {
      this.setData({
        searchValue: options.keyword,
        autoFocus: false
      });
    }
  },

  onShow() {
    this.queryHistory();
    this.queryPopular();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchValue: '' });
  },

  // 快捷搜索
  onQuickSearch(e) {
    const { type } = e.currentTarget.dataset;
    const routes = {
      works: '/pages/search/works/index',
      photographers: '/pages/search/photographers/index',
      appointments: '/pages/search/appointments/index',
      tutorials: '/pages/search/works/index?category=tutorial'
    };

    wx.navigateTo({
      url: routes[type] || routes.works
    });
  },

  /**
   * 查询历史记录
   * 🔧 修复: 使用本地存储管理搜索历史
   * @returns {Promise<void>}
   */
  async queryHistory() {
    try {
      const historyWords = wx.getStorageSync('searchHistory') || [];
      this.setData({
        historyWords: historyWords.slice(0, 10) // 最多显示10条历史记录
      });
    } catch (error) {
      console.error('获取搜索历史失败:', error);
      this.setData({
        historyWords: []
      });
    }
  },

  /**
   * 查询热门搜索
   * @returns {Promise<void>}
   */
  async queryPopular() {
    request('/api/searchPopular').then((res) => {
      const { code, data } = res;

      if (code === 200) {
        const { popularWords = [] } = data;
        this.setData({
          popularWords,
        });
      }
    });
  },

  setHistoryWords(searchValue) {
    if (!searchValue) return;

    const { historyWords } = this.data;
    const index = historyWords.indexOf(searchValue);

    if (index !== -1) {
      historyWords.splice(index, 1);
    }
    historyWords.unshift(searchValue);

    this.setData({
      searchValue,
      historyWords,
    });
    // if (searchValue) {
    //     wx.navigateTo({
    //         url: `/pages/goods/result/index?searchValue=${searchValue}`,
    //     });
    // }
  },

  /**
   * 清空历史记录的再次确认框
   * 后期可能需要增加一个向后端请求的接口
   * @returns {Promise<void>}
   */
  confirm() {
    const { historyWords } = this.data;
    const { deleteType, deleteIndex } = this;

    if (deleteType === 0) {
      historyWords.splice(deleteIndex, 1);
      this.setData({
        historyWords,
        dialogShow: false,
      });
    } else {
      this.setData({ historyWords: [], dialogShow: false });
    }
  },

  /**
   * 取消清空历史记录
   * @returns {Promise<void>}
   */
  close() {
    this.setData({ dialogShow: false });
  },

  /**
   * 点击清空历史记录
   * @returns {Promise<void>}
   */
  handleClearHistory() {
    const { dialog } = this.data;
    this.deleteType = 1;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除所有历史记录',
      },
      dialogShow: true,
    });
  },

  deleteCurr(e) {
    const { index } = e.currentTarget.dataset;
    const { dialog } = this.data;
    this.deleteIndex = index;
    this.deleteType = 0;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除当前历史记录',
      },
      dialogShow: true,
    });
  },

  /**
   * 点击关键词跳转搜索
   * 后期需要增加跳转和后端请求接口
   * @returns {Promise<void>}
   */
  handleHistoryTap(e) {
    const { historyWords } = this.data;
    const { index } = e.currentTarget.dataset;
    const searchValue = historyWords[index || 0] || '';

    this.setHistoryWords(searchValue);
  },

  handlePopularTap(e) {
    const { popularWords } = this.data;
    const { index } = e.currentTarget.dataset;
    const searchValue = popularWords[index || 0] || '';

    this.setHistoryWords(searchValue);
  },

  /**
   * 提交搜索框内容
   * 后期需要增加跳转和后端请求接口
   * @returns {Promise<void>}
   */
  handleSubmit(e) {
    const { value } = e.detail;
    if (value.length === 0) return;

    this.setHistoryWords(value);
  },

  /**
   * 点击取消回到主页
   * @returns {Promise<void>}
   */
  actionHandle() {
    this.setData({
      searchValue: '',
    });
    wx.switchTab({ url: '/pages/discover/index' });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchValue: '' });
  },

  // 快捷搜索
  onQuickSearch(e) {
    const { type } = e.currentTarget.dataset;
    const routes = {
      works: '/pages/search/works/index',
      photographers: '/pages/search/photographers/index',
      appointments: '/pages/search/appointments/index',
      tutorials: '/pages/search/works/index?category=tutorial'
    };

    wx.navigateTo({
      url: routes[type] || routes.works
    });
  },

  // 提交搜索
  handleSubmit(e) {
    const value = e?.detail?.value || this.data.searchValue;
    if (!value?.trim()) return;

    this.setData({ searchValue: value });
    this.setHistoryWords(value);

    // 智能跳转到对应的搜索结果页面
    this.navigateToSearchResult(value);
  },

  // 智能导航到搜索结果
  navigateToSearchResult(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    let targetPage = '/pages/search/works/index'; // 默认搜索作品

    if (lowerKeyword.includes('约拍') || lowerKeyword.includes('拍摄') || lowerKeyword.includes('合作')) {
      targetPage = '/pages/search/appointments/index';
    } else if (lowerKeyword.includes('摄影师') || lowerKeyword.includes('师傅') || lowerKeyword.includes('老师')) {
      targetPage = '/pages/search/photographers/index';
    }

    wx.navigateTo({
      url: `${targetPage}?keyword=${encodeURIComponent(keyword)}`
    });
  },
});
