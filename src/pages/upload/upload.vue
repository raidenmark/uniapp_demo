<template>
  <view class="upload-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="handleGoBack">
          <text class="back-icon">‹</text>
          <text class="back-text">返回</text>
        </view>
        <text class="navbar-title">上传文件</text>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 上传内容区域 -->
    <view class="upload-content">
      <!-- 临时简化的上传组件 -->
      <view class="simple-uploader">
        <text class="upload-title">文件上传</text>
        <button class="upload-button" @click="handleChooseFile" type="primary">
          选择文件
        </button>
        <text class="upload-tips">点击按钮选择要上传的文件（演示功能）</text>
      </view>

      <!-- 上传历史/进度 -->
      <view v-if="uploadHistory && uploadHistory.length > 0" class="upload-history">
        <view class="history-title">
          <text class="title-text">上传记录</text>
          <text class="clear-btn" @click="handleClearHistory">清空</text>
        </view>
        
        <view class="history-list">
          <view 
            v-for="item in uploadHistory" 
            :key="item.id"
            class="history-item"
          >
            <view class="item-info">
              <image 
                v-if="item.fileType === 'image'"
                :src="item.thumbnail || item.fileUrl" 
                mode="aspectFill"
                class="item-thumbnail"
              />
              <view v-else class="item-placeholder">
                <text class="placeholder-text">{{ item.fileType.toUpperCase() }}</text>
              </view>
              
              <view class="item-details">
                <text class="item-name">{{ item.fileName }}</text>
                <text class="item-size">{{ formatFileSize(item.fileSize) }}</text>
                <text class="item-time">{{ formatTime(item.uploadTime) }}</text>
              </view>
            </view>
            
            <view class="item-status">
              <view 
                v-if="item.status === 'uploading'"
                class="status-uploading"
              >
                <view class="progress-bar">
                  <view 
                    class="progress-fill"
                    :style="{ width: item.progress + '%' }"
                  ></view>
                </view>
                <text class="status-text">{{ item.progress }}%</text>
              </view>
              <view 
                v-else-if="item.status === 'success'"
                class="status-success"
              >
                <text class="status-icon">✓</text>
                <text class="status-text">上传成功</text>
              </view>
              <view 
                v-else-if="item.status === 'error'"
                class="status-error"
              >
                <text class="status-icon">✕</text>
                <text class="status-text">上传失败</text>
                <button 
                  class="retry-btn"
                  @click="handleRetryUpload(item)"
                  size="mini"
                >
                  重试
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 使用说明 -->
      <view class="upload-tips">
        <text class="tips-title">使用说明</text>
        <view class="tips-list">
          <text class="tips-item">• 支持图片格式：JPG、PNG、GIF</text>
          <text class="tips-item">• 支持视频格式：MP4、MOV、AVI</text>
          <text class="tips-item">• 文件大小不超过 50MB</text>
          <text class="tips-item">• 可同时选择多个文件上传</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
// 临时注释组件导入
// import FileUploader from '@/components/FileUploader.vue'
import type { FileRecord, FileType } from '@/types/file'
import { FileAPI } from '@/api/file'
import { useFileStore } from '@/store/file'

// 页面标题
uni.setNavigationBarTitle({
  title: '上传文件'
})

// 上传历史记录接口
interface UploadHistoryItem extends FileRecord {
  status: 'uploading' | 'success' | 'error'
  progress: number
}

// 使用FileStore进行状态管理
const fileStore = useFileStore()

// 响应式数据
const uploadHistory = ref<UploadHistoryItem[]>([])

