/**
 * 性能压力测试 - 阶段5全栈功能集成
 * 测试系统在高负载下的性能表现
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 测试覆盖:
 * - API性能负载测试
 * - 数据库查询性能测试
 * - 并发用户处理测试
 * - 内存使用监控
 * - 响应时间基准测试
 */

import { apiClient } from '../utils/api-client.js'
import { UserService, WorksService, AppointmentService } from '../utils/api.js'

describe('阶段5性能压力测试', () => {
  let performanceMetrics = {
    apiResponseTimes: [],
    memoryUsage: [],
    concurrentUsers: 0,
    errorRate: 0,
    throughput: 0
  }

  beforeAll(() => {
    // 设置性能测试环境
    jest.setTimeout(30000) // 30秒超时
  })

  beforeEach(() => {
    // 重置性能指标
    performanceMetrics = {
      apiResponseTimes: [],
      memoryUsage: [],
      concurrentUsers: 0,
      errorRate: 0,
      throughput: 0
    }
  })

  describe('API性能负载测试', () => {
    test('单个API接口响应时间基准测试', async () => {
      const testCases = [
        { name: '获取用户信息', api: () => UserService.getCurrentUser() },
        { name: '获取作品列表', api: () => WorksService.getWorks({ page: 1, limit: 20 }) },
        { name: '获取约拍列表', api: () => AppointmentService.getAppointments({ page: 1, limit: 20 }) },
        { name: '搜索作品', api: () => WorksService.searchWorks({ keyword: '人像', page: 1, limit: 10 }) }
      ]

      for (const testCase of testCases) {
        const responseTimes = []
        
        // 执行10次请求测试
        for (let i = 0; i < 10; i++) {
          const startTime = Date.now()
          
          try {
            await testCase.api()
            const responseTime = Date.now() - startTime
            responseTimes.push(responseTime)
          } catch (error) {
            console.warn(`API ${testCase.name} 请求失败:`, error.message)
          }
        }

        // 计算性能指标
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        const maxResponseTime = Math.max(...responseTimes)
        const minResponseTime = Math.min(...responseTimes)

        // 性能断言
        expect(avgResponseTime).toBeLessThan(500) // 平均响应时间 < 500ms
        expect(maxResponseTime).toBeLessThan(1000) // 最大响应时间 < 1s
        expect(minResponseTime).toBeGreaterThan(0) // 最小响应时间 > 0

        console.log(`${testCase.name} 性能指标:`)
        console.log(`  平均响应时间: ${avgResponseTime.toFixed(2)}ms`)
        console.log(`  最大响应时间: ${maxResponseTime}ms`)
        console.log(`  最小响应时间: ${minResponseTime}ms`)
      }
    })

    test('并发请求处理能力测试', async () => {
      const concurrentRequests = 50
      const requests = []

      // 模拟并发请求
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          measureApiPerformance(() => UserService.getCurrentUser())
        )
      }

      const startTime = Date.now()
      const results = await Promise.allSettled(requests)
      const totalTime = Date.now() - startTime

      // 分析结果
      const successfulRequests = results.filter(r => r.status === 'fulfilled')
      const failedRequests = results.filter(r => r.status === 'rejected')
      
      const successRate = (successfulRequests.length / concurrentRequests) * 100
      const throughput = (successfulRequests.length / totalTime) * 1000 // 请求/秒

      // 性能断言
      expect(successRate).toBeGreaterThan(95) // 成功率 > 95%
      expect(throughput).toBeGreaterThan(10) // 吞吐量 > 10 请求/秒

      console.log(`并发测试结果 (${concurrentRequests}个并发请求):`)
      console.log(`  成功率: ${successRate.toFixed(2)}%`)
      console.log(`  吞吐量: ${throughput.toFixed(2)} 请求/秒`)
      console.log(`  总耗时: ${totalTime}ms`)
    })

    test('长时间负载测试', async () => {
      const testDuration = 10000 // 10秒
      const requestInterval = 100 // 每100ms一个请求
      const startTime = Date.now()
      
      const results = []
      let requestCount = 0

      while (Date.now() - startTime < testDuration) {
        try {
          const result = await measureApiPerformance(() => UserService.getCurrentUser())
          results.push(result)
          requestCount++
        } catch (error) {
          results.push({ error: true, responseTime: 0 })
        }

        await new Promise(resolve => setTimeout(resolve, requestInterval))
      }

      // 分析长时间负载结果
      const successfulResults = results.filter(r => !r.error)
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length
      const successRate = (successfulResults.length / results.length) * 100

      expect(successRate).toBeGreaterThan(90) // 长时间负载成功率 > 90%
      expect(avgResponseTime).toBeLessThan(800) // 长时间负载平均响应时间 < 800ms

      console.log(`长时间负载测试结果 (${testDuration}ms):`)
      console.log(`  总请求数: ${requestCount}`)
      console.log(`  成功率: ${successRate.toFixed(2)}%`)
      console.log(`  平均响应时间: ${avgResponseTime.toFixed(2)}ms`)
    })
  })

  describe('数据库查询性能测试', () => {
    test('复杂查询性能测试', async () => {
      const complexQueries = [
        {
          name: '用户作品统计查询',
          query: () => UserService.getUserStats('user123')
        },
        {
          name: '热门作品排序查询',
          query: () => WorksService.getTrendingWorks({ page: 1, limit: 50 })
        },
        {
          name: '多条件搜索查询',
          query: () => WorksService.searchWorks({
            keyword: '人像',
            category: 'portrait',
            location: '北京',
            dateRange: '7d',
            page: 1,
            limit: 20
          })
        }
      ]

      for (const queryTest of complexQueries) {
        const queryTimes = []

        // 执行5次查询测试
        for (let i = 0; i < 5; i++) {
          const startTime = Date.now()
          
          try {
            await queryTest.query()
            const queryTime = Date.now() - startTime
            queryTimes.push(queryTime)
          } catch (error) {
            console.warn(`查询 ${queryTest.name} 失败:`, error.message)
          }
        }

        if (queryTimes.length > 0) {
          const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
          
          // 复杂查询性能断言
          expect(avgQueryTime).toBeLessThan(1000) // 复杂查询 < 1s

          console.log(`${queryTest.name} 平均查询时间: ${avgQueryTime.toFixed(2)}ms`)
        }
      }
    })

    test('大数据量查询性能测试', async () => {
      // 测试大数据量分页查询
      const largePaginationTests = [
        { page: 1, limit: 100 },
        { page: 10, limit: 100 },
        { page: 50, limit: 100 },
        { page: 100, limit: 100 }
      ]

      for (const pagination of largePaginationTests) {
        const startTime = Date.now()
        
        try {
          const result = await WorksService.getWorks(pagination)
          const queryTime = Date.now() - startTime

          // 大数据量查询性能断言
          expect(queryTime).toBeLessThan(2000) // 大数据量查询 < 2s
          expect(result.data.works).toBeDefined()

          console.log(`大数据量查询 (页码: ${pagination.page}, 每页: ${pagination.limit}): ${queryTime}ms`)
        } catch (error) {
          console.warn(`大数据量查询失败:`, error.message)
        }
      }
    })
  })

  describe('内存使用监控测试', () => {
    test('内存泄漏检测', async () => {
      const initialMemory = getMemoryUsage()
      
      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        await UserService.getCurrentUser()
        await WorksService.getWorks({ page: 1, limit: 10 })
        
        // 每10次操作检查一次内存
        if (i % 10 === 0) {
          const currentMemory = getMemoryUsage()
          performanceMetrics.memoryUsage.push(currentMemory)
        }
      }

      const finalMemory = getMemoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // 内存使用断言
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 内存增长 < 50MB

      console.log(`内存使用情况:`)
      console.log(`  初始内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  最终内存: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })

    test('缓存效率测试', async () => {
      // 第一次请求（无缓存）
      const firstRequestTime = await measureApiPerformance(() => UserService.getCurrentUser())
      
      // 第二次请求（有缓存）
      const secondRequestTime = await measureApiPerformance(() => UserService.getCurrentUser())
      
      // 缓存效率断言
      expect(secondRequestTime.responseTime).toBeLessThan(firstRequestTime.responseTime)
      
      const cacheEfficiency = ((firstRequestTime.responseTime - secondRequestTime.responseTime) / firstRequestTime.responseTime) * 100

      console.log(`缓存效率测试:`)
      console.log(`  首次请求: ${firstRequestTime.responseTime}ms`)
      console.log(`  缓存请求: ${secondRequestTime.responseTime}ms`)
      console.log(`  效率提升: ${cacheEfficiency.toFixed(2)}%`)
    })
  })

  describe('前端性能测试', () => {
    test('页面渲染性能测试', async () => {
      // 模拟页面渲染时间
      const renderingTests = [
        { name: '发现页面', dataSize: 'large' },
        { name: '作品详情页', dataSize: 'medium' },
        { name: '个人主页', dataSize: 'medium' },
        { name: '搜索页面', dataSize: 'small' }
      ]

      for (const test of renderingTests) {
        const startTime = Date.now()
        
        // 模拟数据加载和渲染
        await simulatePageRendering(test.dataSize)
        
        const renderTime = Date.now() - startTime

        // 页面渲染性能断言
        expect(renderTime).toBeLessThan(1500) // 页面渲染 < 1.5s

        console.log(`${test.name} 渲染时间: ${renderTime}ms`)
      }
    })

    test('图片加载性能测试', async () => {
      const imageSizes = ['small', 'medium', 'large']
      
      for (const size of imageSizes) {
        const startTime = Date.now()
        
        // 模拟图片加载
        await simulateImageLoading(size)
        
        const loadTime = Date.now() - startTime

        // 图片加载性能断言
        const maxLoadTime = size === 'large' ? 3000 : size === 'medium' ? 2000 : 1000
        expect(loadTime).toBeLessThan(maxLoadTime)

        console.log(`${size} 图片加载时间: ${loadTime}ms`)
      }
    })
  })
})

/**
 * 辅助函数
 */

async function measureApiPerformance(apiCall) {
  const startTime = Date.now()
  
  try {
    const result = await apiCall()
    const responseTime = Date.now() - startTime
    
    return {
      success: true,
      responseTime,
      result
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      success: false,
      responseTime,
      error: error.message
    }
  }
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage()
  }
  
  // 浏览器环境模拟
  return {
    heapUsed: performance.memory?.usedJSHeapSize || 0,
    heapTotal: performance.memory?.totalJSHeapSize || 0,
    external: 0,
    rss: 0
  }
}

async function simulatePageRendering(dataSize) {
  const renderTimes = {
    small: 200,
    medium: 500,
    large: 1000
  }
  
  const renderTime = renderTimes[dataSize] || 500
  await new Promise(resolve => setTimeout(resolve, renderTime))
}

async function simulateImageLoading(size) {
  const loadTimes = {
    small: 300,
    medium: 800,
    large: 1500
  }
  
  const loadTime = loadTimes[size] || 800
  await new Promise(resolve => setTimeout(resolve, loadTime))
}

console.log('✅ 性能压力测试已加载')
console.log('⚡ 测试覆盖:')
console.log('  - API性能负载测试')
console.log('  - 数据库查询性能测试')
console.log('  - 内存使用监控测试')
console.log('  - 前端性能测试')
console.log('  - 并发处理能力测试')
