/**
 * 动画效果系统 - 阶段4用户体验优化
 * 提供统一的动画效果、过渡动画和微交互
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎬 主要功能:
 * - 页面转场动画
 * - 微交互动画
 * - 手势动画
 * - 加载动画
 * - 反馈动画
 */

/**
 * 动画管理器
 */
export class AnimationManager {
  constructor() {
    this.activeAnimations = new Map()
    this.animationQueue = []
    this.isAnimating = false
  }

  /**
   * 创建动画
   */
  createAnimation(options = {}) {
    const animation = wx.createAnimation({
      duration: options.duration || 300,
      timingFunction: options.timingFunction || 'ease',
      delay: options.delay || 0,
      transformOrigin: options.transformOrigin || '50% 50% 0'
    })

    return animation
  }

  /**
   * 执行动画序列
   */
  async executeSequence(animations) {
    this.isAnimating = true
    
    try {
      for (const animationConfig of animations) {
        await this.executeAnimation(animationConfig)
      }
    } finally {
      this.isAnimating = false
    }
  }

  /**
   * 执行单个动画
   */
  executeAnimation(config) {
    return new Promise((resolve) => {
      const { target, animation, duration = 300 } = config
      
      if (target && target.setData) {
        target.setData({
          [config.property]: animation.export()
        })
      }

      setTimeout(resolve, duration)
    })
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    this.activeAnimations.clear()
    this.animationQueue = []
    this.isAnimating = false
  }
}

/**
 * 页面转场动画
 */
export class PageTransitions {
  /**
   * 淡入淡出转场
   */
  static fadeTransition(page, direction = 'in') {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out'
    })

    if (direction === 'in') {
      animation.opacity(1).step()
    } else {
      animation.opacity(0).step()
    }

    return animation
  }

  /**
   * 滑动转场
   */
  static slideTransition(page, direction = 'left') {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })

    const translateX = direction === 'left' ? '-100%' : '100%'
    
    animation.translateX(translateX).step()
    
    setTimeout(() => {
      animation.translateX(0).step()
      page.setData({
        slideAnimation: animation.export()
      })
    }, 50)

    return animation
  }

  /**
   * 缩放转场
   */
  static scaleTransition(page, direction = 'in') {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    })

    if (direction === 'in') {
      animation.scale(0.8).opacity(0).step({ duration: 0 })
      animation.scale(1).opacity(1).step()
    } else {
      animation.scale(0.8).opacity(0).step()
    }

    return animation
  }
}

/**
 * 微交互动画
 */
export class MicroInteractions {
  /**
   * 按钮点击动画
   */
  static buttonPress(target, callback) {
    const animation = wx.createAnimation({
      duration: 150,
      timingFunction: 'ease-out'
    })

    // 按下效果
    animation.scale(0.95).step()
    target.setData({
      buttonAnimation: animation.export()
    })

    setTimeout(() => {
      // 恢复效果
      animation.scale(1).step()
      target.setData({
        buttonAnimation: animation.export()
      })
      
      if (callback) callback()
    }, 150)
  }

  /**
   * 点赞动画
   */
  static likeAnimation(target, isLiked) {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    })

    if (isLiked) {
      // 点赞动画：放大 -> 缩小
      animation.scale(1.3).step({ duration: 150 })
      animation.scale(1).step({ duration: 150 })
    } else {
      // 取消点赞：轻微缩放
      animation.scale(0.9).step({ duration: 100 })
      animation.scale(1).step({ duration: 100 })
    }

    target.setData({
      likeAnimation: animation.export()
    })
  }

  /**
   * 收藏动画
   */
  static favoriteAnimation(target, isFavorited) {
    const animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease-out'
    })

    if (isFavorited) {
      // 收藏动画：旋转 + 缩放
      animation.rotate(360).scale(1.2).step({ duration: 200 })
      animation.rotate(360).scale(1).step({ duration: 200 })
    } else {
      // 取消收藏：简单缩放
      animation.scale(0.8).step({ duration: 100 })
      animation.scale(1).step({ duration: 100 })
    }

    target.setData({
      favoriteAnimation: animation.export()
    })
  }

  /**
   * 卡片悬浮动画
   */
  static cardHover(target, isHovered) {
    const animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })

    if (isHovered) {
      animation.translateY(-10).step()
    } else {
      animation.translateY(0).step()
    }

    target.setData({
      cardAnimation: animation.export()
    })
  }
}

/**
 * 手势动画
 */
export class GestureAnimations {
  /**
   * 下拉刷新动画
   */
  static pullRefresh(target, progress) {
    const animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'linear'
    })

    const rotation = progress * 360
    const scale = Math.min(1, progress * 2)

    animation.rotate(rotation).scale(scale).step()

    target.setData({
      refreshAnimation: animation.export()
    })
  }

  /**
   * 侧滑删除动画
   */
  static swipeDelete(target, progress) {
    const animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'linear'
    })

    const translateX = -progress * 150 // 最大滑动150rpx

    animation.translateX(translateX).step()

    target.setData({
      swipeAnimation: animation.export()
    })
  }

  /**
   * 图片缩放动画
   */
  static imageZoom(target, scale, x = 0, y = 0) {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out'
    })

    animation.scale(scale).translateX(x).translateY(y).step()

    target.setData({
      imageAnimation: animation.export()
    })
  }
}

