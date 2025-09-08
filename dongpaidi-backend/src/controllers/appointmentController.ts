import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types/api';

const prisma = new PrismaClient();

// 创建约拍
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const {
      title,
      description,
      type,
      location,
      shootDate,
      budget,
      requirements,
    } = req.body;

    // 验证必填字段
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: '标题和类型为必填项',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 验证约拍类型
    if (!['photographer_seek_model', 'model_seek_photographer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '约拍类型无效',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        publisherId: userId,
        title,
        description,
        type,
        location,
        shootDate: shootDate ? new Date(shootDate) : null,
        budget: budget ? parseFloat(budget) : null,
        requirements: requirements ? JSON.stringify(requirements) : '{}',
      },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...appointment,
        requirements: JSON.parse(appointment.requirements),
      },
      message: '约拍发布成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建约拍失败:', error);
    res.status(500).json({
      success: false,
      message: '创建约拍失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 获取约拍列表
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      location,
      status = 'open',
      keyword,
    } = req.query;

    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (location) {
      where.location = {
        contains: location as string,
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { description: { contains: keyword as string } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.appointment.count({ where });

    // 格式化数据
    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      requirements: JSON.parse(appointment.requirements),
      applicationsCount: appointment.applications.length,
    }));

    res.json({
      success: true,
      data: {
        items: formattedAppointments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
      message: '获取约拍列表成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取约拍列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取约拍列表失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 获取约拍详情
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            platform: true,
            specialties: true,
            location: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                specialties: true,
                location: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '约拍不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        ...appointment,
        requirements: JSON.parse(appointment.requirements),
        publisher: {
          ...appointment.publisher,
          specialties: appointment.publisher.specialties ? JSON.parse(appointment.publisher.specialties) : [],
        },
        applications: appointment.applications.map(app => ({
          ...app,
          applicant: {
            ...app.applicant,
            specialties: app.applicant.specialties ? JSON.parse(app.applicant.specialties) : [],
          },
        })),
      },
      message: '获取约拍详情成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取约拍详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取约拍详情失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 申请约拍
export const applyForAppointment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    // 检查约拍是否存在
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '约拍不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查是否为自己发布的约拍
    if (appointment.publisherId === userId) {
      return res.status(400).json({
        success: false,
        message: '不能申请自己发布的约拍',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查约拍状态
    if (appointment.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: '该约拍已关闭申请',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查是否已经申请过
    const existingApplication = await prisma.appointmentApplication.findUnique({
      where: {
        appointmentId_applicantId: {
          appointmentId: id,
          applicantId: userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '您已经申请过该约拍',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 创建申请
    const application = await prisma.appointmentApplication.create({
      data: {
        appointmentId: id,
        applicantId: userId,
        message: message || '',
      },
      include: {
        applicant: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            specialties: true,
            location: true,
          },
        },
        appointment: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...application,
        applicant: {
          ...application.applicant,
          specialties: application.applicant.specialties ? JSON.parse(application.applicant.specialties) : [],
        },
      },
      message: '申请提交成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('申请约拍失败:', error);
    res.status(500).json({
      success: false,
      message: '申请约拍失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 处理约拍申请（接受/拒绝）
export const handleApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { applicationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '操作类型无效',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 获取申请信息
    const application = await prisma.appointmentApplication.findUnique({
      where: { id: applicationId },
      include: {
        appointment: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查是否为约拍发布者
    if (application.appointment.publisherId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限操作',
        code: 403,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查申请状态
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '申请已被处理',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // 更新申请状态
    const updatedApplication = await prisma.appointmentApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
      include: {
        applicant: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 如果接受申请，更新约拍状态为进行中
    if (action === 'accept') {
      await prisma.appointment.update({
        where: { id: application.appointmentId },
        data: { status: 'in_progress' },
      });
    }

    res.json({
      success: true,
      data: updatedApplication,
      message: action === 'accept' ? '申请已接受' : '申请已拒绝',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('处理申请失败:', error);
    res.status(500).json({
      success: false,
      message: '处理申请失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 获取我的约拍（发布的）
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const where: any = { publisherId: userId };
    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.appointment.count({ where });

    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      requirements: JSON.parse(appointment.requirements),
      applicationsCount: appointment.applications.length,
    }));

    res.json({
      success: true,
      data: {
        items: formattedAppointments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
      message: '获取我的约拍成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取我的约拍失败:', error);
    res.status(500).json({
      success: false,
      message: '获取我的约拍失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 获取我的申请
export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const where: any = { applicantId: userId };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.appointmentApplication.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: {
          include: {
            publisher: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.appointmentApplication.count({ where });

    const formattedApplications = applications.map(application => ({
      ...application,
      appointment: {
        ...application.appointment,
        requirements: JSON.parse(application.appointment.requirements),
      },
    }));

    res.json({
      success: true,
      data: {
        items: formattedApplications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
      message: '获取我的申请成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取我的申请失败:', error);
    res.status(500).json({
      success: false,
      message: '获取我的申请失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 更新约拍状态
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态无效',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查约拍是否存在且为当前用户发布
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '约拍不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    if (appointment.publisherId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限操作',
        code: 403,
        timestamp: new Date().toISOString(),
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        publisher: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updatedAppointment,
        requirements: JSON.parse(updatedAppointment.requirements),
      },
      message: '约拍状态更新成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新约拍状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新约拍状态失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};

// 删除约拍
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
        code: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;

    // 检查约拍是否存在且为当前用户发布
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '约拍不存在',
        code: 404,
        timestamp: new Date().toISOString(),
      });
    }

    if (appointment.publisherId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限操作',
        code: 403,
        timestamp: new Date().toISOString(),
      });
    }

    // 检查是否有进行中的申请
    const activeApplications = await prisma.appointmentApplication.count({
      where: {
        appointmentId: id,
        status: 'accepted',
      },
    });

    if (activeApplications > 0 && appointment.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: '约拍进行中，无法删除',
        code: 400,
        timestamp: new Date().toISOString(),
      });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: null,
      message: '约拍删除成功',
      code: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除约拍失败:', error);
    res.status(500).json({
      success: false,
      message: '删除约拍失败',
      code: 500,
      timestamp: new Date().toISOString(),
    });
  }
};
