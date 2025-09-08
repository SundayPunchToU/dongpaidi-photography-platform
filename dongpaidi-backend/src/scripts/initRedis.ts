import { redisClient } from '../config/redis';
import { cacheService } from '../services/cache';
import { hotContentCache } from '../services/hotContentCache';
import { sessionManager } from '../services/sessionManager';

/**
 * Redis初始化脚本
 */
export class RedisInitializer {
  /**
   * 初始化Redis连接和基础数据
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化Redis...');

      // 1. 连接Redis
      await redisClient.connect();
      
      // 2. 测试连接
      const pingResult = await redisClient.ping();
      console.log(`📡 Redis连接测试: ${pingResult}`);

      // 3. 获取Redis信息
      const info = await redisClient.info();
      console.log('📊 Redis服务器信息:');
      console.log(info.split('\n').slice(0, 5).join('\n'));

      // 4. 初始化基础缓存数据
      await RedisInitializer.initializeBaseData();

      // 5. 启动定时任务
      await RedisInitializer.startScheduledTasks();

      console.log('✅ Redis初始化完成!');
    } catch (error) {
      console.error('❌ Redis初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化基础缓存数据
   */
  private static async initializeBaseData(): Promise<void> {
    console.log('📦 初始化基础缓存数据...');

    try {
      // 初始化系统配置缓存
      await cacheService.set('system:config:app_name', '懂拍帝', 24 * 60 * 60); // 24小时
      await cacheService.set('system:config:version', '1.0.0', 24 * 60 * 60);
      await cacheService.set('system:config:maintenance', false, 24 * 60 * 60);

      // 初始化热门城市列表
      const hotCities = [
        { id: '1', name: '北京', code: 'beijing' },
        { id: '2', name: '上海', code: 'shanghai' },
        { id: '3', name: '广州', code: 'guangzhou' },
        { id: '4', name: '深圳', code: 'shenzhen' },
        { id: '5', name: '杭州', code: 'hangzhou' },
        { id: '6', name: '成都', code: 'chengdu' },
        { id: '7', name: '西安', code: 'xian' },
        { id: '8', name: '南京', code: 'nanjing' },
      ];
      await cacheService.set('location:hot_cities', hotCities, 24 * 60 * 60);

      // 初始化热门搜索关键词
      const hotKeywords = [
        '婚纱摄影', '个人写真', '情侣照', '全家福', '商业摄影',
        '风光摄影', '人像摄影', '街拍', '宠物摄影', '产品摄影'
      ];
      await cacheService.set('search:hot_keywords', hotKeywords, 60 * 60); // 1小时

      // 初始化热门内容排行
      await hotContentCache.refreshHotRanking('work');

      console.log('✅ 基础缓存数据初始化完成');
    } catch (error) {
      console.error('❌ 基础缓存数据初始化失败:', error);
      throw error;
    }
  }

  /**
   * 启动定时任务
   */
  private static async startScheduledTasks(): Promise<void> {
    console.log('⏰ 启动定时任务...');

    // 每5分钟清理过期会话
    setInterval(async () => {
      try {
        await sessionManager.cleanupExpiredSessions();
      } catch (error) {
        console.error('会话清理任务失败:', error);
      }
    }, 5 * 60 * 1000); // 5分钟

    // 每30分钟刷新热门内容排行
    setInterval(async () => {
      try {
        await hotContentCache.refreshHotRanking('work');
        await hotContentCache.refreshHotRanking('work', 'portrait');
        await hotContentCache.refreshHotRanking('work', 'wedding');
        await hotContentCache.refreshHotRanking('work', 'landscape');
      } catch (error) {
        console.error('热门内容刷新任务失败:', error);
      }
    }, 30 * 60 * 1000); // 30分钟

    // 每小时更新热门搜索关键词
    setInterval(async () => {
      try {
        // 这里应该从数据库统计实际的搜索数据
        const hotKeywords = [
          '婚纱摄影', '个人写真', '情侣照', '全家福', '商业摄影',
          '风光摄影', '人像摄影', '街拍', '宠物摄影', '产品摄影'
        ];
        await cacheService.set('search:hot_keywords', hotKeywords, 60 * 60);
      } catch (error) {
        console.error('热门关键词更新任务失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时

    console.log('✅ 定时任务启动完成');
  }

  /**
   * 清理所有缓存数据
   */
  static async clearAllCache(): Promise<void> {
    try {
      console.log('🧹 开始清理所有缓存数据...');
      
      await redisClient.flushdb();
      
      console.log('✅ 缓存数据清理完成');
    } catch (error) {
      console.error('❌ 缓存数据清理失败:', error);
      throw error;
    }
  }

  /**
   * 获取Redis状态信息
   */
  static async getRedisStatus(): Promise<{
    connected: boolean;
    uptime: string;
    memory: string;
    keyCount: number;
    version: string;
  }> {
    try {
      const info = await redisClient.info();
      const lines = info.split('\n');
      
      const getInfoValue = (key: string): string => {
        const line = lines.find(l => l.startsWith(key));
        return line ? line.split(':')[1]?.trim() || 'N/A' : 'N/A';
      };

      // 获取键数量
      const redis = redisClient.getClient();
      const keyCount = await redis.dbsize();

      return {
        connected: redisClient.isReady(),
        uptime: getInfoValue('uptime_in_seconds'),
        memory: getInfoValue('used_memory_human'),
        keyCount,
        version: getInfoValue('redis_version'),
      };
    } catch (error) {
      console.error('获取Redis状态失败:', error);
      return {
        connected: false,
        uptime: 'N/A',
        memory: 'N/A',
        keyCount: 0,
        version: 'N/A',
      };
    }
  }

  /**
   * 优雅关闭Redis连接
   */
  static async shutdown(): Promise<void> {
    try {
      console.log('🔌 正在关闭Redis连接...');
      
      await redisClient.disconnect();
      
      console.log('✅ Redis连接已关闭');
    } catch (error) {
      console.error('❌ Redis连接关闭失败:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      // 检查连接状态
      if (!redisClient.isReady()) {
        return {
          status: 'unhealthy',
          message: 'Redis连接未就绪',
        };
      }

      // 执行ping测试
      const pingResult = await redisClient.ping();
      if (pingResult !== 'PONG') {
        return {
          status: 'unhealthy',
          message: 'Redis ping测试失败',
          details: { pingResult },
        };
      }

      // 测试读写操作
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      await cacheService.set(testKey, testValue, 10); // 10秒过期
      const retrievedValue = await cacheService.get(testKey);
      
      if (retrievedValue !== testValue) {
        return {
          status: 'unhealthy',
          message: 'Redis读写测试失败',
          details: { expected: testValue, actual: retrievedValue },
        };
      }

      // 清理测试数据
      await cacheService.del(testKey);

      return {
        status: 'healthy',
        message: 'Redis运行正常',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis健康检查失败',
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

export default RedisInitializer;
