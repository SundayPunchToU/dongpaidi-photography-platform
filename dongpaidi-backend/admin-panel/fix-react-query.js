const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/pages/AppointmentManagement.tsx',
  'src/pages/MessageManagement.tsx', 
  'src/pages/PaymentManagement.tsx',
  'src/pages/WorkManagement.tsx'
];

// 修复函数
function fixReactQuerySyntax(content) {
  // 修复 useQuery 语法
  content = content.replace(
    /useQuery\(\s*(['"`][^'"`]*['"`]|\[[^\]]*\]),\s*([^,]+),\s*\{([^}]*)\}\s*\)/gs,
    (match, queryKey, queryFn, options) => {
      // 清理选项，移除不支持的选项
      let cleanOptions = options
        .replace(/keepPreviousData:\s*true,?/g, '')
        .replace(/onError:\s*\([^)]*\)\s*=>\s*\{[^}]*\},?/gs, '')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*}/g, '}')
        .trim();
      
      if (cleanOptions && !cleanOptions.endsWith(',')) {
        cleanOptions = cleanOptions + ',';
      }
      
      return `useQuery({
    queryKey: ${queryKey.startsWith('[') ? queryKey : `[${queryKey}]`},
    queryFn: ${queryFn.includes('=>') ? queryFn : `() => ${queryFn}()`},
    ${cleanOptions}
    placeholderData: (previousData) => previousData,
  })`;
    }
  );

  // 修复 useMutation 语法
  content = content.replace(
    /useMutation\(\s*([^,]+),\s*\{([^}]*)\}\s*\)/gs,
    (match, mutationFn, options) => {
      // 修复 invalidateQueries 调用
      let cleanOptions = options.replace(
        /queryClient\.invalidateQueries\(\s*(['"`][^'"`]*['"`])\s*\)/g,
        'queryClient.invalidateQueries({ queryKey: [$1] })'
      );
      
      return `useMutation({
    mutationFn: ${mutationFn},
    ${cleanOptions}
  })`;
    }
  );

  // 修复 isLoading 为 isPending
  content = content.replace(/\.isLoading/g, '.isPending');

  // 修复 API 响应数据访问
  content = content.replace(/(\w+)\.data\?\.(\w+)/g, '$1.data?.data?.$2');
  content = content.replace(/(\w+)\.data\?\.data\?\.data\?\.(\w+)/g, '$1.data?.data?.$2');

  return content;
}

// 处理每个文件
filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`修复文件: ${filePath}`);
      
      let content = fs.readFileSync(fullPath, 'utf8');
      const fixedContent = fixReactQuerySyntax(content);
      
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

console.log('所有文件修复完成！');
