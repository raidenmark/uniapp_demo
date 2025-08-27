<template>
  <!-- 预览遮罩层 -->
  <view 
    v-if="visible"
    class="preview-mask"
    @tap="handleMaskClick"
    :style="{ zIndex: zIndex }"
  >
    <!-- 主内容区域 -->
    <view class="preview-container" @tap.stop>
      <!-- 顶部工具栏 -->
      <view class="preview-header">
        <view class="file-info">
          <text class="file-name">{{ currentFile?.fileName || currentFile?.originalName || '未知文件' }}</text>
          <text class="file-index">{{ currentIndex + 1 }} / {{ fileList.length }}</text>
        </view>
        <view class="header-actions">
          <view class="action-btn" @tap="handleClose">
            <text class="close-icon">✕</text>
          </view>
        </view>
      </view>
      
      <!-- 预览内容区域 -->
      <view class="preview-content">
        <!-- 图片预览 -->
        <template v-if="currentFile?.fileType === 'image'">
          <view class="image-container">
            <image
              :src="currentFile.fileUrl"
              mode="aspectFit"
              class="preview-image"
              :style="imageStyle"
              @load="handleImageLoad"
              @error="handleImageError"
              @tap="handleImageTap"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"  
              @touchend="handleTouchEnd"
            />
          </view>
        </template>
        
        <!-- 视频预览 -->
        <template v-else-if="currentFile?.fileType === 'video'">
          <view class="video-container">
            <video
              :src="currentFile.fileUrl"
              class="preview-video"
              :controls="true"
              :autoplay="false"
              :poster="currentFile.thumbnail"
              @error="handleVideoError"
            />
          </view>
        </template>
        
        <!-- 其他文件类型 -->
        <template v-else>
          <view class="unsupported-container">
            <text class="unsupported-text">不支持此文件类型的预览</text>
            <text class="file-type">{{ currentFile?.fileType || 'unknown' }}</text>
          </view>
        </template>
      </view>
      
      <!-- 左右切换按钮 -->
      <view v-if="fileList.length > 1" class="nav-buttons">
        <view 
          v-if="currentIndex > 0"
          class="nav-btn nav-prev"
          @tap="handlePrev"
        >
          <text class="nav-icon">‹</text>
        </view>
        <view 
          v-if="currentIndex < fileList.length - 1"
          class="nav-btn nav-next"
          @tap="handleNext"
        >
          <text class="nav-icon">›</text>
        </view>
      </view>
      
      <!-- 缩略图导航（当有多个文件时） -->
      <view v-if="fileList.length > 1 && showThumbnails" class="thumbnail-nav">
        <scroll-view scroll-x class="thumbnail-scroll">
          <view class="thumbnail-list">
            <view 
              v-for="(file, index) in fileList"
              :key="file.id"
              :class="['thumbnail-item', { active: index === currentIndex }]"
              @tap="handleThumbnailClick(index)"
            >
              <image
                :src="file.thumbnail || file.fileUrl"
                mode="aspectFill"
                class="thumbnail-image"
              />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FileRecord } from '@/types/file'

// Props定义
interface Props {
  // 是否显示预览
  visible: boolean
  // 文件列表
  fileList: FileRecord[]
  // 当前文件索引
  currentIndex: number
  // 是否显示缩略图导航
  showThumbnails?: boolean
  // 遮罩层级
  zIndex?: number
  // 是否允许点击遮罩关闭
  maskClosable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  fileList: () => [],
  currentIndex: 0,
  showThumbnails: true,
  zIndex: 9999,
  maskClosable: true
})

// 事件定义
interface Emits {
  (e: 'close'): void
  (e: 'change', index: number): void
  (e: 'load', file: FileRecord): void
  (e: 'error', error: any): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const internalIndex = ref(props.currentIndex)

// 图片缩放相关
const imageTransform = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0
})

