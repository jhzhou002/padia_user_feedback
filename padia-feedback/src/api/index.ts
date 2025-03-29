import request from './request'
import authApi from './auth'
import { issueApi } from './issue'
import developerApi from './task'

// 管理员相关接口
const adminApi = {
  // 获取反馈列表
  getFeedbackList(params) {
    return request({
      url: '/feedback',
      method: 'get',
      params
    })
  },
  
  // 分配任务
  assignTask(data) {
    return request({
      url: '/tasks/assign',
      method: 'post',
      data
    })
  }
}

// 模块相关接口
const moduleApi = {
  // 获取所有模块
  getModules() {
    return request({
      url: '/modules',
      method: 'get'
    })
  }
}

export {
  authApi,
  issueApi,
  developerApi,
  adminApi,
  moduleApi
} 