<template>
  <!-- 加载状态 -->
  <view v-if="loading" class="loading-container">
    <text class="loading-text">加载中...</text>
  </view>
  
  <!-- 错误状态 -->
  <view v-else-if="error" class="error-container">
    <text class="error-text">{{ error }}</text>
    <button @click="loadFiles" class="retry-btn">重新加载</button>
  </view>
  
  <!-- 文件列表内容 -->
  <view v-else class="file-list-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view 
        v-for="type in filterTypes" 
        :key="type.value"
        :class="['filter-item', { active: currentFilter === type.value }]"
        @click="handleFilterChange(type.value)"
      >
        {{ type.label }}
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="filteredFileList.length === 0" class="empty-container">
      <text class="empty-text">{{ currentFilter === 'all' ? '暂无文件' : `暂无${filterTypes.find(t => t.value === currentFilter)?.label}文件` }}</text>
    </view>
    
    <!-- 选择模式操作栏 -->
    <view v-if="selectionMode" class="selection-toolbar">
      <view class="selection-info">
        <text class="selection-count">已选择 {{ selectedFiles.size }} 个文件</text>
      </view>
      <view class="selection-actions">
        <button @click="handleSelectAll" class="select-all-btn">
          {{ selectedFiles.size === filteredFileList.length ? '取消全选' : '全选' }}
        </button>
        <button @click="handleBatchDelete" class="batch-delete-btn" :disabled="selectedFiles.size === 0">
          删除
        </button>
        <button @click="exitSelectionMode" class="cancel-btn">
          取消
        </button>
      </view>
    </view>

    <!-- 文件网格 -->
    <view v-else class="file-grid">
      <view 
        v-for="file in filteredFileList" 
        :key="file.id"
        :class="['file-item', { selected: selectedFiles.has(file.id) }]"
        @click="handleFileClick(file)"
        @longpress="handleLongPress(file)"
        @touchstart="handleTouchStart(file)"
        @touchend="handleTouchEnd"
      >
        <!-- 选择标识 -->
        <view v-if="selectionMode" class="selection-indicator" @click.stop="toggleFileSelection(file)">
          <view :class="['checkbox', { checked: selectedFiles.has(file.id) }]">
            <text v-if="selectedFiles.has(file.id)" class="check-icon">✓</text>
          </view>
        </view>

        <!-- 文件缩略图 -->
        <view class="file-thumbnail">
          <image 
            v-if="file.fileType === 'image'"
            :src="file.thumbnail || file.fileUrl"
            mode="aspectFill"
            class="thumbnail-image"
            @error="handleImageError"
          />
          <view 
            v-else-if="file.fileType === 'video'"
            class="video-thumbnail"
          >
            <image 
              :src="file.thumbnail || '/static/video-placeholder.png'"
              mode="aspectFill"
              class="thumbnail-image"
            />
            <view class="video-play-icon">▶</view>
          </view>
          <view v-else class="file-placeholder">
            <text class="file-type-text">{{ file.fileType.toUpperCase() }}</text>
          </view>
        </view>
        
        <!-- 文件信息 -->
        <view class="file-info">
          <text class="file-name">{{ file.fileName || file.originalName || '未知文件' }}</text>
          <text class="file-time">{{ formatTime(file.uploadTime) }}</text>
        </view>

        <!-- 操作按钮 -->
        <view v-if="!selectionMode" class="file-actions">
          <view class="action-btn" @click.stop="handleFileInfo(file)">
            <text class="action-icon">ℹ️</text>
          </view>
          <view 
            :class="['action-btn', 'delete-btn', { disabled: deletingFiles.has(file.id) }]" 
            @click.stop="handleFileDelete(file)"
          >
            <text v-if="deletingFiles.has(file.id)" class="action-icon loading">⏳</text>
            <text v-else class="action-icon">🗑️</text>
          </view>
        </view>

        <!-- 删除中遮罩 -->
        <view v-if="deletingFiles.has(file.id)" class="deleting-overlay">
          <view class="deleting-spinner">
            <text class="spinner-text">删除中...</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 分页/加载更多 -->
    <view v-if="hasMore" class="load-more">
      <button 
        @click="loadMoreFiles" 
        :disabled="loadingMore"
        class="load-more-btn"
      >
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, readonly } from 'vue'
import type { FileRecord, FileType } from '@/types/file'

