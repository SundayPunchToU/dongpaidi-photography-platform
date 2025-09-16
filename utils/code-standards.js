/**
 * 代码规范化工具 - 阶段3代码质量优化
 * 提供统一的代码规范、验证工具和最佳实践
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 主要功能:
 * - 统一命名规范
 * - 数据验证工具
 * - 代码质量检查
 * - 最佳实践指南
 * - 开发规范约束
 */

import { errorHandler, ErrorTypes, ErrorSeverity, createError } from './error-handler.js'

/**
 * 命名规范工具
 */
export class NamingConventions {
  /**
   * 转换为驼峰命名
   */
  static toCamelCase(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
  }

  /**
   * 转换为下划线命名
   */
  static toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  }

  /**
   * 转换为短横线命名
   */
  static toKebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }

  /**
   * 验证变量名是否符合规范
   */
  static validateVariableName(name) {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/
    return camelCasePattern.test(name)
  }

  /**
   * 验证常量名是否符合规范
   */
  static validateConstantName(name) {
    const constantPattern = /^[A-Z][A-Z0-9_]*$/
    return constantPattern.test(name)
  }

  /**
   * 验证函数名是否符合规范
   */
  static validateFunctionName(name) {
    const functionPattern = /^[a-z][a-zA-Z0-9]*$/
    return functionPattern.test(name)
  }
}

/**
 * 数据验证工具
 */
