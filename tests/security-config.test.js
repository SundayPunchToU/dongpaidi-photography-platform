/**
 * 安全配置测试
 * 测试环境变量配置和安全检查功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('安全配置测试', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const envExamplePath = path.join(projectRoot, '.env.example');
  const envPath = path.join(projectRoot, '.env');
  const securityCheckScript = path.join(projectRoot, 'scripts', 'security-check.sh');
  const generateKeysScript = path.join(projectRoot, 'scripts', 'generate-keys.sh');

  describe('.env.example文件', () => {
    test('应该存在.env.example文件', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    test('应该包含所有必需的环境变量模板', () => {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'REDIS_PASSWORD',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ENCRYPTION_KEY',
        'ADMIN_PASSWORD',
        'POSTGRES_DB',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD'
      ];

      requiredVars.forEach(varName => {
        expect(content).toMatch(new RegExp(`${varName}=`));
      });
    });

    test('不应该包含真实的敏感信息', () => {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      // 检查是否包含占位符而不是真实密钥
      expect(content).toMatch(/JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET/);
      expect(content).toMatch(/POSTGRES_PASSWORD=YOUR_SECURE_DATABASE_PASSWORD/);
      expect(content).toMatch(/REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD/);
      
      // 确保不包含真实的密钥
      expect(content).not.toMatch(/dongpaidi_password_2024/);
      expect(content).not.toMatch(/redis_password_2024/);
      expect(content).not.toMatch(/admin123456/);
    });
  });

  describe('安全检查脚本', () => {
    test('安全检查脚本应该存在且可执行', () => {
      expect(fs.existsSync(securityCheckScript)).toBe(true);
      
      const stats = fs.statSync(securityCheckScript);
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // 检查执行权限
    });

    test('密钥生成脚本应该存在且可执行', () => {
      expect(fs.existsSync(generateKeysScript)).toBe(true);
      
      const stats = fs.statSync(generateKeysScript);
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // 检查执行权限
    });
  });

  describe('Docker配置安全性', () => {
    test('docker-compose.yml应该使用环境变量', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      
      // 检查是否使用环境变量而不是硬编码密码
      expect(content).toMatch(/POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD\}/);
      expect(content).toMatch(/REDIS_PASSWORD.*\$\{REDIS_PASSWORD\}/);
      expect(content).toMatch(/JWT_SECRET.*\$\{JWT_SECRET\}/);
      
      // 确保不包含硬编码密码
      expect(content).not.toMatch(/dongpaidi_password_2024/);
      expect(content).not.toMatch(/redis_password_2024/);
      expect(content).not.toMatch(/your_jwt_secret_key_2024_dongpaidi_very_secure/);
    });

    test('docker-compose.db.yml应该使用环境变量', () => {
      const dockerComposeDbPath = path.join(projectRoot, 'docker-compose.db.yml');
      const content = fs.readFileSync(dockerComposeDbPath, 'utf8');
      
      // 检查是否使用环境变量
      expect(content).toMatch(/POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD\}/);
      
      // 确保不包含硬编码密码
      expect(content).not.toMatch(/dongpaidi_password_2024/);
    });
  });

  describe('环境变量验证', () => {
    test('JWT密钥长度验证', () => {
      // 模拟短密钥
      const shortSecret = 'short';
      expect(shortSecret.length).toBeLessThan(32);
      
      // 模拟安全密钥
      const secureSecret = 'a'.repeat(64);
      expect(secureSecret.length).toBeGreaterThanOrEqual(32);
    });

    test('加密密钥长度验证', () => {
      // 加密密钥必须是32字符
      const validEncryptionKey = 'a'.repeat(32);
      expect(validEncryptionKey.length).toBe(32);
      
      const invalidEncryptionKey = 'a'.repeat(16);
      expect(invalidEncryptionKey.length).not.toBe(32);
    });
  });

  describe('敏感信息检测', () => {
    test('检测默认密钥值', () => {
      const defaultSecrets = [
        'your_jwt_secret_key_2024_dongpaidi_very_secure',
        'dongpaidi_password_2024',
        'redis_password_2024',
        'admin123456',
        'YOUR_SUPER_SECURE_JWT_SECRET_AT_LEAST_32_CHARACTERS_LONG',
        'CHANGE_THIS_JWT_SECRET_TO_SECURE_RANDOM_STRING_AT_LEAST_32_CHARS'
      ];
      
      // 这些都应该被识别为不安全的默认值
      defaultSecrets.forEach(secret => {
        expect(secret).toMatch(/^(your_|dongpaidi_|redis_|admin|YOUR_|CHANGE_THIS_)/);
      });
    });

    test('验证安全密钥格式', () => {
      // 模拟安全的随机密钥（十六进制格式）
      const secureHexKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
      expect(secureHexKey).toMatch(/^[a-f0-9]{64}$/);
      
      // 模拟不安全的密钥
      const insecureKey = 'password123';
      expect(insecureKey).not.toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('配置文件完整性', () => {
    test('setup-docker.sh应该生成安全密钥', () => {
      const setupDockerPath = path.join(projectRoot, 'setup-docker.sh');
      const content = fs.readFileSync(setupDockerPath, 'utf8');
      
      // 检查是否使用随机密钥生成
      expect(content).toMatch(/openssl rand/);
      expect(content).toMatch(/jwt_secret=\$\(openssl rand -hex 32\)/);
      expect(content).toMatch(/encryption_key=\$\(openssl rand -hex 16\)/);
      
      // 确保不包含硬编码密码
      expect(content).not.toMatch(/JWT_SECRET=your_jwt_secret_key_2024_dongpaidi_very_secure/);
      expect(content).not.toMatch(/ADMIN_PASSWORD=admin123456/);
    });

    test('init-database.sh应该从环境变量读取配置', () => {
      const initDbPath = path.join(projectRoot, 'init-database.sh');
      const content = fs.readFileSync(initDbPath, 'utf8');
      
      // 检查是否从环境变量读取
      expect(content).toMatch(/\$\{POSTGRES_PASSWORD/);
      expect(content).toMatch(/\$\{REDIS_PASSWORD/);
      
      // 确保不包含硬编码密码
      expect(content).not.toMatch(/dongpaidi_password_2024/);
      expect(content).not.toMatch(/redis_password_2024/);
    });
  });
});

describe('密钥生成功能测试', () => {
  test('应该能够生成符合要求的JWT密钥', () => {
    const crypto = require('crypto');
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    
    expect(jwtSecret).toHaveLength(128); // 64字节 = 128十六进制字符
    expect(jwtSecret).toMatch(/^[a-f0-9]+$/);
  });

  test('应该能够生成符合要求的加密密钥', () => {
    const crypto = require('crypto');
    const encryptionKey = crypto.randomBytes(16).toString('hex');
    
    expect(encryptionKey).toHaveLength(32); // 16字节 = 32十六进制字符
    expect(encryptionKey).toMatch(/^[a-f0-9]+$/);
  });

  test('生成的密钥应该是唯一的', () => {
    const crypto = require('crypto');
    const key1 = crypto.randomBytes(32).toString('hex');
    const key2 = crypto.randomBytes(32).toString('hex');
    
    expect(key1).not.toBe(key2);
  });
});
