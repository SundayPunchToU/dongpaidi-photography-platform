/**
 * API测试脚本
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🚀 开始测试懂拍帝后端API...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 健康检查通过:', healthResponse.data);
    console.log('');

    // 2. 测试统计信息
    console.log('2. 测试统计信息...');
    const statsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log('✅ 统计信息:', statsResponse.data);
    console.log('');

    // 3. 创建测试用户
    console.log('3. 创建测试用户...');
    const createUserResponse = await axios.post(`${BASE_URL}/users`, {
      nickname: '测试摄影师',
      platform: 'wechat'
    });
    console.log('✅ 用户创建成功:', createUserResponse.data);
    const userId = createUserResponse.data.data.id;
    console.log('');

    // 4. 获取用户列表
    console.log('4. 获取用户列表...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    console.log('✅ 用户列表:', usersResponse.data);
    console.log('');

    // 5. 创建测试作品
    console.log('5. 创建测试作品...');
    const createWorkResponse = await axios.post(`${BASE_URL}/works`, {
      title: '美丽的风景照',
      description: '这是一张在公园拍摄的风景照片',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      tags: ['风景', '自然', '公园'],
      category: 'landscape',
      userId: userId
    });
    console.log('✅ 作品创建成功:', createWorkResponse.data);
    console.log('');

    // 6. 获取作品列表
    console.log('6. 获取作品列表...');
    const worksResponse = await axios.get(`${BASE_URL}/works`);
    console.log('✅ 作品列表:', worksResponse.data);
    console.log('');

    // 7. 再次获取统计信息
    console.log('7. 再次获取统计信息...');
    const finalStatsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log('✅ 最终统计信息:', finalStatsResponse.data);
    console.log('');

    console.log('🎉 所有API测试通过！');

  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAPI();
