# 🤖 AI协作优化指南

## 核心原则

### 1. 清晰的意图表达
代码应该清楚地表达其意图，让AI能够理解业务逻辑

### 2. 一致的命名规范
使用统一的命名模式，帮助AI识别相似的功能模块

### 3. 模块化设计
将复杂功能拆分为小的、独立的模块

### 4. 丰富的上下文信息
通过注释和文档提供充足的上下文

## AI友好的代码模式

### 1. 函数命名模式
```javascript
// ✅ 好的命名 - 清晰表达意图
async function getUserWorksList(userId, filters) { }
async function uploadWorkImages(images) { }
async function toggleWorkLikeStatus(workId) { }

// ❌ 避免的命名 - 意图不明确
async function getData(id, opts) { }
async function upload(files) { }
async function toggle(id) { }
```

### 2. 业务逻辑封装
```javascript
// ✅ 好的模式 - 业务逻辑清晰
class WorksBusinessLogic {
  /**
   * 发布作品的完整业务流程
   * 1. 验证用户权限
   * 2. 上传图片
   * 3. 创建作品记录
   * 4. 发送通知
   */
  async publishWork(workData) {
    await this.validateUserPermission()
    const imageUrls = await this.uploadImages(workData.images)
    const work = await this.createWorkRecord({ ...workData, images: imageUrls })
    await this.sendPublishNotification(work)
    return work
  }
  
  async validateUserPermission() {
    // 权限验证逻辑
  }
  
  async uploadImages(images) {
    // 图片上传逻辑
  }
  
  async createWorkRecord(workData) {
    // 创建记录逻辑
  }
  
  async sendPublishNotification(work) {
    // 发送通知逻辑
  }
}

// ❌ 避免的模式 - 逻辑混乱
async function publishWork(data) {
  // 混合了验证、上传、创建、通知等多种逻辑
  if (!user.canPublish) throw new Error('No permission')
  const urls = await Promise.all(data.images.map(img => upload(img)))
  const work = await db.works.create({ ...data, images: urls })
  await notify.send(work.userId, 'work_published', work)
  return work
}
```

### 3. 错误处理模式
```javascript
// ✅ 好的模式 - 结构化错误处理
class WorksService {
  async getWorkById(workId) {
    try {
      this.validateWorkId(workId)
      const work = await this.repository.findById(workId)
      
      if (!work) {
        throw new WorkNotFoundError(`Work with id ${workId} not found`)
      }
      
      return this.transformWorkData(work)
      
    } catch (error) {
      if (error instanceof WorkNotFoundError) {
        throw error // 重新抛出业务错误
      }
      
      // 包装系统错误
      throw new WorksServiceError(
        'Failed to get work',
        { originalError: error, workId }
      )
    }
  }
  
  validateWorkId(workId) {
    if (!workId || typeof workId !== 'string') {
      throw new ValidationError('Invalid work ID')
    }
  }
}

// 自定义错误类
class WorksServiceError extends Error {
  constructor(message, context = {}) {
    super(message)
    this.name = 'WorksServiceError'
    this.context = context
  }
}
```

### 4. 配置驱动模式
```javascript
// ✅ 好的模式 - 配置驱动
const WORK_VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/
  },
  description: {
    required: false,
    maxLength: 1000
  },
  images: {
    required: true,
    minCount: 1,
    maxCount: 9,
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp']
  },
  tags: {
    required: false,
    maxCount: 10,
    maxLength: 20
  }
}

class WorkValidator {
  validate(workData) {
    const errors = []
    
    Object.entries(WORK_VALIDATION_RULES).forEach(([field, rules]) => {
      const value = workData[field]
      const fieldErrors = this.validateField(field, value, rules)
      errors.push(...fieldErrors)
    })
    
    return errors
  }
  
  validateField(field, value, rules) {
    // 根据规则验证字段
  }
}
```

### 5. 状态管理模式
```javascript
// ✅ 好的模式 - 清晰的状态管理
class WorksPageState {
  constructor() {
    this.state = {
      works: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        size: 20,
        total: 0,
        hasMore: true
      },
      filters: {
        category: null,
        sortBy: 'created_at',
        order: 'desc'
      }
    }
    this.listeners = new Set()
  }
  
  // 状态更新方法
  updateWorks(works) {
    this.state.works = works
    this.notifyListeners('works', works)
  }
  
  setLoading(loading) {
    this.state.loading = loading
    this.notifyListeners('loading', loading)
  }
  
  setError(error) {
    this.state.error = error
    this.notifyListeners('error', error)
  }
  
  // 订阅状态变化
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  notifyListeners(key, value) {
    this.listeners.forEach(listener => listener(key, value, this.state))
  }
}
```

## AI提示词优化建议

### 1. 功能描述模板
```
请帮我实现一个[功能名称]功能，具体要求：

**业务场景**：[描述具体的业务场景]

**输入参数**：
- 参数1：类型，说明
- 参数2：类型，说明

**输出结果**：[描述期望的输出]

**异常处理**：[描述需要处理的异常情况]

**性能要求**：[如果有特殊性能要求]

**示例用法**：
```javascript
// 提供具体的使用示例
```

### 2. 重构请求模板
```
请帮我重构以下代码，目标是：

**重构目标**：
1. 提高代码可读性
2. 增强可维护性
3. 优化性能

**当前问题**：
- 问题1：具体描述
- 问题2：具体描述

**约束条件**：
- 保持现有API不变
- 兼容现有调用方式
- 遵循项目编码规范

**现有代码**：
[粘贴需要重构的代码]
```

### 3. 调试协助模板
```
遇到以下问题，需要协助调试：

**问题描述**：[详细描述问题现象]

**复现步骤**：
1. 步骤1
2. 步骤2
3. 步骤3

**期望结果**：[描述期望的正确行为]

**实际结果**：[描述实际发生的错误行为]

**环境信息**：
- 微信开发者工具版本：
- 基础库版本：
- 操作系统：

**相关代码**：
[粘贴相关的代码片段]

**错误日志**：
[粘贴错误信息或日志]
```

## 代码组织最佳实践

### 1. 文件结构
```
feature/
├── index.js          # 入口文件，导出主要API
├── types.js          # 类型定义
├── constants.js      # 常量定义
├── utils.js          # 工具函数
├── service.js        # 业务逻辑
├── validator.js      # 验证逻辑
├── errors.js         # 错误定义
└── __tests__/        # 测试文件
    ├── service.test.js
    └── utils.test.js
```

### 2. 导出规范
```javascript
// ✅ 清晰的导出结构
// index.js
export { WorksService } from './service'
export { WorkValidator } from './validator'
export { WorksServiceError, WorkNotFoundError } from './errors'
export * from './types'
export * from './constants'

// 默认导出主要类
export { WorksService as default } from './service'
```

### 3. 依赖注入
```javascript
// ✅ 依赖注入模式，便于测试和扩展
class WorksService {
  constructor(dependencies = {}) {
    this.api = dependencies.api || new ApiClient()
    this.storage = dependencies.storage || new StorageAdapter()
    this.validator = dependencies.validator || new WorkValidator()
    this.logger = dependencies.logger || console
  }
}

// 使用时
const worksService = new WorksService({
  api: customApiClient,
  storage: customStorage
})
```
