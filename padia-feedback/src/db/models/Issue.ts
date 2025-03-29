import { Model, DataTypes } from 'sequelize'
import sequelize from '../config'
import User from './User'

// 问题状态枚举
export enum IssueStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已解决
  CLOSED = 'closed' // 已关闭
}

// 问题优先级枚举
export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 问题模型接口
export interface IssueAttributes {
  id?: number
  title: string
  description: string
  status: IssueStatus
  userId: number
  isPublic: boolean
  priority?: IssuePriority
  views?: number
  createdAt?: Date
  updatedAt?: Date
}

// 问题模型类
class Issue extends Model<IssueAttributes> implements IssueAttributes {
  public id!: number
  public title!: string
  public description!: string
  public status!: IssueStatus
  public userId!: number
  public isPublic!: boolean
  public priority!: IssuePriority
  public views!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化问题模型
Issue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(IssueStatus)),
      allowNull: false,
      defaultValue: IssueStatus.PENDING
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(IssuePriority)),
      allowNull: false,
      defaultValue: IssuePriority.MEDIUM
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'issues',
    indexes: [
      {
        name: 'issues_user_id',
        fields: ['userId']
      },
      {
        name: 'issues_status',
        fields: ['status']
      },
      {
        name: 'issues_is_public',
        fields: ['isPublic']
      }
    ]
  }
)

// 设置与用户的关联关系
Issue.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(Issue, { foreignKey: 'userId', as: 'issues' })

export default Issue 