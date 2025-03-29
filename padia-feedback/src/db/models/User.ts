import { Model, DataTypes } from 'sequelize'
import sequelize from '../config'
import bcrypt from 'bcryptjs'

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  DEVELOPER = 'developer',
  ADMIN = 'admin'
}

// 用户模型接口
export interface UserAttributes {
  id?: number
  username: string
  password: string
  email: string
  role: UserRole
  avatar?: string
  createdAt?: Date
  updatedAt?: Date
}

// 用户模型类
class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number
  public username!: string
  public password!: string
  public email!: string
  public role!: UserRole
  public avatar?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 验证密码方法
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password)
  }
}

// 初始化用户模型
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.USER
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      // 在保存前对密码进行哈希处理
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10)
          user.password = await bcrypt.hash(user.password, salt)
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10)
          user.password = await bcrypt.hash(user.password, salt)
        }
      }
    }
  }
)

export default User 