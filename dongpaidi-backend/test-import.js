// 测试导入adminRoutes
try {
  console.log('测试导入adminRoutes...');
  const adminRoutes = require('./dist/routes/adminRoutes.js');
  console.log('✅ adminRoutes导入成功');
  console.log('adminRoutes类型:', typeof adminRoutes);
  console.log('adminRoutes.default类型:', typeof adminRoutes.default);
} catch (error) {
  console.error('❌ adminRoutes导入失败:', error.message);
}

// 测试导入AdminController
try {
  console.log('\n测试导入AdminController...');
  const AdminController = require('./dist/controllers/adminController.js');
  console.log('✅ AdminController导入成功');
  console.log('AdminController类型:', typeof AdminController);
  console.log('AdminController.AdminController类型:', typeof AdminController.AdminController);
  console.log('AdminController.AdminController.login类型:', typeof AdminController.AdminController?.login);
} catch (error) {
  console.error('❌ AdminController导入失败:', error.message);
}
