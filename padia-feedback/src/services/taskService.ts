import { Task, Issue, User, IssueStatus, IssuePriority } from '../db/models'
import { Op } from 'sequelize'

// 任务服务
export const taskService = {
  // 创建任务（分配问题给开发人员）
  async createTask(
    issueId: number,
    developerId: number,
    priority: IssuePriority = IssuePriority.MEDIUM,
    remark?: string
  ): Promise<Task | null> {
    try {
      // 查找问题
      const issue = await Issue.findByPk(issueId)
      if (!issue) {
        return null
      }
      
      // 更新问题状态为处理中
      issue.status = IssueStatus.PROCESSING
      await issue.save()
      
      // 检查是否已存在任务
      const existingTask = await Task.findOne({ where: { issueId } })
      if (existingTask) {
        // 如果已存在任务，则更新任务信息
        existingTask.assignedTo = developerId
        existingTask.priority = priority
        if (remark) {
          existingTask.remark = remark
        }
        await existingTask.save()
        return existingTask
      }
      
      // 创建新任务
      const task = await Task.create({
        issueId,
        assignedTo: developerId,
        priority,
        remark
      })
      
      return task
    } catch (error) {
      console.error('创建任务失败:', error)
      return null
    }
  },
  
  // 获取开发人员的任务列表
  async getDeveloperTasks(
    developerId: number,
    page: number = 1,
    pageSize: number = 10,
    status?: IssueStatus
  ): Promise<{ tasks: Task[], total: number }> {
    try {
      const whereClause: any = {}
      
      if (status) {
        whereClause['$issue.status$'] = status
      }
      
      const { count, rows } = await Task.findAndCountAll({
        where: {
          assignedTo: developerId,
          ...whereClause
        },
        include: [
          {
            model: Issue,
            as: 'issue',
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } }
            ]
          },
          { model: User, as: 'developer', attributes: { exclude: ['password'] } }
        ],
        order: [
          ['priority', 'ASC'], // 按优先级升序（高优先级在前）
          ['createdAt', 'DESC'] // 按创建时间降序
        ],
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      return {
        tasks: rows,
        total: count
      }
    } catch (error) {
      console.error('获取开发人员任务列表失败:', error)
      return {
        tasks: [],
        total: 0
      }
    }
  },
  
  // 获取任务详情
  async getTaskById(taskId: number): Promise<Task | null> {
    try {
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: Issue,
            as: 'issue',
            include: [
              { model: User, as: 'user', attributes: { exclude: ['password'] } }
            ]
          },
          { model: User, as: 'developer', attributes: { exclude: ['password'] } }
        ]
      })
      
      return task
    } catch (error) {
      console.error('获取任务详情失败:', error)
      return null
    }
  },
  
  // 更新任务
  async updateTask(
    taskId: number,
    data: { priority?: IssuePriority, assignedTo?: number, remark?: string }
  ): Promise<Task | null> {
    try {
      const task = await Task.findByPk(taskId)
      if (!task) {
        return null
      }
      
      // 更新任务信息
      if (data.priority) {
        task.priority = data.priority
      }
      
      if (data.assignedTo) {
        task.assignedTo = data.assignedTo
      }
      
      if (data.remark !== undefined) {
        task.remark = data.remark
      }
      
      await task.save()
      
      return task
    } catch (error) {
      console.error('更新任务失败:', error)
      return null
    }
  }
}

export default taskService 