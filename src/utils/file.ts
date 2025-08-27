/**
 * 文件处理工具函数
 */

import type { FileType } from '@/types/file'

/**
 * 根据文件后缀名判断文件类型
 */
export function getFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  
  if (!ext) return 'other'
  
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (documentExts.includes(ext)) return 'document'
  
  return 'other'
}

/**
 * 检查文件大小是否超限
 */
export function checkFileSize(size: number, maxSize: number = 100): boolean {
  const maxSizeInBytes = maxSize * 1024 * 1024 // 转换为字节
  return size <= maxSizeInBytes
}

/**
 * 获取文件名（不包含扩展名）
 */
export function getFileNameWithoutExt(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) return fileName
  return fileName.substring(0, lastDotIndex)
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) return ''
  return fileName.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = getFileExtension(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}_${random}.${ext}`
}