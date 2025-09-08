# 日志分析系统文档

## 📋 系统概述

懂拍帝日志分析系统是一个全面的日志收集、分析、监控和报告解决方案，为应用程序提供实时的日志洞察和智能告警功能。

## 🏗️ 系统架构

### 核心组件

1. **日志收集器 (LogCollector)**
   - 从多种来源收集日志
   - 支持实时和批量收集
   - 自动解析不同格式的日志

2. **日志分析器 (LogAnalyzer)**
   - 实时日志分析
   - 批量分析任务
   - 趋势分析和异常检测

3. **告警系统 (LogAlerting)**
   - 基于规则的智能告警
   - 多渠道告警通知
   - 告警管理和确认

4. **报告生成器 (LogReporter)**
   - 定时报告生成
   - 多格式报告输出
   - 自定义报告模板

## 🚀 快速开始

### 1. 系统初始化

```typescript
import { initializeLogAnalysis } from '@/services/logAnalysisInit';

// 初始化日志分析系统
await initializeLogAnalysis();
```

### 2. 收集日志

```typescript
import { logCollector, LogSource } from '@/services/logCollector';

// 收集单个日志条目
await logCollector.collectEntry({
  level: 'INFO',
  message: '用户登录成功',
  userId: 'user123',
  ip: '192.168.1.100',
  metadata: { action: 'login', success: true }
}, LogSource.APPLICATION);

// 从文件收集日志
const count = await logCollector.collectFromFile('/path/to/logfile.log');
```

### 3. 生成报告

```typescript
import { logReporter, ReportType, ReportFormat } from '@/services/logReporter';

// 生成自定义报告
const reportPath = await logReporter.generateReport({
  type: ReportType.CUSTOM,
  format: ReportFormat.HTML,
  timeWindow: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  includeCharts: true,
  includeTrends: true,
  includeRecommendations: true
});

// 生成定时报告
const dailyReport = await logReporter.generateScheduledReport(ReportType.DAILY);
```

### 4. 配置告警

```typescript
import { logAlerting, AlertType, AlertSeverity } from '@/services/logAlerting';

// 添加告警规则
const ruleId = logAlerting.addRule({
  name: '高错误率告警',
  type: AlertType.ERROR_RATE,
  severity: AlertSeverity.HIGH,
  condition: 'error_rate > threshold',
  threshold: 0.05, // 5%
  timeWindow: 5 * 60 * 1000, // 5分钟
  cooldown: 15 * 60 * 1000, // 15分钟
  enabled: true,
  description: '当错误率超过5%时触发告警',
  actions: [
    {
      type: 'email',
      config: { template: 'high_error_rate' },
      enabled: true
    }
  ]
});
```

## 📊 API 接口

### 日志分析统计

```http
GET /api/v1/logs/stats
Authorization: Bearer <token>
```

### 生成报告

```http
POST /api/v1/logs/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "custom",
  "format": "html",
  "start": "2024-01-01T00:00:00Z",
  "end": "2024-01-31T23:59:59Z",
  "includeCharts": true,
  "includeTrends": true,
  "includeRecommendations": true
}
```

### 告警管理

```http
# 获取告警规则
GET /api/v1/logs/alerts/rules

# 添加告警规则
POST /api/v1/logs/alerts/rules
Content-Type: application/json

{
  "name": "高响应时间告警",
  "type": "response_time",
  "severity": "medium",
  "condition": "avg_response_time > threshold",
  "threshold": 5000,
  "timeWindow": 600000,
  "cooldown": 1800000,
  "description": "平均响应时间超过5秒时触发告警"
}

# 确认告警
POST /api/v1/logs/alerts/{alertId}/acknowledge

# 解决告警
POST /api/v1/logs/alerts/{alertId}/resolve
```

## ⚙️ 配置说明

### 环境变量

```env
# 日志分析配置
LOG_ANALYSIS_ENABLED=true
LOG_BATCH_SIZE=100
LOG_FLUSH_INTERVAL=5000
LOG_MAX_QUEUE_SIZE=10000
LOG_COMPRESSION_ENABLED=true

# 存储配置
LOG_ANALYSIS_PATH=./logs/analysis
LOG_MAX_FILE_SIZE=100MB
LOG_MAX_FILES=30
LOG_DB_ENABLED=false
LOG_EXTERNAL_ENABLED=false

# 告警配置
LOG_ALERTING_ENABLED=true
ALERT_EMAIL_ENABLED=false
ALERT_WEBHOOK_ENABLED=false
ALERT_SLACK_ENABLED=false

# 隐私配置
LOG_ANONYMIZE_IP=false
LOG_GEO_LOCATION=false
LOG_SAMPLING_ENABLED=false
LOG_SAMPLING_RATE=0.1
```

