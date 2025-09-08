const axios = require('axios');

async function testRoutes() {
  console.log('🧪 测试路由...');

  // 测试API根路径
  try {
    const rootResponse = await axios.get('http://localhost:3000/api/v1');
    console.log('✅ API根路径正常');
    console.log('可用端点:', rootResponse.data.endpoints);
  } catch (error) {
    console.error('❌ API根路径失败:', error.message);
  }

  // 测试管理员登录接口
  try {
    console.log('\n🧪 测试管理员登录接口...');

    const response = await axios.post('http://localhost:3000/api/v1/admin/login', {
      email: 'admin@dongpaidi.com',
      password: 'admin123456'
    });

    console.log('✅ 登录成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ 登录失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

testRoutes();
