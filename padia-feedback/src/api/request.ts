import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 详细日志
    console.log('请求拦截器 - 发起请求:', config.url, config.method)
    
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    console.log('请求拦截器 - token:', token || 'null')
    
    if (token) {
      // 确保headers对象存在
      if (!config.headers) {
        config.headers = {}
      }
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 格式化请求参数日志
    const reqData = config.data || config.params || {}
    console.log('请求配置:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: typeof reqData === 'object' ? { ...reqData } : reqData
    })
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    console.log('响应成功:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    
    // 检查响应结构
    if (response.data && typeof response.data === 'object') {
      if (response.data.code !== undefined && response.data.code !== 200) {
        ElMessage.error(response.data.message || '请求失败')
        // 不抛出错误，交由业务代码处理
      }
    }
    
    return response
  },
  (error) => {
    console.error('请求错误:', error.message || error)
    
    if (error.config) {
      console.error('错误请求配置:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      })
    }
    
    if (error.response) {
      console.log('错误响应状态:', error.response.status)
      console.log('错误响应数据:', error.response.data)
      
      switch (error.response.status) {
        case 401:
          // 只有不在登录页时才跳转登录页
          if (router.currentRoute.value.path !== '/auth/login') {
            localStorage.removeItem('token')
            router.push('/auth/login')
            ElMessage.error('登录已过期，请重新登录')
          }
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查服务器地址或网络连接')
    } else {
      ElMessage.error('网络错误，请检查您的网络连接')
    }
    
    return Promise.reject(error)
  }
)

// 通用请求方法
const request = <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return service(config)
}

export default request 