/**
 * 文件状态管理 - 简化版本用于调试
 */

import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { FileRecord } from '@/types/file'
import { FileAPI } from '@/api/file'

export const useFileStore = defineStore('file', () => {
  console.log('🚀 初始化 FileStore...')
  
  // 简化版状态
  const fileList = ref<FileRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // FileAPI 实例
  const fileAPI = new FileAPI()
  
  console.log('✅ FileStore 基本状态初始化完成')
  
  // 简化版方法
  function setFileList(files: FileRecord[]) {
    console.log('📝 设置文件列表:', files.length, '个文件')
    fileList.value = files
  }
  
  function addFile(file: FileRecord) {
    console.log('➕ 添加文件:', file.fileName)
    fileList.value.unshift(file)
  }
  
  function removeFile(fileId: string) {
    console.log('🗑️ 删除文件:', fileId)
    const index = fileList.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      fileList.value.splice(index, 1)
      return true
    }
    return false
  }
  
  // 异步删除文件（调用API + 更新状态）
  async function deleteFile(fileId: string): Promise<void> {
    console.log('🗑️ 开始删除文件:', fileId)
    loading.value = true
    error.value = null
    
    try {
      // 调用API删除服务器文件
      const result = await fileAPI.deleteFile(fileId)
      
      if (result.code === 0) {
        // API删除成功，从本地状态中移除
        const removed = removeFile(fileId)
        if (removed) {
          console.log('✅ 文件删除成功:', fileId)
        } else {
          console.warn('⚠️ 文件在本地状态中不存在:', fileId)
        }
      } else {
        throw new Error(result.message || '删除失败')
      }
    } catch (err: any) {
      console.error('❌ 文件删除失败:', err)
      error.value = err.message || '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  console.log('🎯 FileStore 方法定义完成')
  
  return {
    // 状态
    fileList: readonly(fileList),
    loading: readonly(loading),
    error: readonly(error),
    
    // 方法
    setFileList,
    addFile,
    removeFile,
    deleteFile
  }
})