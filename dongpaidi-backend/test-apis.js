const axios = require('axios');

async function testAPIs() {
  console.log('🧪 测试管理界面相关API接口...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  // 测试统计接口
  try {
    console.log('1. 测试统计接口...');
    const statsResponse = await axios.get(`${baseURL}/stats`);
    console.log('✅ 统计接口正常');
    console.log('统计数据:', statsResponse.data.data);
  } catch (error) {
    console.error('❌ 统计接口失败:', error.response?.data || error.message);
  }
  
  // 测试趋势数据接口
  try {
    console.log('\n2. 测试趋势数据接口...');
    const trendResponse = await axios.get(`${baseURL}/stats/trend?period=week`);
    console.log('✅ 趋势数据接口正常');
    console.log('趋势数据样本:', {
      dates: trendResponse.data.data.dates.slice(0, 3),
      users: trendResponse.data.data.users.slice(0, 3),
    });
  } catch (error) {
    console.error('❌ 趋势数据接口失败:', error.response?.data || error.message);
  }
  
  // 测试用户列表接口
  try {
    console.log('\n3. 测试用户列表接口...');
    const usersResponse = await axios.get(`${baseURL}/users?page=1&limit=5`);
    console.log('✅ 用户列表接口正常');
    console.log('用户数量:', usersResponse.data.data.items.length);
    console.log('分页信息:', usersResponse.data.data.pagination);
  } catch (error) {
    console.error('❌ 用户列表接口失败:', error.response?.data || error.message);
  }
  
  // 测试用户统计接口
  try {
    console.log('\n4. 测试用户统计接口...');
    const userStatsResponse = await axios.get(`${baseURL}/users/stats`);
    console.log('✅ 用户统计接口正常');
    console.log('用户统计:', userStatsResponse.data.data);
  } catch (error) {
    console.error('❌ 用户统计接口失败:', error.response?.data || error.message);
  }

  // 测试管理员登录
  try {
    console.log('\n5. 测试管理员登录...');
    const loginResponse = await axios.post(`${baseURL}/admin/login`, {
      email: 'admin@dongpaidi.com',
      password: 'admin123456'
    });
    console.log('✅ 管理员登录正常');
    console.log('用户信息:', loginResponse.data.data.user);
  } catch (error) {
    console.error('❌ 管理员登录失败:', error.response?.data || error.message);
  }

  console.log('\n🎉 API测试完成！');
}

testAPIs();
