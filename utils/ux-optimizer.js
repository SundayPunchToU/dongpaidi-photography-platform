/**
 * 用户体验优化工具 - 阶段4用户体验优化
 * 提供用户引导、反馈机制、性能优化等UX功能
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎯 主要功能:
 * - 用户引导系统
 * - 反馈机制优化
 * - 性能体验优化
 * - 无障碍访问支持
 * - 用户行为分析
 */

import { errorHandler, ErrorTypes, ErrorSeverity } from './error-handler.js'
import { animations } from './animation-system.js'

/**
 * 用户引导系统
 */
export class UserGuideSystem {
  constructor() {
    this.guides = new Map()
    this.currentGuide = null
    this.guideHistory = []
  }

  /**
   * 注册引导流程
   */
  registerGuide(id, config) {
    this.guides.set(id, {
      id,
      steps: config.steps || [],
      autoStart: config.autoStart || false,
      showOnce: config.showOnce || true,
      priority: config.priority || 0
    })
  }

  /**
   * 开始引导
   */
  async startGuide(id, context = {}) {
    const guide = this.guides.get(id)
    if (!guide) {
      console.warn(`引导流程 ${id} 不存在`)
      return false
    }

    // 检查是否已经显示过
    if (guide.showOnce && this.hasShownGuide(id)) {
      return false
    }

    this.currentGuide = {
      ...guide,
      context,
      currentStep: 0,
      startTime: Date.now()
    }

    await this.showCurrentStep()
    this.recordGuideStart(id)
    return true
  }

  /**
   * 显示当前步骤
   */
  async showCurrentStep() {
    if (!this.currentGuide) return

    const step = this.currentGuide.steps[this.currentGuide.currentStep]
    if (!step) {
      await this.completeGuide()
      return
    }

    // 显示引导气泡
    await this.showGuideBubble(step)
  }

  /**
   * 显示引导气泡
   */
  async showGuideBubble(step) {
    const bubble = {
      title: step.title,
      content: step.content,
      position: step.position || 'bottom',
      target: step.target,
      showSkip: step.showSkip !== false,
      showNext: step.showNext !== false,
      showPrev: step.showPrev && this.currentGuide.currentStep > 0
    }

    // 触发显示事件
    this.emitGuideEvent('show-bubble', bubble)

    // 如果有动画，执行动画
    if (step.animation) {
      await this.executeStepAnimation(step.animation)
    }
  }

  /**
   * 下一步
   */
  async nextStep() {
    if (!this.currentGuide) return

    this.currentGuide.currentStep++
    await this.showCurrentStep()
  }

  /**
   * 上一步
   */
  async prevStep() {
    if (!this.currentGuide || this.currentGuide.currentStep <= 0) return

    this.currentGuide.currentStep--
    await this.showCurrentStep()
  }

  /**
   * 跳过引导
   */
  async skipGuide() {
    if (!this.currentGuide) return

    this.recordGuideSkip(this.currentGuide.id, this.currentGuide.currentStep)
    await this.completeGuide()
  }

  /**
   * 完成引导
   */
  async completeGuide() {
    if (!this.currentGuide) return

    const guideId = this.currentGuide.id
    const duration = Date.now() - this.currentGuide.startTime

    this.recordGuideComplete(guideId, duration)
    this.emitGuideEvent('guide-complete', { id: guideId, duration })

    this.currentGuide = null
  }

  /**
   * 检查是否已显示过引导
   */
  hasShownGuide(id) {
    try {
      const shownGuides = wx.getStorageSync('shown_guides') || []
      return shownGuides.includes(id)
    } catch (e) {
      return false
    }
  }

  /**
   * 记录引导显示
   */
  recordGuideStart(id) {
    try {
      const shownGuides = wx.getStorageSync('shown_guides') || []
      if (!shownGuides.includes(id)) {
        shownGuides.push(id)
        wx.setStorageSync('shown_guides', shownGuides)
      }
    } catch (e) {
      console.warn('记录引导状态失败:', e)
    }
  }

  /**
   * 记录引导跳过
   */
  recordGuideSkip(id, step) {
    this.guideHistory.push({
      id,
      action: 'skip',
      step,
      timestamp: Date.now()
    })
  }

  /**
   * 记录引导完成
   */
  recordGuideComplete(id, duration) {
    this.guideHistory.push({
      id,
      action: 'complete',
      duration,
      timestamp: Date.now()
    })
  }

  /**
   * 触发引导事件
   */
  emitGuideEvent(event, data) {
    // 可以通过全局事件系统通知页面
    if (typeof getApp === 'function') {
      const app = getApp()
      if (app.globalData && app.globalData.eventBus) {
        app.globalData.eventBus.emit(event, data)
      }
    }
  }

