import config from '../config.js';

const { baseUrl, isMock } = config;
const delay = isMock ? 500 : 0;
function request(url, method = 'GET', data = {}) {
  // 如果是mock模式且没有baseUrl，使用mock数据
  if (isMock && !baseUrl) {
    return getMockData(url, method, data);
  }

  const header = {
    'content-type': 'application/json',
    // 有其他content-type需求加点逻辑判断处理即可
  };
  // 获取token，有就丢进请求头
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      dataType: 'json', // 微信官方文档中介绍会对数据进行一次JSON.parse
      header,
      success(res) {
        setTimeout(() => {
          // HTTP状态码为200才视为成功
          if (res.code === 200) {
            resolve(res);
          } else {
            // wx.request的特性，只要有响应就会走success回调，所以在这里判断状态，非200的均视为请求失败
            reject(res);
          }
        }, delay);
      },
      fail(err) {
        setTimeout(() => {
          // 断网、服务器挂了都会fail回调，直接reject即可
          reject(err);
        }, delay);
      },
    });
  });
}

// Mock数据处理函数
function getMockData(url, method, data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // 根据URL返回对应的mock数据
        let mockResponse;

        switch (url) {
          case '/works':
            // 导入works mock数据
            const mockWorks = [
              {
                id: 'work_001',
                userId: 'user_001',
                userName: '光影大师',
                userAvatar: 'https://i.pravatar.cc/100?img=1',
                title: '城市夜景人像',
                coverImage: 'https://picsum.photos/400/600?random=1',
                imageWidth: 400,
                imageHeight: 600,
                category: 'portrait',
                tags: ['人像', '夜景'],
                stats: { likes: 156, comments: 23, views: 1200 },
                isLiked: false,
                createdAt: '2024-01-15T20:30:00Z'
              },
              {
                id: 'work_002',
                userId: 'user_002',
                userName: '自然之眼',
                userAvatar: 'https://i.pravatar.cc/100?img=2',
                title: '晨雾中的山峦',
                coverImage: 'https://picsum.photos/400/500?random=2',
                imageWidth: 400,
                imageHeight: 500,
                category: 'landscape',
                tags: ['风光', '山景'],
                stats: { likes: 89, comments: 12, views: 800 },
                isLiked: true,
                createdAt: '2024-01-14T06:15:00Z'
              },
              // 添加更多mock数据...
              ...Array.from({ length: 20 }, (_, index) => ({
                id: `work_${String(index + 3).padStart(3, '0')}`,
                userId: `user_${String((index % 10) + 1).padStart(3, '0')}`,
                userName: `摄影师${index + 3}`,
                userAvatar: `https://i.pravatar.cc/100?img=${(index % 50) + 3}`,
                title: `作品标题${index + 3}`,
                coverImage: `https://picsum.photos/400/${400 + Math.floor(Math.random() * 400)}?random=${index + 3}`,
                imageWidth: 400,
                imageHeight: 400 + Math.floor(Math.random() * 400),
                category: ['portrait', 'landscape', 'street', 'commercial', 'art'][index % 5],
                tags: ['标签1', '标签2'],
                stats: {
                  likes: Math.floor(Math.random() * 500) + 10,
                  comments: Math.floor(Math.random() * 50) + 1,
                  views: Math.floor(Math.random() * 2000) + 100
                },
                isLiked: Math.random() > 0.5,
                createdAt: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000).toISOString()
              }))
            ];

            mockResponse = {
              code: 200,
              success: true,
              data: {
                list: mockWorks,
                total: mockWorks.length,
                hasMore: false
              }
            };
            break;

          default:
            mockResponse = {
              code: 200,
              success: true,
              data: {
                list: [],
                total: 0,
                hasMore: false
              }
            };
        }

        resolve(mockResponse);
      } catch (error) {
        reject({
          code: 500,
          success: false,
          message: 'Mock数据处理失败',
          error: error.message
        });
      }
    }, delay);
  });
}

// 导出请求和服务地址
export default request;
