import jwt from 'jsonwebtoken'
import { User, UserRole, sequelize } from '../db/models'
import dotenv from 'dotenv'
import { Op } from 'sequelize'

// 加载环境变量
dotenv.config()

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'padia_user_feedback_secret_key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 用户登录响应接口
export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    email: string
    role: UserRole
    avatar?: string
  }
}

// 身份验证服务
export const authService = {
  // 用户登录
  async login(username: string, password: string): Promise<LoginResponse | null> {
    try {
      // 查找用户
      const user = await User.findOne({ where: { username } })
      if (!user) {
        return null
      }
      
      // 验证密码
      const isValid = await user.validatePassword(password)
      if (!isValid) {
        return null
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )
      
      // 返回登录响应
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return null
    }
  },
  
  // 用户注册
  async register(username: string, email: string, password: string): Promise<User | null> {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }]
        }
      })
      
      if (existingUser) {
        return null
      }
      
      // 创建新用户
      const newUser = await User.create({
        username,
        email,
        password,
        role: UserRole.USER
      })
      
      return newUser
    } catch (error) {
      console.error('注册失败:', error)
      return null
    }
  },
  
  // 验证Token
  verifyToken(token: string): { id: number, role: UserRole } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: UserRole }
      return decoded
    } catch (error) {
      console.error('Token验证失败:', error)
      return null
    }
  },
  
  // 获取用户信息
  async getUserInfo(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      })
      return user
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }
}

export default authService 