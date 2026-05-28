/**
 * Axios 实例与拦截器封装
 *
 * 架构说明：
 * - 提供统一的 axios 实例，配置 baseURL、超时、请求/响应拦截器
 * - 不再使用 mock 模式，直接对接真实后端 API
 */

import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

// ============================================================
// Axios 实例
// ============================================================
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ----- 请求拦截器 -----
// 自动注入 token（从 auth store 中读取）
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ----- 响应拦截器 -----
// 统一处理错误（401 跳登录、网络异常提示等）
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 从后端错误响应体中提取 message
    const backendData = error.response?.data
    const message =
      backendData?.message ||
      error.message ||
      '网络异常，请稍后重试'

    if (error.response?.status === 401) {
      // token 过期，清除持久化登录状态后跳转到登录页
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(new Error(message))
  },
)

// ============================================================
// Mock 工具函数
// ============================================================
// 注意：当前 knowledge.ts / workflow.ts / team.ts 仍在使用这些工具，
// 未来全部对接真实后端后可移除。

/**
 * 模拟网络延迟
 * @param ms 延迟毫秒数（默认 600ms，模拟真实网络）
 */
export function mockDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 包装 mock 响应（统一返回格式）
 * @param data 返回数据
 * @param success 是否成功
 */
export function mockResponse<T>(data: T, success = true) {
  return { success, data, message: success ? 'ok' : 'error' }
}

/**
 * 统一 API 调用入口
 * - mock 模式下直接调用 mockFn 返回假数据
 * - 非 mock 模式下走 axios 真实请求
 */
export async function callApi<T>(
  mockFn: () => Promise<T>,
  requestFn: () => Promise<T>,
): Promise<T> {
  return requestFn()
}

export default apiClient
