import { Model, DataTypes } from 'sequelize'
import sequelize from '../config'
import User from './User'
import Issue, { IssuePriority } from './Issue'

// 任务模型接口
export interface TaskAttributes {
  id?: number
  issueId: number
  assignedTo: number
  priority: IssuePriority
  remark?: string
  createdAt?: Date
  updatedAt?: Date
}

// 任务模型类
class Task extends Model<TaskAttributes> implements TaskAttributes {
  public id!: number
  public issueId!: number
  public assignedTo!: number
  public priority!: IssuePriority
  public remark?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化任务模型
Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    issueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Issue,
        key: 'id'
      }
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(IssuePriority)),
      allowNull: false,
      defaultValue: IssuePriority.MEDIUM
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    indexes: [
      {
        name: 'tasks_issue_id',
        fields: ['issueId']
      },
      {
        name: 'tasks_assigned_to',
        fields: ['assignedTo']
      }
    ]
  }
)

// 设置与用户和问题的关联关系
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'developer' })
Task.belongsTo(Issue, { foreignKey: 'issueId', as: 'issue' })
Issue.hasOne(Task, { foreignKey: 'issueId', as: 'task' })
User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' })

export default Task 