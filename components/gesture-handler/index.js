// 手势操作处理组件
import { AnimationService } from '../../utils/animation-service.js'

Component({
  properties: {
    // 启用的手势类型
    enableSwipe: {
      type: Boolean,
      value: true
    },
    enablePinch: {
      type: Boolean,
      value: false
    },
    enableLongPress: {
      type: Boolean,
      value: true
    },
    // 滑动阈值
    swipeThreshold: {
      type: Number,
      value: 50
    },
    // 长按时间
    longPressTime: {
      type: Number,
      value: 500
    }
  },

  data: {
    // 触摸状态
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isLongPressing: false,
    longPressTimer: null,
    
    // 动画状态
    animationData: {}
  },

  methods: {
    // 触摸开始
    onTouchStart(e) {
      const touch = e.touches[0]
      const currentTime = Date.now()
      
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        touchStartTime: currentTime,
        isLongPressing: false
      })

      // 启动长按检测
      if (this.data.enableLongPress) {
        this.data.longPressTimer = setTimeout(() => {
          this.handleLongPress(e)
        }, this.data.longPressTime)
      }

      // 触发按下动画
      this.triggerPressAnimation(true)
    },

    // 触摸移动
    onTouchMove(e) {
      // 清除长按定时器
      if (this.data.longPressTimer) {
        clearTimeout(this.data.longPressTimer)
        this.data.longPressTimer = null
      }

      // 如果启用了缩放手势
      if (this.data.enablePinch && e.touches.length === 2) {
        this.handlePinchGesture(e)
      }
    },

    // 触摸结束
    onTouchEnd(e) {
      // 清除长按定时器
      if (this.data.longPressTimer) {
        clearTimeout(this.data.longPressTimer)
        this.data.longPressTimer = null
      }

      // 恢复按下动画
      this.triggerPressAnimation(false)

      // 如果没有长按，检测滑动
      if (!this.data.isLongPressing && this.data.enableSwipe) {
        this.handleSwipeGesture(e)
      }
    },

    // 处理滑动手势
    handleSwipeGesture(e) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      const deltaTime = Date.now() - this.data.touchStartTime

      // 计算滑动距离和速度
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / deltaTime

      // 判断是否为有效滑动
      if (distance > this.data.swipeThreshold && velocity > 0.3) {
        let direction = ''
        
        // 判断滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        // 触发滑动事件
        this.triggerEvent('swipe', {
          direction,
          distance,
          velocity,
          deltaX,
          deltaY
        })

        // 播放滑动动画
        const animation = AnimationService.swipe(direction, Math.min(distance, 100))
        this.setData({
          animationData: animation
        })
      }
    },

    // 处理长按手势
    handleLongPress(e) {
      this.setData({ isLongPressing: true })
      
      // 触发长按事件
      this.triggerEvent('longpress', {
        x: this.data.touchStartX,
        y: this.data.touchStartY
      })

      // 播放长按反馈动画
      this.triggerLongPressAnimation()
    },

    // 处理缩放手势
    handlePinchGesture(e) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // 计算两点距离
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      // 触发缩放事件
      this.triggerEvent('pinch', {
        distance,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        }
      })
    },

    // 按下动画
    triggerPressAnimation(isPress) {
      const animation = wx.createAnimation({
        duration: 150,
        timingFunction: 'ease-out'
      })

      if (isPress) {
        animation.scale(0.98).step()
      } else {
        animation.scale(1).step()
      }

      this.setData({
        animationData: animation.export()
      })
    },

    // 长按反馈动画
    triggerLongPressAnimation() {
      const animation = wx.createAnimation({
        duration: 200,
        timingFunction: 'ease-out'
      })

      // 轻微震动效果
      animation.scale(1.05).step()
      animation.scale(1).step()

      this.setData({
        animationData: animation.export()
      })

      // 触发震动反馈
      wx.vibrateShort({
        type: 'medium'
      })
    },

    // 成功反馈动画
    triggerSuccessAnimation() {
      const animation = AnimationService.successFlash()
      this.setData({
        animationData: animation
      })

      // 触发成功震动
      wx.vibrateShort({
        type: 'light'
      })
    },

    // 错误反馈动画
    triggerErrorAnimation() {
      const animation = wx.createAnimation({
        duration: 100,
        timingFunction: 'ease-in-out'
      })

      // 左右摇摆效果
      animation.translateX(-10).step()
      animation.translateX(10).step()
      animation.translateX(-5).step()
      animation.translateX(0).step()

      this.setData({
        animationData: animation.export()
      })

      // 触发错误震动
      wx.vibrateShort({
        type: 'heavy'
      })
    }
  }
})
