import request from './request'
import type { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 用户角色类型
export type UserRole = 'user' | 'developer' | 'admin'

// API 响应格式
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 登录数据类型
export interface LoginData {
  token: string
  user: {
    id: number
    username: string
    role: UserRole
    email: string
    avatar?: string
  }
}

// 登录响应类型
export type LoginResponse = ApiResponse<LoginData>

// 认证相关API
const authApi = {
  // 登录
  login(data: { username: string; password: string }): Promise<AxiosResponse<LoginResponse>> {
    console.log('发起登录请求:', data)
    return request<LoginResponse>({
      url: '/auth/login',
      method: 'post',
      data
    })
  },
  
  // 获取用户信息
  getUserInfo(): Promise<AxiosResponse<ApiResponse<LoginData['user']>>> {
    return request<ApiResponse<LoginData['user']>>({
      url: '/auth/user-info',
      method: 'get'
    })
  },
  
  // 注册
  register(data: { username: string; password: string; email: string; brand?: string; factory?: string }): Promise<AxiosResponse<ApiResponse<LoginData>>> {
    return request<ApiResponse<LoginData>>({
      url: '/auth/register',
      method: 'post',
      data
    })
  },
  
  // 修改密码
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request({
      url: '/auth/change-password',
      method: 'post',
      data
    })
  },
  
  // 退出登录
  logout() {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('rememberUser')
    localStorage.removeItem('rememberedUsername')
    
    // 重定向到登录页
    router.push('/auth/login')
    
    // 显示成功消息
    ElMessage.success('退出登录成功')
    
    return Promise.resolve()
  }
}

export default authApi 