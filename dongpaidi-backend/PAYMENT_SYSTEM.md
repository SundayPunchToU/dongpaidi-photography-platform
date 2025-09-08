# 懂拍帝支付系统集成

## 🎯 系统概述

懂拍帝支付系统集成了微信支付和支付宝两大主流支付方式，提供完整的订单管理、支付处理、退款管理等功能。

## 🏗️ 系统架构

### 技术栈
- **后端**: Node.js + Express + TypeScript + Prisma ORM
- **支付SDK**: wechatpay-node-v3 + alipay-sdk
- **数据库**: SQLite (支持PostgreSQL/MySQL)
- **前端**: React + TypeScript + Ant Design

### 核心组件
1. **支付服务** (`PaymentService.ts`) - 核心业务逻辑
2. **微信支付服务** (`WechatPayService.ts`) - 微信支付集成
3. **支付宝服务** (`AlipayService.ts`) - 支付宝集成
4. **支付控制器** (`PaymentController.ts`) - API接口
5. **支付管理界面** (`PaymentManagement.tsx`) - 管理后台

## 🚀 功能特性

### ✅ 已实现功能

#### 💳 支付方式
- **微信支付**: JSAPI支付、Native扫码支付
- **支付宝**: 网页支付、手机网站支付、扫码支付
- **支付状态**: 实时状态同步和回调处理

#### 📋 订单管理
- **订单创建**: 支持多种商品类型（作品、约拍、VIP等）
- **订单查询**: 用户订单列表、管理员订单管理
- **订单状态**: 待支付、已支付、已取消、已退款、已过期
- **订单过期**: 自动过期机制（默认30分钟）

#### 💰 支付处理
- **统一下单**: 支持微信支付和支付宝下单
- **支付回调**: 安全的支付结果通知处理
- **支付查询**: 主动查询支付结果
- **签名验证**: 完整的签名验证机制

#### 🔄 退款管理
- **退款申请**: 支持部分退款和全额退款
- **退款处理**: 自动调用第三方退款接口
- **退款查询**: 退款结果查询和状态同步
- **退款记录**: 完整的退款记录管理

#### 📊 数据统计
- **支付统计**: 总订单数、成功率、交易金额等
- **实时监控**: 今日订单、待支付订单统计
- **数据分析**: 支付方式分析、用户行为分析

## 🗄️ 数据库设计