// Props定义
interface Props {
  // 外部传入的文件列表
  files?: FileRecord[]
  // 是否显示筛选功能
  showFilter?: boolean
  // 每页显示数量
  pageSize?: number
  // 是否启用分页
  enablePagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  files: () => [],
  showFilter: true,
  pageSize: 12,
  enablePagination: true
})

// 事件定义
interface Emits {
  (e: 'file-click', file: FileRecord): void
  (e: 'file-delete', file: FileRecord): void
  (e: 'file-info', file: FileRecord): void
  (e: 'filter-change', filterType: string): void
  (e: 'load-more'): void
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const fileList = ref<FileRecord[]>([])
const currentFilter = ref<string>('all')
const currentPage = ref(1)
const hasMore = ref(true)
const selectedFiles = ref<Set<string>>(new Set()) // 选中的文件ID集合
const selectionMode = ref(false) // 是否处于选择模式
const longPressTimer = ref<number | null>(null) // 长按计时器
const deletingFiles = ref<Set<string>>(new Set()) // 正在删除的文件ID集合

// 筛选类型配置
const filterTypes = [
  { label: '全部', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '其他', value: 'other' }
]

// 初始化组件
onMounted(() => {
  if (props.files && props.files.length > 0) {
    fileList.value = props.files
  } else {
    loadFiles()
  }
})

// 计算过滤后的文件列表
const filteredFileList = computed(() => {
  if (currentFilter.value === 'all') {
    return props.files || []
  } else if (currentFilter.value === 'image') {
    return (props.files || []).filter(file => file.fileType === 'image')
  } else if (currentFilter.value === 'video') {
    return (props.files || []).filter(file => file.fileType === 'video')
  } else if (currentFilter.value === 'other') {
    return (props.files || []).filter(file => file.fileType !== 'image' && file.fileType !== 'video')
  }
  return props.files || []
})

// 监听外部文件列表变化
watch(() => props.files, (newFiles) => {
  if (newFiles) {
    fileList.value = newFiles
  }
}, { deep: true })

// 加载文件列表
const loadFiles = async () => {
  try {
    loading.value = true
    error.value = ''
    // TODO: 调用API加载文件列表
    // const files = await FileAPI.getFiles({
    //   fileType: currentFilter.value === 'all' ? undefined : currentFilter.value as FileType,
    //   page: 1,
    //   pageSize: props.pageSize
    // })
    // fileList.value = files
    
    // 临时模拟数据
    setTimeout(() => {
      loading.value = false
    }, 500)
  } catch (err: any) {
    error.value = err.message || '加载失败'
    loading.value = false
  }
}

// 加载更多文件
const loadMoreFiles = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  try {
    loadingMore.value = true
    currentPage.value += 1
    
    // TODO: 调用API加载更多文件
    // const moreFiles = await FileAPI.getFiles({
    //   fileType: currentFilter.value === 'all' ? undefined : currentFilter.value as FileType,
    //   page: currentPage.value,
    //   pageSize: props.pageSize
    // })
    // fileList.value.push(...moreFiles)
    
    // 临时处理
    setTimeout(() => {
      loadingMore.value = false
      // 模拟没有更多数据
      if (currentPage.value >= 3) {
        hasMore.value = false
      }
    }, 500)
  } catch (err: any) {
    error.value = err.message || '加载更多失败'
    loadingMore.value = false
    currentPage.value -= 1
  }
}

// 处理筛选变化
const handleFilterChange = (filterType: string) => {
  if (currentFilter.value === filterType) return
  
  console.log('🔍 筛选类型变更:', filterType)
  currentFilter.value = filterType
  currentPage.value = 1
  hasMore.value = true
  
  // 清除选择状态
  selectedFiles.value.clear()
  selectionMode.value = false
  
  emit('filter-change', filterType)
  
  // 如果是外部传入的文件列表，不需要重新加载
  if (!props.files || props.files.length === 0) {
    loadFiles()
  }
}

