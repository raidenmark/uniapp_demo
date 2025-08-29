# UniCloud 多端文件管理 Demo

一个基于 uni-app + Vue3 + TypeScript 的多端文件管理演示项目，支持文件上传、预览、管理等功能。

> 🎯 **新特性**：支持本地模式和云服务模式，无需配置即可本地运行！

## 🌟 功能特性

- 📤 **文件上传**：支持图片、视频上传到 UniCloud 云存储
- 👁️ **文件预览**：图片查看、视频播放
- 📁 **文件管理**：文件列表、筛选、分页、删除
- 📱 **多端支持**：H5、微信小程序、支付宝小程序、Android APP
- 🎨 **响应式设计**：自适应不同屏幕尺寸
- ☁️ **云端存储**：基于 UniCloud 云开发平台
- 💾 **本地模式**：支持纯本地运行，无需云服务配置

## 📦 技术栈

- **框架**: uni-app 3.x
- **前端**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **云服务**: UniCloud (阿里云/腾讯云) - 可选
- **本地存储**: LocalStorage (本地模式)
- **UI组件**: uni-ui
- **构建工具**: Vite

## 🚀 快速开始

### 🔥 方式一：本地模式（推荐初学者）

无需任何云服务配置，直接本地运行：

```bash
# 1. 克隆项目
git clone https://github.com/raidenmark/uniapp_demo.git
cd uniapp_demo

# 2. 安装依赖
npm install

# 3. 启动本地模式
npm run local

# 4. 访问应用
# 打开浏览器访问 http://localhost:3000
```

**本地模式特点**：
- ✅ 无需云服务配置
- ✅ 数据存储在浏览器 LocalStorage
- ✅ 支持所有文件管理功能
- ⚠️ 数据仅保存在当前浏览器

### ☁️ 方式二：云服务模式（生产环境）

使用 UniCloud 云服务，支持多用户和数据持久化：

#### 前置要求

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

#### 配置 UniCloud

**使用 HBuilderX（推荐）**
1. 用 HBuilderX 打开项目
2. 右键点击 `uniCloud` 目录
3. 选择"关联云服务空间"
4. 创建或选择已有的服务空间
5. 右键点击 `uniCloud/database/db_init.json`
6. 选择"初始化云数据库"

**手动配置**
1. 登录 [UniCloud 控制台](https://unicloud.dcloud.net.cn)
2. 创建服务空间（选择阿里云或腾讯云）
3. 获取服务空间 ID 和 API Key
4. 复制云服务配置文件并填写：
```bash
cp .env.cloud .env
# 编辑 .env 文件，填写你的云服务配置
```

5. 启动云服务模式：
```bash
npm run cloud
```

## 🎮 运行模式

项目支持两种运行模式，可通过环境变量切换：

| 模式 | 命令 | 说明 | 适用场景 |
|------|------|------|----------|
| 本地模式 | `npm run local` | 使用 LocalStorage | 开发测试、演示 |
| 云服务模式 | `npm run cloud` | 使用 UniCloud | 生产环境、多用户 |

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

项目提供两套环境配置模板：

#### 本地模式配置（.env.local）
```env
# 运行模式
VITE_RUN_MODE=local

# 本地存储配置
VITE_LOCAL_STORAGE_TYPE=localStorage
VITE_LOCAL_MAX_FILE_SIZE=10485760  # 10MB
VITE_LOCAL_MOCK_USER_ID=local_demo_user
VITE_LOCAL_MOCK_DELAY=300  # 模拟网络延迟

# 调试配置
VITE_ENABLE_DEBUG=true
VITE_ENABLE_CONSOLE_LOG=true
```

#### 云服务模式配置（.env.cloud）
```env
# 运行模式
VITE_RUN_MODE=cloud

# UniCloud 配置（需要替换为实际值）
VITE_UNICLOUD_SPACE_ID=your-space-id
VITE_UNICLOUD_CLIENT_SECRET=your-client-secret
VITE_UNICLOUD_ENDPOINT=your-endpoint

# 生产配置
VITE_ENABLE_DEBUG=false
VITE_ENABLE_CONSOLE_LOG=false
```

#### 切换运行模式
```bash
# 使用本地模式
cp .env.local .env
npm run dev:h5

# 使用云服务模式
cp .env.cloud .env
# 编辑 .env 文件，填写你的 UniCloud 配置
npm run dev:h5
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
4. **存储限制**：
   - 本地模式：50MB（浏览器 LocalStorage）
   - 云服务模式：根据 UniCloud 服务空间配额

## 🆕 本地模式 vs 云服务模式

| 特性 | 本地模式 | 云服务模式 |
|------|----------|-------------|
| 配置难度 | 无需配置 | 需要 UniCloud 配置 |
| 数据存储 | 浏览器 LocalStorage | UniCloud 云存储 |
| 数据持久性 | 仅当前浏览器 | 永久保存 |
| 多用户支持 | 否 | 是 |
| 跨设备同步 | 否 | 是 |
| 存储容量 | 5-10MB | 按需扩展 |
| 适用场景 | 开发、测试、演示 | 生产环境 |
| 费用 | 完全免费 | 有免费额度 |

## 🐛 常见问题

### Q1: 本地模式数据丢失
**原因**：清除浏览器缓存或更换浏览器
**解决**：本地模式数据存储在 LocalStorage，清除缓存会丢失。建议重要数据使用云服务模式。

### Q2: UniCloud 初始化失败
**解决方案**：
1. 检查是否已关联服务空间
2. 确认服务空间状态正常
3. 检查网络连接
4. 查看控制台错误信息

### Q3: 文件上传失败
**可能原因**：
1. 文件大小超过限制
2. 文件格式不支持
3. 网络连接问题
4. 云存储配额不足

### Q4: 小程序预览白屏
**解决方案**：
1. 检查基础库版本
2. 确认已配置合法域名
3. 查看开发者工具控制台
4. 检查页面路径配置

### Q5: APP 打包失败
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