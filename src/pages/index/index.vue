<template>
  <view class="index-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-content">
        <text class="navbar-title">文件管理</text>
        <view class="navbar-actions">
          <button 
            class="upload-btn" 
            @click="handleGoToUpload"
            type="primary"
            size="mini"
          >
            上传文件
          </button>
        </view>
      </view>
    </view>

    <!-- 文件列表内容 -->
    <view class="page-content">
      <FileList 
        ref="fileListRef"
        :files="fileStore.fileList"
        @file-click="handleFileClick"
        @file-delete="handleFileDelete"
        @file-info="handleFileInfo"
        @filter-change="handleFilterChange"
        @load-more="handleLoadMore"
        @refresh="handleRefresh"
      />
    </view>

    <!-- 文件预览组件 -->
    <FilePreview
      :visible="previewVisible"
      :file-list="fileStore.fileList"
      :current-index="currentPreviewIndex"
      @close="handleClosePreview"
      @change="handlePreviewChange"
    />

    <!-- 文件信息查看弹窗 -->
    <FileInfoDialog
      :visible="infoDialogVisible"
      :file="currentInfoFile"
      @close="handleCloseInfoDialog"
      @delete="handleFileDeleteFromInfo"
      @preview="handleFilePreviewFromInfo"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useFileStore } from '@/store/file'
import FileList from '@/components/FileList.vue'
import FilePreview from '@/components/FilePreview.vue'
import FileInfoDialog from '@/components/FileInfoDialog.vue'
import type { FileRecord } from '@/types/file'

// 页面标题
uni.setNavigationBarTitle({
  title: '文件管理'
})

// 使用状态管理
const fileStore = useFileStore()

// 响应式数据
const fileListRef = ref()
const previewVisible = ref(false)
const currentPreviewIndex = ref(0)
const infoDialogVisible = ref(false)
const currentInfoFile = ref<FileRecord>({} as FileRecord)

// 初始化页面
onMounted(() => {
  loadFiles()
})

// 加载文件列表
const loadFiles = async () => {
  try {
    // 如果没有数据，先加载模拟数据，在实际项目中应该调用fileStore.loadFileList()
    if (fileStore.fileList.length === 0) {
      // 临时模拟数据
      const mockFiles = generateMockFiles()
      fileStore.fileList.splice(0, fileStore.fileList.length, ...mockFiles)
    }
    // await fileStore.loadFileList()
  } catch (error) {
    console.error('加载文件失败:', error)
  }
}

// 生成模拟数据
const generateMockFiles = (): FileRecord[] => {
  const mockFiles: FileRecord[] = []
  for (let i = 1; i <= 10; i++) {
    mockFiles.push({
      id: `file_${i}`,
      fileName: `示例文件${i}`,
      originalName: `example_file_${i}`,
      fileType: i % 3 === 0 ? 'video' : 'image',
      fileUrl: i % 3 === 0 
        ? 'https://example.com/video.mp4' 
        : `https://picsum.photos/400/300?random=${i}`,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      uploadTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: 'demo_user_001',
      platform: 'H5',
      status: 1,
      thumbnail: i % 3 === 0 
        ? 'https://example.com/video_thumb.jpg' 
        : `https://picsum.photos/200/150?random=${i}`
    })
  }
  return mockFiles.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())
}

// 跳转到上传页面
const handleGoToUpload = () => {
  uni.navigateTo({
    url: '/pages/upload/upload'
  })
}

// 处理文件点击（预览）
const handleFileClick = (file: FileRecord) => {
  const index = fileStore.fileList.findIndex(f => f.id === file.id)
  if (index !== -1) {
    currentPreviewIndex.value = index
    previewVisible.value = true
  }
}

// 处理文件删除
const handleFileDelete = async (file: FileRecord) => {
  try {
    // 调用状态管理的删除方法
    await fileStore.deleteFile(file.id)
    
    // 通知FileList组件删除成功
    if (fileListRef.value) {
      fileListRef.value.onFileDeleted(file.id)
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    
    // 通知FileList组件删除失败
    if (fileListRef.value) {
      fileListRef.value.onFileDeleteFailed(file.id, error.message)
    }
  }
}

// 处理文件信息查看
const handleFileInfo = (file: FileRecord) => {
  currentInfoFile.value = file
  infoDialogVisible.value = true
}

// 关闭文件信息弹窗
const handleCloseInfoDialog = () => {
  infoDialogVisible.value = false
}

// 从文件信息弹窗中删除文件
const handleFileDeleteFromInfo = async (file: FileRecord) => {
  await handleFileDelete(file)
  infoDialogVisible.value = false
}

// 从文件信息弹窗中预览文件
const handleFilePreviewFromInfo = (file: FileRecord) => {
  infoDialogVisible.value = false
  handleFileClick(file)
}

// 处理筛选变化
const handleFilterChange = (filterType: string) => {
  console.log('筛选类型变更:', filterType)
  // 这里可以调用API重新加载筛选后的数据
  // fileStore.loadFileList({ fileType: filterType === 'all' ? undefined : filterType })
  loadFiles()
}

// 处理加载更多
const handleLoadMore = () => {
  console.log('加载更多')
  // fileStore.loadMore()
}

// 处理下拉刷新
const handleRefresh = () => {
  console.log('下拉刷新')
  // fileStore.refreshList()
  loadFiles()
}

// 关闭预览
const handleClosePreview = () => {
  previewVisible.value = false
}

// 预览文件切换
const handlePreviewChange = (index: number) => {
  currentPreviewIndex.value = index
}

// 下拉刷新
onPullDownRefresh(() => {
  loadFiles().then(() => {
    uni.stopPullDownRefresh()
  })
})

// 上拉加载更多
onReachBottom(() => {
  handleLoadMore()
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background-color: #f8f9fa;
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

.navbar-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.navbar-actions {
  display: flex;
  align-items: center;
}

.upload-btn {
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  border-radius: 44rpx;
  line-height: 1.2;
}

/* 页面内容 */
.page-content {
  flex: 1;
  min-height: calc(100vh - 128rpx);
}

/* 多端适配 */
/* H5端 */
/* #ifdef H5 */
.upload-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover {
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
