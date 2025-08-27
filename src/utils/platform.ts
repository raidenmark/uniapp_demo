/**
 * 平台判断工具函数
 */

import type { Platform } from '@/types/common'

/**
 * 获取当前运行平台
 */
export function getCurrentPlatform(): Platform {
  // #ifdef H5
  return 'h5'
  // #endif
  
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  
  // #ifdef MP-ALIPAY
  return 'mp-alipay'
  // #endif
  
  // #ifdef APP-PLUS
  const platform = uni.getSystemInfoSync().platform
  return platform === 'ios' ? 'app-ios' : 'app-android'
  // #endif
  
  return 'h5' // 默认返回H5
}

/**
 * 判断是否为移动端
 */
export function isMobile(): boolean {
  const platform = getCurrentPlatform()
  return ['app-android', 'app-ios', 'mp-weixin', 'mp-alipay'].includes(platform)
}

/**
 * 判断是否为小程序
 */
export function isMiniProgram(): boolean {
  const platform = getCurrentPlatform()
  return ['mp-weixin', 'mp-alipay'].includes(platform)
}

/**
 * 判断是否为App
 */
export function isApp(): boolean {
  const platform = getCurrentPlatform()
  return ['app-android', 'app-ios'].includes(platform)
}

/**
 * 判断是否为H5
 */
export function isH5(): boolean {
  return getCurrentPlatform() === 'h5'
}