export class DataValidator {
  /**
   * 验证必填字段
   */
  static validateRequired(data, requiredFields) {
    const errors = []
    
    for (const field of requiredFields) {
      if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} 是必填字段`
        })
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证字符串长度
   */
  static validateStringLength(value, minLength = 0, maxLength = Infinity) {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: '值必须是字符串'
      }
    }

    if (value.length < minLength) {
      return {
        isValid: false,
        message: `长度不能少于 ${minLength} 个字符`
      }
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        message: `长度不能超过 ${maxLength} 个字符`
      }
    }

    return { isValid: true }
  }

  /**
   * 验证数字范围
   */
  static validateNumberRange(value, min = -Infinity, max = Infinity) {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        isValid: false,
        message: '值必须是有效数字'
      }
    }

    if (value < min) {
      return {
        isValid: false,
        message: `值不能小于 ${min}`
      }
    }

    if (value > max) {
      return {
        isValid: false,
        message: `值不能大于 ${max}`
      }
    }

    return { isValid: true }
  }

  /**
   * 验证邮箱格式
   */
  static validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      isValid: emailPattern.test(email),
      message: emailPattern.test(email) ? '' : '邮箱格式不正确'
    }
  }

  /**
   * 验证手机号格式
   */
  static validatePhone(phone) {
    const phonePattern = /^1[3-9]\d{9}$/
    return {
      isValid: phonePattern.test(phone),
      message: phonePattern.test(phone) ? '' : '手机号格式不正确'
    }
  }

  /**
   * 验证URL格式
   */
  static validateUrl(url) {
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        message: 'URL格式不正确'
      }
    }
  }

  /**
   * 综合验证
   */
  static validate(data, rules) {
    const errors = []

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field]

      // 必填验证
      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          rule: 'required',
          message: `${field} 是必填字段`
        })
        continue
      }

      // 如果值为空且非必填，跳过其他验证
      if (!fieldRules.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // 类型验证
      if (fieldRules.type) {
        const expectedType = fieldRules.type
        const actualType = typeof value

        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push({
            field,
            rule: 'type',
            message: `${field} 必须是数组`
          })
          continue
        } else if (expectedType !== 'array' && actualType !== expectedType) {
          errors.push({
            field,
            rule: 'type',
            message: `${field} 必须是 ${expectedType} 类型`
          })
          continue
        }
      }

      // 长度验证
      if (fieldRules.minLength !== undefined || fieldRules.maxLength !== undefined) {
        const lengthResult = this.validateStringLength(
          value,
          fieldRules.minLength,
          fieldRules.maxLength
        )
        if (!lengthResult.isValid) {
          errors.push({
            field,
            rule: 'length',
            message: `${field} ${lengthResult.message}`
          })
        }
      }

      // 数值范围验证
      if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
        const rangeResult = this.validateNumberRange(
          value,
          fieldRules.min,
          fieldRules.max
        )
        if (!rangeResult.isValid) {
          errors.push({
            field,
            rule: 'range',
            message: `${field} ${rangeResult.message}`
          })
        }
      }

      // 格式验证
      if (fieldRules.format) {
        let formatResult
        switch (fieldRules.format) {
          case 'email':
            formatResult = this.validateEmail(value)
            break
          case 'phone':
            formatResult = this.validatePhone(value)
            break
          case 'url':
            formatResult = this.validateUrl(value)
            break
          default:
            if (fieldRules.format instanceof RegExp) {
              formatResult = {
                isValid: fieldRules.format.test(value),
                message: '格式不正确'
              }
            }
        }

        if (formatResult && !formatResult.isValid) {
          errors.push({
            field,
            rule: 'format',
            message: `${field} ${formatResult.message}`
          })
        }
      }

      // 自定义验证
      if (fieldRules.custom && typeof fieldRules.custom === 'function') {
        const customResult = fieldRules.custom(value, data)
        if (customResult && !customResult.isValid) {
          errors.push({
            field,
            rule: 'custom',
            message: `${field} ${customResult.message}`
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 代码质量检查工具
 */
export class CodeQualityChecker {
  /**
   * 检查函数复杂度
   */
  static checkFunctionComplexity(functionCode) {
    // 简单的复杂度检查：统计条件语句数量
    const conditions = (functionCode.match(/if|else|for|while|switch|case|\?/g) || []).length
    const complexity = conditions + 1

    return {
      complexity,
      level: complexity <= 5 ? 'low' : complexity <= 10 ? 'medium' : 'high',
      suggestion: complexity > 10 ? '建议拆分函数以降低复杂度' : ''
    }
  }

  /**
   * 检查变量命名
   */
  static checkNaming(code) {
    const issues = []
    
    // 检查变量命名
    const variablePattern = /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    let match
    while ((match = variablePattern.exec(code)) !== null) {
      const varName = match[1]
      if (!NamingConventions.validateVariableName(varName) && 
          !NamingConventions.validateConstantName(varName)) {
        issues.push({
          type: 'naming',
          message: `变量名 "${varName}" 不符合命名规范`,
          suggestion: `建议使用驼峰命名: ${NamingConventions.toCamelCase(varName)}`
        })
      }
    }

    return issues
  }

  /**
   * 检查注释覆盖率
   */
  static checkCommentCoverage(code) {
    const lines = code.split('\n')
    const codeLines = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('/*') &&
      !line.trim().startsWith('*')
    ).length
    
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length

    const coverage = codeLines > 0 ? (commentLines / codeLines * 100) : 0

    return {
      coverage: Math.round(coverage),
      level: coverage >= 20 ? 'good' : coverage >= 10 ? 'fair' : 'poor',
      suggestion: coverage < 20 ? '建议增加代码注释以提高可读性' : ''
    }
  }
}

/**
 * 最佳实践指南
 */
export class BestPractices {
  /**
   * 获取API设计最佳实践
   */
  static getApiDesignPractices() {
    return [
      '使用RESTful设计原则',
      '统一错误响应格式',
      '实现请求重试机制',
      '添加请求超时设置',
      '使用适当的HTTP状态码',
      '实现API版本控制',
      '添加请求限流保护',
      '完善API文档'
    ]
  }

  /**
   * 获取错误处理最佳实践
   */
  static getErrorHandlingPractices() {
    return [
      '使用统一的错误处理机制',
      '提供用户友好的错误信息',
      '记录详细的错误日志',
      '实现错误恢复机制',
      '区分不同类型的错误',
      '避免暴露敏感信息',
      '实现错误监控和报警',
      '提供错误重试选项'
    ]
  }

  /**
   * 获取性能优化最佳实践
   */
  static getPerformancePractices() {
    return [
      '实现智能缓存策略',
      '使用请求去重机制',
      '优化图片加载和显示',
      '实现懒加载和预加载',
      '减少不必要的网络请求',
      '使用性能监控工具',
      '优化数据结构和算法',
      '实现资源压缩和合并'
    ]
  }

  /**
   * 获取代码质量最佳实践
   */
  static getCodeQualityPractices() {
    return [
      '遵循统一的命名规范',
      '保持函数简洁和单一职责',
      '添加充分的代码注释',
      '编写单元测试',
      '使用类型检查',
      '实现代码审查流程',
      '使用代码格式化工具',
      '定期重构和优化代码'
    ]
  }
}

// 导出便捷方法
export const naming = NamingConventions
export const validator = DataValidator
export const qualityChecker = CodeQualityChecker
export const bestPractices = BestPractices

// 创建验证错误的便捷方法
export function createValidationError(field, message) {
  return createError(
    `${field}: ${message}`,
    ErrorTypes.VALIDATION,
    ErrorSeverity.LOW,
    null,
    { field }
  )
}

// 批量验证并抛出错误
export function validateAndThrow(data, rules) {
  const result = validator.validate(data, rules)
  if (!result.isValid) {
    const errorMessage = result.errors.map(e => e.message).join('; ')
    throw createValidationError('数据验证', errorMessage)
  }
  return true
}

console.log('✅ 代码规范化工具已初始化')
console.log('🔧 支持功能:')
console.log('  - 统一命名规范')
console.log('  - 数据验证工具')
console.log('  - 代码质量检查')
console.log('  - 最佳实践指南')
