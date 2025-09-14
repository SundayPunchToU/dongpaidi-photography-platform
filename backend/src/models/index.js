/**
 * 数据模型层
 * 统一管理模拟数据，提供可扩展的数据接口
 */

/**
 * 基础数据模型类
 * 提供通用的CRUD操作接口
 */
class BaseModel {
  constructor(name) {
    this.name = name;
    this.data = new Map();
    this.nextId = 1;
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一标识符
   */
  generateId() {
    return `${this.name}_${this.nextId++}_${Date.now()}`;
  }

  /**
   * 创建记录
   * @param {Object} data - 数据对象
   * @returns {Object} 创建的记录
   */
  create(data) {
    const id = this.generateId();
    const record = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.set(id, record);
    return record;
  }

  /**
   * 根据ID查找记录
   * @param {string} id - 记录ID
   * @returns {Object|null} 找到的记录或null
   */
  findById(id) {
    return this.data.get(id) || null;
  }

  /**
   * 查找所有记录
   * @param {Object} filter - 过滤条件
   * @param {Object} options - 查询选项（分页、排序等）
   * @returns {Array} 记录数组
   */
  findAll(filter = {}, options = {}) {
    let records = Array.from(this.data.values());

    // 应用过滤条件
    if (Object.keys(filter).length > 0) {
      records = records.filter(record => {
        return Object.entries(filter).every(([key, value]) => {
          if (typeof value === 'string' && value.includes('*')) {
            // 支持通配符搜索
            const regex = new RegExp(value.replace(/\*/g, '.*'), 'i');
            return regex.test(record[key]);
          }
          return record[key] === value;
        });
      });
    }

    // 应用排序
    if (options.sortBy) {
      const { sortBy, sortOrder = 'asc' } = options;
      records.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // 应用分页
    if (options.page && options.limit) {
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      records = records.slice(start, end);
    }

    return records;
  }

  /**
   * 更新记录
   * @param {string} id - 记录ID
   * @param {Object} updates - 更新数据
   * @returns {Object|null} 更新后的记录或null
   */
  update(id, updates) {
    const record = this.data.get(id);
    if (!record) return null;

    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.data.set(id, updatedRecord);
    return updatedRecord;
  }

  /**
   * 删除记录
   * @param {string} id - 记录ID
   * @returns {boolean} 是否删除成功
   */
  delete(id) {
    return this.data.delete(id);
  }

  /**
   * 获取记录总数
   * @param {Object} filter - 过滤条件
   * @returns {number} 记录总数
   */
  count(filter = {}) {
    return this.findAll(filter).length;
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.data.clear();
    this.nextId = 1;
  }
}

/**
 * 用户模型
 */
class UserModel extends BaseModel {
  constructor() {
    super('user');
    this.initializeData();
  }

  initializeData() {
    // 初始化一些模拟用户数据
    const users = [
      {
        username: 'photographer1',
        email: 'photo1@example.com',
        nickname: '摄影师小王',
        role: 'photographer',
        isVerified: true,
        status: 'active',
        avatar: '/avatars/photographer1.jpg',
        phone: '13800138001'
      },
      {
        username: 'model1',
        email: 'model1@example.com',
        nickname: '模特小李',
        role: 'model',
        isVerified: true,
        status: 'active',
        avatar: '/avatars/model1.jpg',
        phone: '13800138002'
      }
    ];

    users.forEach(user => this.create(user));
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Object|null} 用户对象或null
   */
  findByUsername(username) {
    return this.findAll({ username })[0] || null;
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户对象或null
   */
  findByEmail(email) {
    return this.findAll({ email })[0] || null;
  }

  /**
   * 获取用户统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const allUsers = this.findAll();
    const verified = allUsers.filter(user => user.isVerified).length;
    const active = allUsers.filter(user => user.status === 'active').length;
    
    // 模拟今日新增用户
    const today = new Date().toISOString().split('T')[0];
    const newToday = allUsers.filter(user => 
      user.createdAt.startsWith(today)
    ).length;

    return {
      total: allUsers.length + 1248, // 加上基础数量
      verified: verified + 978,
      active: active + 848,
      newToday: newToday + 15
    };
  }
}

/**
 * 作品模型
 */
class WorkModel extends BaseModel {
  constructor() {
    super('work');
  }

  /**
   * 获取作品统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      total: 3200,
      published: 2800,
      pending: 250,
      rejected: 150,
      newToday: 25
    };
  }
}

/**
 * 约拍模型
 */
class AppointmentModel extends BaseModel {
  constructor() {
    super('appointment');
  }

  /**
   * 获取约拍统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      total: 680,
      open: 120,
      inProgress: 85,
      completed: 450,
      cancelled: 25,
      newToday: 8
    };
  }
}

/**
 * 消息模型
 */
class MessageModel extends BaseModel {
  constructor() {
    super('message');
  }

  /**
   * 获取未读消息数量
   * @returns {number} 未读消息数量
   */
  getUnreadCount() {
    return 12;
  }
}

/**
 * 支付模型
 */
class PaymentModel extends BaseModel {
  constructor() {
    super('payment');
  }

  /**
   * 获取支付统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      totalRevenue: 125000,
      totalOrders: 450,
      pendingOrders: 15,
      completedOrders: 420,
      refundedOrders: 15,
      todayRevenue: 2500,
      todayOrders: 8
    };
  }
}

/**
 * 系统统计模型
 */
class StatsModel {
  /**
   * 获取总体统计信息
   * @returns {Object} 统计信息
   */
  getOverallStats() {
    return {
      users: 1250,
      works: 3200,
      appointments: 680,
      messages: 450
    };
  }

  /**
   * 获取趋势数据
   * @param {string} period - 时间段 (week|month|year)
   * @returns {Object} 趋势数据
   */
  getTrendData(period = 'week') {
    const trendData = {
      week: {
        dates: ['2025-09-08', '2025-09-09', '2025-09-10', '2025-09-11', '2025-09-12', '2025-09-13', '2025-09-14'],
        users: [12, 18, 15, 22, 25, 20, 15],
        works: [8, 12, 10, 15, 18, 14, 25],
        appointments: [5, 8, 6, 10, 12, 9, 8]
      },
      month: {
        dates: ['2025-08-14', '2025-08-21', '2025-08-28', '2025-09-04', '2025-09-11'],
        users: [85, 92, 78, 105, 98],
        works: [65, 72, 58, 85, 92],
        appointments: [35, 42, 28, 48, 45]
      },
      year: {
        dates: ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'],
        users: [320, 350, 380, 420, 450, 480, 520, 580, 620, 680, 750, 820, 890],
        works: [250, 280, 310, 340, 380, 420, 460, 510, 560, 620, 680, 750, 820],
        appointments: [120, 135, 150, 165, 180, 200, 220, 245, 270, 300, 330, 365, 400]
      }
    };

    return trendData[period] || trendData.week;
  }
}

// 创建模型实例
const userModel = new UserModel();
const workModel = new WorkModel();
const appointmentModel = new AppointmentModel();
const messageModel = new MessageModel();
const paymentModel = new PaymentModel();
const statsModel = new StatsModel();

module.exports = {
  BaseModel,
  UserModel,
  WorkModel,
  AppointmentModel,
  MessageModel,
  PaymentModel,
  StatsModel,
  userModel,
  workModel,
  appointmentModel,
  messageModel,
  paymentModel,
  statsModel
};
