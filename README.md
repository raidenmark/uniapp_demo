# UniCloud 多端文件管理 Demo

一个基于 uni-app + Vue3 + TypeScript + UniCloud 的多端文件管理演示项目，支持文件上传、预览、管理等功能。

## 🌟 功能特性

- 📤 **文件上传**：支持图片、视频上传到 UniCloud 云存储
- 👁️ **文件预览**：图片查看、视频播放
- 📁 **文件管理**：文件列表、筛选、分页、删除
- 📱 **多端支持**：H5、微信小程序、支付宝小程序、Android APP
- 🎨 **响应式设计**：自适应不同屏幕尺寸
- ☁️ **云端存储**：基于 UniCloud 云开发平台

## 📦 技术栈

- **框架**: uni-app 3.x
- **前端**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **云服务**: UniCloud (阿里云/腾讯云)
- **UI组件**: uni-ui
- **构建工具**: Vite

## 🚀 快速开始

### 前置要求

1. **Node.js**: 版本 >= 14.18
2. **HBuilderX**: 最新版本（推荐）或 VS Code
3. **UniCloud账号**: 需要开通 UniCloud 服务

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/raidenmark/uniapp_demo.git
cd uniapp_demo
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置 UniCloud**

#### 方式一：使用 HBuilderX（推荐）
1. 用 HBuilderX 打开项目
2. 右键点击 `uniCloud` 目录
3. 选择"关联云服务空间"
4. 创建或选择已有的服务空间
5. 右键点击 `uniCloud/database/db_init.json`
6. 选择"初始化云数据库"

