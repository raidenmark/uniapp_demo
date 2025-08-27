/**
 * Pinia状态管理主入口
 */

import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// 导出所有store
export * from './file'