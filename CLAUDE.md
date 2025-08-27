# Claude Code 执行任务指南

## 项目信息
- **项目名称**: UniCloud 多端文件管理 Demo
- **技术栈**: uni-app + Vue3 + TypeScript + UniCloud
- **支持平台**: H5、Android、微信小程序、支付宝小程序

## Claude Code 执行规则

### Task Master 工具规则
1. **任务状态管理**: 每次执行任务前/后必须使用 task-master set-status 更新任务状态
2. **上下文压缩**: 执行完主task后（不是subtask），必须压缩上下文以保持效率
3. **输出语言**: 对话中需要输出方案或执行结果时，必须使用中文输出

### 代码风格要求
1. **使用 TypeScript**: 所有 .js 文件改为 .ts，提供完整类型定义
2. **Vue3 Composition API**: 优先使用 `<script setup>` 语法
3. **ES6+ 语法**: 使用 async/await、解构赋值、箭头函数等现代语法
4. **代码注释**: 关键业务逻辑必须添加中文注释
5. **错误处理**: 所有异步操作必须包含 try-catch 错误处理

### 项目结构规范
```
unicloud-file-demo/
├── uniCloud/                   # UniCloud云端资源
│   ├── database/              # 数据库初始化
│   └── common/                # 公共模块(如需要)
├── src/
│   ├── api/                   # 接口封装
│   │   ├── file.ts           # 文件操作接口
│   │   └── types.ts          # 接口类型定义
│   ├── components/            # 公共组件
│   │   ├── FileUploader.vue  # 文件上传组件
│   │   ├── FileList.vue      # 文件列表组件
│   │   └── FilePreview.vue   # 文件预览组件
│   ├── pages/                 # 页面文件
│   │   ├── index/            # 首页
│   │   │   └── index.vue     # 文件列表首页
│   │   ├── upload/           # 上传页面
│   │   │   └── upload.vue    # 文件上传页
│   │   └── preview/          # 预览页面
│   │       └── preview.vue   # 文件预览页
│   ├── store/                 # 状态管理
│   │   ├── file.ts           # 文件状态  
│   │   └── index.ts          # 状态入口
│   ├── utils/                 # 工具函数
│   │   ├── file.ts           # 文件处理工具
│   │   ├── platform.ts       # 平台判断工具
│   │   └── common.ts         # 通用工具
│   ├── types/                 # 类型定义
│   │   ├── file.ts           # 文件相关类型
│   │   └── common.ts         # 通用类型
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   ├── manifest.json         # 应用配置
│   ├── pages.json            # 页面配置
│   └── uni.scss              # 全局样式
├── static/                    # 静态资源
├── .env                       # 环境变量
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
├── vite.config.ts            # Vite配置
└── README.md                 # 项目说明
```

### 开发任务分解

#### 阶段一：项目初始化
1. **创建uni-app项目**: 使用Vue3+TypeScript模板
2. **配置UniCloud**: 创建云服务空间，配置云数据库
3. **安装依赖包**: UI组件库、工具库等
4. **项目结构搭建**: 创建目录结构和基础文件
5. **环境配置**: TypeScript、ESLint、Vite等配置

#### 阶段二：基础功能开发
1. **文件上传功能**:
   - 创建文件上传组件
   - 实现图片选择和上传
   - 实现视频选择和上传
   - 配置UniCloud云存储

#### 阶段三：文件管理功能
1. **文件展示**:
   - 实现文件列表页面
   - 实现基础文件筛选
   - 实现简单分页
2. **文件预览**:
   - 实现图片预览组件
   - 实现视频播放组件
3. **文件操作**:
   - 实现文件删除功能

#### 阶段四：多端适配
1. **H5版本优化**: 基础响应式布局
2. **小程序适配**: 微信和支付宝小程序基础适配
3. **APP打包**: Android APK生成
4. **平台标识**: 各平台文件来源标记

### 代码实现要求

#### 组件开发规范
```typescript
// 组件必须包含的内容
export default defineComponent({
  name: 'ComponentName',
  props: {
    // 使用 PropType 定义类型
  },
  emits: ['update', 'delete'],
  setup(props, { emit }) {
    // 使用 Composition API
    // 必须包含类型定义
    // 必须包含错误处理
    // 必须包含加载状态管理
    
    return {
      // 导出的响应式数据和方法
    }
  }
})
```

