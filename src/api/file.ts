/**
 * 文件操作API封装
 * 支持本地模式和云服务模式
 */

import type { FileRecord, FileUploadParams, FileListParams, UploadProgress } from '@/types/file'
import type { ApiResponse, PageResponse } from '@/types/common'
import { getCurrentPlatform } from '@/utils/platform'
import { generateUniqueFileName } from '@/utils/file'
import { appConfig, isLocalMode, logger } from '@/config'
import { localStorageService } from '@/services/localStorageService'

export class FileAPI {
  // 固定Demo用户ID
  private static readonly DEMO_USER_ID = isLocalMode ? 
    (appConfig.local?.mockUserId || 'local_demo_user') : 
    'demo_user_001'
  
  // 数据库实例（云服务模式）
  private db = isLocalMode ? null : uniCloud.database()
  
  /**
   * 上传文件
   */
  async uploadFile(params: FileUploadParams): Promise<ApiResponse<FileRecord>> {
    try {
      const { filePath, fileType, fileName } = params
      
      // 本地模式处理
      if (isLocalMode) {
        logger.info('使用本地模式上传文件')
        
        // 在H5平台，filePath可能是File对象或base64
        let file: File
        if (typeof filePath === 'string' && filePath.startsWith('blob:')) {
          // 处理blob URL
          const response = await fetch(filePath)
          const blob = await response.blob()
          file = new File([blob], fileName || 'unnamed', { type: blob.type })
        } else if (filePath instanceof File) {
          file = filePath
        } else {
          // 处理临时文件路径（小程序环境）
          // 这里需要特殊处理，暂时返回错误
          throw new Error('本地模式暂不支持小程序文件上传')
        }
        
        const localFile = await localStorageService.uploadFile(file)
        
        return {
          code: 0,
          message: '上传成功（本地模式）',
          data: {
            id: localFile.id,
            fileName: localFile.fileName,
            originalName: localFile.originalName,
            fileType: localFile.fileType,
            fileUrl: localFile.fileUrl,
            fileSize: localFile.fileSize,
            uploadTime: localFile.uploadTime,
            userId: localFile.userId,
            platform: localFile.platform,
            status: 1
          } as FileRecord
        }
      }
      
      // 云服务模式处理
      logger.info('使用云服务模式上传文件')
      
      // 生成唯一文件名
      const uniqueFileName = generateUniqueFileName(fileName || filePath)
      const cloudPath = `files/${FileAPI.DEMO_USER_ID}/${uniqueFileName}`
      
      // 上传文件到云存储
      const uploadResult = await uniCloud.uploadFile({
        filePath,
        cloudPath,
        onUploadProgress: (progressEvent) => {
          const progress: UploadProgress = {
            progress: progressEvent.progress,
            totalBytesWritten: progressEvent.loaded,
            totalBytesExpectedToWrite: progressEvent.total
          }
          uni.$emit('upload-progress', progress)
        }
      })
      
      // 获取文件信息
      const fileInfo = await uni.getFileInfo({
        filePath
      })
      
      // 创建文件记录
      const fileRecord: Partial<FileRecord> = {
        fileName: uniqueFileName,
        fileType,
        fileUrl: uploadResult.fileID,
        fileSize: fileInfo.size,
        uploadTime: new Date().toISOString(),
        userId: FileAPI.DEMO_USER_ID,
        platform: getCurrentPlatform()
      }
      
      // 保存到数据库
      const dbResult = await this.db!.collection('files').add(fileRecord)
      
      return {
        code: 0,
        message: '上传成功',
        data: {
          ...fileRecord,
          id: dbResult.id
        } as FileRecord
      }
    } catch (error: any) {
      logger.error('文件上传失败:', error)
      return {
        code: -1,
        message: error.message || '上传失败',
        data: null as any
      }
    }
  }
  
