import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Comment extends Model {}

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
        allowNull: false
      },
      issueId: {
        type: DataTypes.INTEGER,
        allowNull: false
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

  return Comment
} 