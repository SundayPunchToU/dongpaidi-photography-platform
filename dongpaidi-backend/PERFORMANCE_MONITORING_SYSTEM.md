# 性能监控系统

## 📋 概述

性能监控系统是懂拍帝后端服务的核心监控组件，提供全面的应用性能监控、分析和报告功能。系统采用模块化设计，支持多种指标类型、存储方式和告警机制。

## 🏗️ 系统架构

### 核心组件

#### 1. 性能监控器 (PerformanceMonitor)
- **功能**: 收集和存储性能指标
- **特性**: 
  - 多类型指标支持 (HTTP、数据库、系统资源、缓存、业务指标)
  - 批量处理和异步刷新
  - 内存、文件、数据库多种存储方式
  - 采样率控制和队列管理

#### 2. 性能分析器 (PerformanceAnalyzer)
- **功能**: 分析性能数据并生成洞察
- **特性**:
  - 实时和定期分析
  - 多维度性能分析 (HTTP、数据库、系统、缓存)
  - 智能告警和建议生成
  - 趋势分析和异常检测

#### 3. 性能报告器 (PerformanceReporter)
- **功能**: 生成多格式性能报告
- **特性**:
  - HTML和JSON格式报告
  - 可视化图表和统计信息
  - 定时报告生成
  - 报告分发和管理

## 🚀 快速开始

### 1. 系统初始化

```typescript
import { initializePerformanceMonitoring } from '@/services/performanceMonitoringInit';

// 初始化性能监控系统
await initializePerformanceMonitoring();
```

### 2. 集成到Express应用

```typescript
import { integratePerformanceMonitoring } from '@/middleware/performanceIntegration';

const app = express();

// 集成性能监控
await integratePerformanceMonitoring(app);
```

### 3. 手动记录指标

```typescript
import { performanceMonitor } from '@/services/performanceMonitor';

// 记录HTTP请求指标
performanceMonitor.recordHttpRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  responseTime: 150,
  userId: 'user123'
});

// 记录数据库查询指标
performanceMonitor.recordDatabaseQuery({
  query: 'SELECT * FROM users',
  model: 'User',
  action: 'findMany',
  executionTime: 25
});
```

## 📊 指标类型

### HTTP请求指标
- 响应时间
- 状态码分布
- 请求/响应大小
- 用户和IP信息
- 慢请求检测

### 数据库查询指标
- 查询执行时间
- 慢查询检测
- 查询类型分布
- 连接池状态
- 错误率统计

### 系统资源指标
- CPU使用率
- 内存使用率
- 磁盘使用情况
- 网络I/O
- 系统负载

### 缓存操作指标
- 命中率统计
- 操作响应时间
- 缓存大小监控
- 操作类型分布

### 业务指标
- 用户活动统计
- API使用情况
- 错误率分析
- 自定义业务事件

## ⚙️ 配置说明

### 环境变量配置

```env
# 性能监控开关
PERFORMANCE_MONITORING_ENABLED=true

# 采样配置
PERF_SAMPLING_RATE=1.0
PERF_BATCH_SIZE=100
PERF_FLUSH_INTERVAL=10000

# 阈值配置
PERF_SLOW_REQUEST_THRESHOLD=1000
PERF_SLOW_QUERY_THRESHOLD=500
PERF_CPU_THRESHOLD=80.0
PERF_MEMORY_THRESHOLD=85.0

# 存储配置
PERF_FILE_STORAGE_ENABLED=true
PERF_FILE_STORAGE_PATH=./logs/performance
PERF_DB_STORAGE_ENABLED=false

# 告警配置
PERF_ALERTING_ENABLED=true
PERF_ALERT_EMAIL_ENABLED=false
PERF_ALERT_WEBHOOK_ENABLED=false

# 报告配置
PERF_REPORTING_ENABLED=true
PERF_REPORT_EMAIL_ENABLED=false
```

### 代码配置

```typescript
import { getPerformanceMonitoringConfig } from '@/config/performanceMonitoring';

const config = getPerformanceMonitoringConfig();

// 自定义配置
config.collection.samplingRate = 0.5; // 50%采样率
config.metrics.http.slowRequestThreshold = 2000; // 2秒慢请求阈值
```

## 🔧 API接口

### 获取性能概览
```http
GET /api/v1/performance/overview
```

### 获取指定类型指标
```http
GET /api/v1/performance/metrics/{type}?limit=100&format=json
```

### 执行性能分析
```http
POST /api/v1/performance/analyze
Content-Type: application/json

{
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T23:59:59Z"
}
```

### 生成性能报告
```http
POST /api/v1/performance/report
Content-Type: application/json

{
  "format": "html",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T23:59:59Z"
}
```

### 获取实时指标
```http
GET /api/v1/performance/realtime?type=http_request
```

### 获取性能趋势
```http
GET /api/v1/performance/trends?metrics=http.response_time,system.cpu_usage&startTime=2024-01-01T00:00:00Z&endTime=2024-01-01T23:59:59Z
```

### 健康检查
```http
GET /api/v1/performance/health
```

## 🎯 使用示例

### 1. 装饰器方式监控

```typescript
import { performanceMonitored } from '@/middleware/performanceIntegration';

class UserService {
  @performanceMonitored('user_service', 'create_user')
  async createUser(userData: any) {
    // 用户创建逻辑
    return user;
  }
}
```

