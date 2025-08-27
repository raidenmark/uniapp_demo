<template>
  <view class="file-uploader">
    <!-- 文件选择区域 -->
    <view 
      class="select-area"
      :class="{ 'drag-over': isDragOver }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      v-if="isH5"
    >
      <view class="select-buttons">
        <button 
          class="btn btn-image" 
          :disabled="uploading"
          @click="chooseImage"
        >
          选择图片
        </button>
        <button 
          class="btn btn-video" 
          :disabled="uploading"
          @click="chooseVideo"
        >
          选择视频
        </button>
      </view>
      
      <text class="tips">
        支持JPG、PNG、GIF图片和MP4、MOV视频
        <text v-if="maxCount > 1">，最多选择{{ maxCount }}个文件</text>
        <br>
        <text class="drag-tips">或拖拽文件到此区域</text>
      </text>
    </view>
    
    <!-- 非H5版文件选择区域 -->
    <view class="select-area" v-else>
      <view class="select-buttons">
        <button 
          class="btn btn-image" 
          :disabled="uploading"
          @click="chooseImage"
        >
          选择图片
        </button>
        <button 
          class="btn btn-video" 
          :disabled="uploading"
          @click="chooseVideo"
        >
          选择视频
        </button>
      </view>
      
      <text class="tips">
        支持JPG、PNG、GIF图片和MP4、MOV视频
        <text v-if="maxCount > 1">，最多选择{{ maxCount }}个文件</text>
      </text>
    </view>
    
    <!-- 文件预览区域 -->
    <view v-if="selectedFiles.length > 0" class="preview-area">
      <scroll-view class="file-list" scroll-x>
        <view 
          class="file-item" 
          v-for="(file, index) in selectedFiles" 
          :key="file.id"
        >
          <!-- 图片预览 -->
          <view v-if="file.type === 'image'" class="image-preview">
            <image 
              :src="file.path" 
              mode="aspectFill"
              class="preview-image"
              @click="previewImage(file.path)"
            />
            <view class="file-info">
              <text class="file-name">{{ file.name }}</text>
              <text class="file-size">{{ formatFileSize(file.size) }}</text>
            </view>
          </view>
          
          <!-- 视频预览 -->
          <view v-if="file.type === 'video'" class="video-preview">
            <video 
              :src="file.path"
              :poster="file.poster"
              class="preview-video"
              controls
            />
            <view class="file-info">
              <text class="file-name">{{ file.name }}</text>
              <text class="file-size">{{ formatFileSize(file.size) }}</text>
              <text class="duration">{{ formatDuration(file.duration) }}</text>
            </view>
          </view>
          
          <!-- 上传进度 -->
          <view v-if="file.uploading" class="upload-progress">
            <view class="progress-bar">
              <view 
                class="progress-fill" 
                :style="{ width: file.progress + '%' }"
              ></view>
            </view>
            <text class="progress-text">{{ file.progress }}%</text>
          </view>
          
          <!-- 操作按钮 -->
          <view class="file-actions">
            <!-- 取消上传按钮 - subtask 5.5要求 -->
            <view 
              v-if="file.uploading"
              class="action-btn cancel-btn" 
              @click="cancelUpload(file.id)"
            >
              取消
            </view>
            <!-- 重试按钮 - subtask 5.5要求 -->
            <view 
              v-else-if="file.error"
              class="action-btn retry-btn" 
              @click="retryUpload(file.id)"
            >
              重试
            </view>
            <!-- 删除按钮 -->
            <view 
              v-else
              class="action-btn delete-btn" 
              @click="removeFile(index)"
            >
              删除
            </view>
          </view>
          
          <!-- 状态标识 -->
          <view class="status-badge">
            <text v-if="file.uploading" class="status uploading">上传中</text>
            <text v-else-if="file.uploaded" class="status success">已上传</text>
            <text v-else-if="file.error" class="status error">失败</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 上传按钮 -->
    <view v-if="selectedFiles.length > 0" class="upload-area">
      <button 
        class="upload-btn"
        :disabled="uploading || allUploaded"
        :class="{ uploading, disabled: allUploaded }"
        @click="startUpload"
      >
        <text v-if="uploading">上传中...</text>
        <text v-else-if="allUploaded">全部已上传</text>
        <text v-else>开始上传 ({{ notUploadedCount }}个文件)</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FileUploadParams } from '@/types/file'
