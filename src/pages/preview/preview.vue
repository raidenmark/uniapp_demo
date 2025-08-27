<template>
  <view class="preview-page">
    <!-- 文件预览组件 -->
    <FilePreview
      :visible="true"
      :file-list="fileList"
      :current-index="currentIndex"
      :show-thumbnails="fileList.length > 1"
      @close="handleClose"
      @change="handlePreviewChange"
      @load="handleFileLoad"
      @error="handleFileError"
    />
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 错误状态 -->
    <view v-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button @click="handleRetry" class="retry-btn">重新加载</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import FilePreview from '@/components/FilePreview.vue'
import type { FileRecord } from '@/types/file'

// 页面标题
uni.setNavigationBarTitle({
  title: '文件预览'
})

// 响应式数据
const fileList = ref<FileRecord[]>([])
const currentIndex = ref(0)
const loading = ref(false)
const error = ref('')

// 路由参数
const routeParams = ref({
  fileId: '',
  fileList: '',
  index: '0'
})

// 页面加载时获取路由参数
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  routeParams.value = {
    fileId: options.fileId || '',
    fileList: options.fileList || '',
    index: options.index || '0'
  }
  
  console.log('预览页面路由参数:', routeParams.value)
  
  // 根据参数加载文件数据
  loadFileData()
})

// 加载文件数据
const loadFileData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (routeParams.value.fileList) {
      // 从路由参数解析文件列表
      try {
        const decodedFileList = decodeURIComponent(routeParams.value.fileList)
        fileList.value = JSON.parse(decodedFileList)
        currentIndex.value = parseInt(routeParams.value.index) || 0
      } catch (parseError) {
        console.error('解析文件列表失败:', parseError)
        throw new Error('文件列表数据格式错误')
      }
    } else if (routeParams.value.fileId) {
      // 根据文件ID获取单个文件信息
      await loadFileById(routeParams.value.fileId)
    } else {
      // 没有足够的参数，生成示例数据
      fileList.value = generateSampleFiles()
      currentIndex.value = 0
    }
    
    loading.value = false
  } catch (err: any) {
    console.error('加载文件数据失败:', err)
    error.value = err.message || '加载失败'
    loading.value = false
  }
}

// 根据文件ID加载文件
const loadFileById = async (fileId: string) => {
  // TODO: 调用API获取文件信息
  // const file = await FileAPI.getFileById(fileId)
  // const allFiles = await FileAPI.getFiles()
  // fileList.value = allFiles
  // currentIndex.value = allFiles.findIndex(f => f.id === fileId)
  
  // 临时模拟数据
  const sampleFiles = generateSampleFiles()
  const targetFile = sampleFiles.find(f => f.id === fileId)
  
  if (targetFile) {
    fileList.value = sampleFiles
    currentIndex.value = sampleFiles.findIndex(f => f.id === fileId)
  } else {
    throw new Error('文件不存在')
  }
}

// 生成示例文件数据
const generateSampleFiles = (): FileRecord[] => {
  return [
    {
      id: 'sample_1',
      fileName: '示例图片1.jpg',
      originalName: 'sample_image_1.jpg',
      fileType: 'image',
      fileUrl: 'https://picsum.photos/800/600?random=1',
      fileSize: 524288,
      uploadTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      userId: 'demo_user_001',
      platform: 'H5',
      status: 1,
      thumbnail: 'https://picsum.photos/200/150?random=1'
    },
    {
      id: 'sample_2',
      fileName: '示例视频.mp4',
      originalName: 'sample_video.mp4',
      fileType: 'video',
      fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: 5242880,
      uploadTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      userId: 'demo_user_001',
      platform: 'H5',
      status: 1,
      thumbnail: 'https://picsum.photos/200/150?random=2'
    },
    {
      id: 'sample_3',
      fileName: '示例图片2.png',
      originalName: 'sample_image_2.png',
      fileType: 'image',
      fileUrl: 'https://picsum.photos/600/800?random=3',
      fileSize: 1048576,
      uploadTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      userId: 'demo_user_001',
      platform: 'H5',
      status: 1,
      thumbnail: 'https://picsum.photos/200/150?random=3'
    }
  ]
}

