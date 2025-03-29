import { Sequelize } from 'sequelize'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 创建数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME || 'padia_user_feedback',
  process.env.DB_USER || 'tongyong',
  process.env.DB_PASSWORD || 'zhjh0704',
  {
    host: process.env.DB_HOST || '101.35.218.174',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00', // 设置时区为北京时间
    logging: process.env.NODE_ENV !== 'production' ? console.log : false
  }
)

// 测试数据库连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功')
    return true
  } catch (error) {
    console.error('数据库连接失败:', error)
    return false
  }
}

export default sequelize 