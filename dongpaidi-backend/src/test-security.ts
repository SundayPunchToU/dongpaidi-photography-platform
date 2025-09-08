import 'module-alias/register';
import axios, { AxiosError } from 'axios';
import { SecurityUtil } from '@/utils/security';
import { securityConfig } from '@/config/security';
import { log } from '@/config/logger';

/**
 * 安全功能测试脚本
 */
class SecurityTester {
  private baseURL = 'http://localhost:3000';
  private testResults: Array<{
    test: string;
    passed: boolean;
    message: string;
    duration: number;
  }> = [];

  /**
   * 运行所有安全测试
   */
  async runAllTests(): Promise<void> {
    console.log('🔒 开始安全功能测试...\n');

    const tests = [
      () => this.testPasswordSecurity(),
      () => this.testEncryption(),
      () => this.testInputValidation(),
      () => this.testRateLimit(),
      () => this.testSQLInjectionProtection(),
      () => this.testXSSProtection(),
      () => this.testCSRFProtection(),
      () => this.testSecurityHeaders(),
      () => this.testAuthenticationSecurity(),
      () => this.testDataMasking(),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('测试执行失败:', error);
      }
    }

    this.printResults();
  }

  /**
   * 测试密码安全功能
   */
  async testPasswordSecurity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 测试密码强度验证
      const weakPassword = '123456';
      const strongPassword = 'MyStr0ng!P@ssw0rd';
      
      const weakResult = SecurityUtil.validatePasswordStrength(weakPassword);
      const strongResult = SecurityUtil.validatePasswordStrength(strongPassword);
      
      const passed = !weakResult.isValid && strongResult.isValid;
      
      this.addTestResult('密码强度验证', passed, 
        passed ? '密码强度验证正常工作' : '密码强度验证失败', 
        Date.now() - startTime
      );

      // 测试密码哈希和验证
      const password = 'testPassword123!';
      const hash = await SecurityUtil.hashPassword(password);
      const isValid = await SecurityUtil.verifyPassword(password, hash);
      const isInvalid = await SecurityUtil.verifyPassword('wrongPassword', hash);
      
      const hashPassed = isValid && !isInvalid;
      
      this.addTestResult('密码哈希验证', hashPassed,
        hashPassed ? '密码哈希和验证正常工作' : '密码哈希验证失败',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('密码安全功能', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试加密功能
   */
  async testEncryption(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const plaintext = 'This is a secret message';
      
      // 测试AES加密
      const encrypted = SecurityUtil.encrypt(plaintext);
      const decrypted = SecurityUtil.decrypt(encrypted);
      
      const passed = decrypted === plaintext;
      
      this.addTestResult('AES加密解密', passed,
        passed ? 'AES加密解密正常工作' : 'AES加密解密失败',
        Date.now() - startTime
      );

      // 测试HMAC签名
      const data = 'test data';
      const secret = 'test secret';
      const signature = SecurityUtil.generateHMAC(data, secret);
      const isValid = SecurityUtil.verifyHMAC(data, signature, secret);
      const isInvalid = SecurityUtil.verifyHMAC('tampered data', signature, secret);
      
      const hmacPassed = isValid && !isInvalid;
      
      this.addTestResult('HMAC签名验证', hmacPassed,
        hmacPassed ? 'HMAC签名验证正常工作' : 'HMAC签名验证失败',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('加密功能', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试输入验证
   */
  async testInputValidation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 测试恶意输入检测
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        '$(rm -rf /)',
      ];

      let detectedCount = 0;
      
      for (const input of maliciousInputs) {
        const result = SecurityUtil.detectMaliciousInput(input);
        if (result.isMalicious) {
          detectedCount++;
        }
      }

      const passed = detectedCount === maliciousInputs.length;
      
      this.addTestResult('恶意输入检测', passed,
        passed ? `成功检测到 ${detectedCount}/${maliciousInputs.length} 个恶意输入` : 
                `只检测到 ${detectedCount}/${maliciousInputs.length} 个恶意输入`,
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('输入验证', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试速率限制
   */
  async testRateLimit(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 快速发送多个请求测试速率限制
      const requests = Array(20).fill(null).map(() => 
        axios.get(`${this.baseURL}/health`, { timeout: 5000 })
      );

      const results = await Promise.allSettled(requests);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      // 如果有请求被拒绝，说明速率限制生效
      const passed = rejectedCount > 0;
      
      this.addTestResult('速率限制', passed,
        passed ? `速率限制生效，${rejectedCount} 个请求被限制` : '速率限制未生效',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('速率限制', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试SQL注入防护
   */
  async testSQLInjectionProtection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const sqlInjectionPayloads = [
        "1' OR '1'='1",
        "'; DROP TABLE users; --",
        "1 UNION SELECT * FROM users",
      ];

      let blockedCount = 0;

      for (const payload of sqlInjectionPayloads) {
        try {
          await axios.post(`${this.baseURL}/api/v1/test`, {
            data: payload
          }, { timeout: 5000 });
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 400) {
            blockedCount++;
          }
        }
      }

      const passed = blockedCount > 0;
      
      this.addTestResult('SQL注入防护', passed,
        passed ? `成功阻止 ${blockedCount}/${sqlInjectionPayloads.length} 个SQL注入尝试` : 
                'SQL注入防护未生效',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('SQL注入防护', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试XSS防护
   */
  async testXSSProtection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
      ];

      let blockedCount = 0;

      for (const payload of xssPayloads) {
        try {
          await axios.post(`${this.baseURL}/api/v1/test`, {
            content: payload
          }, { timeout: 5000 });
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 400) {
            blockedCount++;
          }
        }
      }

      const passed = blockedCount > 0;
      
      this.addTestResult('XSS防护', passed,
        passed ? `成功阻止 ${blockedCount}/${xssPayloads.length} 个XSS尝试` : 
                'XSS防护未生效',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('XSS防护', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试CSRF防护
   */
  async testCSRFProtection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 生成CSRF令牌
      const token1 = SecurityUtil.generateCSRFToken();
      const token2 = SecurityUtil.generateCSRFToken();
      
      // 验证令牌
      const validResult = SecurityUtil.verifyCSRFToken(token1, token1);
      const invalidResult = SecurityUtil.verifyCSRFToken(token1, token2);
      
      const passed = validResult && !invalidResult;
      
      this.addTestResult('CSRF防护', passed,
        passed ? 'CSRF令牌验证正常工作' : 'CSRF令牌验证失败',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('CSRF防护', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试安全头
   */
  async testSecurityHeaders(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
      ];

      const presentHeaders = requiredHeaders.filter(header => headers[header]);
      const passed = presentHeaders.length >= requiredHeaders.length * 0.75; // 至少75%的头存在
      
      this.addTestResult('安全头设置', passed,
        `检测到 ${presentHeaders.length}/${requiredHeaders.length} 个安全头`,
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('安全头设置', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试身份验证安全
   */
  async testAuthenticationSecurity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 测试无效令牌
      try {
        await axios.get(`${this.baseURL}/api/v1/protected`, {
          headers: { Authorization: 'Bearer invalid_token' },
          timeout: 5000
        });
        this.addTestResult('身份验证安全', false, '无效令牌未被拒绝', Date.now() - startTime);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          this.addTestResult('身份验证安全', true, '无效令牌被正确拒绝', Date.now() - startTime);
        } else {
          this.addTestResult('身份验证安全', false, '意外的错误响应', Date.now() - startTime);
        }
      }

    } catch (error) {
      this.addTestResult('身份验证安全', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 测试数据脱敏
   */
  async testDataMasking(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 测试各种数据脱敏
      const phone = '13812345678';
      const email = 'test@example.com';
      const idCard = '110101199001011234';
      
      const maskedPhone = SecurityUtil.maskSensitiveData(phone, 'phone');
      const maskedEmail = SecurityUtil.maskSensitiveData(email, 'email');
      const maskedIdCard = SecurityUtil.maskSensitiveData(idCard, 'idCard');
      
      const phonePassed = maskedPhone !== phone && maskedPhone.includes('****');
      const emailPassed = maskedEmail !== email && maskedEmail.includes('***');
      const idCardPassed = maskedIdCard !== idCard && maskedIdCard.includes('**********');
      
      const passed = phonePassed && emailPassed && idCardPassed;
      
      this.addTestResult('数据脱敏', passed,
        passed ? '数据脱敏正常工作' : '数据脱敏失败',
        Date.now() - startTime
      );

    } catch (error) {
      this.addTestResult('数据脱敏', false, `测试失败: ${error}`, Date.now() - startTime);
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(test: string, passed: boolean, message: string, duration: number): void {
    this.testResults.push({ test, passed, message, duration });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const time = `${duration}ms`;
    console.log(`${status} ${test} (${time}): ${message}`);
  }

  /**
   * 打印测试结果汇总
   */
  private printResults(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log('🔒 安全功能测试结果汇总');
    console.log('='.repeat(60));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log('='.repeat(60));

    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    console.log('\n🔒 安全功能测试完成!');
  }
}

/**
 * 运行安全测试
 */
async function runSecurityTests(): Promise<void> {
  const tester = new SecurityTester();
  await tester.runAllTests();
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

export { SecurityTester, runSecurityTests };