// 关闭预览
const handleClose = () => {
  uni.navigateBack({
    fail: () => {
      // 如果没有上一页，跳转到首页
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  })
}

// 预览切换
const handlePreviewChange = (index: number) => {
  currentIndex.value = index
  
  // 更新页面URL参数（可选）
  const currentFile = fileList.value[index]
  if (currentFile) {
    uni.setNavigationBarTitle({
      title: currentFile.fileName || '文件预览'
    })
  }
}

// 文件加载成功
const handleFileLoad = (file: FileRecord) => {
  console.log('文件加载成功:', file.fileName)
}

// 文件加载错误
const handleFileError = (error: any) => {
  console.error('文件加载错误:', error)
  uni.showToast({
    title: '文件加载失败',
    icon: 'error'
  })
}

// 重试加载
const handleRetry = () => {
  loadFileData()
}

// 监听页面参数变化（用于处理页面传参更新）
const handlePageUpdate = (newParams: any) => {
  routeParams.value = { ...routeParams.value, ...newParams }
  loadFileData()
}

// 分享文件（可选功能）
const handleShareFile = () => {
  const currentFile = fileList.value[currentIndex.value]
  if (!currentFile) return
  
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
  // #endif
  
  // #ifdef H5
  if (navigator.share) {
    navigator.share({
      title: currentFile.fileName,
      text: '查看我分享的文件',
      url: window.location.href
    }).catch(console.error)
  } else {
    // 复制链接到剪贴板
    // TODO: 实现复制功能
    uni.showToast({
      title: '链接已复制',
      icon: 'success'
    })
  }
  // #endif
}

// 下载文件（可选功能）
const handleDownloadFile = () => {
  const currentFile = fileList.value[currentIndex.value]
  if (!currentFile) return
  
  // #ifdef H5
  const link = document.createElement('a')
  link.href = currentFile.fileUrl
  link.download = currentFile.fileName
  link.click()
  // #endif
  
  // #ifdef APP-PLUS
  uni.downloadFile({
    url: currentFile.fileUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: () => {
            uni.showToast({
              title: '保存成功',
              icon: 'success'
            })
          },
          fail: () => {
            uni.showToast({
              title: '保存失败',
              icon: 'error'
            })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '下载失败',
        icon: 'error'
      })
    }
  })
  // #endif
  
  // #ifdef MP
  uni.showToast({
    title: '小程序暂不支持下载',
    icon: 'none'
  })
  // #endif
}

// 键盘事件监听（H5端）
// #ifdef H5
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  } else if (e.key === 'ArrowLeft') {
    if (currentIndex.value > 0) {
      handlePreviewChange(currentIndex.value - 1)
    }
  } else if (e.key === 'ArrowRight') {
    if (currentIndex.value < fileList.value.length - 1) {
      handlePreviewChange(currentIndex.value + 1)
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
// #endif

// 页面分享（小程序端）
// #ifdef MP-WEIXIN
onShareAppMessage(() => {
  const currentFile = fileList.value[currentIndex.value]
  return {
    title: currentFile?.fileName || '文件预览',
    path: `/pages/preview/preview?fileId=${currentFile?.id || ''}&index=${currentIndex.value}`,
    imageUrl: currentFile?.thumbnail
  }
})

onShareTimeline(() => {
  const currentFile = fileList.value[currentIndex.value]
  return {
    title: currentFile?.fileName || '文件预览',
    query: `fileId=${currentFile?.id || ''}&index=${currentIndex.value}`,
    imageUrl: currentFile?.thumbnail
  }
})
// #endif

// 暴露方法给外部调用
defineExpose({
  handlePageUpdate,
  handleShareFile,
  handleDownloadFile
})
</script>

<style scoped>
.preview-page {
  width: 100vw;
  height: 100vh;
  background-color: black;
  position: relative;
}

/* 加载状态 */
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
}

.loading-text {
  color: white;
  font-size: 32rpx;
  text-align: center;
}

/* 错误状态 */
.error-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
}

.error-text {
  color: white;
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 40rpx;
}

.retry-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

/* 多端适配 */
/* H5端 */
/* #ifdef H5 */
.retry-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
}
/* #endif */
</style>
</template>