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

    <!-- 调试信息 -->
    <view class="debug-info" style="padding: 20rpx; background: #f0f0f0; margin: 20rpx;">
      <text>文件数量: {{ fileStore?.fileList?.length || 0 }}</text>
    </view>

    <!-- 文件列表内容 -->
    <view class="page-content">
      <FileList 
        ref="fileListRef"
        :files="fileStore?.fileList || []"
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
      :file-list="fileStore?.fileList || []"
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
import { onShow, onHide } from '@dcloudio/uni-app'
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

// 导入FileAPI
import { FileAPI } from '@/api/file'
const fileAPI = new FileAPI()

// 响应式数据
const fileListRef = ref()
const previewVisible = ref(false)
const currentPreviewIndex = ref(0)
const infoDialogVisible = ref(false)
const currentInfoFile = ref<FileRecord>({} as FileRecord)

// 初始化页面
onMounted(() => {
  console.log('页面挂载完成，开始初始化...')
  console.log('fileStore:', fileStore)
  loadFiles()
})

// 页面显示时刷新文件列表 - 用于从上传页面返回后自动刷新
onShow(() => {
  console.log('🔄 页面显示，检查是否需要刷新文件列表...')
  // 每次显示都重新加载文件列表，确保数据是最新的
  loadFiles()
})

// 页面隐藏时的处理
onHide(() => {
  console.log('📱 页面隐藏')
})

// 加载文件列表
const loadFiles = async () => {
  try {
    console.log('🔄 开始加载文件数据...')
    
    // 调用真实API获取文件列表
    const result = await fileAPI.getFileList({
      page: 1,
      pageSize: 50 // 加载更多文件以便测试筛选
    })
    
    if (result.code === 0) {
      console.log('✅ API数据加载成功:', result.data.list.length, '个文件')
      fileStore.setFileList(result.data.list)
      console.log('📊 文件列表已更新，当前文件数量:', fileStore.fileList.length)
    } else {
      console.warn('⚠️ API返回错误:', result.message)
      // 如果API失败，显示空列表
      fileStore.setFileList([])
    }
  } catch (error: any) {
    console.error('❌ 加载文件失败:', error)
    
    // API调用失败时的降级处理 - 使用本地测试数据
    console.log('🔄 API失败，使用本地测试数据...')
    const testFiles: FileRecord[] = [
      {
        id: 'test1',
        fileName: '演示图片1.jpg',
        originalName: 'demo-image-1.jpg',
        fileType: 'image',
        fileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzQyODVmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJhzE8L3RleHQ+PC9zdmc+',
        fileSize: 1024000,
        uploadTime: new Date().toISOString(),
        userId: 'test_user',
        platform: 'H5',
        status: 1,
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzQyODVmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueLhzE8L3RleHQ+PC9zdmc+'
      }
    ]
    fileStore.setFileList(testFiles)
    console.log('📝 设置降级测试数据完成')
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
  console.log('🚀 点击上传按钮，准备跳转到上传页面...')
  
  try {
    // 由于上传页面是tabBar页面，需要使用switchTab
    uni.switchTab({
      url: '/pages/upload/upload',
      success: (res) => {
        console.log('✅ 跳转成功:', res)
      },
      fail: (err) => {
        console.error('❌ switchTab失败，尝试navigateTo:', err)
        // 降级方案：使用navigateTo
        uni.navigateTo({
          url: '/pages/upload/upload',
          success: (res) => {
            console.log('✅ navigateTo跳转成功:', res)
          },
          fail: (err2) => {
            console.error('❌ navigateTo也失败:', err2)
            // 最后降级方案：使用路由跳转
            console.log('🔄 使用路由跳转...')
            window.location.hash = '#/pages/upload/upload'
          }
        })
      }
    })
  } catch (error) {
    console.error('❌ 跳转异常:', error)
    // 异常降级方案
    window.location.hash = '#/pages/upload/upload'
  }
}

// 处理文件点击（预览）
const handleFileClick = (file: FileRecord) => {
  if (!fileStore?.fileList) return
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
  console.log('📊 页面接收到筛选变更事件:', filterType)
  console.log('📋 当前文件列表:', fileStore.fileList)
  console.log('🔢 当前文件数量:', fileStore.fileList.length)
  
  // 分别统计不同类型的文件数量
  const imageCount = fileStore.fileList.filter(f => f.fileType === 'image').length
  const videoCount = fileStore.fileList.filter(f => f.fileType === 'video').length
  const otherCount = fileStore.fileList.filter(f => f.fileType !== 'image' && f.fileType !== 'video').length
  
  console.log(`📸 图片文件: ${imageCount}个, 🎬 视频文件: ${videoCount}个, 📄 其他文件: ${otherCount}个`)
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

// 临时注释uni-app生命周期函数，避免undefined错误
// onPullDownRefresh(() => {
//   loadFiles().then(() => {
//     uni.stopPullDownRefresh()
//   })
// })

// onReachBottom(() => {
//   handleLoadMore()
// })
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