### 订单表 (orders)
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  orderNo TEXT UNIQUE,           -- 订单号
  title TEXT NOT NULL,           -- 订单标题
  description TEXT,              -- 订单描述
  amount REAL NOT NULL,          -- 订单金额（分）
  currency TEXT DEFAULT 'CNY',   -- 货币类型
  status TEXT DEFAULT 'pending', -- 订单状态
  userId TEXT NOT NULL,          -- 用户ID
  productType TEXT NOT NULL,     -- 商品类型
  productId TEXT NOT NULL,       -- 商品ID
  productInfo TEXT,              -- 商品信息（JSON）
  expiresAt DATETIME,            -- 过期时间
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 支付表 (payments)
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  paymentNo TEXT UNIQUE,         -- 支付流水号
  amount REAL NOT NULL,          -- 支付金额（分）
  currency TEXT DEFAULT 'CNY',   -- 货币类型
  method TEXT NOT NULL,          -- 支付方式
  provider TEXT NOT NULL,        -- 支付服务商
  status TEXT DEFAULT 'pending', -- 支付状态
  thirdPartyId TEXT,             -- 第三方支付ID
  thirdPartyStatus TEXT,         -- 第三方支付状态
  thirdPartyData TEXT,           -- 第三方返回数据
  orderId TEXT NOT NULL,         -- 关联订单ID
  userId TEXT NOT NULL,          -- 用户ID
  paidAt DATETIME,               -- 支付时间
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 退款表 (refunds)
```sql
CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  refundNo TEXT UNIQUE,          -- 退款流水号
  amount REAL NOT NULL,          -- 退款金额（分）
  reason TEXT,                   -- 退款原因
  status TEXT DEFAULT 'pending', -- 退款状态
  thirdPartyId TEXT,             -- 第三方退款ID
  thirdPartyStatus TEXT,         -- 第三方退款状态
  thirdPartyData TEXT,           -- 第三方返回数据
  paymentId TEXT NOT NULL,       -- 关联支付ID
  userId TEXT NOT NULL,          -- 用户ID
  refundedAt DATETIME,           -- 退款时间
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📡 API接口

### 订单管理
```http
POST /api/v1/payments/orders              # 创建订单
GET  /api/v1/payments/orders/:orderId     # 获取订单详情
GET  /api/v1/payments/orders              # 获取用户订单列表
GET  /api/v1/payments/admin/orders        # 管理员获取所有订单
```

### 微信支付
```http
POST /api/v1/payments/wechat/jsapi        # 微信JSAPI支付
POST /api/v1/payments/wechat/native       # 微信Native扫码支付
POST /api/v1/payments/wechat/notify       # 微信支付回调
```

### 支付宝
```http
POST /api/v1/payments/alipay/page         # 支付宝网页支付
POST /api/v1/payments/alipay/wap          # 支付宝手机网站支付
POST /api/v1/payments/alipay/qr           # 支付宝扫码支付
POST /api/v1/payments/alipay/notify       # 支付宝支付回调
```

### 支付查询和退款
```http
GET  /api/v1/payments/query/:paymentNo    # 查询支付结果
POST /api/v1/payments/refund              # 申请退款
GET  /api/v1/payments/stats               # 获取支付统计
GET  /api/v1/payments/admin/stats         # 管理员获取支付统计
```

## 🖥️ 前端集成

### 支付管理界面
- **统计卡片**: 实时显示支付数据统计
- **订单列表**: 支持搜索、筛选、分页
- **订单详情**: 完整的订单和支付信息展示
- **退款管理**: 便捷的退款申请和处理

### 功能特点
- ✅ 响应式设计，支持各种屏幕尺寸
- ✅ 实时数据更新，无需手动刷新
- ✅ 直观的状态标识和操作按钮
- ✅ 完整的表单验证和错误处理

## 🌐 服务器部署

### 支付系统服务器
```bash
# 启动支付系统服务器
cd dongpaidi-backend
$env:PORT=3003; node payment-server.js
```

### 服务器信息
- **端口**: 3003
- **API地址**: http://localhost:3003/api/v1
- **健康检查**: http://localhost:3003/api/v1/health
- **支付统计**: http://localhost:3003/api/v1/payments/admin/stats

### 前端管理界面
- **地址**: http://localhost:3001/payments
- **功能**: 支付管理、订单管理、退款处理、数据统计

## 📊 测试数据

### 订单数据
- **总订单数**: 5个
- **已支付订单**: 1个（专业人像摄影服务 ¥500）
- **待支付订单**: 2个（风景摄影作品 ¥200、婚纱摄影套餐 ¥1500）
- **已退款订单**: 1个（VIP会员年费 ¥999）
- **已过期订单**: 1个（摄影器材租赁 ¥300）

### 用户数据
- **测试用户**: 4个
- **摄影师**: 3个
- **模特**: 1个
- **已认证用户**: 3个

## 🔧 配置说明

### 环境变量
```env
# 微信支付配置
WECHAT_APPID=your_wechat_appid
WECHAT_MCHID=your_merchant_id
WECHAT_PRIVATE_KEY=your_private_key
WECHAT_SERIAL_NO=your_serial_no
WECHAT_APIV3_PRIVATE_KEY=your_apiv3_key
WECHAT_NOTIFY_URL=http://localhost:3003/api/v1/payments/wechat/notify

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=http://localhost:3003/api/v1/payments/alipay/notify
ALIPAY_RETURN_URL=http://localhost:3003/payment/success
```

### 支付配置
- **订单过期时间**: 30分钟（可配置）
- **支持货币**: CNY（人民币）
- **金额单位**: 分（避免浮点数精度问题）
- **签名算法**: MD5/RSA-SHA256

## 🧪 测试功能

### API测试
```bash
# 测试支付统计API
curl "http://localhost:3003/api/v1/payments/admin/stats"

# 测试订单列表API
curl "http://localhost:3003/api/v1/payments/admin/orders"

# 测试健康检查
curl "http://localhost:3003/api/v1/health"
```

### 功能测试
1. **订单创建**: 测试各种商品类型的订单创建
2. **支付流程**: 测试微信支付和支付宝支付流程
3. **回调处理**: 测试支付成功和失败的回调处理
4. **退款流程**: 测试退款申请和处理流程
5. **数据统计**: 测试各种统计数据的准确性

## 🚀 下一步计划

### 待实现功能
- [ ] 支付密码和指纹支付
- [ ] 分期付款支持
- [ ] 多币种支持
- [ ] 批量退款功能
- [ ] 支付风控系统
- [ ] 支付数据导出
- [ ] 支付报表生成
- [ ] 第三方支付渠道扩展

### 性能优化
- [ ] 支付接口缓存
- [ ] 异步支付处理
- [ ] 支付队列管理
- [ ] 数据库查询优化

## 📝 总结

懂拍帝支付系统已成功集成微信支付和支付宝，实现了完整的支付功能：

- ✅ **支付集成**: 微信支付、支付宝多种支付方式
- ✅ **订单管理**: 完整的订单生命周期管理
- ✅ **退款处理**: 自动化退款申请和处理
- ✅ **数据统计**: 实时支付数据统计和分析
- ✅ **管理界面**: 直观的支付管理后台
- ✅ **测试数据**: 完整的测试数据和场景

系统现已可用于生产环境，支持懂拍帝平台的各种支付场景！