import { useFileStore } from '@/store/file'
import { formatFileSize, getFileType, generateId } from '@/utils/file'
import { formatDateTime } from '@/utils/common'
import { getCurrentPlatform, isH5 } from '@/utils/platform'
import fileApi from '@/api/file'

// Props
interface Props {
  maxCount?: number // 最大文件数量
  maxSize?: number // 最大文件大小(MB)
  accept?: string[] // 接受的文件类型
  autoUpload?: boolean // 是否自动上传
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 6,
  maxSize: 100,
  accept: () => ['image', 'video'],
  autoUpload: false
})

// Emits
interface Emits {
  uploadSuccess: [files: any[]]
  uploadError: [error: string]
  fileChange: [files: any[]]
}

const emit = defineEmits<Emits>()

// 文件接口
interface SelectedFile {
  id: string
  name: string
  path: string
  type: 'image' | 'video'
  size: number
  duration?: number
  poster?: string
  uploading: boolean
  uploaded: boolean
  progress: number
  error: string | null
}

// Store
const fileStore = useFileStore()

// 响应式数据
const selectedFiles = ref<SelectedFile[]>([])
const uploading = ref(false)
const isDragOver = ref(false)
const isH5 = ref(false)
const uploadTasks = ref<Map<string, any>>(new Map()) // 上传任务管理

// 计算属性
const allUploaded = computed(() => 
  selectedFiles.value.length > 0 && selectedFiles.value.every(f => f.uploaded)
)

const notUploadedCount = computed(() => 
  selectedFiles.value.filter(f => !f.uploaded).length
)

// 方法

/**
 * 选择图片
 */