  /**
   * 执行步骤动画
   */
  async executeStepAnimation(animationConfig) {
    // 根据动画配置执行相应动画
    if (animationConfig.type === 'highlight') {
      await this.highlightElement(animationConfig.target)
    } else if (animationConfig.type === 'pulse') {
      await this.pulseElement(animationConfig.target)
    }
  }

  /**
   * 高亮元素
   */
  async highlightElement(selector) {
    // 实现元素高亮效果
    console.log('高亮元素:', selector)
  }

  /**
   * 脉冲元素
   */
  async pulseElement(selector) {
    // 实现元素脉冲效果
    console.log('脉冲元素:', selector)
  }
}

/**
 * 反馈机制优化
 */
export class FeedbackSystem {
  constructor() {
    this.feedbackQueue = []
    this.isShowingFeedback = false
  }

  /**
   * 显示成功反馈
   */
  showSuccess(message, options = {}) {
    this.addFeedback({
      type: 'success',
      message,
      duration: options.duration || 2000,
      showIcon: options.showIcon !== false,
      ...options
    })
  }

  /**
   * 显示错误反馈
   */
  showError(message, options = {}) {
    this.addFeedback({
      type: 'error',
      message,
      duration: options.duration || 3000,
      showIcon: options.showIcon !== false,
      ...options
    })
  }

  /**
   * 显示警告反馈
   */
  showWarning(message, options = {}) {
    this.addFeedback({
      type: 'warning',
      message,
      duration: options.duration || 2500,
      showIcon: options.showIcon !== false,
      ...options
    })
  }

  /**
   * 显示信息反馈
   */
  showInfo(message, options = {}) {
    this.addFeedback({
      type: 'info',
      message,
      duration: options.duration || 2000,
      showIcon: options.showIcon !== false,
      ...options
    })
  }

  /**
   * 添加反馈到队列
   */
  addFeedback(feedback) {
    this.feedbackQueue.push({
      ...feedback,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    })

    if (!this.isShowingFeedback) {
      this.processFeedbackQueue()
    }
  }

  /**
   * 处理反馈队列
   */
  async processFeedbackQueue() {
    if (this.feedbackQueue.length === 0) {
      this.isShowingFeedback = false
      return
    }

    this.isShowingFeedback = true
    const feedback = this.feedbackQueue.shift()

    await this.displayFeedback(feedback)
    
    // 继续处理下一个反馈
    setTimeout(() => {
      this.processFeedbackQueue()
    }, 300)
  }

  /**
   * 显示反馈
   */
  async displayFeedback(feedback) {
    const config = {
      title: feedback.message,
      icon: this.getFeedbackIcon(feedback.type),
      duration: feedback.duration,
      mask: feedback.mask || false
    }

    if (feedback.type === 'error' || feedback.type === 'warning') {
      // 错误和警告使用模态框
      wx.showModal({
        title: feedback.type === 'error' ? '操作失败' : '注意',
        content: feedback.message,
        showCancel: false,
        confirmText: '我知道了'
      })
    } else {
      // 成功和信息使用Toast
      wx.showToast(config)
    }

    return new Promise(resolve => {
      setTimeout(resolve, feedback.duration)
    })
  }

  /**
   * 获取反馈图标
   */
  getFeedbackIcon(type) {
    const iconMap = {
      success: 'success',
      error: 'error',
      warning: 'none',
      info: 'none'
    }
    return iconMap[type] || 'none'
  }
}

/**
 * 性能体验优化
 */
export class PerformanceUX {
  constructor() {
    this.performanceMetrics = {
      pageLoadTimes: [],
      interactionDelays: [],
      memoryUsage: []
    }
  }

  /**
   * 记录页面加载时间
   */
  recordPageLoad(pageName, startTime, endTime) {
    const loadTime = endTime - startTime
    this.performanceMetrics.pageLoadTimes.push({
      page: pageName,
      loadTime,
      timestamp: Date.now()
    })

    // 如果加载时间过长，显示提示
    if (loadTime > 3000) {
      this.showSlowLoadingTip()
    }
  }

  /**
   * 记录交互延迟
   */
  recordInteractionDelay(action, delay) {
    this.performanceMetrics.interactionDelays.push({
      action,
      delay,
      timestamp: Date.now()
    })

    // 如果延迟过高，优化用户体验
    if (delay > 500) {
      this.optimizeInteraction(action)
    }
  }

  /**
   * 显示慢加载提示
   */
  showSlowLoadingTip() {
    wx.showToast({
      title: '网络较慢，请耐心等待',
      icon: 'none',
      duration: 2000
    })
  }

  /**
   * 优化交互体验
   */
  optimizeInteraction(action) {
    // 添加加载状态，提升用户体验
    console.log(`优化交互: ${action}`)
  }

