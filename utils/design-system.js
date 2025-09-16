/**
 * 设计系统 - 阶段4用户体验优化
 * 统一的设计规范、色彩体系、字体排版和组件样式
 * 
 * 版本: 1.0.0
 * 创建时间: 2025-01-16
 * 
 * 🎨 主要功能:
 * - 色彩体系管理
 * - 字体排版规范
 * - 间距和尺寸标准
 * - 组件样式库
 * - 动画效果库
 */

/**
 * 色彩体系
 */
export const Colors = {
  // 主色调 - 专业摄影风格
  primary: {
    50: '#f8f9fa',
    100: '#e9ecef',
    200: '#dee2e6',
    300: '#ced4da',
    400: '#adb5bd',
    500: '#6c757d',  // 主色
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#000000'
  },

  // 辅助色 - 温暖金色系
  accent: {
    50: '#fffbf0',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // 辅助色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // 中性色
  neutral: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    black: '#000000'
  },

  // 摄影主题色
  photography: {
    lens: '#2563eb',      // 镜头蓝
    aperture: '#7c3aed',  // 光圈紫
    shutter: '#dc2626',   // 快门红
    iso: '#059669',       // ISO绿
    focus: '#ea580c'      // 焦点橙
  }
}

/**
 * 字体排版系统
 */
export const Typography = {
  // 字体族
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    display: '"Playfair Display", Georgia, serif' // 艺术字体
  },

  // 字体大小
  fontSize: {
    xs: '12px',    // 辅助文字
    sm: '14px',    // 小文字
    base: '16px',  // 基础文字
    lg: '18px',    // 大文字
    xl: '20px',    // 标题
    '2xl': '24px', // 大标题
    '3xl': '30px', // 主标题
    '4xl': '36px', // 超大标题
    '5xl': '48px'  // 展示标题
  },

  // 字重
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },

  // 行高
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
}

/**
 * 间距系统
 */
export const Spacing = {
  // 基础间距单位 (rpx)
  unit: 4,
  
  // 间距值
  xs: '8rpx',    // 2 * unit
  sm: '16rpx',   // 4 * unit
  md: '24rpx',   // 6 * unit
  lg: '32rpx',   // 8 * unit
  xl: '48rpx',   // 12 * unit
  '2xl': '64rpx', // 16 * unit
  '3xl': '96rpx', // 24 * unit
  '4xl': '128rpx' // 32 * unit
}

/**
 * 尺寸系统
 */
export const Sizes = {
  // 头像尺寸
  avatar: {
    xs: '48rpx',
    sm: '64rpx',
    md: '80rpx',
    lg: '96rpx',
    xl: '128rpx'
  },

  // 按钮高度
  button: {
    sm: '64rpx',
    md: '80rpx',
    lg: '96rpx'
  },

  // 图标尺寸
  icon: {
    xs: '32rpx',
    sm: '40rpx',
    md: '48rpx',
    lg: '56rpx',
    xl: '64rpx'
  }
}

/**
 * 阴影系统
 */
export const Shadows = {
  none: 'none',
  sm: '0 2rpx 8rpx rgba(0, 0, 0, 0.1)',
  md: '0 8rpx 24rpx rgba(0, 0, 0, 0.12)',
  lg: '0 16rpx 48rpx rgba(0, 0, 0, 0.15)',
  xl: '0 24rpx 64rpx rgba(0, 0, 0, 0.18)'
}

/**
 * 圆角系统
 */
export const BorderRadius = {
  none: '0',
  sm: '8rpx',
  md: '16rpx',
  lg: '24rpx',
  xl: '32rpx',
  full: '50%'
}

/**
 * 动画系统
 */
export const Animations = {
  // 缓动函数
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  // 动画时长
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },

  // 常用动画
  fadeIn: {
    duration: '300ms',
    timingFunction: 'ease-out',
    fillMode: 'both'
  },

  slideUp: {
    duration: '300ms',
    timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    fillMode: 'both'
  },

  bounce: {
    duration: '600ms',
    timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    fillMode: 'both'
  }
}

/**
 * 组件样式库
 */
