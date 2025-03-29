import request from './request'

export const developerApi = {
  // 获取开发人员的任务列表
  getDeveloperTasks(params: {
    page?: number
    pageSize?: number
    status?: string
    search?: string
  }) {
    return request({
      url: '/tasks',
      method: 'get',
      params
    })
  },

  // 更新任务状态
  updateTaskStatus(id: string, status: string) {
    return request({
      url: `/issues/${id}/status`,
      method: 'put',
      data: { status }
    })
  },

  // 添加任务评论
  addTaskComment(taskId: string, content: string) {
    return request({
      url: `/comments`,
      method: 'post',
      data: { issueId: taskId, content }
    })
  }
}

export default developerApi 