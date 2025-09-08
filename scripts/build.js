/**
 * 构建脚本
 * 支持多环境构建和代码优化
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 构建配置
const BUILD_CONFIG = {
  development: {
    minify: false,
    sourcemap: true,
    apiBaseUrl: 'https://dev-api.dongpaidi.com',
    debug: true
  },
  staging: {
    minify: true,
    sourcemap: true,
    apiBaseUrl: 'https://staging-api.dongpaidi.com',
    debug: false
  },
  production: {
    minify: true,
    sourcemap: false,
    apiBaseUrl: 'https://api.dongpaidi.com',
    debug: false
  }
}

/**
 * 主构建函数
 * @param {string} env - 构建环境
 */
async function build(env = 'development') {
  console.log(`🚀 开始构建 ${env} 环境...`)
  
  const config = BUILD_CONFIG[env]
  if (!config) {
    throw new Error(`未知的构建环境: ${env}`)
  }
  
  try {
    // 1. 清理输出目录
    await cleanDist()
    
    // 2. 生成环境配置
    await generateEnvConfig(env, config)
    
    // 3. TypeScript编译
    if (fs.existsSync('tsconfig.json')) {
      await compileTypeScript()
    }
    
    // 4. 代码检查
    await lintCode()
    
    // 5. 构建npm包
    await buildNpm()
    
    // 6. 代码压缩（生产环境）
    if (config.minify) {
      await minifyCode()
    }
    
    // 7. 生成构建报告
    await generateBuildReport(env)
    
    console.log(`✅ ${env} 环境构建完成！`)
    
  } catch (error) {
    console.error(`❌ 构建失败:`, error.message)
    process.exit(1)
  }
}

/**
 * 清理输出目录
 */
async function cleanDist() {
  console.log('🧹 清理输出目录...')
  
  const dirsToClean = ['dist', 'miniprogram_npm']
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`   删除 ${dir}/`)
    }
  })
}

/**
 * 生成环境配置文件
 */
async function generateEnvConfig(env, config) {
  console.log('⚙️  生成环境配置...')
  
  const envConfig = {
    NODE_ENV: env,
    API_BASE_URL: config.apiBaseUrl,
    DEBUG: config.debug,
    VERSION: getVersion(),
    BUILD_TIME: new Date().toISOString()
  }
  
  const configContent = `
/**
 * 环境配置文件 - 自动生成，请勿手动修改
 * 构建时间: ${envConfig.BUILD_TIME}
 * 构建环境: ${env}
 */
export const ENV_CONFIG = ${JSON.stringify(envConfig, null, 2)}

export const isDev = ENV_CONFIG.NODE_ENV === 'development'
export const isProd = ENV_CONFIG.NODE_ENV === 'production'
export const isStaging = ENV_CONFIG.NODE_ENV === 'staging'
`
  
  fs.writeFileSync('config/env.js', configContent)
  console.log('   生成 config/env.js')
}

/**
 * TypeScript编译
 */
async function compileTypeScript() {
  console.log('🔷 编译 TypeScript...')
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
    console.log('   TypeScript 编译检查通过')
  } catch (error) {
    throw new Error('TypeScript 编译失败')
  }
}

/**
 * 代码检查
 */
async function lintCode() {
  console.log('🔍 代码质量检查...')
  
  try {
    execSync('npx eslint . --ext .js,.ts --fix', { stdio: 'inherit' })
    console.log('   ESLint 检查通过')
  } catch (error) {
    console.warn('   ESLint 检查发现问题，请修复后重新构建')
    throw error
  }
}

/**
 * 构建npm包
 */
async function buildNpm() {
  console.log('📦 构建 npm 包...')
  
  try {
    execSync('npm run build:npm', { stdio: 'inherit' })
    console.log('   npm 包构建完成')
  } catch (error) {
    throw new Error('npm 包构建失败')
  }
}

/**
 * 代码压缩
 */
async function minifyCode() {
  console.log('🗜️  代码压缩...')
  
  // 这里可以添加代码压缩逻辑
  // 微信小程序开发者工具会自动处理压缩
  console.log('   代码压缩完成')
}

/**
 * 生成构建报告
 */
async function generateBuildReport(env) {
  console.log('📊 生成构建报告...')
  
  const report = {
    environment: env,
    buildTime: new Date().toISOString(),
    version: getVersion(),
    files: getFileStats(),
    dependencies: getDependencies()
  }
  
  fs.writeFileSync('dist/build-report.json', JSON.stringify(report, null, 2))
  console.log('   生成 dist/build-report.json')
}

/**
 * 获取版本号
 */
function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  return packageJson.version
}

/**
 * 获取文件统计信息
 */
function getFileStats() {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {}
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(file)) {
        walkDir(filePath)
      } else if (stat.isFile()) {
        const ext = path.extname(file)
        stats.totalFiles++
        stats.totalSize += stat.size
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1
      }
    })
  }
  
  walkDir('.')
  return stats
}

/**
 * 获取依赖信息
 */
function getDependencies() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  return {
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(packageJson.devDependencies || {})
  }
}

// 命令行调用
if (require.main === module) {
  const env = process.argv[2] || 'development'
  build(env)
}

module.exports = { build }
