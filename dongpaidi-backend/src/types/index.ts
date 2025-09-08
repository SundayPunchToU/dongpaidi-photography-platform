import { Request } from 'express';

// 基础类型
export type ID = string;
export type Timestamp = Date;
export type URL = string;
export type Email = string;
export type PhoneNumber = string;

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code: number;
  timestamp: Timestamp;
  requestId?: string;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  code: number;
  errors?: ApiError[];
  timestamp: Timestamp;
}

// 分页类型
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 用户相关类型
export interface UserProfile {
  id: ID;
  nickname: string;
  avatarUrl?: URL;
  bio?: string;
  isPhotographer: boolean;
  isModel: boolean;
  isVerified: boolean;
  stats: UserStats;
  createdAt: Timestamp;
}

export interface UserStats {
  worksCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
}

export interface CreateUserDto {
  openid?: string;
  phone?: string;
  email?: string;
  platform: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  gender?: string;
  isPhotographer?: boolean;
  isModel?: boolean;
}

export interface UpdateUserDto {
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  contactWechat?: string;
  contactPhone?: string;
  specialties?: string[];
  equipment?: string[];
}

// 作品相关类型
export interface WorkItem {
  id: ID;
  title: string;
  description?: string;
  images: URL[];
  coverImage?: URL;
  tags: string[];
  category: string;
  location?: string;
  shootingDate?: Timestamp;
  shootingInfo?: Record<string, any>;
  author: {
    id: ID;
    nickname: string;
    avatarUrl?: URL;
    isVerified: boolean;
  };
  stats: {
    likeCount: number;
    commentCount: number;
    viewCount: number;
    collectCount: number;
  };
  userInteraction?: {
    isLiked: boolean;
    isCollected: boolean;
  };
  createdAt: Timestamp;
}

export interface CreateWorkDto {
  title: string;
  description?: string;
  images: URL[];
  coverImage?: URL;
  tags: string[];
  category: string;
  location?: string;
  shootingDate?: Timestamp;
  shootingInfo?: Record<string, any>;
}

export interface UpdateWorkDto {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  location?: string;
  shootingInfo?: Record<string, any>;
}

export interface WorksFilterDto extends PaginationQuery {
  category?: string;
  tags?: string[];
  userId?: ID;
  location?: string;
  keyword?: string;
}

// 约拍相关类型
export interface AppointmentItem {
  id: ID;
  title: string;
  description?: string;
  type: 'photographer_seek_model' | 'model_seek_photographer';
  location?: string;
  shootDate?: Timestamp;
  budget?: number;
  requirements?: Record<string, any>;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  publisher: {
    id: ID;
    nickname: string;
    avatarUrl?: URL;
    isVerified: boolean;
  };
  applicationsCount: number;
  createdAt: Timestamp;
}

export interface CreateAppointmentDto {
  title: string;
  description?: string;
  type: 'photographer_seek_model' | 'model_seek_photographer';
  location?: string;
  shootDate?: Timestamp;
  budget?: number;
  requirements?: Record<string, any>;
}

// 认证相关类型
export interface LoginDto {
  platform: 'wechat' | 'phone';
  code?: string; // 微信登录code或短信验证码
  phone?: string;
  userInfo?: {
    nickname: string;
    avatarUrl?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: ID;
  platform: string;
  iat: number;
  exp: number;
}

// 扩展Request类型
export interface AuthenticatedRequest extends Request {
  user: {
    id: ID;
    platform: string;
  };
}

// 文件上传类型
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface UploadResult {
  success: boolean;
  url?: URL;
  filename?: string;
  message: string;
}

// 微信相关类型
export interface WechatUserInfo {
  openid: string;
  nickname: string;
  avatarUrl?: string;
  gender?: number;
  city?: string;
  province?: string;
  country?: string;
}

export interface WechatLoginResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}
