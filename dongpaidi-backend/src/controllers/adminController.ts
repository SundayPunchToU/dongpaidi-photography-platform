import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { log } from '../config/logger';
import { ApiResponse, PaginatedApiResponse } from '../types/api';

const prisma = new PrismaClient();

/**
 * 管理员控制器
 */
export class AdminController {
  /**
   * 管理员登录
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // 查找管理员用户（通过平台标识和邮箱）
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
        } as ApiResponse);
      }

      // 验证密码（如果有密码字段）
      // 注意：当前schema中没有password字段，这里使用配置中的默认密码
      const isValidPassword = password === config.admin.password;

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '密码错误',
          code: 401,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      // 生成JWT token
      const accessToken = jwt.sign(
        {
          userId: admin.id,
          email: admin.email,
          role: 'admin' // 硬编码管理员角色
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: admin.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      log.info(`管理员登录成功: ${admin.email}`);

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
            refreshToken,
          },
        },
        message: '登录成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('管理员登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 获取系统统计数据
   */
  static async getStats(req: Request, res: Response) {
    try {
      const [userCount, workCount, appointmentCount, messageCount] = await Promise.all([
        prisma.user.count(),
        prisma.work.count(),
        prisma.appointment.count(),
        prisma.message.count(),
      ]);

      res.json({
        success: true,
        data: {
          users: userCount,
          works: workCount,
          appointments: appointmentCount,
          messages: messageCount,
        },
        message: '获取统计数据成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [total, verified, newToday] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({ 
          where: { 
            createdAt: { gte: today } 
          } 
        }),
      ]);

      // 活跃用户（最近7天有登录）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const active = await prisma.user.count({
        where: {
          lastLoginAt: { gte: sevenDaysAgo }
        }
      });

      res.json({
        success: true,
        data: {
          total,
          verified,
          active,
          newToday,
        },
        message: '获取用户统计成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 获取趋势数据
   */
  static async getTrendData(req: Request, res: Response) {
    try {
      const { period = 'week' } = req.query;
      
      let days = 7;
      if (period === 'month') days = 30;
      if (period === 'year') days = 365;

      const dates = [];
      const users = [];
      const works = [];
      const appointments = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [userCount, workCount, appointmentCount] = await Promise.all([
          prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate,
              }
            }
          }),
          prisma.work.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate,
              }
            }
          }),
          prisma.appointment.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate,
              }
            }
          }),
        ]);

        dates.push(date.toISOString().split('T')[0]);
        users.push(userCount);
        works.push(workCount);
        appointments.push(appointmentCount);
      }

      res.json({
        success: true,
        data: {
          dates,
          users,
          works,
          appointments,
        },
        message: '获取趋势数据成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('获取趋势数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取趋势数据失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 获取用户列表（管理员）
   */
  static async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, keyword, platform, isVerified } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // 构建查询条件
      const where: any = {};

      if (keyword) {
        where.OR = [
          { nickname: { contains: keyword as string } },
          { email: { contains: keyword as string } },
          { phone: { contains: keyword as string } },
        ];
      }

      if (platform) {
        where.platform = platform as string;
      }

      if (isVerified !== undefined) {
        where.isVerified = isVerified === 'true';
      }

      // 查询用户列表
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            nickname: true,
            email: true,
            phone: true,
            platform: true,
            avatarUrl: true,
            bio: true,
            location: true,
            isVerified: true,
            specialties: true,
            equipment: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                works: true,
                followers: true,
                following: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
        message: '获取用户列表成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as PaginatedApiResponse<typeof users>);

    } catch (error) {
      log.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 更新用户状态（管理员功能）
   */
  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isVerified, status } = req.body;

      const updateData: any = {};

      if (isVerified !== undefined) {
        updateData.isVerified = isVerified;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nickname: true,
          email: true,
          isVerified: true,
          status: true,
        },
      });

      log.info(`管理员更新用户状态: ${id}`, updateData);

      res.json({
        success: true,
        data: user,
        message: '更新用户状态成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('更新用户状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户状态失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  /**
   * 删除用户（管理员功能）
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, nickname: true, email: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      // 删除用户（这会级联删除相关数据）
      await prisma.user.delete({
        where: { id },
      });

      log.info(`管理员删除用户: ${user.nickname} (${user.email})`);

      res.json({
        success: true,
        data: null,
        message: '删除用户成功',
        code: 200,
        timestamp: new Date().toISOString(),
      } as ApiResponse);

    } catch (error) {
      log.error('删除用户失败:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        code: 500,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
