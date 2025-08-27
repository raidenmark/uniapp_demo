/**
 * 通用类型定义
 */

// API响应通用类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PageParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 平台类型
export type Platform = 'h5' | 'mp-weixin' | 'mp-alipay' | 'app-android' | 'app-ios'

// 加载状态类型
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
}

// 错误状态类型
export interface ErrorState {
  hasError: boolean
  errorMessage?: string
  errorCode?: number
}

// 文件类型枚举
export enum FileTypeEnum {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  OTHER = 'other'
}

// 平台类型枚举
export enum PlatformEnum {
  H5 = 'h5',
  MP_WEIXIN = 'mp-weixin',
  MP_ALIPAY = 'mp-alipay',
  APP_ANDROID = 'app-android',
  APP_IOS = 'app-ios'
}

// 工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 请求状态
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

// 上传状态
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed'