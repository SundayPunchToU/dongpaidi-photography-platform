import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import config from '../config';

const router = Router();
const prisma = new PrismaClient();

// 简化的管理员登录路由
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 查找管理员用户
    const admin = await prisma.user.findFirst({
      where: {
        email,
        platform: 'admin',
      },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员账号不存在',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // 验证密码（使用配置中的默认密码）
    const isValidPassword = password === 'admin123456';

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // 生成JWT token
    const accessToken = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: 'admin',
        platform: admin.platform
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    console.log(`管理员登录成功: ${admin.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          nickname: admin.nickname,
          role: 'admin',
          avatarUrl: admin.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken: accessToken, // 简化处理，使用相同token
        },
      },
      message: '登录成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('管理员登录失败:', error);
    
    res.status(500).json({
      success: false,
      message: '登录失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

// 获取统计数据的简化版本
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const workCount = await prisma.work.count();
    
    res.json({
      success: true,
      data: {
        userCount,
        workCount,
        appointmentCount: 0,
        messageCount: 0,
      },
      message: '获取统计数据成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
