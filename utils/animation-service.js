// 沉浸式动画服务
class AnimationService {
  constructor() {
    this.animationQueue = []
    this.isAnimating = false
  }

  /**
   * 页面进入动画 - 摄影胶片效果
   */
  pageEnterAnimation(selector = '.page-container') {
    const animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 0
    })

    // 胶片展开效果
    animation.opacity(0).scaleX(0.8).step()
    animation.opacity(1).scaleX(1).step()

    return animation.export()
  }

  /**
   * 卡片悬浮动画 - 摄影作品展示效果
   */
  cardHoverAnimation(selector, isHover = true) {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      delay: 0
    })

    if (isHover) {
      animation.translateY(-8).scale(1.02).step()
    } else {
      animation.translateY(0).scale(1).step()
    }

    return animation.export()
  }

  /**
   * 图片加载动画 - 渐进式显示
   */
  imageLoadAnimation(selector) {
    const animation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out',
      delay: 0
    })

    // 从模糊到清晰的效果
    animation.opacity(0).scale(1.1).step()
    animation.opacity(1).scale(1).step()

    return animation.export()
  }

  /**
   * 按钮点击反馈 - 专业相机快门效果
   */
  buttonClickAnimation(selector) {
    const animation = wx.createAnimation({
      duration: 150,
      timingFunction: 'ease-in-out',
      delay: 0
    })

    // 快门按下效果
    animation.scale(0.95).step()
    animation.scale(1).step()

    return animation.export()
  }

  /**
   * 列表项进入动画 - 瀑布流效果
   */
  listItemEnterAnimation(index = 0) {
    const animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: index * 100 // 错开动画时间
    })

    animation.translateY(60).opacity(0).step()
    animation.translateY(0).opacity(1).step()

    return animation.export()
  }

  /**
   * 搜索展开动画
   */
  searchExpandAnimation(isExpand = true) {
    const animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 0
    })

    if (isExpand) {
      animation.height(120).opacity(1).step()
    } else {
      animation.height(0).opacity(0).step()
    }

    return animation.export()
  }

  /**
   * 加载状态动画 - 相机对焦效果
   */
  loadingAnimation() {
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'linear',
      delay: 0
    })

    // 对焦环旋转效果
    animation.rotate(360).step()

    return animation.export()
  }

  /**
   * 成功反馈动画 - 快门闪光效果
   */
  successFlashAnimation() {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-out',
      delay: 0
    })

    // 闪光效果
    animation.opacity(1).scale(1.1).step()
    animation.opacity(0).scale(1).step()

    return animation.export()
  }

  /**
   * 手势滑动动画
   */
  swipeAnimation(direction = 'left', distance = 100) {
    const animation = wx.createAnimation({
      duration: 250,
      timingFunction: 'ease-out',
      delay: 0
    })

    const translateX = direction === 'left' ? -distance : distance
    animation.translateX(translateX).step()
    animation.translateX(0).step()

    return animation.export()
  }

  /**
   * 执行动画队列
   */
  async executeAnimationQueue() {
    if (this.isAnimating || this.animationQueue.length === 0) {
      return
    }

    this.isAnimating = true

    while (this.animationQueue.length > 0) {
      const animationTask = this.animationQueue.shift()
      await this.executeAnimation(animationTask)
    }

    this.isAnimating = false
  }

  /**
   * 执行单个动画
   */
  executeAnimation(animationTask) {
    return new Promise((resolve) => {
      const { selector, animation, duration = 300 } = animationTask
      
      // 应用动画
      if (typeof selector === 'string') {
        const query = wx.createSelectorQuery()
        query.select(selector).boundingClientRect()
        query.exec()
      }

      setTimeout(resolve, duration)
    })
  }

  /**
   * 添加动画到队列
   */
  addToQueue(selector, animation, duration) {
    this.animationQueue.push({
      selector,
      animation,
      duration
    })
  }

  /**
   * 清空动画队列
   */
  clearQueue() {
    this.animationQueue = []
    this.isAnimating = false
  }
}

// 创建全局实例
const animationServiceInstance = new AnimationService()

// 导出服务
export const AnimationService = {
  pageEnter: (selector) => animationServiceInstance.pageEnterAnimation(selector),
  cardHover: (selector, isHover) => animationServiceInstance.cardHoverAnimation(selector, isHover),
  imageLoad: (selector) => animationServiceInstance.imageLoadAnimation(selector),
  buttonClick: (selector) => animationServiceInstance.buttonClickAnimation(selector),
  listItemEnter: (index) => animationServiceInstance.listItemEnterAnimation(index),
  searchExpand: (isExpand) => animationServiceInstance.searchExpandAnimation(isExpand),
  loading: () => animationServiceInstance.loadingAnimation(),
  successFlash: () => animationServiceInstance.successFlashAnimation(),
  swipe: (direction, distance) => animationServiceInstance.swipeAnimation(direction, distance),
  executeQueue: () => animationServiceInstance.executeAnimationQueue(),
  addToQueue: (selector, animation, duration) => animationServiceInstance.addToQueue(selector, animation, duration),
  clearQueue: () => animationServiceInstance.clearQueue()
}

export const animationService = animationServiceInstance
