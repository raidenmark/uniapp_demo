/**
 * 通用工具函数
 */

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时间 - subtask 4.3要求的formatTime函数
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化日期时间 - 兼容性别名
 */
export function formatDateTime(date: string | Date): string {
  return formatTime(date)
}

/**
 * 生成文件ID - subtask 4.3要求的generateFileId函数
 */
export function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 生成唯一ID - 兼容性别名
 */
export function generateId(): string {
  return generateFileId()
}

/**
 * 验证文件类型 - subtask 4.3要求
 */
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const ext = getFileExtension(fileName)
  return allowedTypes.includes(ext)
}

/**
 * 获取文件扩展名 - subtask 4.3要求
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) return ''
  return fileName.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * 判断是否为图片文件 - subtask 4.3要求
 */
export function isImageFile(fileName: string): boolean {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const ext = getFileExtension(fileName)
  return imageExts.includes(ext)
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}