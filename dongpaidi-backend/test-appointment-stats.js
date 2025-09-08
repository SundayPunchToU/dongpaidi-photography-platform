const axios = require('axios');

async function testAppointmentStats() {
  console.log('🧪 测试约拍统计接口...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    // 测试约拍统计接口
    console.log('测试约拍统计接口...');
    const statsResponse = await axios.get(`${baseURL}/appointments/stats`);
    console.log('✅ 约拍统计接口正常');
    console.log('约拍统计数据:', statsResponse.data.data);
    
    // 测试系统总体统计
    console.log('\n测试系统总体统计...');
    const overallResponse = await axios.get(`${baseURL}/stats`);
    console.log('✅ 系统统计接口正常');
    console.log('系统统计数据:', overallResponse.data.data);
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
  
  console.log('\n🎉 约拍统计测试完成！');
}

testAppointmentStats();
