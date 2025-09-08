/**
 * 缓存键管理器
 * 统一管理所有缓存键的命名规范
 */
export class CacheKeys {
  // 基础前缀
  private static readonly PREFIX = 'dongpaidi';

  /**
   * 用户相关缓存键
   */
  static user = {
    // 用户信息缓存
    info: (userId: string) => `${CacheKeys.PREFIX}:user:info:${userId}`,
    
    // 用户会话缓存
    session: (sessionId: string) => `${CacheKeys.PREFIX}:user:session:${sessionId}`,
    
    // 用户JWT token缓存
    token: (userId: string) => `${CacheKeys.PREFIX}:user:token:${userId}`,
    
    // 用户刷新token缓存
    refreshToken: (userId: string) => `${CacheKeys.PREFIX}:user:refresh_token:${userId}`,
    
    // 用户验证码缓存
    smsCode: (phone: string) => `${CacheKeys.PREFIX}:user:sms_code:${phone}`,
    
    // 用户登录尝试次数
    loginAttempts: (identifier: string) => `${CacheKeys.PREFIX}:user:login_attempts:${identifier}`,
    
    // 用户在线状态
    online: (userId: string) => `${CacheKeys.PREFIX}:user:online:${userId}`,
    
    // 用户偏好设置
    preferences: (userId: string) => `${CacheKeys.PREFIX}:user:preferences:${userId}`,
  };

