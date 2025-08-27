/**
 * 用户反馈机制 - subtask 4.4要求
 * 封装uni-app用户反馈API，创建统一的消息提示和加载状态管理
 */

/**
 * 显示成功消息提示
 */
export function showSuccess(message: string, duration: number = 2000): void {
  uni.showToast({
    title: message,
    icon: 'success',
    duration,
    mask: false
  })
}

/**
 * 显示错误消息提示
 */
export function showError(message: string, duration: number = 2000): void {
  uni.showToast({
    title: message,
    icon: 'error',
    duration,
    mask: false
  })
}

/**
 * 显示加载提示
 */
export function showLoading(message: string = '加载中...'): void {
  uni.showLoading({
    title: message,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading(): void {
  uni.hideLoading()
}

/**
 * 显示确认对话框
 */
export function showConfirm(
  title: string,
  content: string = ''
): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 显示警告消息提示
 */
export function showWarning(message: string, duration: number = 2000): void {
  uni.showToast({
    title: message,
    icon: 'none',
    duration,
    mask: false
  })
}

/**
 * 显示信息消息提示
 */
export function showInfo(message: string, duration: number = 2000): void {
  uni.showToast({
    title: message,
    icon: 'none',
    duration,
    mask: false
  })
}

/**
 * 操作反馈管理类 - 全局loading状态管理
 */
export class FeedbackManager {
  private static loadingCount = 0
  
  /**
   * 显示加载状态（支持嵌套调用）
   */
  static showLoading(message: string = '加载中...'): void {
    if (this.loadingCount === 0) {
      showLoading(message)
    }
    this.loadingCount++
  }
  
  /**
   * 隐藏加载状态（支持嵌套调用）
   */
  static hideLoading(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1)
    if (this.loadingCount === 0) {
      hideLoading()
    }
  }
  
  /**
   * 强制隐藏所有加载状态
   */
  static forceHideLoading(): void {
    this.loadingCount = 0
    hideLoading()
  }
}

/**
 * 操作成功反馈
 */
export function operationSuccess(message: string): void {
  FeedbackManager.hideLoading()
  showSuccess(message)
}

/**
 * 操作失败反馈
 */
export function operationError(message: string): void {
  FeedbackManager.hideLoading()
  showError(message)
}

/**
 * 异步操作包装器 - 自动处理loading和错误反馈
 */
export async function withLoading<T>(
  operation: () => Promise<T>,
  loadingMessage: string = '处理中...',
  successMessage?: string
): Promise<T> {
  try {
    FeedbackManager.showLoading(loadingMessage)
    const result = await operation()
    FeedbackManager.hideLoading()
    
    if (successMessage) {
      showSuccess(successMessage)
    }
    
    return result
  } catch (error: any) {
    FeedbackManager.hideLoading()
    showError(error.message || '操作失败')
    throw error
  }
}