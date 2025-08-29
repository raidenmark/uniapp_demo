# 本地模式使用指南

本项目支持两种运行模式：
- **本地模式（Local Mode）**：无需云服务，使用浏览器本地存储
- **云服务模式（Cloud Mode）**：使用 UniCloud 云服务

## 🚀 快速开始（本地模式）

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地模式
```bash
# 方式一：使用快捷命令
npm run local

# 方式二：指定模式启动
npm run dev:h5:local
```

### 3. 访问应用
打开浏览器访问：http://localhost:3000

## 📝 本地模式特性

### 支持的功能
- ✅ 文件上传（保存到浏览器本地存储）
- ✅ 文件列表展示
- ✅ 文件预览（图片、视频）
- ✅ 文件删除
- ✅ 批量操作
- ✅ 文件筛选和分页

### 存储限制
- 最大单文件：10MB（可配置）
- 总存储空间：50MB（可配置）
- 存储方式：LocalStorage + Base64

### 数据持久化
- 数据保存在浏览器 LocalStorage
- 清除浏览器缓存会丢失数据
- 不同浏览器数据不共享

## ⚙️ 配置说明

### 环境变量配置（.env.local）
```env
# 运行模式
VITE_RUN_MODE=local

# 本地存储配置
VITE_LOCAL_STORAGE_TYPE=localStorage
VITE_LOCAL_MAX_FILE_SIZE=10485760  # 10MB
VITE_LOCAL_MOCK_USER_ID=local_demo_user
VITE_LOCAL_MOCK_DELAY=300  # 模拟网络延迟（毫秒）

# 调试配置
VITE_ENABLE_DEBUG=true
VITE_ENABLE_CONSOLE_LOG=true
```

### 切换到云服务模式
1. 复制环境配置：
```bash
cp .env.cloud .env
```

2. 填写云服务配置：
```env
VITE_RUN_MODE=cloud
VITE_UNICLOUD_SPACE_ID=your-space-id
VITE_UNICLOUD_CLIENT_SECRET=your-client-secret
```

3. 启动云服务模式：
```bash
npm run cloud
# 或
npm run dev:h5:cloud
```

## 🎯 使用场景

### 适合本地模式的场景
- 快速演示和测试
- 无需云服务的轻量应用
- 个人学习和开发
- 离线使用需求

### 需要云服务模式的场景
- 生产环境部署
- 多用户数据共享
- 大文件存储需求
- 跨设备数据同步

## 🔍 本地模式实现原理

### 文件上传流程
1. 用户选择文件
2. 文件转换为 Base64
3. 保存到 LocalStorage
4. 生成本地文件记录

### 数据结构
```typescript
interface LocalFile {
  id: string              // 本地生成的唯一ID
  fileName: string        // 文件名
  fileType: 'image' | 'video'
  fileUrl: string        // Base64 数据URL
  fileSize: number       // 文件大小（字节）
  uploadTime: string     // 上传时间
  userId: string         // 模拟用户ID
  platform: string       // 平台标识
  isDeleted: boolean     // 软删除标记
}
```

### 存储键值
- 存储键：`uniapp_demo_files`
- 数据格式：JSON 数组

## 🛠️ 开发调试

### 查看本地存储数据
1. 打开浏览器开发者工具（F12）
2. 进入 Application/应用程序 标签
3. 左侧选择 Local Storage
4. 查看 `uniapp_demo_files` 键

### 清空本地数据
```javascript
// 在控制台执行
localStorage.removeItem('uniapp_demo_files')
```

### 调试日志
本地模式下会输出详细日志：
- `[APP]` - 应用日志
- `[INFO]` - 信息日志
- `[DEBUG]` - 调试日志
- `[ERROR]` - 错误日志

## 📱 多平台支持

### H5 网页版
完全支持本地模式，使用浏览器 LocalStorage

### 小程序
- 需要修改为使用 `uni.setStorageSync` API
- 存储限制：10MB
- 暂不完全支持

### APP
- 可使用 SQLite 本地数据库
- 需要额外配置
- 暂不完全支持

## ⚠️ 注意事项

1. **数据安全**：本地模式数据存储在浏览器，请勿存储敏感信息
2. **存储限制**：LocalStorage 有 5-10MB 限制，大文件会失败
3. **兼容性**：需要现代浏览器支持（Chrome、Firefox、Safari、Edge）
4. **性能**：大量文件会影响页面加载速度

## 🤝 问题反馈

如遇到问题，请提交 Issue：
https://github.com/raidenmark/uniapp_demo/issues