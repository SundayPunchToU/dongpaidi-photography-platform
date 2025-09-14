const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/pages/MessageManagement.tsx',
  'src/pages/PaymentManagement.tsx',
  'src/pages/WorkManagement.tsx',
  'src/pages/Dashboard.tsx'
];

// 修复函数
function fixCommonErrors(content) {
  // 1. 移除Tag组件的size属性
  content = content.replace(/<Tag([^>]*)\s+size="small"([^>]*)>/g, '<Tag$1$2>');
  
  // 2. 修复API响应数据访问路径
  content = content.replace(/(\w+)\.data\.(\w+)/g, '$1.data.data.$2');
  content = content.replace(/(\w+)\.data\.data\.data\.(\w+)/g, '$1.data.data.$2');
  
  // 3. 修复分页数据访问
  content = content.replace(/(\w+)\.data\.items/g, '$1.data.data');
  content = content.replace(/(\w+)\.items/g, '$1.data.data');
  
  // 4. 修复统计数据访问
  content = content.replace(/(\w+)\.data\.count/g, '$1.data.data.count');
  
  // 5. 修复conversations数据访问
  content = content.replace(/conversations\.length/g, '(conversations?.data?.data || []).length');
  content = content.replace(/conversations\.filter/g, '(conversations?.data?.data || []).filter');
  
  // 6. 修复response.data.items访问
  content = content.replace(/response\.data\.items/g, 'response.data.data');
  
  return content;
}

// 处理每个文件
filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`修复文件: ${filePath}`);
      
      let content = fs.readFileSync(fullPath, 'utf8');
      const fixedContent = fixCommonErrors(content);
      
      if (content !== fixedContent) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`✅ ${filePath} 修复完成`);
      } else {
        console.log(`⏭️  ${filePath} 无需修复`);
      }
    } else {
      console.log(`❌ 文件不存在: ${filePath}`);
    }
  } catch (error) {
    console.error(`修复 ${filePath} 时出错:`, error.message);
  }
});

console.log('批量修复完成！');
