import request from './request';

// 约拍相关API
export const appointmentsApi = {
  // 获取约拍列表
  getAppointmentsList(params = {}) {
    return request('/appointments', 'GET', params);
  },
  
  // 获取约拍详情
  getAppointmentDetail(appointmentId) {
    return request(`/appointments/${appointmentId}`, 'GET');
  },
  
  // 发布约拍
  publishAppointment(appointmentData) {
    return request('/appointments', 'POST', appointmentData);
  },
  
  // 更新约拍信息
  updateAppointment(appointmentId, appointmentData) {
    return request(`/appointments/${appointmentId}`, 'PUT', appointmentData);
  },
  
  // 删除约拍
  deleteAppointment(appointmentId) {
    return request(`/appointments/${appointmentId}`, 'DELETE');
  },
  
  // 申请约拍
  applyAppointment(appointmentId, message = '') {
    return request(`/appointments/${appointmentId}/apply`, 'POST', { message });
  },
  
  // 获取约拍申请列表
  getApplications(appointmentId) {
    return request(`/appointments/${appointmentId}/applications`, 'GET');
  },
  
  // 接受/拒绝申请
  handleApplication(appointmentId, applicantId, action) {
    return request(`/appointments/${appointmentId}/applications/${applicantId}`, 'PUT', { action });
  },
  
  // 获取我的约拍（发布的和参与的）
  getMyAppointments(type = 'all') {
    return request('/appointments/my', 'GET', { type });
  },
  
  // 完成约拍
  completeAppointment(appointmentId) {
    return request(`/appointments/${appointmentId}/complete`, 'POST');
  },
  
  // 评价约拍
  rateAppointment(appointmentId, rating, comment) {
    return request(`/appointments/${appointmentId}/rate`, 'POST', { rating, comment });
  },
  
  // 搜索约拍
  searchAppointments(params = {}) {
    return request('/appointments/search', 'GET', params);
  }
};
