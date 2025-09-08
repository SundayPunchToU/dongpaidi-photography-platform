# 🔷 TypeScript 迁移指南

## 迁移策略

### 阶段1：基础设施准备
1. 安装TypeScript依赖
2. 配置tsconfig.json
3. 设置构建流程
4. 创建基础类型定义

### 阶段2：渐进式迁移
1. 从工具函数开始
2. 迁移数据模型
3. 迁移服务层
4. 最后迁移UI层

### 阶段3：严格模式
1. 启用严格类型检查
2. 消除any类型
3. 完善错误处理
4. 优化类型推导

## 配置文件

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/core/*": ["src/core/*"],
      "@/platform/*": ["platform/*"],
      "@/shared/*": ["shared/*"]
    }
  },
  "include": [
    "src/**/*",
    "platform/**/*",
    "shared/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "miniprogram_npm",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## 核心类型定义

### 基础类型
```typescript
// types/common.ts
export type ID = string
export type Timestamp = string // ISO 8601 format
export type URL = string
export type Email = string
export type PhoneNumber = string

// 分页类型
export interface Pagination {
  page: number
  size: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: Timestamp
  requestId?: string
}

// 错误类型
export interface ApiError {
  field?: string
  message: string
  code?: string
}

export interface ApiErrorResponse {
  code: number
  message: string
  data: null
  errors?: ApiError[]
}
```

### 业务模型类型
```typescript
// types/models.ts
export interface User {
  readonly id: ID
  nickname: string
  avatar: URL
  email?: Email
  phone?: PhoneNumber
  bio?: string
  location?: string
  isPhotographer: boolean
  isVerified: boolean
  stats: UserStats
  settings: UserSettings
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserStats {
  worksCount: number
  followersCount: number
  followingCount: number
  likesReceived: number
}

export interface UserSettings {
  privacy: PrivacySettings
  notifications: NotificationSettings
  preferences: UserPreferences
}

export interface Work {
  readonly id: ID
  title: string
  description: string
  coverImage: URL
  images: URL[]
  user: Pick<User, 'id' | 'nickname' | 'avatar' | 'isPhotographer'>
  stats: WorkStats
  tags: string[]
  category: WorkCategory
  location?: string
  cameraParams?: CameraParams
  status: WorkStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type WorkCategory = 
  | 'portrait' 
  | 'landscape' 
  | 'street' 
  | 'commercial' 
  | 'art' 
  | 'wedding'

export type WorkStatus = 'draft' | 'published' | 'archived' | 'deleted'

export interface WorkStats {
  likes: number
  comments: number
  views: number
  shares: number
  collections: number
}

export interface CameraParams {
  camera?: string
  lens?: string
  iso?: string
  aperture?: string
  shutter?: string
  focal?: string
}
```

### 服务接口类型
```typescript
// types/services.ts
export interface WorksServiceInterface {
  getList(params: GetWorksParams): Promise<PaginatedResponse<Work>>
  getById(id: ID): Promise<Work>
  create(data: CreateWorkData): Promise<Work>
  update(id: ID, data: UpdateWorkData): Promise<Work>
  delete(id: ID): Promise<void>
  like(id: ID): Promise<void>
  unlike(id: ID): Promise<void>
}

export interface GetWorksParams {
  page?: number
  size?: number
  category?: WorkCategory
  userId?: ID
  tags?: string[]
  sortBy?: 'created_at' | 'likes' | 'views'
  order?: 'asc' | 'desc'
}

export interface CreateWorkData {
  title: string
  description: string
  images: URL[]
  tags: string[]
  category: WorkCategory
  location?: string
  cameraParams?: CameraParams
}

export type UpdateWorkData = Partial<CreateWorkData>

export interface PaginatedResponse<T> {
  list: T[]
  pagination: Pagination
}
```

### 平台适配器类型
```typescript
// types/adapters.ts
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}

export interface NavigationAdapter {
  navigateTo(url: string, params?: Record<string, any>): Promise<void>
  redirectTo(url: string, params?: Record<string, any>): Promise<void>
  switchTab(url: string): Promise<void>
  navigateBack(delta?: number): Promise<void>
}

export interface NetworkAdapter {
  request<T>(config: RequestConfig): Promise<ApiResponse<T>>
  upload(config: UploadConfig): Promise<UploadResponse>
  download(config: DownloadConfig): Promise<DownloadResponse>
}

export interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}
```

### 组件Props类型
```typescript
// types/components.ts
export interface WorkCardProps {
  work: Work
  showActions?: boolean
  size?: 'small' | 'medium' | 'large'
  onLike?: (work: Work) => void
  onShare?: (work: Work) => void
  onComment?: (work: Work) => void
}

export interface UserProfileProps {
  user: User
  isCurrentUser?: boolean
  showFollowButton?: boolean
  onFollow?: (userId: ID) => void
  onUnfollow?: (userId: ID) => void
}

export interface PhotoGridProps {
  photos: URL[]
  columns?: number
  spacing?: number
  onPhotoTap?: (index: number) => void
}
```

## 迁移示例

### 工具函数迁移
```typescript
// 迁移前 (utils/date.js)
export function formatDate(date, format) {
  // 实现
}

// 迁移后 (utils/date.ts)
export function formatDate(
  date: Date | string | number, 
  format: string = 'YYYY-MM-DD'
): string {
  // 实现
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}
```

### 服务类迁移
```typescript
// 迁移前 (services/WorksService.js)
export class WorksService {
  async getList(params) {
    // 实现
  }
}

// 迁移后 (services/WorksService.ts)
export class WorksService implements WorksServiceInterface {
  constructor(
    private api: NetworkAdapter,
    private storage: StorageAdapter
  ) {}

  async getList(params: GetWorksParams): Promise<PaginatedResponse<Work>> {
    const response = await this.api.request<PaginatedResponse<Work>>({
      url: '/works',
      method: 'GET',
      data: params
    })
    return response.data
  }
}
```
