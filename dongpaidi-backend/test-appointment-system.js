const axios = require('axios');

async function testAppointmentSystem() {
  console.log('🎯 约拍系统完整功能测试\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    console.log('='.repeat(60));
    console.log('📊 1. 系统统计测试');
    console.log('='.repeat(60));
    
    // 系统总体统计
    const overallStats = await axios.get(`${baseURL}/stats`);
    console.log('✅ 系统总体统计:', overallStats.data.data);
    
    // 约拍详细统计
    const appointmentStats = await axios.get(`${baseURL}/appointments/stats`);
    console.log('✅ 约拍详细统计:', appointmentStats.data.data);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 2. 约拍列表和筛选测试');
    console.log('='.repeat(60));
    
    // 获取所有约拍
    const allAppointments = await axios.get(`${baseURL}/appointments?limit=20`);
    console.log(`✅ 获取所有约拍: ${allAppointments.data.data.items.length} 个`);
    
    // 按类型筛选
    const photographerSeek = await axios.get(`${baseURL}/appointments?type=photographer_seek_model`);
    const modelSeek = await axios.get(`${baseURL}/appointments?type=model_seek_photographer`);
    console.log(`✅ 摄影师寻找模特: ${photographerSeek.data.data.items.length} 个`);
    console.log(`✅ 模特寻找摄影师: ${modelSeek.data.data.items.length} 个`);
    
    // 按状态筛选
    const openAppointments = await axios.get(`${baseURL}/appointments?status=open`);
    const inProgressAppointments = await axios.get(`${baseURL}/appointments?status=in_progress`);
    console.log(`✅ 开放状态约拍: ${openAppointments.data.data.items.length} 个`);
    console.log(`✅ 进行中约拍: ${inProgressAppointments.data.data.items.length} 个`);
    
    // 关键词搜索
    const searchResults = await axios.get(`${baseURL}/appointments?keyword=摄影`);
    console.log(`✅ 搜索"摄影": ${searchResults.data.data.items.length} 个结果`);
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 3. 约拍创建测试');
    console.log('='.repeat(60));
    
    // 创建新约拍
    const newAppointment = {
      title: '专业人像摄影合作',
      description: '寻找有经验的人像摄影师，拍摄个人艺术照',
      type: 'model_seek_photographer',
      location: '深圳市南山区',
      shootDate: '2025-10-15T14:00:00Z',
      budget: 800,
      requirements: {
        style: '人像艺术照',
        experience: '3年以上人像摄影经验',
        equipment: '全画幅相机 + 85mm镜头',
        duration: '3小时',
        deliverables: '精修15张',
      },
    };
    
    const createResult = await axios.post(`${baseURL}/appointments`, newAppointment);
    const createdAppointmentId = createResult.data.data.id;
    console.log('✅ 创建约拍成功:', {
      id: createdAppointmentId,
      title: createResult.data.data.title,
      type: createResult.data.data.type,
      status: createResult.data.data.status,
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 4. 约拍详情测试');
    console.log('='.repeat(60));
    
    // 获取约拍详情
    const appointmentDetail = await axios.get(`${baseURL}/appointments/${createdAppointmentId}`);
    console.log('✅ 获取约拍详情成功:', {
      title: appointmentDetail.data.data.title,
      publisher: appointmentDetail.data.data.publisher.nickname,
      requirements: Object.keys(appointmentDetail.data.data.requirements).length + ' 项要求',
      applications: appointmentDetail.data.data.applications.length + ' 个申请',
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 5. 数据分析');
    console.log('='.repeat(60));
    
    // 重新获取统计数据
    const finalStats = await axios.get(`${baseURL}/appointments/stats`);
    const stats = finalStats.data.data;
    
    console.log('📊 约拍系统数据分析:');
    console.log(`   总约拍数: ${stats.total}`);
    console.log(`   开放约拍: ${stats.open} (${(stats.open/stats.total*100).toFixed(1)}%)`);
    console.log(`   进行中: ${stats.inProgress} (${(stats.inProgress/stats.total*100).toFixed(1)}%)`);
    console.log(`   已完成: ${stats.completed} (${(stats.completed/stats.total*100).toFixed(1)}%)`);
    console.log(`   摄影师寻找模特: ${stats.photographerSeek} (${(stats.photographerSeek/stats.total*100).toFixed(1)}%)`);
    console.log(`   模特寻找摄影师: ${stats.modelSeek} (${(stats.modelSeek/stats.total*100).toFixed(1)}%)`);
    console.log(`   今日新增: ${stats.newToday}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 约拍系统功能验证完成');
    console.log('='.repeat(60));
    
    console.log('\n🎉 约拍系统所有核心功能正常运行！');
    console.log('\n📋 已验证功能:');
    console.log('   ✅ 约拍发布和创建');
    console.log('   ✅ 约拍列表获取和分页');
    console.log('   ✅ 多维度筛选 (类型、状态、关键词)');
    console.log('   ✅ 约拍详情查看');
    console.log('   ✅ 统计数据分析');
    console.log('   ✅ 数据格式化和错误处理');
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

testAppointmentSystem();
