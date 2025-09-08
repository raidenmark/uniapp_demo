<template>
  <!-- 文件信息查看弹窗 -->
  <view v-if="visible" class="file-info-overlay" @click.self="handleClose">
    <view class="file-info-dialog" @click.stop>
      <view class="dialog-header">
        <text class="dialog-title">文件详情</text>
        <view class="close-btn" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>
      
      <view class="dialog-content">
        <!-- 文件预览 -->
        <view class="file-preview">
          <image 
            v-if="file.fileType === 'image'"
            :src="file.thumbnail || file.fileUrl"
            mode="aspectFit"
            class="preview-image"
          />
          <view 
            v-else-if="file.fileType === 'video'"
            class="video-preview"
          >
            <image 
              :src="file.thumbnail || '/static/video-placeholder.png'"
              mode="aspectFit"
              class="preview-image"
            />
            <view class="video-play-icon">▶</view>
          </view>
          <view v-else class="file-type-preview">
            <text class="file-type-large">{{ file.fileType.toUpperCase() }}</text>
          </view>
        </view>
        
        <!-- 文件信息 -->
        <view class="file-details">
          <view class="detail-row">
            <text class="detail-label">文件名</text>
            <text class="detail-value">{{ file.fileName || file.originalName || '未知文件' }}</text>
          </view>
          
          <view class="detail-row">
            <text class="detail-label">文件类型</text>
            <text class="detail-value">{{ getFileTypeText(file.fileType) }}</text>
          </view>
          
          <view class="detail-row">
            <text class="detail-label">文件大小</text>
            <text class="detail-value">{{ formatFileSize(file.fileSize) }}</text>
          </view>
          
          <view class="detail-row">
            <text class="detail-label">上传时间</text>
            <text class="detail-value">{{ formatDateTime(file.uploadTime) }}</text>
          </view>
          
          <view class="detail-row">
            <text class="detail-label">上传平台</text>
            <text class="detail-value">{{ getPlatformText(file.platform) }}</text>
          </view>
          
          <view v-if="file.fileType === 'image' && imageInfo" class="detail-row">
            <text class="detail-label">图片尺寸</text>
            <text class="detail-value">{{ imageInfo.width }} × {{ imageInfo.height }}</text>
          </view>
        </view>
      </view>
      
      <view class="dialog-actions">
        <button class="action-btn secondary" @click="handleClose">关闭</button>
        <button class="action-btn danger" @click="handleDelete">删除</button>
        <button class="action-btn primary" @click="handlePreview">预览</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FileRecord } from '@/types/file'

// Props定义
interface Props {
  visible: boolean
  file: FileRecord
}

const props = defineProps<Props>()

// 事件定义
interface Emits {
  (e: 'close'): void
  (e: 'delete', file: FileRecord): void
  (e: 'preview', file: FileRecord): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const imageInfo = ref<{ width: number; height: number } | null>(null)

// 监听文件变化，获取图片信息
watch(() => props.file, async (newFile) => {
  if (newFile && newFile.fileType === 'image') {
    try {
      const info = await uni.getImageInfo({
        src: newFile.fileUrl
      })
      imageInfo.value = {
        width: info.width,
        height: info.height
      }
    } catch (error) {
      console.warn('获取图片信息失败:', error)
      imageInfo.value = null
    }
  } else {
    imageInfo.value = null
  }
}, { immediate: true })

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (!size || size === 0) return '未知'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let fileSize = size
  
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024
    index++
  }
  
  return `${fileSize.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

// 格式化日期时间
const formatDateTime = (timeString: string): string => {
  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return timeString
  }
}

// 获取文件类型文本
const getFileTypeText = (fileType: string): string => {
  const typeMap: Record<string, string> = {
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    other: '其他'
  }
  return typeMap[fileType] || fileType.toUpperCase()
}

// 获取平台文本
const getPlatformText = (platform: string): string => {
  const platformMap: Record<string, string> = {
    H5: '网页版',
    'APP-PLUS': 'APP',
    'MP-WEIXIN': '微信小程序',
    'MP-ALIPAY': '支付宝小程序',
    'MP-BAIDU': '百度小程序',
    'MP-TOUTIAO': '头条小程序'
  }
  return platformMap[platform] || platform
}

// 处理关闭
const handleClose = () => {
  emit('close')
}

// 处理删除
const handleDelete = () => {
  emit('delete', props.file)
}

// 处理预览
const handlePreview = () => {
  emit('preview', props.file)
}

// 防止滚动穿透
watch(() => props.visible, (visible) => {
  if (visible) {
    // 禁用页面滚动
    // #ifdef H5
    document.body.style.overflow = 'hidden'
    // #endif
  } else {
    // 恢复页面滚动
    // #ifdef H5
    document.body.style.overflow = ''
    // #endif
  }
})
</script>

<style scoped>
/* 弹窗遮罩 */
.file-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40rpx;
}

/* 弹窗主体 */
.file-info-dialog {
  background-color: white;
  border-radius: 16rpx;
  width: 100%;
  max-width: 600rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

/* 弹窗头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:active {
  background-color: #e0e0e0;
}

.close-icon {
  font-size: 32rpx;
  color: #666;
}

/* 弹窗内容 */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
}

/* 文件预览 */
.file-preview {
  width: 100%;
  height: 300rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-play-icon {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.file-type-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.file-type-large {
  font-size: 48rpx;
  color: #999;
  font-weight: bold;
}

/* 文件详情 */
.file-details {
  space-y: 24rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
  min-width: 160rpx;
  flex-shrink: 0;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

/* 弹窗操作 */
.dialog-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.primary {
  background-color: #007aff;
  color: white;
}

.action-btn.secondary {
  background-color: #f5f5f5;
  color: #666;
}

.action-btn.danger {
  background-color: #ff4d4f;
  color: white;
}

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

/* 多端适配 */
/* H5端 */
/* #ifdef H5 */
.close-btn {
  cursor: pointer;
}

.action-btn {
  cursor: pointer;
}

.action-btn:hover {
  opacity: 0.9;
}
/* #endif */

/* 小程序端 */
/* #ifdef MP */
.file-info-dialog {
  max-height: 70vh;
}
/* #endif */

/* APP端 */
/* #ifdef APP-PLUS */
.file-info-overlay {
  padding: 60rpx 40rpx;
}
/* #endif */
</style>