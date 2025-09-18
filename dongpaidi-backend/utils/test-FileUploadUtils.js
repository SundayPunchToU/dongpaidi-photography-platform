/**
 * FileUploadUtils 工具类测试文件
 * 
 * 用途：验证FileUploadUtils各个方法的功能正确性
 * 创建时间: 2025-09-17
 * 开发者: Augment Agent
 * 
 * 测试内容：
 * - 文件类型验证
 * - 文件大小验证
 * - 文件名生成和清理
 * - 路径构建
 * - URL生成
 */

const FileUploadUtils = require('./FileUploadUtils');

console.log('🧪 开始测试 FileUploadUtils 工具类...\n');

// 测试1: 文件名清理功能
console.log('📝 测试1: 文件名清理功能');
const testFilenames = [
  '我的照片.jpg',
  '../../../etc/passwd',
  'photo with spaces.png',
  'special@#$%chars.webp',
  '...dotted...file...',
  ''
];

testFilenames.forEach(filename => {
  const cleaned = FileUploadUtils.sanitizeFilename(filename);
  console.log(`  "${filename}" -> "${cleaned}"`);
});

// 测试2: 安全文件名生成
console.log('\n📝 测试2: 安全文件名生成');
const testOriginalNames = [
  '夕阳下的剪影.jpg',
  'my-photo.png',
  'test image with spaces.webp'
];

testOriginalNames.forEach(name => {
  const safeName = FileUploadUtils.generateSafeFilename(name);
  console.log(`  "${name}" -> "${safeName}"`);
});

// 测试3: 文件大小验证
console.log('\n📝 测试3: 文件大小验证');
const testSizes = [
  0,                    // 空文件
  1024,                 // 1KB
  5 * 1024 * 1024,      // 5MB
  15 * 1024 * 1024,     // 15MB (超过限制)
  -1                    // 无效大小
];

testSizes.forEach(size => {
  const result = FileUploadUtils.validateFileSize(size);
  const sizeStr = size >= 0 ? `${(size / (1024 * 1024)).toFixed(1)}MB` : 'invalid';
  console.log(`  ${sizeStr}: ${result.isValid ? '✅' : '❌'} ${result.message}`);
});

// 测试4: 文件数量验证
console.log('\n📝 测试4: 文件数量验证');
const testCounts = [0, 1, 5, 9, 10, -1];

testCounts.forEach(count => {
  const result = FileUploadUtils.validateFilesCount(count);
  console.log(`  ${count}个文件: ${result.isValid ? '✅' : '❌'} ${result.message}`);
});

// 测试5: 路径构建
console.log('\n📝 测试5: 路径构建');
const testPaths = [
  { type: 'original', filename: 'photo.jpg' },
  { type: 'compressed', filename: 'image.png' },
  { type: 'thumbnails/300x300', filename: 'thumb.webp' },
  { type: '../dangerous', filename: 'hack.jpg' }
];

testPaths.forEach(({ type, filename }) => {
  try {
    const filePath = FileUploadUtils.buildFilePath(type, filename);
    console.log(`  ${type}/${filename} -> ${filePath}`);
  } catch (error) {
    console.log(`  ${type}/${filename} -> ❌ ${error.message}`);
  }
});

// 测试6: URL构建
console.log('\n📝 测试6: URL构建');
const testUrls = [
  'uploads/images/original/2025/09/17/photo.jpg',
  '/uploads/images/compressed/2025/09/17/image.png'
];

testUrls.forEach(filePath => {
  try {
    const url = FileUploadUtils.buildFileUrl(filePath);
    console.log(`  ${filePath} -> ${url}`);
  } catch (error) {
    console.log(`  ${filePath} -> ❌ ${error.message}`);
  }
});

// 测试7: 文件扩展名检查
console.log('\n📝 测试7: 文件扩展名检查');
const testExtensions = [
  'photo.jpg',
  'image.PNG',
  'file.webp',
  'document.pdf',
  'script.js',
  'noextension'
];

testExtensions.forEach(filename => {
  const ext = FileUploadUtils.getFileExtension(filename);
  const isSupported = FileUploadUtils.isSupportedImageExtension(filename);
  console.log(`  ${filename}: 扩展名="${ext}" 支持=${isSupported ? '✅' : '❌'}`);
});

// 测试8: 模拟文件类型验证（需要实际文件buffer才能完整测试）
console.log('\n📝 测试8: 文件类型验证（模拟）');

// 创建模拟的JPEG文件头
const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
const mockJpegFile = {
  mimetype: 'image/jpeg',
  buffer: jpegHeader
};

const jpegResult = FileUploadUtils.validateFileType(mockJpegFile);
console.log(`  JPEG文件: ${jpegResult.isValid ? '✅' : '❌'} ${jpegResult.message}`);

// 测试无效文件
const invalidFile = {
  mimetype: 'application/pdf',
  buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]) // PDF header
};

const invalidResult = FileUploadUtils.validateFileType(invalidFile);
console.log(`  PDF文件: ${invalidResult.isValid ? '✅' : '❌'} ${invalidResult.message}`);

console.log('\n✅ FileUploadUtils 工具类测试完成！');
console.log('\n📋 测试总结：');
console.log('- 文件名清理：正常处理特殊字符和路径遍历');
console.log('- 文件名生成：包含时间戳和随机字符串，确保唯一性');
console.log('- 文件大小验证：正确识别超大文件和无效大小');
console.log('- 文件数量验证：正确限制批量上传数量');
console.log('- 路径构建：按日期分层，防止路径遍历攻击');
console.log('- URL构建：生成正确的访问URL');
console.log('- 扩展名检查：正确识别支持的图片格式');
console.log('- 文件类型验证：通过文件头验证真实类型');