// 处理文件点击
const handleFileClick = (file: FileRecord) => {
  if (selectionMode.value) {
    toggleFileSelection(file)
  } else {
    emit('file-click', file)
  }
}

// 处理长按进入选择模式
const handleLongPress = (file: FileRecord) => {
  if (!selectionMode.value) {
    selectionMode.value = true
    selectedFiles.value.add(file.id)
    uni.vibrateShort() // 触发震动反馈
  }
}

// 处理触摸开始（用于长按计时）
const handleTouchStart = (file: FileRecord) => {
  // 为不同平台提供长按支持
  // #ifdef H5
  longPressTimer.value = window.setTimeout(() => {
    handleLongPress(file)
  }, 500) // 500ms长按
  // #endif
}

// 处理触摸结束
const handleTouchEnd = () => {
  // #ifdef H5
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  // #endif
}

// 切换文件选择状态
const toggleFileSelection = (file: FileRecord) => {
  if (selectedFiles.value.has(file.id)) {
    selectedFiles.value.delete(file.id)
  } else {
    selectedFiles.value.add(file.id)
  }
}

// 全选/取消全选
const handleSelectAll = () => {
  if (selectedFiles.value.size === filteredFileList.value.length) {
    // 取消全选
    selectedFiles.value.clear()
  } else {
    // 全选
    filteredFileList.value.forEach(file => {
      selectedFiles.value.add(file.id)
    })
  }
}

// 退出选择模式
const exitSelectionMode = () => {
  selectionMode.value = false
  selectedFiles.value.clear()
}

