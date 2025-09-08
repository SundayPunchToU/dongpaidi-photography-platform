const axios = require('axios');

async function testAppointmentAPIs() {
  console.log('🧪 测试约拍系统API...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    // 1. 测试获取约拍列表
    console.log('1. 测试获取约拍列表...');
    const appointmentsResponse = await axios.get(`${baseURL}/appointments?page=1&limit=5`);
    console.log('✅ 约拍列表接口正常');
    console.log('约拍数量:', appointmentsResponse.data.data.items.length);
    console.log('分页信息:', appointmentsResponse.data.data.pagination);
    
    if (appointmentsResponse.data.data.items.length > 0) {
      const firstAppointment = appointmentsResponse.data.data.items[0];
      console.log('第一个约拍:', {
        id: firstAppointment.id,
        title: firstAppointment.title,
        type: firstAppointment.type,
        status: firstAppointment.status,
        applicationsCount: firstAppointment.applicationsCount,
      });
      
      // 2. 测试获取约拍详情
      console.log('\n2. 测试获取约拍详情...');
      const detailResponse = await axios.get(`${baseURL}/appointments/${firstAppointment.id}`);
      console.log('✅ 约拍详情接口正常');
      console.log('约拍详情:', {
        title: detailResponse.data.data.title,
        publisher: detailResponse.data.data.publisher.nickname,
        applications: detailResponse.data.data.applications.length,
        requirements: Object.keys(detailResponse.data.data.requirements).length,
      });
    }
    
    // 3. 测试创建约拍
    console.log('\n3. 测试创建约拍...');
    const newAppointment = {
      title: '测试约拍 - 风景摄影',
      description: '这是一个测试约拍，寻找风景摄影师合作',
      type: 'model_seek_photographer',
      location: '测试地点',
      shootDate: '2025-09-30T10:00:00Z',
      budget: 500,
      requirements: {
        style: '风景摄影',
        equipment: '专业相机',
        experience: '有风景摄影经验',
      },
    };
    
    const createResponse = await axios.post(`${baseURL}/appointments`, newAppointment);
    console.log('✅ 创建约拍接口正常');
    console.log('新创建的约拍:', {
      id: createResponse.data.data.id,
      title: createResponse.data.data.title,
      type: createResponse.data.data.type,
      status: createResponse.data.data.status,
    });
    
    // 4. 测试筛选功能
    console.log('\n4. 测试约拍筛选...');
    
    // 按类型筛选
    const photographerSeekResponse = await axios.get(`${baseURL}/appointments?type=photographer_seek_model`);
    console.log('✅ 按类型筛选正常');
    console.log('摄影师寻找模特的约拍数量:', photographerSeekResponse.data.data.items.length);
    
    const modelSeekResponse = await axios.get(`${baseURL}/appointments?type=model_seek_photographer`);
    console.log('模特寻找摄影师的约拍数量:', modelSeekResponse.data.data.items.length);
    
    // 按状态筛选
    const openAppointments = await axios.get(`${baseURL}/appointments?status=open`);
    console.log('开放状态的约拍数量:', openAppointments.data.data.items.length);
    
    // 按关键词搜索
    const searchResponse = await axios.get(`${baseURL}/appointments?keyword=摄影`);
    console.log('包含"摄影"关键词的约拍数量:', searchResponse.data.data.items.length);
    
    // 5. 测试约拍统计
    console.log('\n5. 约拍系统统计:');
    const allAppointments = await axios.get(`${baseURL}/appointments?limit=100`);
    const appointments = allAppointments.data.data.items;
    
    const stats = {
      total: appointments.length,
      byType: {
        photographer_seek_model: appointments.filter(a => a.type === 'photographer_seek_model').length,
        model_seek_photographer: appointments.filter(a => a.type === 'model_seek_photographer').length,
      },
      byStatus: {
        open: appointments.filter(a => a.status === 'open').length,
        in_progress: appointments.filter(a => a.status === 'in_progress').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
      },
      totalApplications: appointments.reduce((sum, a) => sum + a.applicationsCount, 0),
    };
    
    console.log('📊 约拍统计数据:');
    console.log('总约拍数:', stats.total);
    console.log('按类型分布:', stats.byType);
    console.log('按状态分布:', stats.byStatus);
    console.log('总申请数:', stats.totalApplications);
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
  
  console.log('\n🎉 约拍系统API测试完成！');
}

testAppointmentAPIs();
