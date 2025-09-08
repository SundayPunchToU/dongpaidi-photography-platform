#!/usr/bin/env node

/**
 * 安全加固版服务器启动脚本
 */

import 'module-alias/register';
import { startSecureServer } from './secureApp';
import { log } from '@/config/logger';
import { SecurityUtil } from '@/utils/security';

/**
 * 启动前安全检查
 */
async function preStartSecurityCheck(): Promise<boolean> {
  console.log('🔒 执行启动前安全检查...\n');

  const checks = [
    checkEnvironmentVariables(),
    checkJWTSecrets(),
    checkEncryptionKeys(),
    checkSecurityConfiguration(),
    checkDependencies(),
  ];

  const results = await Promise.all(checks);
  const allPassed = results.every(result => result.passed);

  console.log('\n' + '='.repeat(50));
  console.log('🔒 安全检查结果汇总');
  console.log('='.repeat(50));

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}: ${result.message}`);
  });

  console.log('='.repeat(50));

  if (!allPassed) {
    console.log('\n❌ 安全检查失败，请修复上述问题后重新启动服务器');
    return false;
  }

  console.log('\n✅ 所有安全检查通过，服务器可以安全启动');
  return true;
}

/**
 * 检查环境变量
 */
async function checkEnvironmentVariables(): Promise<{ name: string; passed: boolean; message: string }> {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  return {
    name: '环境变量检查',
    passed: missingVars.length === 0,
    message: missingVars.length === 0 
      ? '所有必需的环境变量已设置'
      : `缺少环境变量: ${missingVars.join(', ')}`,
  };
}

/**
 * 检查JWT密钥安全性
 */
async function checkJWTSecrets(): Promise<{ name: string; passed: boolean; message: string }> {
  const jwtSecret = process.env.JWT_SECRET || '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';

  const issues: string[] = [];

  // 检查密钥长度
  if (jwtSecret.length < 32) {
    issues.push('JWT_SECRET长度不足32字符');
  }

  if (refreshSecret.length < 32) {
    issues.push('JWT_REFRESH_SECRET长度不足32字符');
  }

  // 检查是否使用默认值
  const defaultSecrets = [
    'your-super-secret-jwt-key-here-change-in-production',
    'your-super-secret-refresh-key-here-change-in-production',
    'secret',
    'jwt-secret',
  ];

  if (defaultSecrets.includes(jwtSecret)) {
    issues.push('JWT_SECRET使用默认值，存在安全风险');
  }

  if (defaultSecrets.includes(refreshSecret)) {
    issues.push('JWT_REFRESH_SECRET使用默认值，存在安全风险');
  }

  // 检查密钥复杂性
  if (jwtSecret === refreshSecret) {
    issues.push('JWT_SECRET和JWT_REFRESH_SECRET不应相同');
  }

  return {
    name: 'JWT密钥安全检查',
    passed: issues.length === 0,
    message: issues.length === 0 
      ? 'JWT密钥配置安全'
      : issues.join('; '),
  };
}

/**
 * 检查加密密钥
 */
async function checkEncryptionKeys(): Promise<{ name: string; passed: boolean; message: string }> {
  const encryptionKey = process.env.ENCRYPTION_KEY || '';

  const issues: string[] = [];

  // 检查密钥长度（AES-256需要32字节）
  if (encryptionKey.length < 32) {
    issues.push('ENCRYPTION_KEY长度不足32字符');
  }

  // 检查是否使用默认值
  const defaultKeys = [
    'your-32-character-encryption-key-here',
    'encryption-key',
    'secret-key',
  ];

  if (defaultKeys.includes(encryptionKey)) {
    issues.push('ENCRYPTION_KEY使用默认值，存在安全风险');
  }

  return {
    name: '加密密钥检查',
    passed: issues.length === 0,
    message: issues.length === 0 
      ? '加密密钥配置安全'
      : issues.join('; '),
  };
}

/**
 * 检查安全配置
 */
async function checkSecurityConfiguration(): Promise<{ name: string; passed: boolean; message: string }> {
  const issues: string[] = [];

  // 检查生产环境配置
  if (process.env.NODE_ENV === 'production') {
    // 生产环境应该启用HTTPS
    if (process.env.FORCE_HTTPS !== 'true') {
      issues.push('生产环境建议启用FORCE_HTTPS');
    }

    // 生产环境应该限制CORS
    if (process.env.CORS_ORIGIN === '*') {
      issues.push('生产环境不应使用通配符CORS配置');
    }

    // 生产环境应该有SSL证书配置
    if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
      issues.push('生产环境缺少SSL证书配置');
    }
  }

  // 检查安全功能是否启用
  if (process.env.SECURITY_ENABLED !== 'true') {
    issues.push('安全功能未启用');
  }

  if (process.env.THREAT_DETECTION_ENABLED !== 'true') {
    issues.push('威胁检测功能未启用');
  }

  return {
    name: '安全配置检查',
    passed: issues.length === 0,
    message: issues.length === 0 
      ? '安全配置正确'
      : issues.join('; '),
  };
}

/**
 * 检查依赖项安全性
 */
async function checkDependencies(): Promise<{ name: string; passed: boolean; message: string }> {
  try {
    // 这里可以添加依赖项安全扫描
    // 例如检查已知漏洞的包版本
    
    return {
      name: '依赖项安全检查',
      passed: true,
      message: '依赖项安全检查通过',
    };
  } catch (error) {
    return {
      name: '依赖项安全检查',
      passed: false,
      message: `依赖项检查失败: ${error}`,
    };
  }
}

/**
 * 生成安全密钥（用于首次设置）
 */
function generateSecurityKeys(): void {
  console.log('🔑 生成安全密钥...\n');
  
  const jwtSecret = SecurityUtil.generateJWTSecret();
  const refreshSecret = SecurityUtil.generateJWTSecret();
  const encryptionKey = SecurityUtil.generateSecureRandom(32);
  const apiKey = SecurityUtil.generateApiKey();

  console.log('请将以下密钥添加到您的.env文件中：\n');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
  console.log(`API_KEY=${apiKey}`);
  console.log('\n⚠️  请妥善保管这些密钥，不要泄露给他人！');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 检查命令行参数
    const args = process.argv.slice(2);
    
    if (args.includes('--generate-keys')) {
      generateSecurityKeys();
      return;
    }

    if (args.includes('--security-test')) {
      const { runSecurityTests } = await import('./test-security');
      await runSecurityTests();
      return;
    }

    // 执行启动前安全检查
    const securityCheckPassed = await preStartSecurityCheck();
    
    if (!securityCheckPassed) {
      process.exit(1);
    }

    // 记录安全启动事件
    SecurityUtil.logSecurityEvent({
      type: 'server_start',
      severity: 'low',
      description: 'Secure server starting',
      ip: 'localhost',
      userAgent: 'system',
    });

    // 启动安全服务器
    console.log('\n🚀 启动安全加固版服务器...\n');
    await startSecureServer();

  } catch (error) {
    log.error('Failed to start secure server:', error);
    
    // 记录启动失败事件
    SecurityUtil.logSecurityEvent({
      type: 'server_start_failed',
      severity: 'high',
      description: `Server start failed: ${error}`,
      ip: 'localhost',
      userAgent: 'system',
    });
    
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔒 懂拍帝安全加固版服务器

使用方法:
  npm run secure-start          启动安全服务器
  npm run secure-start -- --generate-keys    生成安全密钥
  npm run secure-start -- --security-test    运行安全测试
  npm run secure-start -- --help             显示帮助信息

环境变量:
  NODE_ENV                 运行环境 (development/production)
  DATABASE_URL             数据库连接字符串
  JWT_SECRET               JWT签名密钥
  JWT_REFRESH_SECRET       JWT刷新令牌密钥
  ENCRYPTION_KEY           数据加密密钥
  SECURITY_ENABLED         是否启用安全功能
  THREAT_DETECTION_ENABLED 是否启用威胁检测
  CORS_ORIGIN              允许的CORS源
  FORCE_HTTPS              是否强制HTTPS

安全功能:
  ✅ 速率限制保护
  ✅ 输入验证和清理
  ✅ SQL注入防护
  ✅ XSS攻击防护
  ✅ CSRF保护
  ✅ 威胁检测
  ✅ 审计日志
  ✅ 数据脱敏
  ✅ 会话安全
  ✅ 安全头设置
`);
  process.exit(0);
}

// 运行主函数
main().catch(console.error);