#### 接口封装规范
```typescript
// api/file.ts 示例
export interface FileUploadParams {
  filePath: string
  fileType: 'image' | 'video'
}

export interface FileRecord {
  id: string
  fileName: string
  fileType: 'image' | 'video'
  fileUrl: string
  uploadTime: string
}

export class FileAPI {
  private db = uniCloud.database()
  private static readonly DEMO_USER_ID = 'demo_user'

  async uploadFile(params: FileUploadParams): Promise<FileRecord> {
    try {
      // 实现文件上传逻辑
      // 使用固定用户ID
      // 必须包含错误处理
    } catch (error) {
      // 统一错误处理
      throw new Error(`文件上传失败: ${error.message}`)
    }
  }
}
```

#### 页面开发规范
```vue
<template>
  <!-- 必须包含loading状态 -->
  <view v-if="loading" class="loading">
    加载中...
  </view>
  
  <!-- 必须包含错误状态 -->
  <view v-else-if="error" class="error">
    {{ error }}
  </view>
  
  <!-- 正常内容 -->
  <view v-else class="content">
    <!-- 页面内容 -->
  </view>
</template>

<script setup lang="ts">
// 必须使用 TypeScript
// 必须包含响应式数据类型定义
// 必须包含生命周期钩子
// 必须包含错误处理逻辑
</script>

<style scoped>
/* 必须使用scoped样式 */
/* 必须考虑多端适配 */
</style>
```

### UniCloud配置要求

#### 数据库Schema定义
```javascript
// uniCloud/database/db_init.json
{
  "users": {
    "data": [],
    "schema": {
      "bsonType": "object",
      "permission": {
        "read": "auth.uid == doc._id",
        "create": true,
        "update": "auth.uid == doc._id",
        "delete": false
      }
    }
  },
  "files": {
    "data": [],
    "schema": {
      "bsonType": "object", 
      "permission": {
        "read": "auth.uid == doc.userId",
        "create": "auth.uid != null",
        "update": "auth.uid == doc.userId", 
        "delete": "auth.uid == doc.userId"
      }
    }
  }
}
```

#### 云函数开发规范
```javascript
// uniCloud/cloudfunctions/fileProcessor/index.js
'use strict';

const db = uniCloud.database()

exports.main = async (event, context) => {
  // 必须验证用户权限
  const { uid } = context
  if (!uid) {
    throw new Error('用户未登录')
  }

  try {
    // 业务逻辑实现
    return {
      code: 200,
      message: 'success',
      data: result
    }
  } catch (error) {
    // 统一错误返回格式
    return {
      code: 500,
      message: error.message,
      data: null
    }
  }
}
```

## 质量要求

### 代码质量
- **TypeScript覆盖率**: 90%以上，核心文件必须是.ts/.vue
- **基础代码规范**: 基本的ESLint检查通过
- **注释覆盖率**: 主要函数和业务逻辑有注释
- **错误处理**: 主要异步操作有错误处理

### 测试要求
- **功能测试**: 核心功能手动测试通过
- **多端测试**: 主要支持平台测试核心功能
- **基础兼容性**: 确保在目标平台正常运行

## 交付检查清单

### 代码交付
- [ ] 核心代码已完成
- [ ] README.md文档基本完整
- [ ] package.json依赖正确
- [ ] TypeScript配置基本正确
- [ ] 移除明显的调试代码

### 功能交付  
- [ ] 图片上传查看功能正常
- [ ] 视频上传播放功能正常
- [ ] 基础文件删除功能
- [ ] 主要平台适配完成

### 部署交付
- [ ] UniCloud云服务空间配置
- [ ] H5版本可以访问
- [ ] Android APK可以安装
- [ ] 微信小程序可以预览
- [ ] 基础部署文档

## 开发时间估算

- **项目初始化**: 0.5天
- **文件上传模块**: 1.5天  
- **文件管理模块**: 1天
- **多端适配**: 1天
- **基础测试**: 0.5天

**总计**: 4-5天开发时间 (Demo版本)
