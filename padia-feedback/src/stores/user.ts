import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  USER = 'user'
}

// 用户信息接口
export interface UserInfo {
  id: number
  username: string
  email?: string
  avatar?: string
  role: UserRole
  brand?: string
  factory?: string
}

// 用户状态存储
export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const isAdmin = computed(() => userInfo.value?.role === UserRole.ADMIN)
  
  // 登录
  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const response = await authApi.login(username, password)
      if (response.data && response.data.code === 200) {
        const data = response.data.data
        token.value = data.token
        localStorage.setItem('token', data.token)
        
        // 获取用户信息
        await fetchUserInfo()
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.data?.message || '登录失败' 
        }
      }
    } catch (error) {
      console.error('登录错误:', error)
      return { 
        success: false, 
        message: '登录失败，请稍后重试' 
      }
    } finally {
      loading.value = false
    }
  }
  
  // 注册
  const register = async (userData: {
    username: string
    password: string
    email: string
    brand?: string
    factory?: string
  }) => {
    loading.value = true
    try {
      const response = await authApi.register(userData)
      if (response.data && response.data.code === 200) {
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.data?.message || '注册失败' 
        }
      }
    } catch (error) {
      console.error('注册错误:', error)
      return { 
        success: false, 
        message: '注册失败，请稍后重试' 
      }
    } finally {
      loading.value = false
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!token.value) return false
    
    loading.value = true
    try {
      const response = await authApi.getUserInfo()
      if (response.data && response.data.code === 200) {
        userInfo.value = response.data.data
        return true
      }
      return false
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 更新用户信息
  const updateUserInfo = async (data: Partial<UserInfo>) => {
    loading.value = true
    try {
      const response = await authApi.updateUserInfo(data)
      if (response.data && response.data.code === 200) {
        // 更新本地存储的用户信息
        if (userInfo.value) {
          userInfo.value = {
            ...userInfo.value,
            ...response.data.data
          }
        }
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.data?.message || '更新用户信息失败' 
        }
      }
    } catch (error) {
      console.error('更新用户信息错误:', error)
      return { 
        success: false, 
        message: '更新用户信息失败，请稍后重试' 
      }
    } finally {
      loading.value = false
    }
  }
  
  // 退出登录
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
  }
  
  // 初始化
  const init = async () => {
    if (token.value) {
      await fetchUserInfo()
    }
  }
  
  return {
    // 状态
    token,
    userInfo,
    loading,
    
    // 计算属性
    isLoggedIn,
    userRole,
    isAdmin,
    
    // 操作
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout,
    init
  }
}) 