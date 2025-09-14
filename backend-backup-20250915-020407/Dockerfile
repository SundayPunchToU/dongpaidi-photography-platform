# 使用官方Node.js镜像
FROM node:18-alpine

# 安装必要的系统包（避免编译工具）
RUN apk add --no-cache curl dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 切换到nodejs用户安装依赖（避免权限问题）
USER nextjs

# 安装依赖（使用npm ci获得更快的安装速度）
RUN npm ci --only=production && npm cache clean --force

# 复制应用文件
COPY --chown=nextjs:nodejs . .

# 创建必要的目录
RUN mkdir -p logs uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
