import { Model, DataTypes } from 'sequelize'

// 功能模块枚举
export const ModuleType = {
  DASHBOARD: 'dashboard',
  PROCESS_MAP: 'process_map',
  AUDIT: 'audit',
  MATERIAL_MANAGEMENT: 'material_management',
  ISSUE_AND_DIAGNOSIS: 'issue_and_diagnosis',
  STATISTICS: 'statistics',
  INTERNAL_DATA: 'internal_data',
  CONFIGURATION: 'configuration'
}

// 功能模块名称映射
export const ModuleName = {
  [ModuleType.DASHBOARD]: 'Dashboard',
  [ModuleType.PROCESS_MAP]: 'Process Map',
  [ModuleType.AUDIT]: 'Audit',
  [ModuleType.MATERIAL_MANAGEMENT]: 'Material Management',
  [ModuleType.ISSUE_AND_DIAGNOSIS]: 'Issue and Diagnosis',
  [ModuleType.STATISTICS]: 'Statistics',
  [ModuleType.INTERNAL_DATA]: 'Internal Data',
  [ModuleType.CONFIGURATION]: 'Configuration'
}

// 功能模块模型定义函数
export default (sequelize) => {
  class Module extends Model {}

  Module.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: DataTypes.ENUM(...Object.values(ModuleType)),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'modules'
    }
  )

  return Module
} 