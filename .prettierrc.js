/**
 * Prettier 配置文件
 * 用于统一代码格式化规则
 */
module.exports = {
  // 基础配置
  printWidth: 100,           // 每行最大字符数
  tabWidth: 2,              // 缩进空格数
  useTabs: false,           // 使用空格而不是tab
  semi: false,              // 不使用分号
  singleQuote: true,        // 使用单引号
  quoteProps: 'as-needed',  // 对象属性引号按需添加
  
  // JSX配置
  jsxSingleQuote: true,     // JSX中使用单引号
  
  // 尾随逗号
  trailingComma: 'es5',     // ES5语法中添加尾随逗号
  
  // 空格配置
  bracketSpacing: true,     // 对象字面量的括号间添加空格
  bracketSameLine: false,   // 多行JSX元素的>放在下一行
  
  // 箭头函数参数括号
  arrowParens: 'avoid',     // 单参数箭头函数不使用括号
  
  // 换行符
  endOfLine: 'lf',          // 使用LF换行符
  
  // HTML空格敏感性
  htmlWhitespaceSensitivity: 'css',
  
  // Vue文件配置
  vueIndentScriptAndStyle: false,
  
  // 嵌入式语言格式化
  embeddedLanguageFormatting: 'auto',
  
  // 文件覆盖配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'preserve'
      }
    },
    {
      files: '*.{wxml,html}',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore'
      }
    },
    {
      files: '*.{wxss,less,css}',
      options: {
        printWidth: 120,
        singleQuote: false
      }
    }
  ]
}