  /**
   * 作品相关缓存键
   */
  static work = {
    // 作品详情缓存
    info: (workId: string) => `${CacheKeys.PREFIX}:work:info:${workId}`,
    
    // 作品列表缓存
    list: (page: number, limit: number, filters?: string) => 
      `${CacheKeys.PREFIX}:work:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
    
    // 热门作品缓存
    hot: (category?: string) => 
      `${CacheKeys.PREFIX}:work:hot${category ? `:${category}` : ''}`,
    
    // 推荐作品缓存
    recommended: (userId: string) => `${CacheKeys.PREFIX}:work:recommended:${userId}`,
    
    // 作品统计数据
    stats: (workId: string) => `${CacheKeys.PREFIX}:work:stats:${workId}`,
    
    // 作品浏览记录
    views: (workId: string) => `${CacheKeys.PREFIX}:work:views:${workId}`,
    
    // 作品点赞用户列表
    likes: (workId: string) => `${CacheKeys.PREFIX}:work:likes:${workId}`,
    
    // 作品收藏用户列表
    favorites: (workId: string) => `${CacheKeys.PREFIX}:work:favorites:${workId}`,
  };

  /**
   * 约拍相关缓存键
   */
  static appointment = {
    // 约拍详情缓存
    info: (appointmentId: string) => `${CacheKeys.PREFIX}:appointment:info:${appointmentId}`,
    
    // 约拍列表缓存
    list: (userId: string, status?: string) => 
      `${CacheKeys.PREFIX}:appointment:list:${userId}${status ? `:${status}` : ''}`,
    
    // 约拍统计数据
    stats: (userId: string) => `${CacheKeys.PREFIX}:appointment:stats:${userId}`,
    
    // 约拍通知
    notifications: (userId: string) => `${CacheKeys.PREFIX}:appointment:notifications:${userId}`,
  };

  /**
   * 消息相关缓存键
   */
  static message = {
    // 对话列表缓存
    conversations: (userId: string) => `${CacheKeys.PREFIX}:message:conversations:${userId}`,
    
    // 对话消息缓存
    conversation: (conversationId: string, page: number) => 
      `${CacheKeys.PREFIX}:message:conversation:${conversationId}:${page}`,
    
    // 未读消息数量
    unreadCount: (userId: string) => `${CacheKeys.PREFIX}:message:unread_count:${userId}`,
    
    // 消息通知
    notifications: (userId: string) => `${CacheKeys.PREFIX}:message:notifications:${userId}`,
  };

  /**
   * 支付相关缓存键
   */
  static payment = {
    // 订单缓存
    order: (orderId: string) => `${CacheKeys.PREFIX}:payment:order:${orderId}`,
    
    // 支付会话缓存
    session: (sessionId: string) => `${CacheKeys.PREFIX}:payment:session:${sessionId}`,
    
    // 用户订单列表
    userOrders: (userId: string, status?: string) => 
      `${CacheKeys.PREFIX}:payment:user_orders:${userId}${status ? `:${status}` : ''}`,
    
    // 支付统计数据
    stats: (period: string) => `${CacheKeys.PREFIX}:payment:stats:${period}`,
  };

  /**
   * 系统相关缓存键
   */
  static system = {
    // 系统配置缓存
    config: (key: string) => `${CacheKeys.PREFIX}:system:config:${key}`,
    
    // 系统统计数据
    stats: (type: string) => `${CacheKeys.PREFIX}:system:stats:${type}`,
    
    // API限流缓存
    rateLimit: (ip: string, endpoint: string) => 
      `${CacheKeys.PREFIX}:system:rate_limit:${ip}:${endpoint}`,
    
    // 系统通知
    notifications: () => `${CacheKeys.PREFIX}:system:notifications`,
    
    // 系统维护状态
    maintenance: () => `${CacheKeys.PREFIX}:system:maintenance`,
  };

  /**
   * 搜索相关缓存键
   */
  static search = {
    // 搜索结果缓存
    results: (query: string, type: string, page: number) => 
      `${CacheKeys.PREFIX}:search:results:${type}:${encodeURIComponent(query)}:${page}`,
    
    // 热门搜索词
    hotKeywords: () => `${CacheKeys.PREFIX}:search:hot_keywords`,
    
    // 用户搜索历史
    history: (userId: string) => `${CacheKeys.PREFIX}:search:history:${userId}`,
    
    // 搜索建议
    suggestions: (query: string) => `${CacheKeys.PREFIX}:search:suggestions:${encodeURIComponent(query)}`,
  };

  /**
   * 地理位置相关缓存键
   */
  static location = {
    // 城市列表缓存
    cities: () => `${CacheKeys.PREFIX}:location:cities`,
    
    // 热门城市缓存
    hotCities: () => `${CacheKeys.PREFIX}:location:hot_cities`,
    
    // 用户位置缓存
    userLocation: (userId: string) => `${CacheKeys.PREFIX}:location:user:${userId}`,
    
    // 附近的摄影师
    nearbyPhotographers: (lat: number, lng: number, radius: number) => 
      `${CacheKeys.PREFIX}:location:nearby_photographers:${lat}:${lng}:${radius}`,
  };

  /**
   * 文件上传相关缓存键
   */
  static upload = {
    // 上传会话缓存
    session: (sessionId: string) => `${CacheKeys.PREFIX}:upload:session:${sessionId}`,
    
    // 临时文件缓存
    tempFile: (fileId: string) => `${CacheKeys.PREFIX}:upload:temp_file:${fileId}`,
    
    // 上传进度缓存
    progress: (uploadId: string) => `${CacheKeys.PREFIX}:upload:progress:${uploadId}`,
  };

  /**
   * 生成带时间戳的缓存键
   * @param baseKey 基础键
   * @param timestamp 时间戳（可选，默认为当前时间）
   * @returns 带时间戳的缓存键
   */
  static withTimestamp(baseKey: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    return `${baseKey}:${ts}`;
  }

  /**
   * 生成带过期时间的缓存键
   * @param baseKey 基础键
   * @param ttl 过期时间（秒）
   * @returns 带过期时间的缓存键
   */
  static withTTL(baseKey: string, ttl: number): string {
    const expireAt = Date.now() + (ttl * 1000);
    return `${baseKey}:expire:${expireAt}`;
  }

  /**
   * 解析缓存键中的参数
   * @param key 缓存键
   * @returns 解析后的参数对象
   */
  static parseKey(key: string): Record<string, string> {
    const parts = key.split(':');
    const params: Record<string, string> = {};
    
    parts.forEach((part, index) => {
      params[`part${index}`] = part;
    });
    
    return params;
  }
}

export default CacheKeys;
