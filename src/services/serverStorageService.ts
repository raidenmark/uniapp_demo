/**
 * 服务器存储服务
 * 用于本地模式下与文件服务器API交互
 */

import { appConfig, logger } from '@/config'

export interface ServerFile {
  id: string
  fileName: string
  originalName: string
  fileType: 'image' | 'video' | 'other'
  fileUrl: string
  fileSize: number
  uploadTime: string
  userId: string
  platform: string
  status: number
  thumbnail?: string
}

// API响应接口
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface PageResponse<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
  totalPages?: number
}

class ServerStorageService {
  private readonly baseUrl: string
  private readonly mockDelay: number
  
  constructor() {
    // 从配置文件读取API地址
    this.baseUrl = appConfig.api.baseUrl
    this.mockDelay = appConfig.local?.mockDelay || 0
    
    // 调试输出
    logger.info('服务器存储服务初始化')
    logger.info('API基础URL:', this.baseUrl)
    logger.info('配置来源: appConfig.api.baseUrl')
    logger.info('当前运行模式:', appConfig.runMode)
  }
  
  // 模拟网络延迟
  private async simulateDelay(): Promise<void> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay))
    }
  }
  
  // HTTP请求封装
  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      return result
    } catch (error: any) {
      logger.error('请求失败:', error)
      throw new Error(error.message || '网络请求失败')
    }
  }
  
  // 上传文件
  async uploadFile(file: File): Promise<ServerFile> {
    await this.simulateDelay()
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.status} ${response.statusText}`)
      }
      
      const result: ApiResponse<ServerFile> = await response.json()
      
      if (result.code !== 0) {
        throw new Error(result.message || '上传失败')
      }
      
      logger.info('文件上传成功（服务器模式）:', result.data.fileName)
      
      return result.data
    } catch (error: any) {
      logger.error('文件上传失败:', error)
      throw error
    }
  }
  
  // 获取文件列表
  async getFileList(options: {
    userId?: string
    fileType?: string
    pageSize?: number
    pageNum?: number
  }): Promise<{ list: ServerFile[], total: number }> {
    await this.simulateDelay()
    
    try {
      const params = new URLSearchParams()
      
      if (options.fileType && options.fileType !== 'all') {
        params.append('fileType', options.fileType)
      }
      if (options.pageNum) {
        params.append('page', options.pageNum.toString())
      }
      if (options.pageSize) {
        params.append('pageSize', options.pageSize.toString())
      }
      
      const url = `/api/files${params.toString() ? '?' + params.toString() : ''}`
      const result = await this.request<PageResponse<ServerFile>>(url)
      
      if (result.code !== 0) {
        throw new Error(result.message || '获取文件列表失败')
      }
      
      return {
        list: result.data.list,
        total: result.data.total
      }
    } catch (error: any) {
      logger.error('获取文件列表失败:', error)
      throw error
    }
  }
  
  // 删除文件
  async deleteFile(fileId: string): Promise<boolean> {
    await this.simulateDelay()
    
    try {
      const result = await this.request<boolean>(`/api/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (result.code !== 0) {
        throw new Error(result.message || '删除失败')
      }
      
      logger.info('文件删除成功（服务器模式）:', fileId)
      return result.data
    } catch (error: any) {
      logger.error('删除文件失败:', error)
      throw error
    }
  }
  
  // 批量删除文件
  async batchDeleteFiles(fileIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    await this.simulateDelay()
    
    try {
      const results = {
        success: [] as string[],
        failed: [] as string[]
      }
      
      // 使用Promise.allSettled并发删除，提高性能
      const deletePromises = fileIds.map(async (fileId) => {
        try {
          await this.deleteFile(fileId)
          return { fileId, success: true }
        } catch (error) {
          return { fileId, success: false, error }
        }
      })
      
      const settledResults = await Promise.allSettled(deletePromises)
      
      settledResults.forEach((settledResult, index) => {
        const fileId = fileIds[index]
        
        if (settledResult.status === 'fulfilled' && settledResult.value.success) {
          results.success.push(fileId)
        } else {
          results.failed.push(fileId)
          logger.error(`删除文件${fileId}失败:`, 
            settledResult.status === 'fulfilled' 
              ? settledResult.value.error
              : settledResult.reason
          )
        }
      })
      
      return results
    } catch (error: any) {
      logger.error('批量删除文件失败:', error)
      return {
        success: [],
        failed: fileIds
      }
    }
  }
  
  // 获取文件URL（如果需要转换）
  getFileUrl(file: ServerFile): string {
    // 如果是相对路径，转换为绝对URL
    if (file.fileUrl.startsWith('/')) {
      return `${this.baseUrl}${file.fileUrl}`
    }
    return file.fileUrl
  }
  
  // 获取存储统计信息
  async getStorageInfo(): Promise<{
    totalFiles: number
    totalSize: number
    typeStats: { [key: string]: number }
  }> {
    try {
      // 获取所有文件
      const { list, total } = await this.getFileList({})
      
      // 统计信息
      const totalSize = list.reduce((sum, file) => sum + file.fileSize, 0)
      const typeStats: { [key: string]: number } = {}
      
      list.forEach(file => {
        typeStats[file.fileType] = (typeStats[file.fileType] || 0) + 1
      })
      
      return {
        totalFiles: total,
        totalSize,
        typeStats
      }
    } catch (error: any) {
      logger.error('获取存储信息失败:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        typeStats: {}
      }
    }
  }
  
  // 清理存储（仅用于开发环境）
  async clearStorage(): Promise<boolean> {
    try {
      const { list } = await this.getFileList({})
      const fileIds = list.map(f => f.id)
      
      if (fileIds.length > 0) {
        const result = await this.batchDeleteFiles(fileIds)
        const success = result.failed.length === 0
        
        if (success) {
          logger.info('存储清理成功，删除了', result.success.length, '个文件')
        } else {
          logger.warn('存储清理部分成功，失败', result.failed.length, '个文件')
        }
        
        return success
      }
      
      return true
    } catch (error: any) {
      logger.error('清理存储失败:', error)
      return false
    }
  }
}

// 导出单例
export const serverStorageService = new ServerStorageService()
export default serverStorageService