  /**
   * 获取文件列表
   */
  async getFileList(params?: FileListParams): Promise<ApiResponse<PageResponse<FileRecord>>> {
    try {
      const { fileType, page = 1, pageSize = 20 } = params || {}
      
      // 本地模式处理
      if (isLocalMode) {
        logger.info('使用本地模式获取文件列表')
        
        const result = await localStorageService.getFileList({
          userId: FileAPI.DEMO_USER_ID,
          fileType,
          pageSize,
          pageNum: page
        })
        
        const records = result.list.map(f => ({
          id: f.id,
          fileName: f.fileName,
          originalName: f.originalName,
          fileType: f.fileType,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          uploadTime: f.uploadTime,
          userId: f.userId,
          platform: f.platform,
          status: 1
        } as FileRecord))
        
        return {
          code: 0,
          message: '获取成功',
          data: {
            list: records,
            page,
            pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / pageSize)
          }
        }
      }
      
      // 云服务模式处理
      logger.info('使用云服务模式获取文件列表')
      
      // 构建where条件
      let where: any = {
        userId: FileAPI.DEMO_USER_ID,
        status: 1
      }
      
      if (fileType) {
        where.fileType = fileType
      }
      
      // 查询总数
      const countResult = await this.db!.collection('files')
        .where(where)
        .count()
      
      // 查询列表
      const listResult = await this.db!.collection('files')
        .where(where)
        .orderBy('uploadTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: listResult.data as FileRecord[],
          total: countResult.total,
          page,
          pageSize
        }
      }
    } catch (error: any) {
      logger.error('获取文件列表失败:', error)
      return {
        code: -1,
        message: error.message || '获取失败',
        data: {
          list: [],
          total: 0,
          page: 1,
          pageSize: 20
        }
      }
    }
  }
  
  /**
   * 删除文件（完整删除：数据库记录 + 云存储文件）
   */
  async deleteFile(fileId: string): Promise<ApiResponse<boolean>> {
    try {
      // 本地模式处理
      if (isLocalMode) {
        logger.info('使用本地模式删除文件')
        const success = await localStorageService.deleteFile(fileId)
        
        return {
          code: success ? 0 : -1,
          message: success ? '删除成功' : '删除失败',
          data: success
        }
      }
      
      // 云服务模式处理
      logger.info('使用云服务模式删除文件')
      
      // 1. 先获取文件信息，需要fileUrl来删除云存储文件
      const fileDetailResult = await this.db!.collection('files')
        .doc(fileId)
        .get()
      
      if (!fileDetailResult.data || fileDetailResult.data.length === 0) {
        return {
          code: -1,
          message: '文件不存在',
          data: false
        }
      }
      
      const fileRecord = fileDetailResult.data[0] as FileRecord
      
      // 2. 删除云存储文件（如果fileUrl存在且是云存储文件ID）
      if (fileRecord.fileUrl && fileRecord.fileUrl.startsWith('cloud://')) {
        try {
          await uniCloud.deleteFile({
            fileList: [fileRecord.fileUrl]
          })
          logger.log('云存储文件删除成功:', fileRecord.fileUrl)
        } catch (cloudError) {
          logger.warn('云存储文件删除失败（可能已经不存在）:', cloudError)
          // 云存储删除失败不阻止数据库删除，可能文件已经不存在
        }
      }
      
      // 3. 删除数据库记录（硬删除）
      await this.db!.collection('files')
        .doc(fileId)
        .remove()
      
      return {
        code: 0,
        message: '删除成功',
        data: true
      }
    } catch (error: any) {
      console.error('删除文件失败:', error)
      return {
        code: -1,
        message: error.message || '删除失败',
        data: false
      }
    }
  }

  /**
   * 软删除文件（仅标记为删除状态，不删除实际文件）
   */
  async softDeleteFile(fileId: string): Promise<ApiResponse<boolean>> {
    try {
      // 软删除，更新状态为0
      await this.db.collection('files')
        .doc(fileId)
        .update({
          status: 0,
          deletedTime: new Date().toISOString()
        })
      
      return {
        code: 0,
        message: '删除成功',
        data: true
      }
    } catch (error: any) {
      logger.error('删除文件失败:', error)
      return {
        code: -1,
        message: error.message || '软删除失败',
        data: false
      }
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(fileIds: string[]): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      // 本地模式处理
      if (isLocalMode) {
        logger.info('使用本地模式批量删除文件')
        const result = await localStorageService.batchDeleteFiles(fileIds)
        
        return {
          code: 0,
          message: '批量删除完成',
          data: result
        }
      }
      
      // 云服务模式处理
      logger.info('使用云服务模式批量删除文件')
      
      const results = {
        success: [] as string[],
        failed: [] as string[]
      }
      
      // 使用Promise.allSettled并发删除，提高性能
      const deletePromises = fileIds.map(async (fileId) => {
        const result = await this.deleteFile(fileId)
        return { fileId, result }
      })
      
      const settledResults = await Promise.allSettled(deletePromises)
      
      settledResults.forEach((settledResult, index) => {
        const fileId = fileIds[index]
        
        if (settledResult.status === 'fulfilled' && settledResult.value.result.code === 0) {
          results.success.push(fileId)
        } else {
          results.failed.push(fileId)
          logger.error(`删除文件${fileId}失败:`, 
            settledResult.status === 'fulfilled' 
              ? settledResult.value.result.message 
              : settledResult.reason
          )
        }
      })
      
      return {
        code: 0,
        message: `批量删除完成，成功${results.success.length}个，失败${results.failed.length}个`,
        data: results
      }
    } catch (error: any) {
      console.error('批量删除文件失败:', error)
      return {
        code: -1,
        message: error.message || '批量删除失败',
        data: {
          success: [],
          failed: fileIds
        }
      }
    }
  }
  
  /**
   * 上传文件到云存储 - subtask 5.4要求的uploadToCloud方法
   */
  async uploadToCloud(params: {
    filePath: string
    cloudPath?: string
    fileName?: string
    onProgress?: (progress: UploadProgress) => void
  }): Promise<ApiResponse<{ fileID: string; cloudPath: string; fileUrl: string }>> {
    try {
      const { filePath, cloudPath, fileName, onProgress } = params
      
      // 生成云存储路径
      const finalCloudPath = cloudPath || `files/${FileAPI.DEMO_USER_ID}/${generateUniqueFileName(fileName || filePath)}`
      
      // 文件类型验证
      const fileType = fileName ? fileName.split('.').pop()?.toLowerCase() : ''
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi']
      if (fileType && !allowedTypes.includes(fileType)) {
        throw new Error(`不支持的文件格式: ${fileType}`)
      }
      
      // 上传文件到云存储
      const uploadResult = await uniCloud.uploadFile({
        filePath,
        cloudPath: finalCloudPath,
        onUploadProgress: (progressEvent) => {
          const progress: UploadProgress = {
            progress: progressEvent.progress,
            totalBytesWritten: progressEvent.loaded,
            totalBytesExpectedToWrite: progressEvent.total
          }
          if (onProgress) {
            onProgress(progress)
          }
          uni.$emit('upload-progress', progress)
        }
      })
      
      // 获取文件下载URL
      const fileUrl = await uniCloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })
      
      return {
        code: 0,
        message: '上传成功',
        data: {
          fileID: uploadResult.fileID,
          cloudPath: finalCloudPath,
          fileUrl: fileUrl.fileList[0]?.tempFileURL || uploadResult.fileID
        }
      }
    } catch (error: any) {
      console.error('云存储上传失败:', error)
      return {
        code: -1,
        message: error.message || '上传失败',
        data: null as any
      }
    }
  }

  /**
   * 获取文件详情
   */
  async getFileDetail(fileId: string): Promise<ApiResponse<FileRecord | null>> {
    try {
      const result = await this.db.collection('files')
        .doc(fileId)
        .get()
      
      if (result.data && result.data.length > 0) {
        return {
          code: 0,
          message: '获取成功',
          data: result.data[0] as FileRecord
        }
      } else {
        return {
          code: -1,
          message: '文件不存在',
          data: null
        }
      }
    } catch (error: any) {
      console.error('获取文件详情失败:', error)
      return {
        code: -1,
        message: error.message || '获取失败',
        data: null
      }
    }
  }
}

// 导出单例
export default new FileAPI()