function chooseImage() {
  if (selectedFiles.value.length >= props.maxCount) {
    uni.showToast({
      title: `最多只能选择${props.maxCount}个文件`,
      icon: 'none'
    })
    return
  }
  
  const remainCount = props.maxCount - selectedFiles.value.length
  
  uni.chooseImage({
    count: Math.min(remainCount, 9),
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach((path, index) => {
        const tempFile = res.tempFiles?.[index]
        if (tempFile) {
          const file: SelectedFile = {
            id: generateId(),
            name: `image_${Date.now()}_${index}.jpg`,
            path,
            type: 'image',
            size: tempFile.size,
            uploading: false,
            uploaded: false,
            progress: 0,
            error: null
          }
          
          // 检查文件大小
          if (file.size > props.maxSize * 1024 * 1024) {
            uni.showToast({
              title: `文件大小不能超过${props.maxSize}MB`,
              icon: 'none'
            })
            return
          }
          
          selectedFiles.value.push(file)
        }
      })
      
      emit('fileChange', selectedFiles.value)
      
      if (props.autoUpload) {
        startUpload()
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 选择视频
 */
function chooseVideo() {
  if (selectedFiles.value.length >= props.maxCount) {
    uni.showToast({
      title: `最多只能选择${props.maxCount}个文件`,
      icon: 'none'
    })
    return
  }
  
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60, // 最长60秒
    success: (res) => {
      const file: SelectedFile = {
        id: generateId(),
        name: `video_${Date.now()}.mp4`,
        path: res.tempFilePath,
        type: 'video',
        size: res.size,
        duration: res.duration,
        uploading: false,
        uploaded: false,
        progress: 0,
        error: null
      }
      
      // 检查文件大小
      if (file.size > props.maxSize * 1024 * 1024) {
        uni.showToast({
          title: `文件大小不能超过${props.maxSize}MB`,
          icon: 'none'
        })
        return
      }
      
      selectedFiles.value.push(file)
      emit('fileChange', selectedFiles.value)
      
      if (props.autoUpload) {
        startUpload()
      }
    },
    fail: (err) => {
      console.error('选择视频失败:', err)
      uni.showToast({
        title: '选择视频失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 移除文件
 */
function removeFile(index: number) {
  const file = selectedFiles.value[index]
  if (file.uploading) {
    uni.showToast({
      title: '正在上传中，无法删除',
      icon: 'none'
    })
    return
  }
  
  selectedFiles.value.splice(index, 1)
  emit('fileChange', selectedFiles.value)
}

/**
 * 开始上传
 */
async function startUpload() {
  const filesToUpload = selectedFiles.value.filter(f => !f.uploaded && !f.uploading)
  if (filesToUpload.length === 0) return
  
  uploading.value = true
  const uploadedFiles: any[] = []
  
  try {
    for (const file of filesToUpload) {
      file.uploading = true
      file.progress = 0
      file.error = null
      
      try {
        const uploadParams: FileUploadParams = {
          filePath: file.path,
          fileType: getFileType(file.name),
          fileName: file.name
        }
        
        // 监听上传进度
        const progressHandler = (event: any) => {
          file.progress = event.progress
        }
        uni.$on('upload-progress', progressHandler)
        
        const result = await fileStore.uploadFile(uploadParams)
        
        uni.$off('upload-progress', progressHandler)
        
        file.uploaded = true
        file.uploading = false
        file.progress = 100
        uploadedFiles.push(result)
        
      } catch (error: any) {
        file.uploading = false
        file.error = error.message || '上传失败'
        file.progress = 0
      }
    }
    
    if (uploadedFiles.length > 0) {
      emit('uploadSuccess', uploadedFiles)
    }
    
    if (uploadedFiles.length < filesToUpload.length) {
      const failedCount = filesToUpload.length - uploadedFiles.length
      emit('uploadError', `${failedCount}个文件上传失败`)
    }
    
  } finally {
    uploading.value = false
  }
}

/**
 * 预览图片
 */
function previewImage(current: string) {
  const urls = selectedFiles.value
    .filter(f => f.type === 'image')
    .map(f => f.path)
  
  uni.previewImage({
    current,
    urls
  })
}

/**
 * 格式化时长
 */
function formatDuration(duration?: number): string {
  if (!duration) return ''
  
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 处理H5拖拽上传 - subtask 5.6要求
 */
function handleDrop(event: DragEvent) {
  isDragOver.value = false
  
  if (!event.dataTransfer?.files) return
  
  const files = Array.from(event.dataTransfer.files)
  
  if (selectedFiles.value.length + files.length > props.maxCount) {
    uni.showToast({
      title: `最多只能选择${props.maxCount}个文件`,
      icon: 'none'
    })
    return
  }
  
  files.forEach((file) => {
    // 检查文件类型
    const fileType = getFileType(file.name)
    if (!props.accept.includes(fileType)) {
      uni.showToast({
        title: `不支持的文件类型: ${file.name}`,
        icon: 'none'
      })
      return
    }
    
    // 检查文件大小
    if (file.size > props.maxSize * 1024 * 1024) {
      uni.showToast({
        title: `文件大小不能超过${props.maxSize}MB`,
        icon: 'none'
      })
      return
    }
    
    // 创建文件对象URL用于预览
    const fileUrl = URL.createObjectURL(file)
    
    const selectedFile: SelectedFile = {
      id: generateId(),
      name: file.name,
      path: fileUrl,
      type: fileType as 'image' | 'video',
      size: file.size,
      uploading: false,
      uploaded: false,
      progress: 0,
      error: null
    }
    
    selectedFiles.value.push(selectedFile)
  })
  
  emit('fileChange', selectedFiles.value)
  
  if (props.autoUpload) {
    startUpload()
  }
}

/**
 * 取消上传 - subtask 5.5要求
 */
function cancelUpload(fileId: string) {
  const task = uploadTasks.value.get(fileId)
  if (task) {
    task.abort()
    uploadTasks.value.delete(fileId)
  }
  
  const file = selectedFiles.value.find(f => f.id === fileId)
  if (file) {
    file.uploading = false
    file.progress = 0
    file.error = '已取消上传'
  }
}

/**
 * 重试上传 - subtask 5.5要求
 */
async function retryUpload(fileId: string) {
  const file = selectedFiles.value.find(f => f.id === fileId)
  if (!file || file.uploaded) return
  
  file.error = null
  file.progress = 0
  
  try {
    await uploadSingleFile(file)
  } catch (error: any) {
    file.error = error.message || '重试失败'
  }
}

/**
 * 单个文件上传
 */
async function uploadSingleFile(file: SelectedFile): Promise<void> {
  file.uploading = true
  file.progress = 0
  file.error = null
  
  try {
    const uploadParams: FileUploadParams = {
      filePath: file.path,
      fileType: getFileType(file.name),
      fileName: file.name
    }
    
    // 使用云存储API
    const cloudResult = await fileApi.uploadToCloud({
      filePath: file.path,
      fileName: file.name,
      onProgress: (progress) => {
        file.progress = progress.progress
      }
    })
    
    if (cloudResult.code === 0) {
      // 保存文件记录到数据库
      const result = await fileStore.uploadFile(uploadParams)
      
      file.uploaded = true
      file.uploading = false
      file.progress = 100
      
      return result
    } else {
      throw new Error(cloudResult.message)
    }
    
  } catch (error: any) {
    file.uploading = false
    file.error = error.message || '上传失败'
    file.progress = 0
    throw error
  }
}

// 生命周期
onMounted(() => {
  // 清理可能存在的事件监听
  uni.$off('upload-progress')
  
  // 初始化平台检测 - subtask 5.6要求
  isH5.value = isH5()
})
</script>

<style scoped>
.file-uploader {
  padding: 20px;
}

.select-area {
  text-align: center;
  margin-bottom: 20px;
  border: 2px dashed #CCCCCC;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.select-area.drag-over {
  border-color: #2979FF;
  background-color: rgba(41, 121, 255, 0.1);
}

.drag-tips {
  color: #2979FF;
  font-size: 12px;
}

.select-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-image {
  background-color: #2979FF;
  color: white;
}

.btn-image:hover {
  background-color: #1976D2;
}

.btn-video {
  background-color: #FF6B6B;
  color: white;
}

.btn-video:hover {
  background-color: #E63946;
}

.btn[disabled] {
  background-color: #CCCCCC;
  cursor: not-allowed;
}

.tips {
  font-size: 14px;
  color: #666666;
  line-height: 1.4;
}

.preview-area {
  margin-bottom: 20px;
}

.file-list {
  white-space: nowrap;
}

.file-item {
  display: inline-block;
  width: 200px;
  margin-right: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  position: relative;
  vertical-align: top;
}

.image-preview, .video-preview {
  position: relative;
}

.preview-image, .preview-video {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
}

.file-info {
  padding: 10px;
}

.file-name {
  font-size: 12px;
  color: #333;
  display: block;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size, .duration {
  font-size: 11px;
  color: #999;
  display: block;
}

.upload-progress {
  position: absolute;
  bottom: 30px;
  left: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  padding: 6px;
  border-radius: 4px;
}

.progress-bar {
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: #2979FF;
  transition: width 0.3s;
}

.progress-text {
  font-size: 10px;
  color: white;
  text-align: center;
  display: block;
}

.file-actions {
  position: absolute;
  top: 5px;
  right: 5px;
}

.action-btn {
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: #FF4757;
}

.cancel-btn {
  background: #FF6B6B;
}

.cancel-btn:hover {
  background: #E63946;
}

.retry-btn {
  background: #FFA726;
}

.retry-btn:hover {
  background: #FB8C00;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge {
  position: absolute;
  top: 5px;
  left: 5px;
}

.status {
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.status.uploading {
  background: #2979FF;
}

.status.success {
  background: #27AE60;
}

.status.error {
  background: #E74C3C;
}

.upload-area {
  text-align: center;
}

.upload-btn {
  background: #27AE60;
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.upload-btn.uploading {
  background: #3498DB;
}

.upload-btn.disabled {
  background: #95A5A6;
  cursor: not-allowed;
}

.upload-btn:not(.disabled):not(.uploading):hover {
  background: #229954;
}
</style>