// 手势控制相关
const gestureState = reactive({
  lastTapTime: 0,
  doubleTapDelay: 300,
  isZoomed: false,
  minScale: 1,
  maxScale: 3,
  initialDistance: 0,
  initialScale: 1,
  startX: 0,
  startY: 0,
  lastMoveX: 0,
  lastMoveY: 0
})

// 当前文件
const currentFile = computed(() => {
  if (props.fileList && props.fileList.length > internalIndex.value) {
    return props.fileList[internalIndex.value]
  }
  return null
})

// 图片样式
const imageStyle = computed(() => {
  return {
    transform: `scale(${imageTransform.scale}) translate(${imageTransform.translateX}px, ${imageTransform.translateY}px)`,
    transition: 'transform 0.3s ease'
  }
})

// 监听外部索引变化
watch(() => props.currentIndex, (newIndex) => {
  internalIndex.value = newIndex
  resetImageTransform()
})

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible) {
    resetImageTransform()
    preloadAdjacentFiles()
  }
})

// 重置图片变换
const resetImageTransform = () => {
  imageTransform.scale = 1
  imageTransform.translateX = 0
  imageTransform.translateY = 0
}

// 预加载相邻文件
const preloadAdjacentFiles = () => {
  if (!props.fileList || props.fileList.length <= 1) return
  
  // 预加载前一个和后一个文件
  const prevIndex = internalIndex.value - 1
  const nextIndex = internalIndex.value + 1
  
  if (prevIndex >= 0) {
    preloadFile(props.fileList[prevIndex])
  }
  if (nextIndex < props.fileList.length) {
    preloadFile(props.fileList[nextIndex])
  }
}

// 预加载单个文件
const preloadFile = (file: FileRecord) => {
  if (file.fileType === 'image') {
    const img = new Image()
    img.src = file.fileUrl
  }
}

// 处理关闭
const handleClose = () => {
  emit('close')
}

// 处理遮罩点击
const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

// 处理上一个文件
const handlePrev = () => {
  if (internalIndex.value > 0) {
    internalIndex.value--
    emit('change', internalIndex.value)
    preloadAdjacentFiles()
  }
}

// 处理下一个文件
const handleNext = () => {
  if (internalIndex.value < props.fileList.length - 1) {
    internalIndex.value++
    emit('change', internalIndex.value)
    preloadAdjacentFiles()
  }
}

// 处理缩略图点击
const handleThumbnailClick = (index: number) => {
  if (index !== internalIndex.value) {
    internalIndex.value = index
    emit('change', index)
    preloadAdjacentFiles()
  }
}

// 处理图片点击（双击缩放）
const handleImageTap = () => {
  const currentTime = Date.now()
  const timeDiff = currentTime - gestureState.lastTapTime
  
  if (timeDiff < gestureState.doubleTapDelay) {
    // 双击缩放
    handleDoubleClick()
  }
  
  gestureState.lastTapTime = currentTime
}

// 处理双击缩放
const handleDoubleClick = () => {
  if (imageTransform.scale > gestureState.minScale) {
    // 如果已经缩放，则恢复原始大小
    imageTransform.scale = gestureState.minScale
    imageTransform.translateX = 0
    imageTransform.translateY = 0
    gestureState.isZoomed = false
  } else {
    // 放大到2倍
    imageTransform.scale = 2
    imageTransform.translateX = 0
    imageTransform.translateY = 0
    gestureState.isZoomed = true
  }
}

