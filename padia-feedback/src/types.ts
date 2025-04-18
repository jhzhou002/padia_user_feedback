// 用户角色枚举
export enum UserRole {
  USER = 'user',
  DEVELOPER = 'developer',
  ADMIN = 'admin'
}

// 问题状态枚举
export enum IssueStatus {
  PENDING = 'pending',   // 待处理
  VIEWED = 'viewed',     // 已查看
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved',  // 已处理
  CLOSED = 'closed'      // 已关闭（保留，可能会用到）
}

// 优先级枚举
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 功能模块枚举
export enum ModuleType {
  DASHBOARD = 'dashboard',
  PROCESS_MAP = 'process_map',
  AUDIT = 'audit',
  MATERIAL_MANAGEMENT = 'material_management',
  ISSUE_AND_DIAGNOSIS = 'issue_and_diagnosis',
  STATISTICS = 'statistics',
  INTERNAL_DATA = 'internal_data',
  CONFIGURATION = 'configuration'

  //增加po，即admin也会去回答问题
  //先欠着，商量下命名
}

// 模块名称映射
export const ModuleName: Record<ModuleType, string> = {
  [ModuleType.DASHBOARD]: 'Dashboard',
  [ModuleType.PROCESS_MAP]: 'Process Map',
  [ModuleType.AUDIT]: 'Audit',
  [ModuleType.MATERIAL_MANAGEMENT]: 'Material Management',
  [ModuleType.ISSUE_AND_DIAGNOSIS]: 'Issue and Diagnosis',
  [ModuleType.STATISTICS]: 'Statistics',
  [ModuleType.INTERNAL_DATA]: 'Internal Data',
  [ModuleType.CONFIGURATION]: 'Configuration',
}

// 用户信息
export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  avatar?: string
  moduleId?: number
  module?: Module
  factory?: string  // 用户所属工厂
  brand?: string    // 用户所属品牌
}

// 功能模块
export interface Module {
  id: number
  name: string
  code: ModuleType
  description?: string
}

// 问题信息
export interface Issue {
  id: number
  title: string
  description: string
  status: IssueStatus
  userId: number
  moduleId?: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
  user?: User
  module?: Module
  comments?: Comment[]
  task?: Task
}

// 任务信息
export interface Task {
  id: number
  issueId: number
  assignedTo: number
  priority: Priority
  remark?: string
  createdAt: string
  updatedAt: string
  issue?: Issue
  developer?: User
}

// 评论信息
export interface Comment {
  id: number
  issueId: number
  userId: number
  content: string
  createdAt: string
  updatedAt: string
  user?: User
}

// API响应接口
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

// 状态计数接口
export interface StatusCounts {
  total: number
  pending: number
  processing: number
  resolved: number
  closed: number
} 