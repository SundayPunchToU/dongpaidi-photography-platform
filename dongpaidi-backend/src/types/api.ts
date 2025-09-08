/**
 * API响应类型定义
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code: number;
  timestamp: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  data: null;
  errors?: string[];
}
