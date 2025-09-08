import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import worksRoutes from './works';
import uploadRoutes from './upload';
import appointmentRoutes from './appointmentRoutes';
import messageRoutes from './messageRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './simple-admin';
import logAnalysisRoutes from './logAnalysis';
import performanceRoutes from './performance';

const router = Router();

/**
 * API路由配置
 */

// 认证相关路由
router.use('/auth', authRoutes);

// 用户相关路由
router.use('/users', userRoutes);

// 作品相关路由
router.use('/works', worksRoutes);

// 文件上传相关路由
router.use('/upload', uploadRoutes);

// 约拍相关路由
router.use('/appointments', appointmentRoutes);

// 消息相关路由
router.use('/messages', messageRoutes);

// 支付相关路由
router.use('/payments', paymentRoutes);

// 管理员相关路由
router.use('/admin', adminRoutes);

// 日志分析相关路由
router.use('/logs', logAnalysisRoutes);

// 性能监控相关路由
router.use('/performance', performanceRoutes);

// API根路径
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '懂拍帝 API 服务运行正常',
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      works: '/api/v1/works',
      upload: '/api/v1/upload',
      appointments: '/api/v1/appointments',
      messages: '/api/v1/messages',
      payments: '/api/v1/payments',
      admin: '/api/v1/admin',
      logs: '/api/v1/logs',
      performance: '/api/v1/performance',
    },
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  });
});

export default router;
