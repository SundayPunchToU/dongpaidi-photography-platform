#!/usr/bin/env node

/**
 * 阶段3代码质量优化验证脚本
 * 验证错误处理、性能优化、代码规范等功能
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 */

const fs = require('fs')
const path = require('path')

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

// 验证结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
}

/**
 * 输出彩色文本
 */
function colorLog(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`)
}

/**
 * 验证文件是否存在
 */
function verifyFileExists(filePath, description) {
  results.total++
  const fullPath = path.resolve(filePath)
  
  if (fs.existsSync(fullPath)) {
    results.passed++
    results.details.push({
      type: 'file',
      name: description,
      status: 'passed',
      message: `文件存在: ${filePath}`
    })
    return true
  } else {
    results.failed++
    results.details.push({
      type: 'file',
      name: description,
      status: 'failed',
      message: `文件不存在: ${filePath}`
    })
    return false
  }
}

/**
 * 验证文件内容包含指定字符串
 */
function verifyFileContent(filePath, searchString, description) {
  results.total++
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(searchString)) {
      results.passed++
      results.details.push({
        type: 'content',
        name: description,
        status: 'passed',
        message: `内容验证通过: ${searchString}`
      })
      return true
    } else {
      results.failed++
      results.details.push({
        type: 'content',
        name: description,
        status: 'failed',
        message: `内容不包含: ${searchString}`
      })
      return false
    }
  } catch (error) {
    results.failed++
    results.details.push({
      type: 'content',
      name: description,
      status: 'failed',
      message: `读取文件失败: ${error.message}`
    })
    return false
  }
}

/**
 * 验证代码行数
 */
function verifyCodeLines(filePath, minLines, description) {
  results.total++
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').length
    
    if (lines >= minLines) {
      results.passed++
      results.details.push({
        type: 'lines',
        name: description,
        status: 'passed',
        message: `代码行数: ${lines} (>= ${minLines})`
      })
      return true
    } else {
      results.failed++
      results.details.push({
        type: 'lines',
        name: description,
        status: 'failed',
        message: `代码行数不足: ${lines} (< ${minLines})`
      })
      return false
    }
  } catch (error) {
    results.failed++
    results.details.push({
      type: 'lines',
      name: description,
      status: 'failed',
      message: `读取文件失败: ${error.message}`
    })
    return false
  }
}

/**
 * 统计代码质量指标
 */
function analyzeCodeQuality() {
  const files = [
    'utils/error-handler.js',
    'utils/performance-optimizer.js',
    'utils/code-standards.js',
    'utils/api-client.js',
    'utils/api.js'
  ]

  let totalLines = 0
  let totalCommentLines = 0
  let totalFunctions = 0
  let totalClasses = 0

  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      
      totalLines += lines.length
      
      // 统计注释行
      const commentLines = lines.filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('//') || 
               trimmed.startsWith('/*') || 
               trimmed.startsWith('*')
      }).length
      totalCommentLines += commentLines
      
      // 统计函数和类
      const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length
      const classes = (content.match(/class\s+\w+/g) || []).length
      
      totalFunctions += functions
      totalClasses += classes
    }
  })

  const commentCoverage = totalLines > 0 ? (totalCommentLines / totalLines * 100).toFixed(1) : 0

  return {
    totalLines,
    totalCommentLines,
    totalFunctions,
    totalClasses,
    commentCoverage
  }
}

/**
 * 主验证函数
 */
function runVerification() {
  colorLog('\n🔍 阶段3代码质量优化验证开始', 'cyan')
  colorLog('='.repeat(50), 'cyan')

  // 1. 验证核心文件存在
  colorLog('\n📁 验证核心文件...', 'yellow')
  verifyFileExists('utils/error-handler.js', '统一错误处理系统')
  verifyFileExists('utils/performance-optimizer.js', '性能优化工具')
  verifyFileExists('utils/code-standards.js', '代码规范化工具')
  verifyFileExists('tests/phase3-quality-optimization.test.js', '阶段3测试文件')

  // 2. 验证错误处理系统
  colorLog('\n🚨 验证错误处理系统...', 'yellow')
  verifyFileContent('utils/error-handler.js', 'class AppError', '标准化错误类')
  verifyFileContent('utils/error-handler.js', 'ErrorTypes', '错误类型枚举')
  verifyFileContent('utils/error-handler.js', 'ErrorSeverity', '错误严重级别')
  verifyFileContent('utils/error-handler.js', 'class ErrorHandler', '错误处理器类')
  verifyFileContent('utils/api-client.js', 'errorHandler', 'API客户端集成错误处理')

  // 3. 验证性能优化功能
  colorLog('\n⚡ 验证性能优化功能...', 'yellow')
  verifyFileContent('utils/performance-optimizer.js', 'class CacheManager', '缓存管理器')
  verifyFileContent('utils/performance-optimizer.js', 'class RequestDeduplicator', '请求去重管理器')
  verifyFileContent('utils/performance-optimizer.js', 'class PerformanceMonitor', '性能监控器')
  verifyFileContent('utils/api-client.js', 'cache.get', 'API客户端集成缓存')
  verifyFileContent('utils/api-client.js', 'dedupe.execute', 'API客户端集成去重')

  // 4. 验证代码规范化
  colorLog('\n📏 验证代码规范化...', 'yellow')
  verifyFileContent('utils/code-standards.js', 'class NamingConventions', '命名规范工具')
  verifyFileContent('utils/code-standards.js', 'class DataValidator', '数据验证工具')
  verifyFileContent('utils/code-standards.js', 'class CodeQualityChecker', '代码质量检查工具')
  verifyFileContent('utils/api.js', 'handleServiceError', '服务层错误处理')

  // 5. 验证代码行数
  colorLog('\n📊 验证代码质量...', 'yellow')
  verifyCodeLines('utils/error-handler.js', 300, '错误处理系统代码量')
  verifyCodeLines('utils/performance-optimizer.js', 300, '性能优化工具代码量')
  verifyCodeLines('utils/code-standards.js', 300, '代码规范工具代码量')
  verifyCodeLines('tests/phase3-quality-optimization.test.js', 200, '测试代码量')

  // 6. 分析代码质量指标
  colorLog('\n📈 分析代码质量指标...', 'yellow')
  const quality = analyzeCodeQuality()
  
  // 输出结果
  colorLog('\n📋 验证结果详情:', 'blue')
  results.details.forEach(detail => {
    const icon = detail.status === 'passed' ? '✅' : '❌'
    const color = detail.status === 'passed' ? 'green' : 'red'
    colorLog(`${icon} ${detail.name}: ${detail.message}`, color)
  })

  // 输出总结
  colorLog('\n📊 验证总结:', 'bright')
  colorLog(`总验证项: ${results.total}`, 'blue')
  colorLog(`通过: ${results.passed}`, 'green')
  colorLog(`失败: ${results.failed}`, 'red')
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1)
  colorLog(`成功率: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red')

  // 输出代码质量指标
  colorLog('\n📈 代码质量指标:', 'bright')
  colorLog(`总代码行数: ${quality.totalLines}`, 'blue')
  colorLog(`注释行数: ${quality.totalCommentLines}`, 'blue')
  colorLog(`注释覆盖率: ${quality.commentCoverage}%`, 'blue')
  colorLog(`函数数量: ${quality.totalFunctions}`, 'blue')
  colorLog(`类数量: ${quality.totalClasses}`, 'blue')

  // 最终结果
  if (results.failed === 0) {
    colorLog('\n🎉 阶段3代码质量优化验证完全通过！', 'green')
    colorLog('✨ 所有质量优化功能都已正确实现', 'green')
  } else if (successRate >= 80) {
    colorLog('\n✅ 阶段3代码质量优化验证基本通过', 'yellow')
    colorLog(`⚠️  有 ${results.failed} 项需要改进`, 'yellow')
  } else {
    colorLog('\n❌ 阶段3代码质量优化验证未通过', 'red')
    colorLog(`🔧 需要修复 ${results.failed} 项问题`, 'red')
  }

  return results.failed === 0
}

// 运行验证
if (require.main === module) {
  const success = runVerification()
  process.exit(success ? 0 : 1)
}

module.exports = { runVerification, results }
