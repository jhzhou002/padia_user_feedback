import { Model, DataTypes } from 'sequelize'

// 问题状态枚举
export const IssueStatus = {
  PENDING: 'pending', // 待处理
  VIEWED: 'viewed',   // 已查看
  PROCESSING: 'processing', // 处理中
  RESOLVED: 'resolved', // 已解决
  CLOSED: 'closed' // 已关闭
}

// 问题优先级枚举
export const IssuePriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

// 问题模型定义函数
export default (sequelize) => {
  class Issue extends Model {}

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
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: IssueStatus.PENDING,
        validate: {
          isIn: [Object.values(IssueStatus)]
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      moduleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '问题所属的功能模块ID'
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      priority: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: IssuePriority.MEDIUM,
        validate: {
          isIn: [Object.values(IssuePriority)]
        }
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
          min: 1,
          max: 5
        },
        comment: '用户评分，1-5星'
      }
    },
    {
      sequelize,
      tableName: 'issues',
      indexes: [
        {
          name: 'issues_user_id',
          fields: ['userId']
        }
      ]
    }
  )

  return Issue
} 