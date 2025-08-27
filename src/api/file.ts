/**
 * 文件操作API封装
 */

import type { FileRecord, FileUploadParams, FileListParams, UploadProgress } from '@/types/file'
import type { ApiResponse, PageResponse } from '@/types/common'
import { getCurrentPlatform } from '@/utils/platform'
import { generateUniqueFileName } from '@/utils/file'

export class FileAPI {
  // 固定Demo用户ID
  private static readonly DEMO_USER_ID = 'demo_user_001'
  
  // 数据库实例
  private db = uniCloud.database()
  
  /**
   * 上传文件
   */
  async uploadFile(params: FileUploadParams): Promise<ApiResponse<FileRecord>> {
    try {
      const { filePath, fileType, fileName } = params
      
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
      const dbResult = await this.db.collection('files').add(fileRecord)
      
      return {
        code: 0,
        message: '上传成功',
        data: {
          ...fileRecord,
          id: dbResult.id
        } as FileRecord
      }
    } catch (error: any) {
      console.error('文件上传失败:', error)
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
      
      // 构建where条件
      let where: any = {
        userId: FileAPI.DEMO_USER_ID,
        status: 1
      }
      
      if (fileType) {
        where.fileType = fileType
      }
      
      // 查询总数
      const countResult = await this.db.collection('files')
        .where(where)
        .count()
      
      // 查询列表
      const listResult = await this.db.collection('files')
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
      console.error('获取文件列表失败:', error)
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
      // 1. 先获取文件信息，需要fileUrl来删除云存储文件
      const fileDetailResult = await this.db.collection('files')
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
          console.log('云存储文件删除成功:', fileRecord.fileUrl)
        } catch (cloudError) {
          console.warn('云存储文件删除失败（可能已经不存在）:', cloudError)
          // 云存储删除失败不阻止数据库删除，可能文件已经不存在
        }
      }
      
      // 3. 删除数据库记录（硬删除）
      await this.db.collection('files')
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
      console.error('软删除文件失败:', error)
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
          console.error(`删除文件${fileId}失败:`, 
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