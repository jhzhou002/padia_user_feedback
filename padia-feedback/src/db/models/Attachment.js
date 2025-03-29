import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Attachment extends Model {}

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
        allowNull: false
      },
      issueId: {
        type: DataTypes.INTEGER,
        allowNull: false
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

  return Attachment
}