// 处理触摸开始
const handleTouchStart = (e: TouchEvent) => {
  if (!currentFile.value || currentFile.value.fileType !== 'image') return
  
  const touches = e.touches
  if (touches.length === 1) {
    // 单指触摸，准备拖拽
    gestureState.startX = touches[0].clientX
    gestureState.startY = touches[0].clientY
    gestureState.lastMoveX = touches[0].clientX
    gestureState.lastMoveY = touches[0].clientY
  } else if (touches.length === 2) {
    // 双指触摸，准备缩放
    const touch1 = touches[0]
    const touch2 = touches[1]
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    gestureState.initialDistance = distance
    gestureState.initialScale = imageTransform.scale
  }
}

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!currentFile.value || currentFile.value.fileType !== 'image') return
  
  e.preventDefault()
  const touches = e.touches
  
  if (touches.length === 1 && gestureState.isZoomed) {
    // 单指拖拽（仅在缩放状态下）
    const deltaX = touches[0].clientX - gestureState.lastMoveX
    const deltaY = touches[0].clientY - gestureState.lastMoveY
    
    imageTransform.translateX += deltaX
    imageTransform.translateY += deltaY
    
    gestureState.lastMoveX = touches[0].clientX
    gestureState.lastMoveY = touches[0].clientY
  } else if (touches.length === 2) {
    // 双指缩放
    const touch1 = touches[0]
    const touch2 = touches[1]
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    
    if (gestureState.initialDistance > 0) {
      const scale = (distance / gestureState.initialDistance) * gestureState.initialScale
      imageTransform.scale = Math.min(Math.max(scale, gestureState.minScale), gestureState.maxScale)
      
      if (imageTransform.scale > gestureState.minScale) {
        gestureState.isZoomed = true
      } else {
        gestureState.isZoomed = false
        imageTransform.translateX = 0
        imageTransform.translateY = 0
      }
    }
  }
}

// 处理触摸结束
const handleTouchEnd = () => {
  gestureState.initialDistance = 0
  gestureState.initialScale = imageTransform.scale
}

// 处理图片加载完成
const handleImageLoad = (e: any) => {
  loading.value = false
  if (currentFile.value) {
    emit('load', currentFile.value)
  }
}

// 处理图片加载错误
const handleImageError = (e: any) => {
  loading.value = false
  emit('error', e)
  console.error('图片加载失败:', e)
}

// 处理视频错误
const handleVideoError = (e: any) => {
  loading.value = false
  emit('error', e)
  console.error('视频加载失败:', e)
}

// 暴露方法给父组件
defineExpose({
  resetTransform: resetImageTransform,
  preloadFiles: preloadAdjacentFiles
})
</script>

<style scoped>
/* 预览遮罩层 */
.preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
}

/* 主容器 */
.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 顶部工具栏 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 40rpx;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-index {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.close-icon {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

/* 预览内容区域 */
.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 图片容器 */
.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  transform-origin: center;
}

/* 视频容器 */
.video-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

/* 不支持的文件类型 */
.unsupported-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.unsupported-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.file-type {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  text-transform: uppercase;
}

/* 导航按钮 */
.nav-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  pointer-events: none;
}

.nav-btn {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  backdrop-filter: blur(10rpx);
}

.nav-prev {
  left: 40rpx;
}

.nav-next {
  right: 40rpx;
}

.nav-icon {
  color: white;
  font-size: 48rpx;
  font-weight: bold;
}

/* 缩略图导航 */
.thumbnail-nav {
  position: absolute;
  bottom: 40rpx;
  left: 0;
  right: 0;
  height: 120rpx;
}

.thumbnail-scroll {
  height: 100%;
}

.thumbnail-list {
  display: flex;
  padding: 0 40rpx;
  height: 100%;
  align-items: center;
}

.thumbnail-item {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 20rpx;
  border: 4rpx solid transparent;
  transition: all 0.2s ease;
}

.thumbnail-item.active {
  border-color: #007aff;
  transform: scale(1.1);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: white;
  font-size: 28rpx;
}

/* 多端适配 */
/* H5端 */
/* #ifdef H5 */
.action-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.thumbnail-item {
  cursor: pointer;
}
/* #endif */

/* 小程序端 */
/* #ifdef MP */
.nav-btn {
  width: 70rpx;
  height: 70rpx;
}

.nav-icon {
  font-size: 40rpx;
}
/* #endif */

/* APP端 */
/* #ifdef APP-PLUS */
.preview-header {
  padding-top: var(--status-bar-height, 44rpx);
}
/* #endif */
</style>
</template>