  /**
   * 预加载资源
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        wx.getImageInfo({
          src: resource.url,
          success: () => console.log(`预加载图片成功: ${resource.url}`),
          fail: () => console.warn(`预加载图片失败: ${resource.url}`)
        })
      }
    })
  }

  /**
   * 图片懒加载
   */
  setupLazyLoading(selector) {
    // 创建交叉观察器
    const observer = wx.createIntersectionObserver()
    
    observer.relativeToViewport().observe(selector, (res) => {
      if (res.intersectionRatio > 0) {
        // 元素进入视口，开始加载
        this.loadImage(res.target)
        observer.unobserve(res.target)
      }
    })
  }

  /**
   * 加载图片
   */
  loadImage(target) {
    const dataSrc = target.dataset.src
    if (dataSrc) {
      target.src = dataSrc
    }
  }
}

/**
 * 无障碍访问支持
 */
export class AccessibilitySupport {
  constructor() {
    this.isVoiceOverEnabled = false
    this.fontSize = 'normal'
    this.highContrast = false
  }

  /**
   * 检测无障碍功能
   */
  detectAccessibilityFeatures() {
    // 检测系统设置
    wx.getSystemInfo({
      success: (res) => {
        // 根据系统信息调整无障碍功能
        this.adjustForAccessibility(res)
      }
    })
  }

  /**
   * 调整无障碍功能
   */
  adjustForAccessibility(systemInfo) {
    // 根据系统信息调整字体大小、对比度等
    if (systemInfo.fontSizeSetting > 1) {
      this.fontSize = 'large'
    }
  }

  /**
   * 设置语音提示
   */
  setVoicePrompt(element, text) {
    if (element && element.setAttribute) {
      element.setAttribute('aria-label', text)
    }
  }

  /**
   * 设置焦点管理
   */
  manageFocus(element) {
    if (element && element.focus) {
      element.focus()
    }
  }
}

/**
 * 用户行为分析
 */
export class UserBehaviorAnalytics {
  constructor() {
    this.behaviors = []
    this.sessionStart = Date.now()
  }

  /**
   * 记录用户行为
   */
  trackBehavior(action, data = {}) {
    this.behaviors.push({
      action,
      data,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStart
    })

    // 分析用户行为模式
    this.analyzeBehaviorPattern()
  }

  /**
   * 分析行为模式
   */
  analyzeBehaviorPattern() {
    // 分析最近的行为，提供个性化建议
    const recentBehaviors = this.behaviors.slice(-10)
    
    // 检测重复操作
    const repeatActions = this.detectRepeatActions(recentBehaviors)
    if (repeatActions.length > 0) {
      this.suggestOptimization(repeatActions)
    }
  }

  /**
   * 检测重复操作
   */
  detectRepeatActions(behaviors) {
    const actionCounts = {}
    behaviors.forEach(behavior => {
      actionCounts[behavior.action] = (actionCounts[behavior.action] || 0) + 1
    })

    return Object.entries(actionCounts)
      .filter(([action, count]) => count >= 3)
      .map(([action]) => action)
  }

  /**
   * 建议优化
   */
  suggestOptimization(repeatActions) {
    // 根据重复操作建议优化方案
    console.log('检测到重复操作，建议优化:', repeatActions)
  }
}

// 创建全局实例
export const userGuide = new UserGuideSystem()
export const feedback = new FeedbackSystem()
export const performanceUX = new PerformanceUX()
export const accessibility = new AccessibilitySupport()
export const analytics = new UserBehaviorAnalytics()

// 便捷方法
export const ux = {
  // 用户引导
  guide: {
    register: (id, config) => userGuide.registerGuide(id, config),
    start: (id, context) => userGuide.startGuide(id, context),
    next: () => userGuide.nextStep(),
    prev: () => userGuide.prevStep(),
    skip: () => userGuide.skipGuide()
  },

  // 反馈系统
  feedback: {
    success: (message, options) => feedback.showSuccess(message, options),
    error: (message, options) => feedback.showError(message, options),
    warning: (message, options) => feedback.showWarning(message, options),
    info: (message, options) => feedback.showInfo(message, options)
  },

  // 性能优化
  performance: {
    recordPageLoad: (page, start, end) => performanceUX.recordPageLoad(page, start, end),
    preload: (resources) => performanceUX.preloadResources(resources),
    lazyLoad: (selector) => performanceUX.setupLazyLoading(selector)
  },

  // 行为分析
  track: (action, data) => analytics.trackBehavior(action, data)
}

console.log('✅ 用户体验优化工具已初始化')
console.log('🎯 支持功能:')
console.log('  - 用户引导系统')
console.log('  - 反馈机制优化')
console.log('  - 性能体验优化')
console.log('  - 无障碍访问支持')
console.log('  - 用户行为分析')
