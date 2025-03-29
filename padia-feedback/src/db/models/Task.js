import { Model, DataTypes } from 'sequelize'
import { IssuePriority } from './Issue.js'

export default (sequelize) => {
  class Task extends Model {}

  Task.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      issueId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: false
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

  return Task
} 