// 处理单个文件删除
const handleFileDelete = (file: FileRecord) => {
  // 如果正在删除中，忽略点击
  if (deletingFiles.value.has(file.id)) {
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除文件"${file.fileName || file.originalName}"吗？删除后无法恢复。`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        // 设置删除状态
        deletingFiles.value.add(file.id)
        // 发射删除事件
        emit('file-delete', file)
      }
    }
  })
}

// 删除完成后调用（由父组件调用）
const onFileDeleted = (fileId: string) => {
  deletingFiles.value.delete(fileId)
  // 从文件列表中移除
  const index = fileList.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
  // 从选中列表中移除
  selectedFiles.value.delete(fileId)
}

// 删除失败后调用（由父组件调用）
const onFileDeleteFailed = (fileId: string, error: string) => {
  deletingFiles.value.delete(fileId)
  uni.showToast({
    title: error || '删除失败',
    icon: 'error'
  })
}

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedFiles.value.size === 0) return
  
  const selectedFilesList = fileList.value.filter(file => selectedFiles.value.has(file.id))
  const fileNames = selectedFilesList.map(f => f.fileName || f.originalName).slice(0, 3).join('、')
  const displayText = selectedFiles.value.size > 3 
    ? `${fileNames}等${selectedFiles.value.size}个文件` 
    : fileNames
  
  uni.showModal({
    title: '确认批量删除',
    content: `确定要删除${displayText}吗？删除后无法恢复。`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        // 设置所有选中文件为删除中状态
        selectedFilesList.forEach(file => {
          deletingFiles.value.add(file.id)
        })
        
        // 发射批量删除事件
        selectedFilesList.forEach(file => {
          emit('file-delete', file)
        })
        exitSelectionMode()
      }
    }
  })
}

// 处理文件信息查看
const handleFileInfo = (file: FileRecord) => {
  emit('file-info', file)
}

// 处理图片加载错误
const handleImageError = (e: any) => {
  console.warn('图片加载失败:', e)
}

// 格式化时间
const formatTime = (timeString: string): string => {
  try {
    const date = new Date(timeString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString()
    }
  } catch (error) {
    return timeString
  }
}

// 暴露方法给父组件
defineExpose({
  loadFiles,
  loadMoreFiles,
  exitSelectionMode,
  enterSelectionMode: (fileId?: string) => {
    selectionMode.value = true
    if (fileId) {
      selectedFiles.value.add(fileId)
    }
  },
  getSelectedFiles: () => Array.from(selectedFiles.value),
  selectionMode: readonly(selectionMode),
  onFileDeleted,
  onFileDeleteFailed
})
</script>

<style scoped>
/* 容器样式 */
.file-list-container {
  width: 100%;
  padding: 20rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 20rpx;
}

.loading-text,
.error-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.retry-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  background-color: white;
  border-radius: 12rpx;
  padding: 8rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 8rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.filter-item.active {
  background-color: #007aff;
  color: white;
}

/* 空状态 */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 选择模式工具栏 */
.selection-toolbar {
  background-color: white;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-info .selection-count {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.selection-actions {
  display: flex;
  gap: 12rpx;
}

.select-all-btn,
.batch-delete-btn,
.cancel-btn {
  padding: 12rpx 20rpx;
  font-size: 26rpx;
  border-radius: 8rpx;
  border: none;
}

.select-all-btn {
  background-color: #007aff;
  color: white;
}

.batch-delete-btn {
  background-color: #ff4d4f;
  color: white;
}

.batch-delete-btn:disabled {
  background-color: #ccc;
  color: #999;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

/* 文件网格 */
.file-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.file-item {
  position: relative;
  background-color: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.file-item:active {
  transform: scale(0.98);
}

.file-item.selected {
  border: 3rpx solid #007aff;
  box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.2);
}

/* 选择指示器 */
.selection-indicator {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  z-index: 10;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background-color: #007aff;
  border-color: #007aff;
}

.check-icon {
  color: white;
  font-size: 24rpx;
  font-weight: bold;
}

/* 文件操作按钮 */
.file-actions {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  display: flex;
  gap: 8rpx;
  z-index: 5;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.9);
}

.delete-btn {
  background-color: rgba(255, 77, 79, 0.9);
}

.delete-btn.disabled {
  background-color: rgba(204, 204, 204, 0.9);
  pointer-events: none;
}

.action-icon {
  font-size: 28rpx;
}

.loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 删除中遮罩 */
.deleting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  z-index: 20;
}

.deleting-spinner {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-text {
  font-size: 24rpx;
  color: #666;
}

/* 文件缩略图 */
.file-thumbnail {
  position: relative;
  width: 100%;
  height: 200rpx;
  background-color: #f5f5f5;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.file-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e9ecef;
}

.file-type-text {
  font-size: 24rpx;
  color: #666;
  font-weight: bold;
}

/* 文件信息 */
.file-info {
  padding: 20rpx;
}

.file-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-time {
  font-size: 24rpx;
  color: #999;
}

/* 加载更多 */
.load-more {
  padding: 40rpx 20rpx;
  text-align: center;
}

.load-more-btn {
  background-color: #f8f9fa;
  color: #666;
  border: 2rpx solid #dee2e6;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.load-more-btn:disabled {
  opacity: 0.5;
}

/* 响应式设计 - 多端适配 */
/* 手机端默认 2 列 */
.file-grid {
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

/* 平板端 3 列 */
@media (min-width: 768rpx) {
  .file-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
  }
}

/* PC端 4 列 */
@media (min-width: 1024rpx) {
  .file-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 28rpx;
  }
  
  .file-list-container {
    padding: 40rpx;
  }
  
  .file-item:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  }
}

/* 小程序端适配 */
/* #ifdef MP */
.file-item {
  border-radius: 8rpx; /* 小程序圆角较小 */
}

.filter-item {
  font-size: 26rpx; /* 小程序字体稍小 */
}
/* #endif */

/* H5端适配 */
/* #ifdef H5 */
.file-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background-color: #e9ecef;
}
/* #endif */

/* APP端适配 */
/* #ifdef APP-PLUS */
.file-thumbnail {
  /* APP端缩略图稍大 */
  height: 220rpx;
}
/* #endif */
</style>