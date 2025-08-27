/**
 * 文件相关类型定义
 */

// 文件类型
export type FileType = 'image' | 'video' | 'document' | 'other'

// 文件记录
export interface FileRecord {
  id: string
  fileName: string
  originalName?: string
  fileType: FileType
  fileUrl: string
  fileSize: number
  uploadTime: string
  userId: string
  platform: string
  duration?: number
  width?: number
  height?: number
  status: number
  tags?: string[]
  thumbnail?: string
}

// 文件上传参数
export interface FileUploadParams {
  filePath: string
  fileType: FileType
  fileName?: string
}

// 文件列表查询参数
export interface FileListParams {
  fileType?: FileType
  page?: number
  pageSize?: number
  startTime?: string
  endTime?: string
}

// 文件上传进度
export interface UploadProgress {
  progress: number
  totalBytesWritten: number
  totalBytesExpectedToWrite: number
}