### 2. 包装器方式监控

```typescript
import { wrapWithPerformanceMonitoring } from '@/middleware/performanceIntegration';

const monitoredFunction = wrapWithPerformanceMonitoring(
  originalFunction,
  'category',
  'action'
);
```

### 3. 批量操作监控

```typescript
import { monitorBatchOperation } from '@/middleware/performanceIntegration';

await monitorBatchOperation(
  async () => {
    // 批量操作逻辑
    return results;
  },
  'batch_operation',
  'process_users',
  1000 // 批次大小
);
```

### 4. 定时任务监控

```typescript
import { monitorScheduledTask } from '@/middleware/performanceIntegration';

const monitoredTask = monitorScheduledTask('daily_cleanup', async () => {
  // 定时任务逻辑
});

// 执行监控的定时任务
await monitoredTask();
```

## 📈 性能分析

### 分析维度

1. **HTTP性能分析**
   - 最慢端点识别
   - 错误端点统计
   - 状态码分布
   - 响应时间分析

2. **数据库性能分析**
   - 慢查询识别
   - 查询类型分布
   - 连接池状态
   - 执行时间统计

3. **系统资源分析**
   - CPU使用趋势
   - 内存使用模式
   - 系统负载分析
   - 资源瓶颈识别

4. **缓存性能分析**
   - 命中率统计
   - 操作延迟分析
   - 缓存效率评估

### 智能建议

系统会根据分析结果自动生成优化建议：

- 慢接口优化建议
- 数据库查询优化
- 缓存策略调整
- 系统资源优化
- 架构改进建议

## 🚨 告警系统

### 告警规则

系统内置多种告警规则：

1. **响应时间告警**: 平均响应时间超过阈值
2. **错误率告警**: 错误率超过5%
3. **CPU使用率告警**: CPU使用率超过80%
4. **内存使用率告警**: 内存使用率超过85%
5. **缓存命中率告警**: 命中率低于70%

### 告警级别

- **低 (Low)**: 性能轻微下降
- **中 (Medium)**: 性能明显下降
- **高 (High)**: 性能严重下降
- **严重 (Critical)**: 系统可能不可用

### 通知渠道

- 邮件通知
- Webhook通知
- Slack集成
- 短信通知 (可扩展)

## 📋 测试和验证

### 运行测试

```bash
# 完整性能监控测试
npm run performance-test

# 或使用别名
npm run test:performance
npm run perf-test
```

### 测试内容

1. **系统初始化测试**: 验证系统正确初始化
2. **指标记录测试**: 验证各类指标正确记录
3. **性能分析测试**: 验证分析功能正常
4. **系统状态测试**: 验证状态查询功能
5. **报告生成测试**: 验证报告生成功能
6. **压力测试**: 验证高并发处理能力

### 性能基准

- **指标记录**: 支持 >10,000 metrics/sec
- **分析延迟**: <5秒完成1小时数据分析
- **内存使用**: <100MB基础内存占用
- **存储效率**: 压缩率 >70%

## 🔍 故障排除

### 常见问题

1. **指标未记录**
   - 检查采样率配置
   - 验证系统初始化状态
   - 查看错误日志

2. **分析结果异常**
   - 确认时间窗口设置
   - 检查数据完整性
   - 验证分析配置

3. **告警未触发**
   - 检查告警规则配置
   - 验证阈值设置
   - 确认通知渠道配置

4. **性能影响**
   - 调整采样率
   - 优化批处理大小
   - 检查存储配置

### 调试模式

```typescript
// 启用调试模式
process.env.PERF_DEBUG_ENABLED = 'true';

// 查看详细日志
import { log } from '@/config/logger';
log.level = 'debug';
```

## 🔮 扩展开发

### 自定义指标类型

```typescript
// 定义新的指标类型
export enum CustomMetricType {
  CUSTOM_BUSINESS = 'custom_business',
}

// 扩展指标接口
export interface CustomMetric extends PerformanceMetric {
  type: CustomMetricType.CUSTOM_BUSINESS;
  customField: string;
}
```

### 自定义分析器

```typescript
export class CustomAnalyzer {
  async analyzeCustomMetrics(metrics: CustomMetric[]): Promise<any> {
    // 自定义分析逻辑
    return analysis;
  }
}
```

### 自定义存储后端

```typescript
export class CustomStorageBackend {
  async store(metrics: PerformanceMetric[]): Promise<void> {
    // 自定义存储逻辑
  }
}
```

## 📚 最佳实践

### 1. 采样策略
- 开发环境: 100%采样
- 测试环境: 50%采样  
- 生产环境: 10-20%采样

### 2. 存储策略
- 热数据: 内存存储 (最近1小时)
- 温数据: 文件存储 (最近7天)
- 冷数据: 数据库存储 (历史数据)

### 3. 告警策略
- 设置合理的阈值
- 避免告警风暴
- 建立告警升级机制

### 4. 性能优化
- 合理设置批处理大小
- 定期清理过期数据
- 监控系统自身性能

---

## 📞 支持

如有问题或建议，请联系开发团队或查看相关文档。

**版本**: 1.0.0  
**更新时间**: 2024-01-01  
**维护者**: 懂拍帝开发团队
