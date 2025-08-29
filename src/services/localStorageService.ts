/**
 * 本地存储服务
 * 用于本地模式下模拟云存储功能
 */

import { appConfig, logger } from '@/config'

export interface LocalFile {
  id: string
  fileName: string
  originalName: string
  fileType: 'image' | 'video'
  fileUrl: string
  fileSize: number
  uploadTime: string
  userId: string
  platform: string
  isDeleted: boolean
  base64Data?: string // 本地存储使用base64
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'uniapp_demo_files'
  private readonly maxStorageSize: number
  private readonly mockDelay: number
  
  constructor() {
    // 从配置获取参数
    this.maxStorageSize = appConfig.local?.maxFileSize || 50 * 1024 * 1024
    this.mockDelay = appConfig.local?.mockDelay || 0
    this.init()
  }
  
  private init() {
    // 初始化存储
    if (!this.getFiles()) {
      this.setFiles([])
      logger.info('本地存储初始化完成')
    }
  }
  
  // 模拟网络延迟
  private async simulateDelay(): Promise<void> {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay))
    }
  }
  
  // 获取存储数据
  private getFiles(): LocalFile[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('获取本地文件失败:', error)
      return null
    }
  }
  
  // 设置存储数据
  private setFiles(files: LocalFile[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files))
  }
  
  // 上传文件（模拟）
  async uploadFile(file: File): Promise<LocalFile> {
    await this.simulateDelay()
    
    const files = this.getFiles() || []
    
    // 检查存储空间
    const totalSize = this.calculateTotalSize(files)
    if (totalSize + file.size > this.maxStorageSize) {
      throw new Error('本地存储空间不足')
    }
    
    // 转换为base64
    const base64Data = await this.fileToBase64(file)
    
    // 创建文件记录
    const localFile: LocalFile = {
      id: this.generateId(),
      fileName: file.name,
      originalName: file.name,
      fileType: file.type.startsWith('image/') ? 'image' : 'video',
      fileUrl: base64Data, // 本地模式直接使用base64作为URL
      fileSize: file.size,
      uploadTime: new Date().toISOString(),
      userId: appConfig.local?.mockUserId || 'local_user',
      platform: 'h5',
      isDeleted: false,
      base64Data
    }
    
    files.push(localFile)
    this.setFiles(files)
    
    logger.info('文件上传成功（本地模式）:', localFile.fileName)
    
    return localFile
  }
  
  // 获取文件列表
  async getFileList(options: {
    userId?: string
    fileType?: string
    pageSize?: number
    pageNum?: number
  }): Promise<{ list: LocalFile[], total: number }> {
    await this.simulateDelay()
    
    let files = (this.getFiles() || []).filter(f => !f.isDeleted)
    
    // 用户过滤
    const userId = options.userId || appConfig.local?.mockUserId
    if (userId) {
      files = files.filter(f => f.userId === userId)
    }
    
    // 类型过滤
    if (options.fileType) {
      files = files.filter(f => f.fileType === options.fileType)
    }
    
    // 排序
    files.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())
    
    // 分页
    const pageSize = options.pageSize || 10
    const pageNum = options.pageNum || 1
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    
    const result = {
      list: files.slice(start, end),
      total: files.length
    }
    
    logger.debug('获取文件列表（本地模式）:', result)
    
    return result
  }
  
  // 获取单个文件
  async getFile(fileId: string): Promise<LocalFile | null> {
    await this.simulateDelay()
    
    const files = this.getFiles() || []
    const file = files.find(f => f.id === fileId && !f.isDeleted)
    
    logger.debug('获取文件（本地模式）:', file)
    
    return file || null
  }
  
  // 删除文件
  async deleteFile(fileId: string): Promise<boolean> {
    await this.simulateDelay()
    
    const files = this.getFiles() || []
    const index = files.findIndex(f => f.id === fileId)
    
    if (index === -1) {
      logger.warn('文件不存在（本地模式）:', fileId)
      return false
    }
    
    // 软删除
    files[index].isDeleted = true
    this.setFiles(files)
    
    logger.info('文件删除成功（本地模式）:', fileId)
    
    return true
  }
  
  // 批量删除
  async batchDeleteFiles(fileIds: string[]): Promise<{
    success: string[]
    failed: string[]
  }> {
    await this.simulateDelay()
    
    const files = this.getFiles() || []
    const success: string[] = []
    const failed: string[] = []
    
    fileIds.forEach(fileId => {
      const index = files.findIndex(f => f.id === fileId)
      if (index !== -1) {
        files[index].isDeleted = true
        success.push(fileId)
      } else {
        failed.push(fileId)
      }
    })
    
    this.setFiles(files)
    
    logger.info('批量删除完成（本地模式）:', { success, failed })
    
    return { success, failed }
  }
  
  // 获取存储信息
  getStorageInfo(): {
    used: number
    total: number
    percentage: number
    fileCount: number
  } {
    const files = (this.getFiles() || []).filter(f => !f.isDeleted)
    const used = this.calculateTotalSize(files)
    const total = this.maxStorageSize
    
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
      fileCount: files.length
    }
  }
  
  // 清空所有文件
  clearAll(): void {
    this.setFiles([])
    logger.info('本地存储已清空')
  }
  
  // 工具方法：计算总大小
  private calculateTotalSize(files: LocalFile[]): number {
    return files.reduce((total, file) => total + file.fileSize, 0)
  }
  
  // 工具方法：文件转base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // 工具方法：生成ID
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例
export const localStorageService = new LocalStorageService()