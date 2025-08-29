/**
 * 应用配置中心
 * 根据环境变量动态切换本地模式和云服务模式
 */

// 运行模式类型
export type RunMode = 'local' | 'cloud'

// 配置接口
export interface AppConfig {
  // 运行模式
  runMode: RunMode
  
  // 是否启用调试
  enableDebug: boolean
  
  // 是否启用控制台日志
  enableConsoleLog: boolean
  
  // 是否启用模拟数据
  enableMock: boolean
  
  // API配置
  api: {
    baseUrl: string
    timeout: number
  }
  
  // 文件上传配置
  upload: {
    maxFileSize: number
    allowedImageTypes: string[]
    allowedVideoTypes: string[]
  }
  
  // 本地模式配置
  local?: {
    storageType: 'localStorage' | 'indexedDB'
    maxFileSize: number
    mockUserId: string
    mockDelay: number // 模拟网络延迟（毫秒）
  }
  
  // 云服务配置
  cloud?: {
    spaceId: string
    clientSecret: string
    endpoint: string
  }
}

// 获取环境变量
const getEnvVar = (key: string, defaultValue = ''): string => {
  // @ts-ignore
  return import.meta.env[key] || defaultValue
}

// 解析布尔值
const parseBoolean = (value: string): boolean => {
  return value === 'true' || value === '1'
}

// 解析数字
const parseNumber = (value: string, defaultValue: number): number => {
  const num = parseInt(value, 10)
  return isNaN(num) ? defaultValue : num
}

// 解析数组
const parseArray = (value: string): string[] => {
  return value ? value.split(',').map(s => s.trim()) : []
}

// 创建配置对象
const createConfig = (): AppConfig => {
  const runMode = (getEnvVar('VITE_RUN_MODE', 'local') as RunMode)
  
  const config: AppConfig = {
    runMode,
    enableDebug: parseBoolean(getEnvVar('VITE_ENABLE_DEBUG', 'true')),
    enableConsoleLog: parseBoolean(getEnvVar('VITE_ENABLE_CONSOLE_LOG', 'true')),
    enableMock: parseBoolean(getEnvVar('VITE_ENABLE_MOCK', 'true')),
    
    api: {
      baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
      timeout: parseNumber(getEnvVar('VITE_API_TIMEOUT'), 30000)
    },
    
    upload: {
      maxFileSize: parseNumber(getEnvVar('VITE_MAX_FILE_SIZE'), 10485760),
      allowedImageTypes: parseArray(getEnvVar('VITE_ALLOWED_IMAGE_TYPES', 'jpg,jpeg,png,gif,webp')),
      allowedVideoTypes: parseArray(getEnvVar('VITE_ALLOWED_VIDEO_TYPES', 'mp4,mov,avi'))
    }
  }
  
  // 根据运行模式添加特定配置
  if (runMode === 'local') {
    config.local = {
      storageType: getEnvVar('VITE_LOCAL_STORAGE_TYPE', 'localStorage') as 'localStorage' | 'indexedDB',
      maxFileSize: parseNumber(getEnvVar('VITE_LOCAL_MAX_FILE_SIZE'), 10485760),
      mockUserId: getEnvVar('VITE_LOCAL_MOCK_USER_ID', 'local_demo_user'),
      mockDelay: parseNumber(getEnvVar('VITE_LOCAL_MOCK_DELAY'), 300)
    }
  } else {
    config.cloud = {
      spaceId: getEnvVar('VITE_UNICLOUD_SPACE_ID'),
      clientSecret: getEnvVar('VITE_UNICLOUD_CLIENT_SECRET'),
      endpoint: getEnvVar('VITE_UNICLOUD_ENDPOINT')
    }
  }
  
  return config
}

// 导出配置
export const appConfig = createConfig()

// 日志工具
export const logger = {
  log: (...args: any[]) => {
    if (appConfig.enableConsoleLog) {
      console.log('[APP]', ...args)
    }
  },
  
  info: (...args: any[]) => {
    if (appConfig.enableConsoleLog) {
      console.info('[INFO]', ...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (appConfig.enableConsoleLog) {
      console.warn('[WARN]', ...args)
    }
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
  
  debug: (...args: any[]) => {
    if (appConfig.enableDebug) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

// 检查配置
export const validateConfig = (): boolean => {
  if (appConfig.runMode === 'cloud') {
    if (!appConfig.cloud?.spaceId || !appConfig.cloud?.clientSecret) {
      logger.error('云服务模式需要配置 VITE_UNICLOUD_SPACE_ID 和 VITE_UNICLOUD_CLIENT_SECRET')
      return false
    }
  }
  
  logger.info('当前运行模式:', appConfig.runMode)
  logger.debug('配置详情:', appConfig)
  
  return true
}

// 导出常用配置项
export const isLocalMode = appConfig.runMode === 'local'
export const isCloudMode = appConfig.runMode === 'cloud'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'