### 配置文件

日志分析系统的详细配置在 `src/config/logAnalysis.ts` 中定义，包括：

- 日志收集配置
- 存储配置
- 分析配置
- 告警配置
- 报告配置
- 数据保留配置
- 性能配置
- 隐私和安全配置

## 🔧 测试和验证

### 运行测试

```bash
# 运行日志分析系统测试
npm run log-analysis-test

# 或者
npm run test:logs
```

### 测试内容

- ✅ 系统初始化测试
- ✅ 日志收集功能测试
- ✅ 告警系统测试
- ✅ 报告生成测试
- ✅ 系统状态检查
- ✅ 性能测试

## 📈 监控和维护

### 系统健康检查

```typescript
import { logAnalysisInit } from '@/services/logAnalysisInit';

// 获取系统状态
const status = logAnalysisInit.getSystemStatus();
console.log('系统状态:', status);
```

### 日志清理

```typescript
import { logAnalyzer } from '@/services/logAnalyzer';

// 清理过期日志
await logAnalyzer.cleanupExpiredLogs();
```

### 收集器管理

```typescript
import { logCollector, LogSource } from '@/services/logCollector';

// 获取收集器状态
const status = logCollector.getCollectorStatus();

// 重置收集器位置
logCollector.resetCollectorPosition(LogSource.APPLICATION);

// 停止所有收集器
logCollector.stopAllCollectors();
```

## 🎯 最佳实践

### 1. 日志级别使用

- **ERROR**: 系统错误、异常情况
- **WARN**: 警告信息、潜在问题
- **INFO**: 一般信息、业务操作
- **DEBUG**: 调试信息、详细跟踪
- **HTTP**: HTTP请求日志

### 2. 元数据结构

```typescript
{
  level: 'INFO',
  message: '用户操作',
  userId: 'user123',
  sessionId: 'session456',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  url: '/api/v1/users/profile',
  method: 'GET',
  statusCode: 200,
  responseTime: 150,
  metadata: {
    action: 'view_profile',
    resource: 'user_profile',
    success: true,
    details: { ... }
  },
  tags: ['user', 'profile', 'api']
}
```

### 3. 告警规则设计

- 设置合理的阈值和时间窗口
- 配置适当的冷却期避免告警风暴
- 使用分级告警（低、中、高、严重）
- 定期审查和调整告警规则

### 4. 报告生成策略

- 定时生成日报、周报、月报
- 根据业务需求自定义报告内容
- 使用合适的报告格式（HTML、PDF、JSON）
- 配置报告接收人和分发策略

## 🔒 安全和隐私

### 数据脱敏

系统自动对敏感数据进行脱敏处理：

- IP地址掩码（192.168.1.xxx）
- 用户ID哈希化
- 敏感字段过滤（password、token、secret等）

### 数据保留

- 原始日志保留30天（可配置）
- 分析结果保留90天（可配置）
- 自动压缩和归档过期数据

## 🚨 故障排除

### 常见问题

1. **日志收集器不工作**
   - 检查文件路径是否正确
   - 确认文件权限
   - 查看收集器状态

2. **告警不触发**
   - 检查告警规则配置
   - 确认指标数据是否正常
   - 查看告警冷却期设置

3. **报告生成失败**
   - 检查存储路径权限
   - 确认时间窗口设置
   - 查看系统资源使用情况

### 调试模式

```env
# 启用调试模式
NODE_ENV=development
LOG_LEVEL=debug
```

## 📚 扩展开发

### 自定义分析器

```typescript
// 继承并扩展分析功能
class CustomLogAnalyzer extends LogAnalyzer {
  async customAnalysis(entries: LogEntry[]): Promise<AnalysisResult> {
    // 自定义分析逻辑
    return result;
  }
}
```

### 自定义告警动作

```typescript
// 添加新的告警通知渠道
class CustomAlertAction {
  async execute(alert: AlertEvent, config: any): Promise<void> {
    // 自定义告警处理逻辑
  }
}
```

## 📞 支持和反馈

如有问题或建议，请联系开发团队或提交Issue。

---

**懂拍帝日志分析系统** - 让日志数据发挥最大价值！ 🚀
