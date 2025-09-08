import request from './request';

// 作品相关API
export const worksApi = {
  // 获取作品列表（支持分页和筛选）
  getWorksList(params = {}) {
    return request('/works', 'GET', params);
  },
  
  // 获取作品详情
  getWorkDetail(workId) {
    return request(`/works/${workId}`, 'GET');
  },
  
  // 上传作品
  uploadWork(workData) {
    return request('/works', 'POST', workData);
  },
  
  // 更新作品信息
  updateWork(workId, workData) {
    return request(`/works/${workId}`, 'PUT', workData);
  },
  
  // 删除作品
  deleteWork(workId) {
    return request(`/works/${workId}`, 'DELETE');
  },
  
  // 点赞作品
  likeWork(workId) {
    return request(`/works/${workId}/like`, 'POST');
  },
  
  // 取消点赞
  unlikeWork(workId) {
    return request(`/works/${workId}/like`, 'DELETE');
  },
  
  // 收藏作品
  collectWork(workId) {
    return request(`/works/${workId}/collect`, 'POST');
  },
  
  // 获取作品评论
  getWorkComments(workId, params = {}) {
    return request(`/works/${workId}/comments`, 'GET', params);
  },
  
  // 添加评论
  addComment(workId, content) {
    return request(`/works/${workId}/comments`, 'POST', { content });
  },
  
  // 获取推荐作品
  getRecommendedWorks(params = {}) {
    return request('/works/recommended', 'GET', params);
  },
  
  // 按分类获取作品
  getWorksByCategory(category, params = {}) {
    return request(`/works/category/${category}`, 'GET', params);
  },
  
  // 搜索作品
  searchWorks(keyword, params = {}) {
    return request('/works/search', 'GET', { keyword, ...params });
  }
};
