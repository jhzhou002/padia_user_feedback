import request from './request'
import type { ApiResponse, Issue, PaginatedResponse } from '../types'

interface Issue {
  id: number
  title: string
  description: string
  status: string
  userId: number
  isPublic: boolean
  moduleId?: number
  priority: string
  views: number
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    username: string
    email: string
    role: string
    avatar?: string
  }
}

interface PaginatedResponse<T> {
  rows: T[]
  count: number
}

// 问题相关接口
export const issueApi = {
  // 提交问题
  submitIssue(data: Partial<Issue>) {
    return request<ApiResponse<Issue>>({
      url: '/issues',
      method: 'post',
      data
    })
  },

  // 获取用户问题列表
  getUserIssues(params: {
    page?: number
    pageSize?: number
    status?: string
    search?: string
  }) {
    return request<ApiResponse<{
      issues: Issue[]
      total: number
      counts?: {
        pending: number
        processing: number
        resolved: number
        closed: number
      }
    }>>({
      url: '/issues/user',
      method: 'get',
      params
    })
  },

  // 获取热门问题
  getHotIssues(params: {
    page?: number
    pageSize?: number
    module?: string
    search?: string
  }) {
    return request<ApiResponse<{
      issues: Issue[]
      total: number
    }>>({
      url: '/issues/hot',
      method: 'get',
      params
    })
  },

  // 获取问题详情
  getIssueDetail(id: number) {
    return request<ApiResponse<Issue>>({
      url: `/issues/${id}`,
      method: 'get'
    })
  },

  // 更新问题状态
  updateIssueStatus(id: number, status: string) {
    return request<ApiResponse<Issue>>({
      url: `/issues/${id}/status`,
      method: 'put',
      data: { status }
    })
  },

  // 添加评论
  addComment(issueId: number, content: string) {
    return request<ApiResponse<any>>({
      url: '/comments',
      method: 'post',
      data: { issueId, content }
    })
  },

  // 提交问题评价
  submitRating(id: number, rating: number) {
    return request<ApiResponse<Issue>>({
      url: `/issues/${id}/rating`,
      method: 'post',
      data: { rating }
    })
  },

  // 获取开发者统计数据
  getDeveloperStatistics() {
    return request<ApiResponse<{
      totalIssues: number,
      resolvedIssues: number,
      pendingIssues: number,
      processingIssues: number,
      averageRating: number,
      ratingsCount: number,
      ratingsDistribution: Record<string, number>, // 1-5星评价分布
      responseTime: number, // 平均响应时间（小时）
      resolveTime: number, // 平均解决时间（小时）
    }>>({
      url: '/developer/statistics',
      method: 'get'
    })
  },

  // 创建热门问题测试数据
  createHotIssueTestData() {
    return request<ApiResponse<{ count: number }>>({
      url: '/dev/create-hot-issues',
      method: 'post'
    })
  }
}

export default issueApi 