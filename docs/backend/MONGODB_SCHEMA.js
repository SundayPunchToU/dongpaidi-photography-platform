/**
 * MongoDB 文档型数据设计
 * 用于存储非关系型数据和高频读写数据
 */

// 用户活动日志集合
db.createCollection("user_activities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "action", "timestamp"],
      properties: {
        userId: { bsonType: "string" },
        action: { 
          bsonType: "string",
          enum: ["login", "logout", "view_work", "like", "comment", "share", "upload"]
        },
        targetId: { bsonType: "string" }, // 目标对象ID
        targetType: { 
          bsonType: "string",
          enum: ["work", "user", "appointment", "comment"]
        },
        metadata: { bsonType: "object" }, // 额外数据
        ip: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

// 搜索历史集合
db.createCollection("search_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "query", "timestamp"],
      properties: {
        userId: { bsonType: "string" },
        query: { bsonType: "string" },
        category: { bsonType: "string" },
        filters: { bsonType: "object" },
        resultCount: { bsonType: "int" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

// 推荐算法数据集合
db.createCollection("user_preferences", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "preferences"],
      properties: {
        userId: { bsonType: "string" },
        preferences: {
          bsonType: "object",
          properties: {
            categories: { bsonType: "array" }, // 偏好分类
            tags: { bsonType: "array" }, // 偏好标签
            photographers: { bsonType: "array" }, // 关注的摄影师
            locations: { bsonType: "array" }, // 偏好地区
            priceRange: { bsonType: "object" }, // 价格范围
            timeSlots: { bsonType: "array" } // 偏好时间段
          }
        },
        behaviorScore: {
          bsonType: "object",
          properties: {
            viewScore: { bsonType: "double" },
            likeScore: { bsonType: "double" },
            commentScore: { bsonType: "double" },
            shareScore: { bsonType: "double" },
            bookingScore: { bsonType: "double" }
          }
        },
        lastUpdated: { bsonType: "date" }
      }
    }
  }
});

// 实时聊天消息集合
db.createCollection("chat_messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversationId", "senderId", "content", "timestamp"],
      properties: {
        conversationId: { bsonType: "string" },
        senderId: { bsonType: "string" },
        receiverId: { bsonType: "string" },
        messageType: { 
          bsonType: "string",
          enum: ["text", "image", "voice", "video", "location", "appointment"]
        },
        content: { bsonType: "string" },
        metadata: { bsonType: "object" }, // 图片尺寸、语音时长等
        status: {
          bsonType: "string",
          enum: ["sent", "delivered", "read"]
        },
        timestamp: { bsonType: "date" },
        editedAt: { bsonType: "date" },
        deletedAt: { bsonType: "date" }
      }
    }
  }
});

// 图片处理任务队列
db.createCollection("image_processing_tasks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["taskId", "originalUrl", "status"],
      properties: {
        taskId: { bsonType: "string" },
        userId: { bsonType: "string" },
        originalUrl: { bsonType: "string" },
        processedUrls: {
          bsonType: "object",
          properties: {
            thumbnail: { bsonType: "string" },
            medium: { bsonType: "string" },
            large: { bsonType: "string" },
            watermarked: { bsonType: "string" }
          }
        },
        processingOptions: {
          bsonType: "object",
          properties: {
            resize: { bsonType: "array" },
            quality: { bsonType: "int" },
            watermark: { bsonType: "bool" },
            format: { bsonType: "string" }
          }
        },
        status: {
          bsonType: "string",
          enum: ["pending", "processing", "completed", "failed"]
        },
        error: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        completedAt: { bsonType: "date" }
      }
    }
  }
});

// 系统配置集合
db.createCollection("system_configs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "value"],
      properties: {
        key: { bsonType: "string" },
        value: { bsonType: "object" },
        description: { bsonType: "string" },
        category: { bsonType: "string" },
        isActive: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// 创建索引
// 用户活动日志索引
db.user_activities.createIndex({ "userId": 1, "timestamp": -1 });
db.user_activities.createIndex({ "action": 1, "timestamp": -1 });
db.user_activities.createIndex({ "targetId": 1, "targetType": 1 });

// 搜索历史索引
db.search_history.createIndex({ "userId": 1, "timestamp": -1 });
db.search_history.createIndex({ "query": "text" });

// 用户偏好索引
db.user_preferences.createIndex({ "userId": 1 });
db.user_preferences.createIndex({ "lastUpdated": -1 });

// 聊天消息索引
db.chat_messages.createIndex({ "conversationId": 1, "timestamp": -1 });
db.chat_messages.createIndex({ "senderId": 1, "timestamp": -1 });
db.chat_messages.createIndex({ "receiverId": 1, "status": 1 });

// 图片处理任务索引
db.image_processing_tasks.createIndex({ "status": 1, "createdAt": 1 });
db.image_processing_tasks.createIndex({ "userId": 1, "createdAt": -1 });

// 系统配置索引
db.system_configs.createIndex({ "key": 1 }, { unique: true });
db.system_configs.createIndex({ "category": 1, "isActive": 1 });

// 示例数据插入
// 系统配置示例
db.system_configs.insertMany([
  {
    key: "image_upload_config",
    value: {
      maxFileSize: 10485760, // 10MB
      allowedFormats: ["jpg", "jpeg", "png", "webp"],
      maxImagesPerWork: 9,
      compressionQuality: 85,
      thumbnailSizes: [150, 300, 600],
      watermarkEnabled: true
    },
    description: "图片上传相关配置",
    category: "upload",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "recommendation_config",
    value: {
      maxRecommendations: 20,
      refreshInterval: 3600, // 1小时
      weightFactors: {
        viewWeight: 1.0,
        likeWeight: 2.0,
        commentWeight: 3.0,
        shareWeight: 4.0,
        followWeight: 5.0
      },
      categoryBoost: 1.5,
      locationBoost: 1.2,
      timeDecayFactor: 0.95
    },
    description: "推荐算法配置",
    category: "recommendation",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "notification_config",
    value: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      batchSize: 100,
      retryAttempts: 3,
      templates: {
        like: "{{user}} 赞了你的作品 {{work}}",
        comment: "{{user}} 评论了你的作品：{{comment}}",
        follow: "{{user}} 关注了你",
        appointment: "你有新的约拍预约"
      }
    },
    description: "通知系统配置",
    category: "notification",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 用户偏好示例数据
db.user_preferences.insertOne({
  userId: "user_123",
  preferences: {
    categories: ["portrait", "landscape", "street"],
    tags: ["夜景", "人像", "建筑", "自然"],
    photographers: ["photographer_456", "photographer_789"],
    locations: ["北京", "上海", "深圳"],
    priceRange: { min: 500, max: 2000 },
    timeSlots: ["morning", "afternoon", "golden_hour"]
  },
  behaviorScore: {
    viewScore: 0.8,
    likeScore: 0.9,
    commentScore: 0.7,
    shareScore: 0.6,
    bookingScore: 0.85
  },
  lastUpdated: new Date()
});

// 聊天消息示例
db.chat_messages.insertOne({
  conversationId: "conv_user123_user456",
  senderId: "user_123",
  receiverId: "user_456",
  messageType: "text",
  content: "你好，我对你的约拍服务很感兴趣",
  status: "sent",
  timestamp: new Date()
});
