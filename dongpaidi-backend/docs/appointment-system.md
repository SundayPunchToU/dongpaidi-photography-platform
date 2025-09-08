# 约拍系统开发文档

## 📋 系统概述

约拍系统是懂拍帝平台的核心功能之一，为摄影师和模特提供了一个高效的约拍匹配平台。系统支持双向约拍模式，完整的申请流程管理，以及丰富的筛选和统计功能。

## 🏗️ 系统架构

### 数据模型

#### 1. Appointment (约拍表)
```prisma
model Appointment {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  publisherId String
  publisher   User     @relation(fields: [publisherId], references: [id])
  
  title       String
  description String?
  type        String   // photographer_seek_model, model_seek_photographer
  location    String?
  shootDate   DateTime?
  budget      Float?
  requirements String  @default("{}")
  status      String   @default("open") // open, in_progress, completed, cancelled
  
  applications AppointmentApplication[]
}
```

#### 2. AppointmentApplication (约拍申请表)
```prisma
model AppointmentApplication {
  id            String      @id @default(cuid())
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  
  applicantId   String
  applicant     User        @relation(fields: [applicantId], references: [id])
  
  message       String?
  status        String      @default("pending") // pending, accepted, rejected
}
```

## 🚀 API 接口

### 1. 约拍管理接口

#### 获取约拍列表
```http
GET /api/v1/appointments
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `type`: 约拍类型 (photographer_seek_model | model_seek_photographer)
- `location`: 地点筛选
- `status`: 状态筛选 (open | in_progress | completed | cancelled)
- `keyword`: 关键词搜索

**响应示例:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "appointment_id",
        "title": "寻找专业人像模特",
        "type": "photographer_seek_model",
        "status": "open",
        "publisher": {
          "id": "user_id",
          "nickname": "摄影师昵称",
          "avatarUrl": "头像URL"
        },
        "applicationsCount": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### 创建约拍
```http
POST /api/v1/appointments
```

**请求体:**
```json
{
  "title": "约拍标题",
  "description": "约拍描述",
  "type": "photographer_seek_model",
  "location": "拍摄地点",
  "shootDate": "2025-09-15T10:00:00Z",
  "budget": 1500.00,
  "requirements": {
    "gender": "女性",
    "ageRange": "20-30",
    "experience": "有商业拍摄经验"
  }
}
```

#### 获取约拍详情
```http
GET /api/v1/appointments/:id
```

#### 申请约拍
```http
POST /api/v1/appointments/:id/apply
```

**请求体:**
```json
{
  "message": "申请留言"
}
```

#### 处理申请
```http
POST /api/v1/appointments/applications/:applicationId/handle
```

**请求体:**
```json
{
  "action": "accept" // accept | reject
}
```

### 2. 个人约拍管理

#### 获取我发布的约拍
```http
GET /api/v1/appointments/my/published
```

#### 获取我的申请
```http
GET /api/v1/appointments/my/applications
```

#### 更新约拍状态
```http
PATCH /api/v1/appointments/:id/status
```

#### 删除约拍
```http
DELETE /api/v1/appointments/:id
```

### 3. 统计接口

#### 约拍统计
```http
GET /api/v1/appointments/stats
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "open": 18,
    "inProgress": 5,
    "completed": 2,
    "photographerSeek": 15,
    "modelSeek": 10,
    "newToday": 3
  }
}
```

## 🔄 业务流程

### 1. 约拍发布流程
1. 用户填写约拍信息
2. 系统验证数据完整性
3. 创建约拍记录，状态为 "open"
4. 约拍进入公开列表

### 2. 申请流程
1. 用户浏览约拍列表
2. 选择感兴趣的约拍
3. 提交申请，包含申请留言
4. 申请状态为 "pending"

### 3. 处理申请流程
1. 约拍发布者查看申请列表
2. 选择接受或拒绝申请
3. 如果接受，约拍状态变为 "in_progress"
4. 系统通知相关用户

### 4. 约拍完成流程
1. 拍摄完成后，发布者更新状态为 "completed"
2. 可选：双方互相评价
3. 约拍记录归档

## 📊 数据统计

系统提供多维度的数据统计：

- **总体统计**: 约拍总数、各状态分布
- **类型分析**: 摄影师寻找模特 vs 模特寻找摄影师
- **时间趋势**: 每日新增约拍数量
- **地域分布**: 不同城市的约拍活跃度
- **成功率**: 申请接受率、约拍完成率

## 🔒 权限控制

- **公开访问**: 约拍列表、约拍详情
- **登录用户**: 创建约拍、申请约拍
- **约拍发布者**: 处理申请、更新状态、删除约拍
- **管理员**: 所有约拍的管理权限

## ✅ 测试覆盖

系统已通过完整的功能测试：

1. **API接口测试**: 所有接口的正常和异常情况
2. **数据验证测试**: 输入数据的格式和完整性验证
3. **权限测试**: 不同用户角色的权限控制
4. **性能测试**: 大量数据下的查询和筛选性能
5. **集成测试**: 与用户系统、消息系统的集成

## 🚀 部署状态

- ✅ 数据库模型已创建
- ✅ API接口已实现
- ✅ 路由配置已完成
- ✅ 数据验证已添加
- ✅ 错误处理已完善
- ✅ 测试数据已生成
- ✅ 功能测试已通过

约拍系统现已完全就绪，可以投入生产使用！
