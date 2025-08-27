/**
 * 文件状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileRecord, FileUploadParams, FileListParams } from '@/types/file'
import fileApi from '@/api/file'
import { 
  showSuccess, 
  showError, 
  showLoading, 
  hideLoading,
  FeedbackManager,
  operationSuccess,
  operationError,
  withLoading
} from '@/utils/feedback'

export const useFileStore = defineStore('file', () => {
  // 状态
  const fileList = ref<FileRecord[]>([])
  const currentFile = ref<FileRecord | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref(0)
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filterType = ref<string>('')
  
  // 计算属性
  const imageFiles = computed(() => 
    fileList.value.filter(file => file.fileType === 'image')
  )
  
  const videoFiles = computed(() => 
    fileList.value.filter(file => file.fileType === 'video')
  )
  
  const hasMore = computed(() => {
    const totalPages = Math.ceil(totalCount.value / pageSize.value)
    return currentPage.value < totalPages
  })
  
  // 方法
  
  /**
   * 上传文件
   */
  async function uploadFile(params: FileUploadParams) {
    uploading.value = true
    error.value = null
    uploadProgress.value = 0
    
    try {
      // 监听上传进度
      const progressHandler = (event: any) => {
        uploadProgress.value = event.progress
      }
      uni.$on('upload-progress', progressHandler)
      
      const result = await fileApi.uploadFile(params)
      
      if (result.code === 0 && result.data) {
        // 添加到列表开头
        fileList.value.unshift(result.data)
        totalCount.value++
        
        operationSuccess('上传成功')
        
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || '上传失败'
      operationError(error.value)
      throw err
    } finally {
      uploading.value = false
      uploadProgress.value = 0
      uni.$off('upload-progress')
    }
  }
  
  /**
   * 加载文件列表
   */
  async function loadFileList(params?: FileListParams) {
    loading.value = true
    error.value = null
    
    try {
      const requestParams = {
        page: params?.page || currentPage.value,
        pageSize: params?.pageSize || pageSize.value,
        fileType: params?.fileType || filterType.value || undefined
      }
      
      const result = await fileApi.getFileList(requestParams)
      
      if (result.code === 0 && result.data) {
        if (requestParams.page === 1) {
          // 首页替换数据
          fileList.value = result.data.list
        } else {
          // 追加数据
          fileList.value.push(...result.data.list)
        }
        
        totalCount.value = result.data.total
        currentPage.value = result.data.page
        pageSize.value = result.data.pageSize
        
        if (params?.fileType !== undefined) {
          filterType.value = params.fileType
        }
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || '加载失败'
      showError(error.value)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 加载更多
   */
  async function loadMore() {
    if (!hasMore.value || loading.value) return
    
    await loadFileList({
      page: currentPage.value + 1,
      pageSize: pageSize.value,
      fileType: filterType.value
    })
  }
  
  /**
   * 刷新列表
   */
  async function refreshList() {
    currentPage.value = 1
    await loadFileList({
      page: 1,
      pageSize: pageSize.value,
      fileType: filterType.value
    })
  }
  
  /**
   * 删除单个文件
   */
  async function deleteFile(fileId: string) {
    try {
      const result = await fileApi.deleteFile(fileId)
      
      if (result.code === 0) {
        // 从列表中移除
        const index = fileList.value.findIndex(file => file.id === fileId)
        if (index > -1) {
          fileList.value.splice(index, 1)
          totalCount.value = Math.max(0, totalCount.value - 1)
        }
        
        operationSuccess('删除成功')
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      operationError(err.message || '删除失败')
      throw err
    }
  }

  /**
   * 批量删除文件
   */
  async function batchDeleteFiles(fileIds: string[]) {
    try {
      showLoading('批量删除中...')
      
      const result = await fileApi.batchDeleteFiles(fileIds)
      
      if (result.code === 0 && result.data) {
        const { success, failed } = result.data
        
        // 从列表中移除成功删除的文件
        success.forEach(fileId => {
          const index = fileList.value.findIndex(file => file.id === fileId)
          if (index > -1) {
            fileList.value.splice(index, 1)
          }
        })
        
        // 更新总数
        totalCount.value = Math.max(0, totalCount.value - success.length)
        
        if (failed.length === 0) {
          operationSuccess(`成功删除${success.length}个文件`)
        } else {
          showError(`删除完成，成功${success.length}个，失败${failed.length}个`)
        }
        
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      operationError(err.message || '批量删除失败')
      throw err
    } finally {
      hideLoading()
    }
  }

  /**
   * 获取文件详情
   */
  async function getFileDetail(fileId: string) {
    try {
      const result = await fileApi.getFileDetail(fileId)
      
      if (result.code === 0 && result.data) {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      operationError(err.message || '获取文件详情失败')
      throw err
    }
  }
  
  /**
   * 设置当前文件
   */
  function setCurrentFile(file: FileRecord | null) {
    currentFile.value = file
  }
  
  /**
   * 清除错误
   */
  function clearError() {
    error.value = null
  }
  
  /**
   * 更新文件状态 - subtask 4.2要求的updateFileStatus方法
   */
  function updateFileStatus(fileId: string, status: number) {
    const file = fileList.value.find(f => f.id === fileId)
    if (file) {
      file.status = status
    }
  }

  /**
   * 重置状态
   */
  function resetStore() {
    fileList.value = []
    currentFile.value = null
    loading.value = false
    uploading.value = false
    error.value = null
    uploadProgress.value = 0
    totalCount.value = 0
    currentPage.value = 1
    pageSize.value = 20
    filterType.value = ''
  }
  
  return {
    // 状态
    fileList,
    currentFile,
    loading,
    uploading,
    error,
    uploadProgress,
    totalCount,
    currentPage,
    pageSize,
    filterType,
    
    // 计算属性
    imageFiles,
    videoFiles,
    hasMore,
    
    // 方法
    uploadFile,
    loadFileList,
    loadMore,
    refreshList,
    deleteFile,
    batchDeleteFiles,
    getFileDetail,
    setCurrentFile,
    updateFileStatus,
    clearError,
    resetStore
  }
})