import { Issue, IssueStatus, IssuePriority, User, Task, Comment, Attachment } from '../db/models'
import { Op } from 'sequelize'

// 问题服务
export const issueService = {
  // 创建问题
  async createIssue(
    userId: number,
    title: string,
    description: string,
    isPublic: boolean = true
  ): Promise<Issue | null> {
    try {
      const issue = await Issue.create({
        title,
        description,
        status: IssueStatus.PENDING,
        userId,
        isPublic,
        priority: IssuePriority.MEDIUM
      })
      
      return issue
    } catch (error) {
      console.error('创建问题失败:', error)
      return null
    }
  },
  
  // 获取问题详情
  async getIssueById(issueId: number, includeRelations: boolean = true): Promise<Issue | null> {
    try {
      const options: any = {
        where: { id: issueId }
      }
      
      if (includeRelations) {
        options.include = [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { model: Task, as: 'task', include: [{ model: User, as: 'developer', attributes: { exclude: ['password'] } }] },
          { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
          { model: Attachment, as: 'attachments' }
        ]
      }
      
      const issue = await Issue.findOne(options)
      
      // 增加浏览次数
      if (issue) {
        issue.views += 1
        await issue.save()
      }
      
      return issue
    } catch (error) {
      console.error('获取问题详情失败:', error)
      return null
    }
  },
  
  // 获取用户的问题列表
  async getUserIssues(userId: number, page: number = 1, pageSize: number = 10): Promise<{ issues: Issue[], total: number }> {
    try {
      const { count, rows } = await Issue.findAndCountAll({
        where: { userId },
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } }
        ],
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      return {
        issues: rows,
        total: count
      }
    } catch (error) {
      console.error('获取用户问题列表失败:', error)
      return {
        issues: [],
        total: 0
      }
    }
  },
  
  // 获取热门问题列表
  async getHotIssues(page: number = 1, pageSize: number = 10, searchQuery: string = ''): Promise<{ issues: Issue[], total: number }> {
    try {
      const whereClause: any = {
        isPublic: true
      }
      
      // 如果有搜索查询，添加标题和描述搜索条件
      if (searchQuery) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchQuery}%` } },
          { description: { [Op.like]: `%${searchQuery}%` } }
        ]
      }
      
      const { count, rows } = await Issue.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } }
        ],
        order: [['views', 'DESC'], ['createdAt', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      return {
        issues: rows,
        total: count
      }
    } catch (error) {
      console.error('获取热门问题列表失败:', error)
      return {
        issues: [],
        total: 0
      }
    }
  },
  
  // 更新问题状态
  async updateIssueStatus(issueId: number, status: IssueStatus): Promise<Issue | null> {
    try {
      const issue = await Issue.findByPk(issueId)
      if (!issue) {
        return null
      }
      
      issue.status = status
      await issue.save()
      
      return issue
    } catch (error) {
      console.error('更新问题状态失败:', error)
      return null
    }
  }
}

export default issueService 