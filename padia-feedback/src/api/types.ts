// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PaginatedResponse<T> {
  issues: T[]
  total: number
}

// 问题类型
export interface Issue {
  id: number
  title: string
  description: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  userId: number
  isPublic: boolean
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

// 任务类型
export interface Task {
  id: number
  title: string
  description: string
  status: string
  developerId: number
  issueId: number
  createdAt: string
  updatedAt: string
  developer?: {
    id: number
    username: string
    email: string
    role: string
    avatar?: string
  }
}

// 评论类型
export interface Comment {
  id: number
  content: string
  userId: number
  issueId: number
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