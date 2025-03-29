import { Model, DataTypes } from 'sequelize'
import sequelize from '../config'
import User from './User'
import Issue from './Issue'

// 评论模型接口
export interface CommentAttributes {
  id?: number
  content: string
  userId: number
  issueId: number
  createdAt?: Date
  updatedAt?: Date
}

// 评论模型类
class Comment extends Model<CommentAttributes> implements CommentAttributes {
  public id!: number
  public content!: string
  public userId!: number
  public issueId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化评论模型
Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    issueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Issue,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'comments',
    indexes: [
      {
        name: 'comments_user_id',
        fields: ['userId']
      },
      {
        name: 'comments_issue_id',
        fields: ['issueId']
      }
    ]
  }
)

// 设置与用户和问题的关联关系
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Comment.belongsTo(Issue, { foreignKey: 'issueId', as: 'issue' })
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' })
Issue.hasMany(Comment, { foreignKey: 'issueId', as: 'comments' })

export default Comment 