/**
 * 加载动画
 */
export class LoadingAnimations {
  /**
   * 旋转加载动画
   */
  static spinLoader(target) {
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'linear',
      iterationCount: -1 // 无限循环
    })

    animation.rotate(360).step()

    target.setData({
      loadingAnimation: animation.export()
    })
  }

  /**
   * 脉冲加载动画
   */
  static pulseLoader(target) {
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease-in-out',
      iterationCount: -1
    })

    animation.scale(1.1).opacity(0.7).step({ duration: 500 })
    animation.scale(1).opacity(1).step({ duration: 500 })

    target.setData({
      pulseAnimation: animation.export()
    })
  }

  /**
   * 骨架屏动画
   */
  static skeletonLoader(target) {
    const animation = wx.createAnimation({
      duration: 1500,
      timingFunction: 'ease-in-out',
      iterationCount: -1
    })

    animation.translateX(-100).step({ duration: 0 })
    animation.translateX(100).step({ duration: 1500 })

    target.setData({
      skeletonAnimation: animation.export()
    })
  }
}

/**
 * 反馈动画
 */
export class FeedbackAnimations {
  /**
   * 成功动画
   */
  static successAnimation(target) {
    const animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    })

    // 缩放 + 旋转
    animation.scale(0).rotate(0).step({ duration: 0 })
    animation.scale(1.2).rotate(360).step({ duration: 300 })
    animation.scale(1).step({ duration: 300 })

    target.setData({
      successAnimation: animation.export()
    })
  }

  /**
   * 错误动画
   */
  static errorAnimation(target) {
    const animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease-out'
    })

    // 摇摆动画
    animation.translateX(10).step({ duration: 100 })
    animation.translateX(-10).step({ duration: 100 })
    animation.translateX(5).step({ duration: 100 })
    animation.translateX(-5).step({ duration: 100 })
    animation.translateX(0).step({ duration: 100 })

    target.setData({
      errorAnimation: animation.export()
    })
  }

  /**
   * 警告动画
   */
  static warningAnimation(target) {
    const animation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-in-out'
    })

    // 闪烁动画
    animation.opacity(0.5).step({ duration: 200 })
    animation.opacity(1).step({ duration: 200 })
    animation.opacity(0.5).step({ duration: 200 })
    animation.opacity(1).step({ duration: 200 })

    target.setData({
      warningAnimation: animation.export()
    })
  }
}

/**
 * 动画工具函数
 */
export class AnimationUtils {
  /**
   * 创建弹性动画
   */
  static createSpringAnimation(options = {}) {
    return wx.createAnimation({
      duration: options.duration || 400,
      timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      delay: options.delay || 0
    })
  }

  /**
   * 创建缓动动画
   */
  static createEaseAnimation(options = {}) {
    return wx.createAnimation({
      duration: options.duration || 300,
      timingFunction: options.easing || 'ease-out',
      delay: options.delay || 0
    })
  }

  /**
   * 延迟执行动画
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 动画序列执行器
   */
  static async sequence(animations) {
    for (const animation of animations) {
      await animation()
      if (animation.delay) {
        await this.delay(animation.delay)
      }
    }
  }

  /**
   * 并行执行动画
   */
  static parallel(animations) {
    return Promise.all(animations.map(animation => animation()))
  }
}

// 创建全局动画管理器实例
export const animationManager = new AnimationManager()

// 便捷方法导出
export const animations = {
  // 页面转场
  fadeIn: (page) => PageTransitions.fadeTransition(page, 'in'),
  fadeOut: (page) => PageTransitions.fadeTransition(page, 'out'),
  slideLeft: (page) => PageTransitions.slideTransition(page, 'left'),
  slideRight: (page) => PageTransitions.slideTransition(page, 'right'),
  scaleIn: (page) => PageTransitions.scaleTransition(page, 'in'),
  scaleOut: (page) => PageTransitions.scaleTransition(page, 'out'),

  // 微交互
  buttonPress: (target, callback) => MicroInteractions.buttonPress(target, callback),
  like: (target, isLiked) => MicroInteractions.likeAnimation(target, isLiked),
  favorite: (target, isFavorited) => MicroInteractions.favoriteAnimation(target, isFavorited),
  cardHover: (target, isHovered) => MicroInteractions.cardHover(target, isHovered),

  // 加载动画
  spin: (target) => LoadingAnimations.spinLoader(target),
  pulse: (target) => LoadingAnimations.pulseLoader(target),
  skeleton: (target) => LoadingAnimations.skeletonLoader(target),

  // 反馈动画
  success: (target) => FeedbackAnimations.successAnimation(target),
  error: (target) => FeedbackAnimations.errorAnimation(target),
  warning: (target) => FeedbackAnimations.warningAnimation(target)
}

console.log('✅ 动画效果系统已初始化')
console.log('🎬 支持功能:')
console.log('  - 页面转场动画')
console.log('  - 微交互动画')
console.log('  - 手势动画')
console.log('  - 加载动画')
console.log('  - 反馈动画')
console.log('  - 动画序列管理')
