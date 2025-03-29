import { Model, DataTypes } from 'sequelize'
import sequelize from '../config'
import User from './User'
import Issue from './Issue'

// 附件模型接口
export interface AttachmentAttributes {
  id?: number
  filename: string
  originalname: string
  mimetype: string
  path: string
  size: number
  userId: number
  issueId: number
  createdAt?: Date
  updatedAt?: Date
}

// 附件模型类
class Attachment extends Model<AttachmentAttributes> implements AttachmentAttributes {
  public id!: number
  public filename!: string
  public originalname!: string
  public mimetype!: string
  public path!: string
  public size!: number
  public userId!: number
  public issueId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化附件模型
Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
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
    tableName: 'attachments',
    indexes: [
      {
        name: 'attachments_user_id',
        fields: ['userId']
      },
      {
        name: 'attachments_issue_id',
        fields: ['issueId']
      }
    ]
  }
)

// 设置与用户和问题的关联关系
Attachment.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Attachment.belongsTo(Issue, { foreignKey: 'issueId', as: 'issue' })
User.hasMany(Attachment, { foreignKey: 'userId', as: 'attachments' })
Issue.hasMany(Attachment, { foreignKey: 'issueId', as: 'attachments' })

export default Attachment 