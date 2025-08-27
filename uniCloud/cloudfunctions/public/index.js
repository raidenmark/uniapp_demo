'use strict';

/**
 * 公共模块
 * 提供通用的工具函数和常量
 */

// 默认演示用户ID
const DEMO_USER_ID = 'demo_user_001';

// 获取用户ID
function getUserId(context) {
  // 如果有认证信息，使用认证用户ID
  if (context && context.CLIENTINFO && context.CLIENTINFO.uid) {
    return context.CLIENTINFO.uid;
  }
  // 否则使用默认演示用户ID
  return DEMO_USER_ID;
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取当前时间戳
function getCurrentTimestamp() {
  return Date.now();
}

// 响应成功
function success(data = null, message = '操作成功') {
  return {
    code: 0,
    message,
    data
  };
}

// 响应失败
function fail(message = '操作失败', code = -1) {
  return {
    code,
    message,
    data: null
  };
}

module.exports = {
  DEMO_USER_ID,
  getUserId,
  generateId,
  getCurrentTimestamp,
  success,
  fail
};