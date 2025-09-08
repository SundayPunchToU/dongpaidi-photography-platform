# 🤝 贡献指南 (Contributing Guide)

感谢您对懂拍帝摄影平台项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug报告和修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX优化
- ⚡ 性能提升
- 🔒 安全增强

## 📋 开始之前

### 🔍 搜索现有Issue
在创建新Issue或开始开发之前，请先搜索现有的Issues，避免重复工作。

### 📖 阅读文档
请确保您已经阅读了：
- [README.md](./README.md) - 项目概述和快速开始
- [开发指南](#开发指南) - 本文档的开发部分
- [代码规范](#代码规范) - 编码标准

## 🚀 贡献流程

### 1️⃣ Fork 和 Clone

```bash
# 1. 在GitHub上Fork项目
# 2. Clone你的Fork到本地
git clone https://github.com/your-username/dongpaidi-photography-platform.git
cd dongpaidi-photography-platform

# 3. 添加上游仓库
git remote add upstream https://github.com/original-owner/dongpaidi-photography-platform.git
```

### 2️⃣ 创建分支

```bash
# 从最新的main分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 分支命名规范:
# feature/功能名称    - 新功能开发
# fix/问题描述       - Bug修复
# docs/文档类型      - 文档更新
# style/样式描述     - 样式调整
# refactor/重构描述  - 代码重构
```

### 3️⃣ 开发和测试

```bash
# 安装依赖
npm install

# 启动开发环境
# 使用微信开发者工具打开项目

# 运行测试 (如果有)
npm test

# 检查代码规范
npm run lint
```

### 4️⃣ 提交代码

```bash
# 添加更改
git add .

# 提交 (遵循提交信息规范)
git commit -m "✨ feat: 添加用户头像上传功能

- 实现头像选择和裁剪功能
- 添加图片压缩和上传逻辑
- 更新用户资料页面UI
- 添加相关API接口

Closes #123"

# 推送到你的Fork
git push origin feature/your-feature-name
```

### 5️⃣ 创建 Pull Request

1. 在GitHub上打开你的Fork
2. 点击 "New Pull Request"
3. 选择正确的分支
4. 填写PR模板
5. 等待代码审查

## 📝 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式
```
<类型>[可选范围]: <描述>

[可选正文]

[可选脚注]
```

### 类型说明
- `✨ feat`: 新功能
- `🐛 fix`: Bug修复
- `📝 docs`: 文档更新
- `💄 style`: 代码格式调整
- `♻️ refactor`: 代码重构
- `⚡ perf`: 性能优化
- `✅ test`: 测试相关
- `🔧 chore`: 构建过程或辅助工具的变动

### 示例
```bash
# 新功能
git commit -m "✨ feat(auth): 添加微信登录功能"

# Bug修复
git commit -m "🐛 fix(chat): 修复消息重复显示问题"

# 文档更新
git commit -m "📝 docs: 更新API文档"

# 样式调整
git commit -m "💄 style(works): 优化作品卡片布局"
```

## 🔧 开发指南

### 环境设置

1. **Node.js版本**: >= 16.0.0
2. **微信开发者工具**: 最新版本
3. **编辑器**: 推荐使用VSCode + 相关插件

### 项目结构理解

```
├── pages/              # 小程序页面
├── components/         # 自定义组件
├── utils/             # 工具函数
├── api/               # API接口
├── mock/              # 模拟数据
├── config/            # 配置文件
└── dongpaidi-backend/ # 后端服务
```

### 开发模式

#### Mock模式开发 (推荐)
```javascript
// config.js
export default {
  isMock: true,  // 启用Mock模式
  // 无需后端服务，使用本地模拟数据
}
```

#### API模式开发
```javascript
// config.js
export default {
  isMock: false,
  baseUrl: 'http://localhost:3000',  // 本地后端地址
}
```

## 📋 代码规范

### JavaScript/ES6+

```javascript
// ✅ 推荐写法
import { worksAPI } from '../utils/supabase-client.js';

const fetchWorks = async () => {
  try {
    const response = await worksAPI.getWorks();
    return response.data;
  } catch (error) {
    console.error('获取作品失败:', error);
    throw error;
  }
};

// ❌ 避免的写法
function fetchWorks() {
  worksAPI.getWorks().then(function(response) {
    return response.data;
  }).catch(function(error) {
    console.log(error);
  });
}
```

### 组件开发规范

```javascript
// ✅ 组件规范
Component({
  properties: {
    workData: {
      type: Object,
      value: {},
      observer: 'onWorkDataChange'
    }
  },
  
  data: {
    loading: false,
    error: null
  },
  
  methods: {
    onWorkDataChange(newVal, oldVal) {
      // 处理属性变化
    },
    
    onTapWork() {
      this.triggerEvent('tap-work', {
        work: this.data.workData
      });
    },
    
    async loadData() {
      this.setData({ loading: true });
      try {
        // 加载数据逻辑
      } catch (error) {
        this.setData({ error: error.message });
      } finally {
        this.setData({ loading: false });
      }
    }
  }
});
```

### 样式规范 (Less)

```less
// ✅ 样式规范
.work-card {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  &__image {
    width: 100%;
    height: 400rpx;
    object-fit: cover;
  }
  
  &__content {
    padding: 24rpx;
  }
  
  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 12rpx;
  }
  
  &__meta {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #666;
  }
}
```

## 🧪 测试指南

### 功能测试
1. 在微信开发者工具中测试所有功能
2. 测试不同屏幕尺寸的适配
3. 测试网络异常情况的处理
4. 测试Mock模式和API模式的切换

### 性能测试
1. 检查页面加载速度
2. 监控内存使用情况
3. 优化图片加载和缓存

## 📋 Pull Request 检查清单

提交PR前，请确保：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 测试了所有相关功能
- [ ] 提交信息符合规范
- [ ] 没有引入新的警告或错误
- [ ] 考虑了向后兼容性

## 🎯 Issue 指南

### Bug报告

使用以下模板报告Bug：

```markdown
## Bug描述
简要描述遇到的问题

## 复现步骤
1. 打开页面...
2. 点击按钮...
3. 看到错误...

## 预期行为
描述你期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- 微信版本: 
- 基础库版本: 
- 设备型号: 
- 操作系统: 

## 截图
如果适用，添加截图来帮助解释问题
```

### 功能请求

```markdown
## 功能描述
简要描述建议的功能

## 使用场景
描述什么情况下需要这个功能

## 解决方案
描述你认为可行的解决方案

## 替代方案
描述你考虑过的其他解决方案
```

## 🏆 贡献者认可

我们会在以下地方认可贡献者：
- README.md 中的贡献者列表
- 发布说明中的特别感谢
- 项目官网的贡献者页面

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. 查看现有的Issues和Discussions
2. 在GitHub Discussions中提问
3. 发送邮件到: your-email@example.com

## 📄 许可证

通过贡献代码，您同意您的贡献将在MIT许可证下授权。

---

**感谢您的贡献！** 🎉
