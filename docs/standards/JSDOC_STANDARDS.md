# 📝 JSDoc 文档标准

## 基本原则
- 所有公共API必须有JSDoc注释
- 复杂业务逻辑必须有详细说明
- 参数和返回值必须明确类型
- 异常情况必须文档化

## 标准模板

### 类注释
```javascript
/**
 * 作品服务类 - 处理作品相关的业务逻辑
 * @class WorksService
 * @description 提供作品的增删改查、点赞、分享等功能
 * @author AI Assistant
 * @since 1.0.0
 * @example
 * const worksService = new WorksService(apiClient, storage)
 * const works = await worksService.getWorksList({ page: 1, size: 20 })
 */
export class WorksService {
  /**
   * 构造函数
   * @param {ApiClient} apiClient - API客户端实例
   * @param {StorageAdapter} storageAdapter - 存储适配器实例
   */
  constructor(apiClient, storageAdapter) {
    this.api = apiClient
    this.storage = storageAdapter
  }
}
```

### 方法注释
```javascript
/**
 * 获取作品列表
 * @async
 * @method getWorksList
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.size - 每页数量，默认20
 * @param {string} [params.category] - 作品分类，可选
 * @param {string} [params.userId] - 用户ID，可选
 * @returns {Promise<Work[]>} 作品列表
 * @throws {WorksServiceError} 当API调用失败时抛出
 * @throws {ValidationError} 当参数验证失败时抛出
 * @example
 * // 获取第一页作品
 * const works = await worksService.getWorksList({ page: 1, size: 20 })
 * 
 * // 获取特定分类的作品
 * const portraitWorks = await worksService.getWorksList({ 
 *   page: 1, 
 *   size: 10, 
 *   category: 'portrait' 
 * })
 */
async getWorksList(params) {
  // 实现代码
}
```

### 组件注释
```javascript
/**
 * 作品卡片组件
 * @component WorkCard
 * @description 展示单个作品的卡片组件，支持点赞、分享、评论等交互
 * @param {Object} work - 作品数据对象
 * @param {string} work.id - 作品ID
 * @param {string} work.title - 作品标题
 * @param {string} work.coverImage - 封面图片URL
 * @param {Object} work.user - 作者信息
 * @param {boolean} [showActions=true] - 是否显示操作按钮
 * @fires WorkCard#like - 点赞事件
 * @fires WorkCard#share - 分享事件
 * @fires WorkCard#comment - 评论事件
 * @example
 * <work-card 
 *   work="{{workData}}" 
 *   show-actions="{{true}}"
 *   bind:like="onWorkLike"
 *   bind:share="onWorkShare"
 * />
 */
Component({
  properties: {
    work: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      value: true
    }
  }
})
```

### 事件注释
```javascript
/**
 * 点赞事件处理
 * @event WorkCard#like
 * @type {Object}
 * @property {string} workId - 作品ID
 * @property {boolean} isLiked - 当前点赞状态
 * @property {number} likeCount - 点赞数量
 */

/**
 * 处理作品点赞
 * @method handleLike
 * @param {Event} e - 微信小程序事件对象
 * @param {Object} e.detail - 事件详情
 * @param {string} e.detail.workId - 作品ID
 * @emits WorkCard#like
 */
handleLike(e) {
  const { workId } = e.detail
  // 处理逻辑
  this.triggerEvent('like', {
    workId,
    isLiked: !this.data.isLiked,
    likeCount: this.data.likeCount + (this.data.isLiked ? -1 : 1)
  })
}
```

### 类型定义注释
```javascript
/**
 * 作品数据类型
 * @typedef {Object} Work
 * @property {string} id - 作品唯一标识
 * @property {string} title - 作品标题
 * @property {string} description - 作品描述
 * @property {string} coverImage - 封面图片URL
 * @property {string[]} images - 图片URL数组
 * @property {User} user - 作者信息
 * @property {WorkStats} stats - 统计信息
 * @property {string[]} tags - 标签数组
 * @property {string} category - 作品分类
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * 用户数据类型
 * @typedef {Object} User
 * @property {string} id - 用户ID
 * @property {string} nickname - 昵称
 * @property {string} avatar - 头像URL
 * @property {boolean} isPhotographer - 是否为摄影师
 * @property {string} [bio] - 个人简介
 * @property {string} [location] - 所在地
 */

/**
 * 作品统计信息
 * @typedef {Object} WorkStats
 * @property {number} likes - 点赞数
 * @property {number} comments - 评论数
 * @property {number} views - 浏览数
 * @property {number} shares - 分享数
 */
```

## 特殊注释标记

### 待办事项
```javascript
/**
 * @todo 实现图片压缩功能
 * @todo 添加水印功能
 * @fixme 修复在低版本微信中的兼容性问题
 * @hack 临时解决方案，需要后续优化
 * @deprecated 此方法已废弃，请使用 newMethod() 替代
 */
```

### 平台特定
```javascript
/**
 * 获取设备信息
 * @platform wechat - 微信小程序专用
 * @platform react-native - RN版本需要不同实现
 * @crossplatform false - 此方法不跨平台
 */
```

## 文档生成配置

### JSDoc 配置文件 (jsdoc.json)
```json
{
  "source": {
    "include": ["./src/", "./platform/wechat/"],
    "exclude": ["node_modules/", "miniprogram_npm/"]
  },
  "opts": {
    "destination": "./docs/api/",
    "recurse": true
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": false
  }
}
```