// 选择文件处理函数
const handleChooseFile = () => {
  console.log('🚀 用户点击选择文件')
  
  uni.chooseImage({
    count: 9,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      console.log('✅ 选择文件成功:', res)
      uni.showToast({
        title: `选中${res.tempFilePaths.length}个文件`,
        icon: 'success'
      })
      
      // 真实上传过程
      for (const [index, filePath] of res.tempFilePaths.entries()) {
        try {
          // 🎯 创建唯一ID，加入随机数避免冲突
          const uniqueId = `upload_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
          
          // 创建上传历史项目
          const tempItem: UploadHistoryItem = {
            id: uniqueId,
            fileName: `上传中_${index + 1}.jpg`,
            originalName: filePath.split('/').pop() || '',
            fileType: 'image' as FileType,
            fileUrl: filePath,
            fileSize: 0,
            uploadTime: new Date().toISOString(),
            userId: 'local_demo_user',
            platform: 'H5',
            status: 'uploading',
            progress: 0,
            thumbnail: filePath
          }
          
          uploadHistory.value.push(tempItem)
          console.log(`📝 添加上传记录 [${index + 1}/${res.tempFilePaths.length}]:`, uniqueId)
          
          // 🚀 模拟进度更新
          const updateProgress = async (progress: number) => {
            const item = uploadHistory.value.find(item => item.id === uniqueId)
            if (item && item.status === 'uploading') {
              item.progress = Math.min(progress, 99) // 保留最后1%给API成功响应
              console.log(`📊 文件 ${uniqueId} 进度: ${item.progress}%`)
            }
            // 添加小延迟模拟真实上传过程
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          // H5环境下需要将blob转换为File对象
          await updateProgress(10)
          const response = await fetch(filePath)
          const blob = await response.blob()
          await updateProgress(25)
          
          const file = new File([blob], `upload_${Date.now()}_${index}.jpg`, { 
            type: blob.type || 'image/jpeg' 
          })
          await updateProgress(40)
          
          console.log('🔄 开始上传文件:', file.name, 'ID:', uniqueId)
          
          // 调用真实API上传
          const fileAPI = new FileAPI()
          await updateProgress(60)
          
          const result = await fileAPI.uploadFile({
            filePath: file,
            fileType: 'image',
            fileName: file.name
          })
          await updateProgress(90)
          
          if (result.code === 0) {
            // 🎯 通过唯一ID找到对应的历史记录并更新
            const successItem = uploadHistory.value.find(item => item.id === uniqueId)
            if (successItem) {
              successItem.status = 'success'
              successItem.progress = 100
              successItem.fileName = result.data.fileName
              successItem.fileUrl = result.data.fileUrl
              successItem.fileSize = result.data.fileSize
              successItem.thumbnail = result.data.thumbnail || result.data.fileUrl
              // 保持显示用的ID，但记录真实的服务器ID
              successItem.id = result.data.id
              console.log(`✅ 更新成功记录 ${uniqueId} -> ${result.data.id}`)
            }
            
            // 🎯 关键修复：上传成功后立即更新FileStore状态
            console.log('🔄 上传成功，更新FileStore状态...')
            try {
              fileStore.addFile(result.data)
              console.log('✅ FileStore状态更新成功')
            } catch (storeError) {
              console.warn('⚠️ FileStore状态更新失败:', storeError)
            }
            
            console.log('✅ 文件上传成功:', result.data)
            uni.showToast({
              title: '上传成功',
              icon: 'success'
            })
          } else {
            // 🎯 通过唯一ID找到对应的历史记录并标记失败
            const failItem = uploadHistory.value.find(item => item.id === uniqueId)
            if (failItem) {
              failItem.status = 'error'
              failItem.progress = 0
              console.log(`❌ 标记失败记录 ${uniqueId}`)
            }
            console.error('❌ 文件上传失败:', result.message)
            uni.showToast({
              title: result.message || '上传失败',
              icon: 'error'
            })
          }
        } catch (error: any) {
          console.error('❌ 文件上传异常:', error)
          
          // 🎯 通过唯一ID找到对应的历史项目并标记为错误
          const errorItem = uploadHistory.value.find(item => item.id === uniqueId)
          if (errorItem) {
            errorItem.status = 'error'
            errorItem.progress = 0
            console.log(`❌ 异常标记失败记录 ${uniqueId}`)
          }
          
          uni.showToast({
            title: '上传失败: ' + error.message,
            icon: 'error'
          })
        }
      }
      
      // 检查是否所有文件都上传完成
      const allCompleted = uploadHistory.value.every(item => 
        item.status === 'success' || item.status === 'error'
      )
      
      if (allCompleted) {
        const successCount = uploadHistory.value.filter(item => item.status === 'success').length
        const totalCount = uploadHistory.value.length
        
        if (successCount === totalCount) {
          // 全部成功
          setTimeout(() => {
            uni.showModal({
              title: '上传完成',
              content: `所有${successCount}个文件上传成功！是否返回文件列表查看？`,
              success: (modalRes) => {
                if (modalRes.confirm) {
                  console.log('🏠 用户确认返回主页，文件状态已同步')
                  uni.switchTab({
                    url: '/pages/index/index',
                    success: () => {
                      console.log('✅ 返回主页成功，FileStore状态已包含新文件')
                    }
                  })
                }
              }
            })
          }, 1000)
        } else {
          // 部分成功
          uni.showToast({
            title: `上传完成：成功${successCount}个，失败${totalCount - successCount}个`,
            icon: 'none',
            duration: 3000
          })
        }
      }
    },
    fail: (err) => {
      console.error('❌ 选择文件失败:', err)
      uni.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  })
}

// 返回上一页
const handleGoBack = () => {
  if (uploadHistory.value.some(item => item.status === 'uploading')) {
    uni.showModal({
      title: '提示',
      content: '文件正在上传中，确定要离开吗？',
      success: (res) => {
        if (res.confirm) {
          // 由于上传页面是tabBar页面，使用switchTab跳转到首页
          uni.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  } else {
    // 由于上传页面是tabBar页面，使用switchTab跳转到首页  
    console.log('🏠 返回主页，FileStore已包含上传的文件')
    uni.switchTab({
      url: '/pages/index/index',
      success: () => {
        console.log('✅ 返回首页成功，onShow事件将自动刷新文件列表')
      },
      fail: (err) => {
        console.error('❌ 返回首页失败:', err)
        // 降级方案：尝试使用navigateBack
        uni.navigateBack({
          fail: (err2) => {
            console.error('❌ navigateBack也失败:', err2)
          }
        })
      }
    })
  }
}

// 处理上传成功
const handleUploadSuccess = (file: any) => {
  console.log('上传成功:', file)
  
  // 更新历史记录状态
  const historyItem = uploadHistory.value.find(item => item.id === file.id)
  if (historyItem) {
    historyItem.status = 'success'
    historyItem.progress = 100
    historyItem.fileUrl = file.fileUrl
    historyItem.thumbnail = file.thumbnail
  }

  // 显示成功提示
  uni.showToast({
    title: '上传成功',
    icon: 'success'
  })

  // 延迟跳转回首页（可选）
  setTimeout(() => {
    if (uploadHistory.value.every(item => item.status !== 'uploading')) {
      // 所有文件都上传完成，询问是否返回
      uni.showModal({
        title: '上传完成',
        content: '所有文件上传完成，是否返回文件列表？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    }
  }, 1000)
}

// 处理上传错误
const handleUploadError = (error: any, file?: any) => {
  console.error('上传失败:', error)
  
  // 更新历史记录状态
  if (file) {
    const historyItem = uploadHistory.value.find(item => item.id === file.id)
    if (historyItem) {
      historyItem.status = 'error'
    }
  }

  // 显示错误提示
  uni.showToast({
    title: '上传失败',
    icon: 'error'
  })
}

// 处理上传进度
const handleUploadProgress = (progress: number, file: any) => {
  console.log('上传进度:', progress, file)
  
  // 查找或创建历史记录项
  let historyItem = uploadHistory.value.find(item => item.id === file.id)
  if (!historyItem) {
    historyItem = {
      id: file.id || generateFileId(),
      fileName: file.fileName || file.name || '未知文件',
      originalName: file.name,
      fileType: getFileTypeFromMime(file.type) || 'other',
      fileUrl: file.tempFilePath || '',
      fileSize: file.size || 0,
      uploadTime: new Date().toISOString(),
      userId: 'demo_user_001',
      platform: 'H5',
      status: 'uploading',
      progress: 0,
      thumbnail: file.tempFilePath
    }
    uploadHistory.value.unshift(historyItem)
  }
  
  historyItem.progress = Math.round(progress)
}

// 重试上传
const handleRetryUpload = (item: UploadHistoryItem) => {
  item.status = 'uploading'
  item.progress = 0
  // TODO: 调用FileUploader的重试方法
  console.log('重试上传:', item)
}

// 清空上传历史
const handleClearHistory = () => {
  const uploadingItems = uploadHistory.value.filter(item => item.status === 'uploading')
  if (uploadingItems.length > 0) {
    uni.showToast({
      title: '有文件正在上传',
      icon: 'none'
    })
    return
  }
  
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有上传记录吗？',
    success: (res) => {
      if (res.confirm) {
        uploadHistory.value = []
      }
    }
  })
}

// 生成文件ID
const generateFileId = () => {
  return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 根据MIME类型判断文件类型
const getFileTypeFromMime = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) {
    return 'image'
  } else if (mimeType.startsWith('video/')) {
    return 'video'
  } else {
    return 'other'
  }
}

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return Math.round(size / 1024) + 'KB'
  if (size < 1024 * 1024 * 1024) return Math.round(size / (1024 * 1024)) + 'MB'
  return Math.round(size / (1024 * 1024 * 1024)) + 'GB'
}

// 格式化时间
const formatTime = (timeString: string): string => {
  try {
    const date = new Date(timeString)
    return date.toLocaleTimeString()
  } catch (error) {
    return timeString
  }
}

// 页面卸载时清理
onUnmounted(() => {
  // 清理未完成的上传任务
  const uploadingItems = uploadHistory.value.filter(item => item.status === 'uploading')
  if (uploadingItems.length > 0) {
    console.log('页面卸载，取消上传任务')
  }
})
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 简化上传组件样式 */
.simple-uploader {
  background-color: white;
  border-radius: 12rpx;
  padding: 60rpx 40rpx;
  margin: 40rpx;
  text-align: center;
  border: 2rpx dashed #d9d9d9;
}

.upload-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 40rpx;
}

.upload-button {
  margin: 40rpx 0;
  width: 60%;
}

.upload-tips {
  display: block;
  font-size: 24rpx;
  color: #666;
}

/* 导航栏 */
.navbar {
  background-color: white;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 40rpx;
  height: 88rpx;
}

.navbar-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.back-icon {
  font-size: 48rpx;
  color: #007aff;
  margin-right: 8rpx;
}

.back-text {
  font-size: 32rpx;
  color: #007aff;
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  flex: 1;
}

.navbar-right {
  flex: 1;
}

/* 上传内容区域 */
.upload-content {
  padding: 40rpx;
}

/* 上传历史 */
.upload-history {
  margin-top: 60rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.history-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx 16rpx;
}

/* 历史记录列表 */
.history-list {
  space-y: 24rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.item-thumbnail {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  margin-right: 24rpx;
}

.item-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.placeholder-text {
  font-size: 20rpx;
  color: #999;
}

.item-details {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-size,
.item-time {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

/* 状态显示 */
.item-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 160rpx;
}

.status-uploading {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.progress-bar {
  width: 120rpx;
  height: 8rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progress-fill {
  height: 100%;
  background-color: #007aff;
  transition: width 0.3s ease;
}

.status-success {
  display: flex;
  align-items: center;
}

.status-error {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.status-success .status-icon {
  color: #52c41a;
}

.status-error .status-icon {
  color: #ff4d4f;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}

.retry-btn {
  margin-top: 8rpx;
  padding: 8rpx 16rpx;
  font-size: 24rpx;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
}

/* 使用说明 */
.upload-tips {
  margin-top: 60rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tips-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

/* 多端适配 */
/* H5端 */
/* #ifdef H5 */
.navbar-left {
  cursor: pointer;
}

.clear-btn {
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-btn:hover {
  color: #666;
}

.retry-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
}
/* #endif */

/* 小程序端 */
/* #ifdef MP */
.navbar-content {
  padding-top: var(--status-bar-height, 44rpx);
}
/* #endif */

/* APP端 */
/* #ifdef APP-PLUS */
.navbar-content {
  padding-top: var(--status-bar-height, 44rpx);
}
/* #endif */
</style>