import { Model, DataTypes } from 'sequelize'
// 移除 bcrypt 引用，因为我们现在使用明文密码
// import bcrypt from 'bcryptjs'

// 用户角色枚举
export const UserRole = {
  USER: 'user',
  DEVELOPER: 'developer',
  ADMIN: 'admin'
}

export default (sequelize) => {
  class User extends Model {
    // 验证密码
    async validatePassword(password) {
      try {
        console.log('验证密码详情:', { 
          id: this.id,
          username: this.username,
          输入密码: password,
          数据库密码: this.password
        });
        
        // 直接比较明文密码
        const result = password === this.password;
        console.log('密码比对结果:', result);
        
        return result;
      } catch (error) {
        console.error('密码验证错误:', error);
        return false;
      }
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.USER
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '开发人员负责的功能模块ID'
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '用户车辆品牌'
    },
    factory: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '用户所属工厂'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          console.log('创建用户，明文密码:', user.password);
          // 不再加密密码，直接使用明文
          // user.password = await bcrypt.hash(user.password, 10)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          console.log('更新密码，明文密码:', user.password);
          // 不再加密密码，直接使用明文
          // user.password = await bcrypt.hash(user.password, 10)
        }
      }
    }
  })

  return User
} 