#### 方式二：手动配置
1. 登录 [UniCloud 控制台](https://unicloud.dcloud.net.cn)
2. 创建服务空间（选择阿里云或腾讯云）
3. 获取服务空间 ID 和 API Key
4. 在项目根目录创建 `.env` 文件：
```env
VITE_UNICLOUD_SPACE_ID=your-space-id
VITE_UNICLOUD_CLIENT_SECRET=your-client-secret
VITE_UNICLOUD_ENDPOINT=your-endpoint
```

### 启动项目

#### H5 开发
```bash
# 启动开发服务器
npm run dev:h5

# 构建生产版本
npm run build:h5
```

#### 微信小程序
```bash
# 开发构建
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```
然后使用微信开发者工具打开 `dist/dev/mp-weixin` 目录

#### 支付宝小程序
```bash
# 开发构建
npm run dev:mp-alipay

# 生产构建
npm run build:mp-alipay
```
然后使用支付宝小程序开发者工具打开 `dist/dev/mp-alipay` 目录

#### Android APP
```bash
# 开发构建
npm run dev:app

# 生产构建
npm run build:app
```
使用 HBuilderX 进行云打包或本地打包

## 📝 项目结构

```
uniapp_demo/
├── src/
│   ├── api/                # API 接口封装
│   │   └── file.ts         # 文件操作接口
│   ├── components/         # 公共组件
│   │   ├── FileUploader.vue   # 文件上传组件
│   │   ├── FileList.vue       # 文件列表组件
│   │   ├── FilePreview.vue    # 文件预览组件
│   │   └── FileInfoDialog.vue # 文件信息弹窗
│   ├── pages/              # 页面文件
│   │   ├── index/          # 首页（文件列表）
│   │   ├── upload/         # 上传页面
│   │   └── preview/        # 预览页面
│   ├── store/              # 状态管理
│   │   └── file.ts         # 文件状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口文件
│   ├── manifest.json       # 应用配置
│   ├── pages.json          # 页面配置
│   └── uni.scss            # 全局样式
├── uniCloud/               # 云服务配置
│   ├── cloudfunctions/    # 云函数
│   └── database/          # 数据库配置
├── package.json           # 项目配置
└── vite.config.ts         # Vite 配置
```

## 🔧 配置说明

### UniCloud 数据库结构

#### files 集合
```json
{
  "id": "文件ID",
  "fileName": "文件名",
  "originalName": "原始文件名",
  "fileType": "文件类型(image/video)",
  "fileUrl": "文件URL",
  "fileSize": "文件大小(字节)",
  "uploadTime": "上传时间",
  "userId": "用户ID",
  "platform": "上传平台",
  "isDeleted": "是否删除"
}
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：
```env
# UniCloud 配置
VITE_UNICLOUD_SPACE_ID=your-space-id
VITE_UNICLOUD_CLIENT_SECRET=your-client-secret

# API 配置
VITE_API_BASE_URL=https://your-api.com
VITE_API_TIMEOUT=30000

# 上传配置
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
VITE_ALLOWED_VIDEO_TYPES=mp4,mov,avi
```

## 🚢 部署指南

### H5 部署

1. **构建项目**
```bash
npm run build:h5
```

2. **部署到服务器**
- 将 `dist/build/h5` 目录下的文件上传到 Web 服务器
- 配置 nginx/apache 等 Web 服务器
- 确保服务器支持 History 路由模式

3. **nginx 配置示例**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist/build/h5;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass https://your-unicloud-api.com;
    }
}
```

### 小程序发布

#### 微信小程序
1. 构建小程序版本：`npm run build:mp-weixin`
2. 使用微信开发者工具打开 `dist/build/mp-weixin`
3. 上传代码到微信公众平台
4. 提交审核并发布

#### 支付宝小程序
1. 构建小程序版本：`npm run build:mp-alipay`
2. 使用支付宝小程序开发者工具打开 `dist/build/mp-alipay`
3. 上传代码到支付宝开放平台
4. 提交审核并发布

### Android APP 发布

1. **使用 HBuilderX 云打包**
   - 在 HBuilderX 中打开项目
   - 选择"发行" -> "原生App-云打包"
   - 配置证书和包名
   - 等待打包完成

2. **本地打包**（需要 Android 开发环境）
   - 生成离线打包资源
   - 集成到原生 Android 项目
   - 使用 Android Studio 打包 APK

## 🔍 使用指南

### 基本操作流程

1. **上传文件**
   - 点击"上传"按钮进入上传页面
   - 选择图片或视频文件
   - 等待上传完成自动跳转回列表

2. **查看文件**
   - 在首页查看文件列表
   - 点击文件卡片查看详情
   - 支持筛选和分页

3. **预览文件**
   - 点击文件进入预览页面
   - 图片支持缩放、旋转
   - 视频支持播放控制

4. **删除文件**
   - 长按文件进入选择模式
   - 选择要删除的文件
   - 确认删除操作

### 注意事项

1. **文件大小限制**：默认单文件最大 10MB
2. **支持格式**：
   - 图片：JPG、PNG、GIF、WebP
   - 视频：MP4、MOV、AVI
3. **并发上传**：最多同时上传 3 个文件
4. **存储配额**：根据 UniCloud 服务空间配额

## 🐛 常见问题

### Q1: UniCloud 初始化失败
**解决方案**：
1. 检查是否已关联服务空间
2. 确认服务空间状态正常
3. 检查网络连接
4. 查看控制台错误信息

### Q2: 文件上传失败
**可能原因**：
1. 文件大小超过限制
2. 文件格式不支持
3. 网络连接问题
4. 云存储配额不足

### Q3: 小程序预览白屏
**解决方案**：
1. 检查基础库版本
2. 确认已配置合法域名
3. 查看开发者工具控制台
4. 检查页面路径配置

### Q4: APP 打包失败
**检查项**：
1. manifest.json 配置是否正确
2. 图标和启动图资源是否齐全
3. 证书配置是否正确
4. 权限申请是否完整

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

- 项目地址：[https://github.com/raidenmark/uniapp_demo](https://github.com/raidenmark/uniapp_demo)
- 问题反馈：[Issues](https://github.com/raidenmark/uniapp_demo/issues)

## 🙏 致谢

- [uni-app](https://uniapp.dcloud.io/)
- [Vue.js](https://vuejs.org/)
- [UniCloud](https://unicloud.dcloud.net.cn/)
- [TypeScript](https://www.typescriptlang.org/)

---

**说明**：这是一个演示项目，仅供学习和参考使用。