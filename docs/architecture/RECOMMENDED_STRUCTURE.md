# 📁 推荐的项目结构

## 当前问题分析
- utils目录文件过多且功能混杂
- 组件缺乏分类和层次结构
- 业务逻辑与平台特定代码耦合
- 缺乏跨平台抽象层

## 建议的新结构

```
src/
├── core/                    # 核心业务逻辑（跨平台）
│   ├── models/             # 数据模型
│   │   ├── User.js
│   │   ├── Work.js
│   │   ├── Appointment.js
│   │   └── index.js
│   ├── services/           # 业务服务层
│   │   ├── auth/
│   │   │   ├── AuthService.js
│   │   │   ├── TokenManager.js
│   │   │   └── index.js
│   │   ├── works/
│   │   │   ├── WorksService.js
│   │   │   ├── WorksUploadService.js
│   │   │   └── index.js
│   │   ├── social/
│   │   │   ├── SocialService.js
│   │   │   ├── CommentService.js
│   │   │   └── index.js
│   │   └── appointment/
│   │       ├── AppointmentService.js
│   │       └── index.js
│   ├── utils/              # 通用工具函数
│   │   ├── date.js
│   │   ├── validation.js
│   │   ├── format.js
│   │   └── constants.js
│   └── types/              # TypeScript类型定义
│       ├── api.d.ts
│       ├── models.d.ts
│       └── common.d.ts

platform/                   # 平台特定代码
├── wechat/                 # 微信小程序
│   ├── pages/
│   ├── components/
│   ├── adapters/           # 平台适配器
│   │   ├── StorageAdapter.js
│   │   ├── NetworkAdapter.js
│   │   ├── NavigationAdapter.js
│   │   └── MediaAdapter.js
│   └── utils/              # 微信特定工具
├── react-native/           # RN版本（预留）
└── web/                    # Web版本（预留）

shared/                     # 共享资源
├── components/             # 跨平台组件
│   ├── ui/                # 基础UI组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Loading/
│   ├── business/          # 业务组件
│   │   ├── WorkCard/
│   │   ├── UserProfile/
│   │   ├── AppointmentCard/
│   │   └── PhotoGrid/
│   └── layout/            # 布局组件
│       ├── Header/
│       ├── TabBar/
│       └── Container/
├── assets/                # 静态资源
│   ├── images/
│   ├── icons/
│   └── fonts/
└── styles/                # 样式文件
    ├── themes/
    ├── variables/
    └── mixins/

config/                    # 配置文件
├── environments/
│   ├── development.js
│   ├── production.js
│   └── staging.js
├── api.js
└── constants.js

docs/                      # 文档
├── api/                   # API文档
├── components/            # 组件文档
├── architecture/          # 架构文档
└── deployment/            # 部署文档
```

## 迁移策略

### 阶段1：重构现有代码
1. 将业务逻辑提取到 `src/core/`
2. 创建平台适配器
3. 重组组件结构

### 阶段2：抽象平台差异
1. 统一API调用接口
2. 标准化存储和导航
3. 创建跨平台组件库

### 阶段3：支持新平台
1. 实现React Native适配器
2. 复用核心业务逻辑
3. 适配平台特定UI
