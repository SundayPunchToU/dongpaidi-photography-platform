// 占位符图片和数据生成工具

// 生成占位符图片URL
export function generatePlaceholderImage(width = 400, height = 600, seed = 1) {
  // 使用 picsum.photos 生成随机图片
  return `https://picsum.photos/${width}/${height}?random=${seed}`;
}

// 生成随机用户头像
export function generateUserAvatar(seed = 1) {
  const avatarServices = [
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&seed=${seed}`,
    `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&seed=${seed}`,
    `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&seed=${seed}`,
    `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&seed=${seed}`,
    `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&seed=${seed}`
  ];
  
  return avatarServices[seed % avatarServices.length];
}

// 生成随机作品数据
export function generateMockWork(index) {
  const titles = [
    '城市街角的光影', '温暖午后阳光', '雨后的彩虹', '古建筑之美', '人像写真集',
    '自然风光大片', '黑白艺术照', '色彩的碰撞', '光影的游戏', '情绪的表达',
    '建筑几何美学', '花卉微距特写', '可爱宠物萌照', '精致美食摄影', '旅行记录',
    '夜景霓虹灯火', '日出日落时分', '云海奇观', '都市生活节奏', '静物美学'
  ];
  
  const userNames = [
    '摄影新手', '光影追逐者', '色彩大师', '构图专家', '情感捕手',
    '自然爱好者', '都市探索者', '艺术创作者', '视觉设计师', '影像记录者',
    '风光摄影师', '人像专家', '街拍达人', '商业摄影师', '艺术家'
  ];
  
  const categories = ['portrait', 'landscape', 'street', 'commercial', 'art'];
  const heights = [300, 350, 400, 450, 500, 550, 600, 650, 700, 750];
  
  const randomHeight = heights[Math.floor(Math.random() * heights.length)];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id: `work_${String(index).padStart(3, '0')}`,
    userId: `user_${String((index % 15) + 1).padStart(3, '0')}`,
    userName: userNames[index % userNames.length],
    userAvatar: generateUserAvatar(index),
    title: titles[index % titles.length],
    coverImage: generatePlaceholderImage(400, randomHeight, index),
    imageWidth: 400,
    imageHeight: randomHeight,
    category: randomCategory,
    tags: ['摄影', '艺术'],
    stats: { 
      likes: Math.floor(Math.random() * 500) + 10, 
      comments: Math.floor(Math.random() * 50) + 1, 
      views: Math.floor(Math.random() * 2000) + 100 
    },
    isLiked: Math.random() > 0.7,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
  };
}
