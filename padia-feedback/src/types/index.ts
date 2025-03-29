// 问题状态
export enum IssueStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已解决
  CLOSED = 'closed' // 已关闭
}

// 问题类型
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  createTime: string;
  updateTime: string;
  isPublic: boolean;
  attachments?: string[];
  comments?: Comment[];
}

// 评论类型
export interface Comment {
  id: string;
  issueId: string;
  content: string;
  createTime: string;
  createdBy: string;
  userType: 'user' | 'developer';
}

// 任务类型
export interface Task {
  id: string;
  issueId: string;
  issue: Issue;
  assignTo: string;
  priority: 'high' | 'medium' | 'low';
  createTime: string;
}

// 反馈类型 (管理员视图)
export interface Feedback {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  isPublic: boolean;
  createdBy?: string;
  createTime: string;
  updateTime: string;
} 