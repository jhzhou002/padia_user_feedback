import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import UserModel, { UserRole } from './User.js'
import IssueModel, { IssueStatus, IssuePriority } from './Issue.js'
import TaskModel from './Task.js'
import CommentModel from './Comment.js'
import AttachmentModel from './Attachment.js'
import ModuleModel, { ModuleType, ModuleName } from './Module.js'

// 加载环境变量
dotenv.config()

// 创建数据库连接
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'padia_user_feedback',
  process.env.DB_USER || 'tongyong',
  process.env.DB_PASSWORD || 'zhjh0704',
  {
    host: process.env.DB_HOST || '101.35.218.174',
    dialect: 'mysql',
    // 设置时区为北京时间
    timezone: '+08:00',
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+08:00'
    },
    define: {
      timestamps: true,
      // 确保createdAt和updatedAt字段使用正确的时区
      createdAt: true,
      updatedAt: true
    },
    logging: false
  }
)

// 初始化模型
const User = UserModel(sequelize)
const Issue = IssueModel(sequelize)
const Task = TaskModel(sequelize)
const Comment = CommentModel(sequelize)
const Attachment = AttachmentModel(sequelize)
const Module = ModuleModel(sequelize)

// 定义模型关联关系（但不创建实际的外键约束）
User.hasMany(Issue, { as: 'issues', foreignKey: 'userId', constraints: false })
Issue.belongsTo(User, { as: 'user', foreignKey: 'userId', constraints: false })

Issue.hasOne(Task, { as: 'task', foreignKey: 'issueId', constraints: false })
Task.belongsTo(Issue, { as: 'issue', foreignKey: 'issueId', constraints: false })

Task.belongsTo(User, { as: 'developer', foreignKey: 'assignedTo', constraints: false })
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo', constraints: false })

Issue.hasMany(Comment, { as: 'comments', foreignKey: 'issueId', constraints: false })
Comment.belongsTo(Issue, { as: 'issue', foreignKey: 'issueId', constraints: false })

Comment.belongsTo(User, { as: 'user', foreignKey: 'userId', constraints: false })
User.hasMany(Comment, { as: 'comments', foreignKey: 'userId', constraints: false })

Issue.hasMany(Attachment, { as: 'attachments', foreignKey: 'issueId', constraints: false })
Attachment.belongsTo(Issue, { as: 'issue', foreignKey: 'issueId', constraints: false })

// 添加模块关联关系（但不创建实际的外键约束）
Module.hasMany(User, { as: 'developers', foreignKey: 'moduleId', constraints: false })
User.belongsTo(Module, { as: 'module', foreignKey: 'moduleId', constraints: false })

Module.hasMany(Issue, { as: 'issues', foreignKey: 'moduleId', constraints: false })
Issue.belongsTo(Module, { as: 'module', foreignKey: 'moduleId', constraints: false })

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 不修改现有表结构，保留数据
    await sequelize.sync({ alter: false })
    console.log('数据库同步完成')

    // 初始化功能模块数据
    await initModules()

    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

// 初始化功能模块数据
const initModules = async () => {
  try {
    // 检查是否已有模块数据
    const count = await Module.count()
    if (count === 0) {
      // 创建功能模块数据
      const modulesToCreate = Object.values(ModuleType).map(code => ({
        name: ModuleName[code],
        code,
        description: `${ModuleName[code]} module for system functionality`
      }))
      
      await Module.bulkCreate(modulesToCreate)
      console.log('功能模块初始化完成')
    }
  } catch (error) {
    console.error('功能模块初始化失败:', error)
  }
}

export {
  User,
  Issue,
  Task,
  Comment,
  Attachment,
  Module,
  UserRole,
  IssueStatus,
  IssuePriority,
  ModuleType,
  ModuleName
} 