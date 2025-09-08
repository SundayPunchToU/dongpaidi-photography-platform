const axios = require('axios');

async function testUsersAPI() {
  console.log('🧪 测试用户管理API...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    console.log('测试用户列表接口...');
    const response = await axios.get(`${baseURL}/users?page=1&limit=10`);
    
    console.log('✅ 用户列表接口正常');
    console.log('返回数据结构:', {
      success: response.data.success,
      itemsCount: response.data.data.items.length,
      pagination: response.data.data.pagination,
    });
    
    if (response.data.data.items.length > 0) {
      const firstUser = response.data.data.items[0];
      console.log('\n第一个用户数据样本:');
      console.log({
        id: firstUser.id,
        nickname: firstUser.nickname,
        email: firstUser.email,
        platform: firstUser.platform,
        isVerified: firstUser.isVerified,
        status: firstUser.status,
        specialties: firstUser.specialties,
        specialtiesType: typeof firstUser.specialties,
        specialtiesIsArray: Array.isArray(firstUser.specialties),
      });
    }
    
  } catch (error) {
    console.error('❌ 用户列表接口失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

testUsersAPI();
