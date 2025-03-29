import User, { UserRole } from './User'
import Issue, { IssueStatus, IssuePriority } from './Issue'
import Task from './Task'
import Comment from './Comment'
import Attachment from './Attachment'
import sequelize, { testConnection } from '../config'

// 导出模型和枚举
export {
  User,
  UserRole,
  Issue,
  IssueStatus,
  IssuePriority,
  Task,
  Comment,
  Attachment,
  sequelize,
  testConnection
}

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 测试数据库连接
    await testConnection()
    
    // 同步模型到数据库（创建表）
    await sequelize.sync({ alter: true })
    console.log('数据库同步完成')
    
    // 检查是否需要创建默认管理员用户
    const adminCount = await User.count({ where: { role: UserRole.ADMIN } })
    if (adminCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      })
      console.log('已创建默认管理员用户')
    }
    
    // 检查是否需要创建默认开发者用户
    const devCount = await User.count({ where: { role: UserRole.DEVELOPER } })
    if (devCount === 0) {
      await User.create({
        username: 'developer',
        password: 'dev123',
        email: 'dev@example.com',
        role: UserRole.DEVELOPER
      })
      console.log('已创建默认开发者用户')
    }
    
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
} 