export const ComponentStyles = {
  // 按钮样式
  button: {
    primary: {
      backgroundColor: Colors.accent[500],
      color: Colors.neutral.white,
      borderRadius: BorderRadius.md,
      boxShadow: Shadows.sm
    },
    
    secondary: {
      backgroundColor: Colors.neutral.gray100,
      color: Colors.neutral.gray700,
      borderRadius: BorderRadius.md,
      border: `2rpx solid ${Colors.neutral.gray200}`
    },

    ghost: {
      backgroundColor: 'transparent',
      color: Colors.accent[500],
      borderRadius: BorderRadius.md,
      border: `2rpx solid ${Colors.accent[500]}`
    }
  },

  // 卡片样式
  card: {
    default: {
      backgroundColor: Colors.neutral.white,
      borderRadius: BorderRadius.lg,
      boxShadow: Shadows.md,
      padding: Spacing.lg
    },

    elevated: {
      backgroundColor: Colors.neutral.white,
      borderRadius: BorderRadius.lg,
      boxShadow: Shadows.lg,
      padding: Spacing.xl
    }
  },

  // 输入框样式
  input: {
    default: {
      backgroundColor: Colors.neutral.gray50,
      borderRadius: BorderRadius.md,
      border: `2rpx solid ${Colors.neutral.gray200}`,
      padding: `${Spacing.md} ${Spacing.lg}`,
      fontSize: Typography.fontSize.base
    },

    focused: {
      borderColor: Colors.accent[500],
      boxShadow: `0 0 0 6rpx ${Colors.accent[100]}`
    },

    error: {
      borderColor: Colors.error,
      boxShadow: `0 0 0 6rpx rgba(239, 68, 68, 0.1)`
    }
  }
}

/**
 * 响应式断点
 */
export const Breakpoints = {
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px'
}

/**
 * 工具函数
 */
export const DesignUtils = {
  /**
   * 获取颜色值
   */
  getColor(colorPath) {
    const paths = colorPath.split('.')
    let color = Colors
    
    for (const path of paths) {
      color = color[path]
      if (!color) return null
    }
    
    return color
  },

  /**
   * 生成渐变色
   */
  createGradient(startColor, endColor, direction = 'to right') {
    return `linear-gradient(${direction}, ${startColor}, ${endColor})`
  },

  /**
   * 生成阴影样式
   */
  createShadow(x, y, blur, spread, color, opacity = 0.1) {
    return `${x}rpx ${y}rpx ${blur}rpx ${spread}rpx rgba(${color}, ${opacity})`
  },

  /**
   * 响应式字体大小
   */
  responsiveFontSize(baseSize, scale = 1.2) {
    return {
      fontSize: baseSize,
      '@media (min-width: 768px)': {
        fontSize: `${parseFloat(baseSize) * scale}px`
      }
    }
  }
}

/**
 * 主题配置
 */
export const Theme = {
  light: {
    colors: Colors,
    typography: Typography,
    spacing: Spacing,
    shadows: Shadows,
    borderRadius: BorderRadius
  },

  dark: {
    colors: {
      ...Colors,
      // 暗色主题的颜色覆盖
      primary: {
        ...Colors.primary,
        500: Colors.neutral.gray200
      },
      neutral: {
        ...Colors.neutral,
        white: Colors.neutral.gray900,
        gray50: Colors.neutral.gray800,
        gray100: Colors.neutral.gray700
      }
    },
    typography: Typography,
    spacing: Spacing,
    shadows: {
      ...Shadows,
      // 暗色主题的阴影调整
      sm: '0 2rpx 8rpx rgba(255, 255, 255, 0.1)',
      md: '0 8rpx 24rpx rgba(255, 255, 255, 0.12)'
    },
    borderRadius: BorderRadius
  }
}

// 导出默认主题
export const defaultTheme = Theme.light

console.log('✅ 设计系统已初始化')
console.log('🎨 支持功能:')
console.log('  - 完整的色彩体系')
console.log('  - 标准化字体排版')
console.log('  - 统一的间距和尺寸')
console.log('  - 组件样式库')
console.log('  - 动画效果系统')
console.log('  - 响应式设计支持')
