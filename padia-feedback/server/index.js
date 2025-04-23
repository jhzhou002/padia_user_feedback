import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Sequelize, Op } from 'sequelize'
import { initDatabase, User, Issue, Task, Comment, Module, UserRole, IssueStatus, ModuleType, sequelize } from '../src/db/models/index.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import qiniu from 'qiniu'
import dotenv from 'dotenv'

// 导入邮件服务模块
import mailer from './mailer.js';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 七牛云配置
const accessKey = 'nfxmZVGEHjkd8Rsn44S-JSynTBUUguTScil9dDvC';
const secretKey = '9lZjiRtRLL0U_MuYkcUZBAL16TlIJ8_dDSbTqqU2';
const bucket = 'padia'; // 存储空间名
const domain = 'https://padia.lingjing235.cn'; // CDN域名

// 使用中间件
app.use(cors())
app.use(bodyParser.json())

// 添加CORS相关配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  
  // 预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  // 打印请求日志
  console.log(`${req.method} ${req.url}`)
  
  next()
})

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  } 
})

// 文件上传API
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        code: 400, 
        message: '没有上传文件', 
        data: null 
      })
    }

    console.log('【文件上传】文件信息:', req.file)
    
    // 生成可访问的URL
    const fileUrl = `/uploads/${req.file.filename}`
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('【文件上传错误】:', error)
    res.status(500).json({ 
      code: 500, 
      message: '上传文件失败', 
      data: null 
    })
  }
})

// 配置静态文件访问
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// 七牛云上传token接口
app.get('/api/qiniu-token', (req, res) => {
  try {
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = {
      scope: bucket,
      expires: 3600, // 1小时有效期
      returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
    };
    
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const token = putPolicy.uploadToken(mac);
    
    console.log('获取七牛云上传凭证成功', { token, domain });
    
    // 返回正确的JSON格式
    return res.json({
      code: 200,
      data: {
        token: token,
        domain: domain
      },
      message: '获取上传凭证成功'
    });
  } catch (error) {
    console.error('获取七牛云上传凭证失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取上传凭证失败',
      data: null
    });
  }
});

// 全局请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  console.log(`\n\x1b[35m[请求]\x1b[0m ${req.method} ${req.originalUrl}`);
  console.log(`\x1b[35m[请求头]\x1b[0m ${JSON.stringify({
    contentType: req.headers['content-type'],
    authorization: req.headers.authorization ? '存在' : '无',
    userAgent: req.headers['user-agent']
  })}`);
  
  // 记录请求体，但避免记录过大的内容
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyLog = JSON.stringify(req.body).substring(0, 1000);
    console.log(`\x1b[35m[请求体]\x1b[0m ${bodyLog}${bodyLog.length === 1000 ? '...(截断)' : ''}`);
  }
  
  // 拦截响应发送，记录响应信息
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    console.log(`\x1b[36m[响应]\x1b[0m ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`);
    
    // 记录简短的响应体预览，避免记录过大的内容
    if (body) {
      let preview = '无法获取响应体预览';
      try {
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          preview = JSON.stringify({
            code: parsed.code || res.statusCode,
            message: parsed.message || '未知',
            data: parsed.data ? '有数据' : '无数据'
          });
        } else if (typeof body === 'object') {
          preview = JSON.stringify({
            code: body.code || res.statusCode,
            message: body.message || '未知',
            data: body.data ? '有数据' : '无数据'
          });
        }
      } catch (e) {
        preview = `响应体长度: ${typeof body === 'string' ? body.length : '未知'}`;
      }
      console.log(`\x1b[36m[响应体预览]\x1b[0m ${preview}`);
    }
    
    return originalSend.apply(this, arguments);
  };
  
  next();
});

// 初始化数据库
initDatabase().then(async success => {
  console.log('数据库初始化状态:', success ? '成功' : '失败')
  
  try {
    // 获取数据库连接
    const sequelize = new Sequelize(process.env.DB_NAME || 'padia_user_feedback', 
                                   process.env.DB_USER || 'tongyong', 
                                   process.env.DB_PASSWORD || 'zhjh0704', {
      host: process.env.DB_HOST || '101.35.218.174',
      dialect: 'mysql',
      // 设置时区为北京时间
      timezone: '+08:00',
      dialectOptions: {
        dateStrings: true,
        typeCast: true,
        // 确保MySQL连接也使用正确的时区
        timezone: '+08:00'
      },
      define: {
        // 为所有模型设置时区处理
        timestamps: true,
        createdAt: true,
        updatedAt: true
      },
      // 只在错误时输出日志
      logging: (msg) => {
        if (msg.startsWith('Executing (default): SELECT 1+1')) {
          console.log('数据库连接成功');
        } else if (msg.includes('ERROR')) {
          console.error('数据库错误:', msg);
        } else if (process.env.DB_DEBUG === 'true') {
          // 仅在显式设置调试模式时才输出完整SQL
          console.log(msg);
        }
      }
    });
    
    // 查询issues表结构
    const [results] = await sequelize.query('SHOW COLUMNS FROM issues');
    const columns = results.map(col => col.Field);
    console.log('数据库表结构检查...');
    
    // 检查status字段类型
    const statusColumn = results.find(col => col.Field === 'status');
    if (statusColumn && statusColumn.Type.toLowerCase().includes('enum')) {
      console.log('检测到status字段为ENUM类型，正在修改为VARCHAR...');
      try {
        // 修改status字段为varchar(20)
        await sequelize.query('ALTER TABLE issues MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT "pending"');
        console.log('status字段类型修改成功');
      } catch (alterError) {
        console.error('修改status字段类型失败:', alterError);
      }
    } else {
      console.log('status字段类型正常');
    }
    
    // 检查priority字段类型
    const priorityColumn = results.find(col => col.Field === 'priority');
    if (priorityColumn && priorityColumn.Type.toLowerCase().includes('enum')) {
      console.log('检测到priority字段为ENUM类型，正在修改为VARCHAR...');
      try {
        // 修改priority字段为varchar(10)
        await sequelize.query('ALTER TABLE issues MODIFY COLUMN priority VARCHAR(10) NOT NULL DEFAULT "medium"');
        console.log('priority字段类型修改成功');
      } catch (alterError) {
        console.error('修改priority字段类型失败:', alterError);
      }
    } else {
      console.log('priority字段类型正常');
    }
    
    // 如果没有rating字段，添加它
    if (!columns.includes('rating')) {
      console.log('正在添加issues表的rating字段...');
      await sequelize.query('ALTER TABLE issues ADD COLUMN rating INT NULL DEFAULT NULL');
      console.log('rating字段添加成功');
    } else {
      console.log('issues表已存在rating字段');
    }

    // 检查并添加处理时间相关字段
    if (!columns.includes('processingAt')) {
      console.log('正在添加issues表的processingAt字段...');
      await sequelize.query('ALTER TABLE issues ADD COLUMN processingAt DATETIME NULL DEFAULT NULL');
      console.log('processingAt字段添加成功');
    } else {
      console.log('issues表已存在processingAt字段');
    }

    if (!columns.includes('resolvedAt')) {
      console.log('正在添加issues表的resolvedAt字段...');
      await sequelize.query('ALTER TABLE issues ADD COLUMN resolvedAt DATETIME NULL DEFAULT NULL');
      console.log('resolvedAt字段添加成功');
    } else {
      console.log('issues表已存在resolvedAt字段');
    }
  } catch (error) {
    console.error('数据库表结构检查/修复失败:', error);
  }
  
  // 检查并创建默认开发人员账号
  createDefaultDevelopers().catch(err => {
    console.error('创建默认开发人员账号失败:', err)
  })
}).catch(err => {
  console.error('数据库初始化错误:', err)
})

// 创建默认开发人员账号
const createDefaultDevelopers = async () => {
  try {
    // 创建默认管理员账号
    const adminUser = await User.findOne({
      where: { role: UserRole.ADMIN }
    });
    
    if (!adminUser) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // 明文密码
        role: UserRole.ADMIN
      });
      console.log('创建了默认管理员账号: admin (密码: admin123)');
    }
    
    // 创建测试用户账号
    const testUser = await User.findOne({
      where: { username: 'testuser' }
    });
    
    if (!testUser) {
      await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'test123', // 明文密码
        role: UserRole.USER
      });
      console.log('创建了测试用户账号: testuser (密码: test123)');
    }
    
    // 获取所有模块
    const modules = await Module.findAll()
    
    // 为每个模块创建一个开发人员账号（如果不存在）
    for (const module of modules) {
      // 检查是否已存在负责该模块的开发人员
      const existingDeveloper = await User.findOne({
        where: {
          role: UserRole.DEVELOPER,
          moduleId: module.id
        }
      })
      
      if (!existingDeveloper) {
        // 为模块创建开发人员账号
        const moduleCode = module.code.toLowerCase()
        const developerUsername = `dev_${moduleCode}`
        
        // 检查用户名是否已存在
        const existingUser = await User.findOne({
          where: { username: developerUsername }
        })
        
        if (!existingUser) {
          await User.create({
            username: developerUsername,
            email: `${developerUsername}@example.com`,
            password: 'dev123456', // 明文密码
            role: UserRole.DEVELOPER,
            moduleId: module.id
          })
          
          console.log(`为模块 ${module.name} 创建了开发人员账号: ${developerUsername}`)
        }
      }
    }
    
    console.log('默认开发人员账号检查完成')
  } catch (error) {
    console.error('创建默认开发人员账号错误:', error)
  }
}

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供token', data: null })
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'padia_user_feedback_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, message: 'token无效', data: null })
    }
    
    req.user = user
    next()
  })
}

// 权限验证中间件
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录', data: null })
    }
    
    if (roles.includes(req.user.role)) {
      next()
    } else {
      res.status(403).json({ code: 403, message: '无权访问', data: null })
    }
  }
}

// 登录API
app.post('/auth/login', async (req, res) => {
  try {
    console.log('【登录请求】收到数据:', req.body)
    
    const { username, password } = req.body
    
    if (!username || !password) {
      console.log('【登录失败】用户名或密码为空')
      return res.status(400).json({ 
        code: 400, 
        message: '用户名和密码不能为空', 
        data: null 
      })
    }
    
    // 查找用户（支持用户名或邮箱登录）
    let user = await User.findOne({ where: { username } })
    
    // 如果用户名没找到，尝试邮箱
    if (!user) {
      user = await User.findOne({ where: { email: username } })
    }
    
    console.log('【登录查询】用户查询结果:', user ? '找到用户' : '未找到用户')
    
    if (!user) {
      console.log('【登录失败】用户不存在:', username)
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null 
      })
    }
    
    console.log('【登录验证】用户信息:', { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      密码: user.password
    })
    
    // 验证密码(明文比较)
    const isPasswordValid = await user.validatePassword(password)
    console.log('【登录验证】密码验证结果:', isPasswordValid ? '密码正确' : '密码错误')
    
    if (!isPasswordValid) {
      console.log('【登录失败】密码错误:', username, '输入密码:', password, '数据库密码:', user.password)
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null
      })
    }
    
    // 生成token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'padia_user_feedback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      avatar: user.avatar || null
    }
    
    console.log('【登录成功】用户:', username, '角色:', user.role)
    
    // 返回登录成功响应
    const responseData = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userData
      }
    }
    
    console.log('【登录响应】数据:', JSON.stringify(responseData))
    return res.status(200).json(responseData)
  } catch (error) {
    console.error('【登录错误】异常:', error)
    return res.status(500).json({ 
      code: 500, 
      message: '服务器错误: ' + (error.message || '未知错误'), 
      data: null 
    })
  }
})

// 注册API
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名已存在', data: null })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) {
      return res.status(400).json({ code: 400, message: '邮箱已被注册', data: null })
    }
    
    // 创建用户 - 使用明文密码
    const newUser = await User.create({
      username,
      email,
      password, // 直接使用明文密码
      role: 'user'
    })
    
    res.json({
      code: 200,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email
        }
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取用户信息API
app.get('/auth/user-info', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    
    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        avatar: user.avatar || null
      }
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取所有功能模块API
app.get('/modules', async (req, res) => {
  try {
    const modules = await Module.findAll({
      attributes: ['id', 'name', 'code', 'description']
    })
    
    res.json({
      code: 200,
      message: '获取功能模块成功',
      data: modules
    })
  } catch (error) {
    console.error('获取功能模块错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 提交问题API
app.post('/issues', authenticateToken, async (req, res) => {
  try {
    const { title, description, moduleId, isPublic = true } = req.body
    
    // 验证必填字段
    if (!title || !description) {
      return res.status(400).json({ code: 400, message: '标题和描述不能为空', data: null })
    }
    
    // 验证模块ID
    let validModuleId = null
    if (moduleId) {
      const module = await Module.findByPk(moduleId)
      if (module) {
        validModuleId = module.id
      }
    }
    
    // 创建问题
    const newIssue = await Issue.create({
      title,
      description,
      status: 'pending',
      userId: req.user.id,
      moduleId: validModuleId,
      isPublic: isPublic === true || isPublic === 'true',
      priority: 'medium' // 默认优先级
    })
    
    console.log(`【问题提交】用户 ${req.user.username} 创建了问题: ${title}`)
    
    // 查找负责该模块的开发人员或默认开发人员
    let developer = null
    if (validModuleId) {
      developer = await User.findOne({
        where: {
          role: 'developer',
          moduleId: validModuleId
        }
      })
    }
    
    // 如果找不到模块负责的开发人员，分配给默认开发人员
    if (!developer) {
      developer = await User.findOne({
        where: {
          role: 'developer'
        }
      })
    }
    
    // 创建任务，分配给开发人员
    if (developer) {
      await Task.create({
        issueId: newIssue.id,
        assignedTo: developer.id,
        status: 'pending'
      })
      
      console.log(`【任务分配】问题 ${newIssue.id} 已分配给开发人员 ${developer.username}`)
      
      // 发送邮件通知开发人员
      try {
        // 查询完整的问题信息（包括用户信息）用于邮件发送
        const issueWithUser = await Issue.findByPk(newIssue.id, {
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
          ]
        });

        // 发送邮件通知
        await mailer.sendNewIssueNotification(issueWithUser, developer);
      } catch (emailError) {
        console.error('发送新问题通知邮件失败:', emailError);
        // 邮件发送失败不影响API响应
      }
    } else {
      console.log(`【任务分配】警告: 问题 ${newIssue.id} 无法分配，因为没有找到开发人员`)
    }
    
    // 返回新创建的问题ID
    res.json({
      code: 200,
      message: '问题提交成功',
      data: {
        id: newIssue.id
      }
    })
  } catch (error) {
    console.error('问题提交错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取用户问题列表API
app.get('/issues/user', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const status = req.query.status
    const search = req.query.search
    const offset = (page - 1) * pageSize
    
    // 构建查询条件
    const where = { userId: req.user.id }
    
    if (status) {
      // 处理状态过滤
      if (status === 'pending') {
        // 对于待处理状态，将除了处理中和已处理的所有状态归为待处理
        where.status = {
          [Op.notIn]: [IssueStatus.RESOLVED, IssueStatus.PROCESSING]
        }
      } else {
        // 处理中和已处理状态直接匹配
        where.status = status
      }
    }
    
    if (search) {
      where.title = { [Op.like]: `%${search}%` }
    }
    
    // 获取用户问题
    const { count, rows } = await Issue.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    })
    
    // 统计各状态问题数量
    // 获取处理中问题数
    const processing = await Issue.count({ 
      where: { 
        userId: req.user.id, 
        status: IssueStatus.PROCESSING 
      } 
    })
    
    // 获取已处理问题数
    const resolved = await Issue.count({ 
      where: { 
        userId: req.user.id, 
        status: IssueStatus.RESOLVED 
      } 
    })
    
    // 获取待处理问题数 - 除了处理中和已处理状态外的所有任务
    const pending = await Issue.count({ 
      where: { 
        userId: req.user.id, 
        status: {
          [Op.notIn]: [IssueStatus.RESOLVED, IssueStatus.PROCESSING]
        }
      } 
    })
    
    // 获取已关闭问题数
    const closed = await Issue.count({ 
      where: { 
        userId: req.user.id, 
        status: IssueStatus.CLOSED 
      } 
    })
    
    // 获取总问题数
    const total = await Issue.count({ 
      where: { 
        userId: req.user.id 
      } 
    })
    
    res.json({
      code: 200,
      message: '获取问题列表成功',
      data: {
        issues: rows,
        total: count,
        counts: {
          total,
          pending,
          processing,
          resolved,
          closed
        }
      }
    })
  } catch (error) {
    console.error('获取问题列表错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取开发者的任务列表API
app.get('/tasks', authenticateToken, checkRole(['developer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const status = req.query.status
    const search = req.query.search || ''
    const offset = (page - 1) * pageSize
    
    console.log(`【任务列表】开发者(${userId})请求任务列表:`, {
      page, pageSize, status, search
    })
    
    let tasksWhere = {}
    let issueWhere = {}
    
    // 如果不是管理员，则只显示分配给自己的任务
    if (userRole !== UserRole.ADMIN) {
      tasksWhere.assignedTo = userId
    }
    
    // 处理状态过滤
    if (status && status !== 'all') {
      issueWhere.status = status
    }
    
    // 处理搜索条件
    if (search) {
      issueWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    }
    
    // 查询任务列表
    const { count, rows: tasks } = await Task.findAndCountAll({
      where: tasksWhere,
      include: [
        {
          model: Issue,
          as: 'issue',
          where: issueWhere,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'avatar', 'factory', 'brand']
            },
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'name', 'code']
            }
          ]
        },
        {
          model: User,
          as: 'developer',
          attributes: ['id', 'username', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: offset
    })
    
    // 获取各状态的问题数量
    const totalTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: search ? issueWhere[Op.or] ? { [Op.and]: [{ [Op.or]: issueWhere[Op.or] }] } : {} : {}
      }]
    })
    
    const pendingTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'pending',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const processingTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'processing',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const resolvedTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'resolved',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const closedTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'closed',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    console.log(`【任务列表】找到任务数量:`, count)
    
    res.json({
      code: 200,
      message: '获取任务列表成功',
      data: {
        tasks,
        total: count,
        counts: {
          total: totalTasks,
          pending: pendingTasks,
          processing: processingTasks,
          resolved: resolvedTasks,
          closed: closedTasks
        }
      }
    })
  } catch (error) {
    console.error('【任务列表】获取任务列表错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 创建developer前缀的任务列表API路由
app.get('/developer/tasks', authenticateToken, checkRole(['developer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const status = req.query.status
    const search = req.query.search || ''
    const offset = (page - 1) * pageSize
    
    console.log(`【任务列表(developer)】开发者(${userId})请求任务列表:`, {
      page, pageSize, status, search
    })
    
    let tasksWhere = {}
    let issueWhere = {}
    
    // 如果不是管理员，则只显示分配给自己的任务
    if (userRole !== UserRole.ADMIN) {
      tasksWhere.assignedTo = userId
    }
    
    // 处理状态过滤
    if (status && status !== 'all') {
      issueWhere.status = status
    }
    
    // 处理搜索条件
    if (search) {
      issueWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    }
    
    // 查询任务列表
    const { count, rows: tasks } = await Task.findAndCountAll({
      where: tasksWhere,
      include: [
        {
          model: Issue,
          as: 'issue',
          where: issueWhere,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'avatar', 'factory', 'brand']
            },
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'name', 'code']
            }
          ]
        },
        {
          model: User,
          as: 'developer',
          attributes: ['id', 'username', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: offset
    })
    
    // 获取各状态的问题数量
    const totalTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: search ? issueWhere[Op.or] ? { [Op.and]: [{ [Op.or]: issueWhere[Op.or] }] } : {} : {}
      }]
    })
    
    const pendingTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'pending',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const processingTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'processing',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const resolvedTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'resolved',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    const closedTasks = await Task.count({
      where: tasksWhere,
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: 'closed',
          ...(search ? { [Op.or]: issueWhere[Op.or] } : {})
        }
      }]
    })
    
    console.log(`【任务列表(developer)】找到任务数量:`, count)
    
    res.json({
      code: 200,
      message: '获取任务列表成功',
      data: {
        tasks,
        total: count,
        counts: {
          total: totalTasks,
          pending: pendingTasks,
          processing: processingTasks,
          resolved: resolvedTasks,
          closed: closedTasks
        }
      }
    })
  } catch (error) {
    console.error('【任务列表(developer)】获取任务列表错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取开发者统计数据
app.get('/developer/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`获取开发者统计数据: 用户ID=${userId}, 角色=${req.user.role}, 是否管理员=${isAdmin}`);

    // 查询所有开发者任务
    const developerTasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'developer',
          attributes: ['id', 'username', 'email', 'avatar']
        },
        {
          model: Issue,
          as: 'issue'
        }
      ]
    });

    console.log(`找到开发者任务: ${developerTasks.length}个`);

    // 如果用户是管理员，获取所有开发者的统计数据
    if (isAdmin) {
      console.log('管理员视图: 处理统计数据');
      
      // 分组统计每个开发者的问题状态
      const developerStats = [];
      const developerMap = new Map();
      
      for (const task of developerTasks) {
        const developerId = task.assignedTo;
        const developer = task.developer;
        
        if (!developerMap.has(developerId)) {
          developerMap.set(developerId, {
            developer: {
              id: developer.id,
              username: developer.username,
              email: developer.email,
              avatar: developer.avatar
            },
            totalIssues: 0,
            pendingIssues: 0,
            processingIssues: 0,
            resolvedIssues: 0,
            ratingsCount: 0,
            averageRating: '0.0',
            responseTime: '0.0',
            resolveTime: '0.0',
            ratingSum: 0,
            respondedIssues: 0,
            resolvedIssuesWithTime: 0,
            responseTimeSum: 0,
            resolveTimeSum: 0
          });
        }
        
        const stats = developerMap.get(developerId);
        stats.totalIssues++;
        
        if (task.issue) {
          // 统计各状态问题数量
          switch (task.issue.status) {
            case 'pending':
              stats.pendingIssues++;
              break;
            case 'processing':
              stats.processingIssues++;
              break;
            case 'resolved':
              stats.resolvedIssues++;
              
              // 统计评分
              if (task.issue.rating > 0) {
                stats.ratingsCount++;
                stats.ratingSum += task.issue.rating;
              }
              
              // 响应时间和解决时间计算逻辑
              if (task.issue.processingAt && task.issue.createdAt) {
                const responseTime = (new Date(task.issue.processingAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
                if (responseTime >= 0) {
                  stats.respondedIssues++;
                  stats.responseTimeSum += responseTime;
                }
              }
              
              if (task.issue.status === 'resolved' && task.issue.resolvedAt && task.issue.createdAt) {
                const resolveTime = (new Date(task.issue.resolvedAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
                if (resolveTime >= 0) {
                  stats.resolvedIssuesWithTime++;
                  stats.resolveTimeSum += resolveTime;
                }
              }
              break;
          }
        }
      }
      
      // 计算平均评分和响应/解决时间
      for (const [developerId, stats] of developerMap) {
        if (stats.ratingsCount > 0) {
          stats.averageRating = (stats.ratingSum / stats.ratingsCount).toFixed(1);
        }
        
        if (stats.respondedIssues > 0) {
          stats.responseTime = (stats.responseTimeSum / stats.respondedIssues).toFixed(1);
        }
        
        if (stats.resolvedIssuesWithTime > 0) {
          stats.resolveTime = (stats.resolveTimeSum / stats.resolvedIssuesWithTime).toFixed(1);
        }
        
        // 删除内部计算字段
        delete stats.ratingSum;
        delete stats.respondedIssues;
        delete stats.resolvedIssuesWithTime;
        delete stats.responseTimeSum;
        delete stats.resolveTimeSum;
        
        developerStats.push(stats);
      }
      
      // 计算总体统计数据
      const totalIssues = developerStats.reduce((sum, dev) => sum + dev.totalIssues, 0);
      const pendingIssues = developerStats.reduce((sum, dev) => sum + dev.pendingIssues, 0);
      const processingIssues = developerStats.reduce((sum, dev) => sum + dev.processingIssues, 0);
      const resolvedIssues = developerStats.reduce((sum, dev) => sum + dev.resolvedIssues, 0);
      
      // 计算评分分布和平均评分
      let totalRatings = 0;
      let totalRatingSum = 0;
      const ratingsDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      for (const task of developerTasks) {
        if (task.issue && task.issue.rating > 0) {
          totalRatings++;
          totalRatingSum += task.issue.rating;
          
          // 更新评分分布
          const rating = Math.floor(task.issue.rating);
          if (rating >= 1 && rating <= 5) {
            ratingsDistribution[rating]++;
          }
        }
      }
      
      const averageRating = totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(1) : '0.0';
      
      // 计算总体响应时间和解决时间
      let totalResponseTimeSum = 0;
      let totalResolveTimeSum = 0;
      let totalRespondedIssues = 0;
      let totalResolvedIssuesWithTime = 0;
      
      for (const task of developerTasks) {
        if (task.issue) {
          // 响应时间：开发人员将问题状态更新为processing时间 - 问题提交时间
          if (task.issue.processingAt && task.issue.createdAt) {
            const responseTime = (new Date(task.issue.processingAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
            if (responseTime >= 0) {
              totalRespondedIssues++;
              totalResponseTimeSum += responseTime;
            }
          }
          
          // 解决时间：问题状态更新为resolved时间 - 问题提交时间
          if (task.issue.status === 'resolved' && task.issue.resolvedAt && task.issue.createdAt) {
            const resolveTime = (new Date(task.issue.resolvedAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
            if (resolveTime >= 0) {
              totalResolvedIssuesWithTime++;
              totalResolveTimeSum += resolveTime;
            }
          }
        }
      }
      
      // 平均响应时间=总响应时间/响应个数（即状态更新为正在处理+已解决的总个数）
      const avgResponseTime = totalRespondedIssues > 0 ? (totalResponseTimeSum / totalRespondedIssues).toFixed(1) : '0.0';
      // 平均解决时间=总解决时间/解决问题个数
      const avgResolveTime = totalResolvedIssuesWithTime > 0 ? (totalResolveTimeSum / totalResolvedIssuesWithTime).toFixed(1) : '0.0';
      
      return res.json({
      code: 200,
      message: '获取开发者统计数据成功',
      data: {
          summary: {
        totalIssues,
        pendingIssues,
        processingIssues,
        resolvedIssues,
            ratingsCount: totalRatings,
        averageRating,
        ratingsDistribution,
            avgResponseTime,
            avgResolveTime
          },
          developers: developerStats
        }
      });
    } else {
      // 普通开发者只看到自己的数据
      console.log('开发者视图: 处理统计数据');
      
      // 筛选当前开发者的任务
      const userTasks = developerTasks.filter(task => task.assignedTo === userId);
      console.log(`找到当前开发者任务: ${userTasks.length}个`);
      
      // 总体统计数据
      const totalIssues = developerTasks.length;
      const pendingIssues = developerTasks.filter(task => task.issue && task.issue.status === 'pending').length;
      const processingIssues = developerTasks.filter(task => task.issue && task.issue.status === 'processing').length;
      const resolvedIssues = developerTasks.filter(task => task.issue && task.issue.status === 'resolved').length;
      
      // 计算评分分布和平均评分
      let totalRatings = 0;
      let totalRatingSum = 0;
      const ratingsDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      for (const task of developerTasks) {
        if (task.issue && task.issue.rating > 0) {
          totalRatings++;
          totalRatingSum += task.issue.rating;
          
          // 更新评分分布
          const rating = Math.floor(task.issue.rating);
          if (rating >= 1 && rating <= 5) {
            ratingsDistribution[rating]++;
          }
        }
      }
      
      const overallAverageRating = totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(1) : '0.0';
      
      // 当前开发者统计
      let userTotalIssues = 0;
      let userPendingIssues = 0;
      let userProcessingIssues = 0;
      let userResolvedIssues = 0;
      let userRatingsCount = 0;
      let userRatingSum = 0;
      let userRespondedIssues = 0;
      let userResolvedIssuesWithTime = 0;
      let userResponseTimeSum = 0;
      let userResolveTimeSum = 0;
      const userRatingsDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      for (const task of userTasks) {
        userTotalIssues++;
        
        if (task.issue) {
          // 统计各状态问题数量
          switch (task.issue.status) {
            case 'pending':
              userPendingIssues++;
              break;
            case 'processing':
              userProcessingIssues++;
              break;
            case 'resolved':
              userResolvedIssues++;
              
              // 统计评分
              if (task.issue.rating > 0) {
                userRatingsCount++;
                userRatingSum += task.issue.rating;
                
                // 更新评分分布
                const rating = Math.floor(task.issue.rating);
                if (rating >= 1 && rating <= 5) {
                  userRatingsDistribution[rating]++;
                }
              }
              
              // 响应时间和解决时间计算逻辑
              if (task.issue.processingAt && task.issue.createdAt) {
                const responseTime = (new Date(task.issue.processingAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
                if (responseTime >= 0) {
                  userRespondedIssues++;
                  userResponseTimeSum += responseTime;
                }
              }
              
              if (task.issue.status === 'resolved' && task.issue.resolvedAt && task.issue.createdAt) {
                const resolveTime = (new Date(task.issue.resolvedAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
                if (resolveTime >= 0) {
                  userResolvedIssuesWithTime++;
                  userResolveTimeSum += resolveTime;
                }
              }
              break;
          }
        }
      }
      
      // 计算开发者平均评分和响应/解决时间
      const userAverageRating = userRatingsCount > 0 ? (userRatingSum / userRatingsCount).toFixed(1) : '0.0';
      const userResponseTime = userRespondedIssues > 0 ? (userResponseTimeSum / userRespondedIssues).toFixed(1) : '0.0';
      const userResolveTime = userResolvedIssuesWithTime > 0 ? (userResolveTimeSum / userResolvedIssuesWithTime).toFixed(1) : '0.0';
      
      // 计算总体响应时间和解决时间
      let totalResponseTimeSum = 0;
      let totalResolveTimeSum = 0;
      let totalRespondedIssues = 0;
      let totalResolvedIssuesWithTime = 0;
      
      for (const task of developerTasks) {
        if (task.issue) {
          // 响应时间：开发人员将问题状态更新为processing时间 - 问题提交时间
          if (task.issue.processingAt && task.issue.createdAt) {
            const responseTime = (new Date(task.issue.processingAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
            if (responseTime >= 0) {
              totalRespondedIssues++;
              totalResponseTimeSum += responseTime;
            }
          }
          
          // 解决时间：问题状态更新为resolved时间 - 问题提交时间
          if (task.issue.status === 'resolved' && task.issue.resolvedAt && task.issue.createdAt) {
            const resolveTime = (new Date(task.issue.resolvedAt) - new Date(task.issue.createdAt)) / (1000 * 60 * 60);
            if (resolveTime >= 0) {
              totalResolvedIssuesWithTime++;
              totalResolveTimeSum += resolveTime;
            }
          }
        }
      }
      
      // 平均响应时间=总响应时间/响应个数（即状态更新为正在处理+已解决的总个数）
      const avgResponseTime = totalRespondedIssues > 0 ? (totalResponseTimeSum / totalRespondedIssues).toFixed(1) : '0.0';
      // 平均解决时间=总解决时间/解决问题个数
      const avgResolveTime = totalResolvedIssuesWithTime > 0 ? (totalResolveTimeSum / totalResolvedIssuesWithTime).toFixed(1) : '0.0';
      
      return res.json({
        code: 200,
        message: '获取开发者统计数据成功',
        data: {
          summary: {
            totalIssues,
            pendingIssues,
            processingIssues,
            resolvedIssues,
            ratingsCount: totalRatings,
            averageRating: overallAverageRating,
            ratingsDistribution,
            avgResponseTime,
            avgResolveTime
          },
          totalIssues: userTotalIssues,
          pendingIssues: userPendingIssues,
          processingIssues: userProcessingIssues,
          resolvedIssues: userResolvedIssues,
          ratingsCount: userRatingsCount,
          averageRating: userAverageRating,
          responseTime: userResponseTime,
          resolveTime: userResolveTime,
          ratingsDistribution: userRatingsDistribution
        }
      });
    }
  } catch (error) {
    console.error('获取开发者统计数据错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后重试',
      data: null
    });
  }
});

// 获取热门问题API
app.get('/issues/hot', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const search = req.query.search
    const moduleId = req.query.module
    const offset = (page - 1) * pageSize
    
    console.log('【获取热门问题】查询参数:', { 
      页码: page, 
      每页数量: pageSize,
      搜索关键词: search,
      模块ID: moduleId 
    })
    
    // 构建查询条件
    const where = { 
      isPublic: true, 
      status: IssueStatus.RESOLVED
    }
    
    // 添加模块筛选
    if (moduleId && moduleId !== '') {
      where.moduleId = moduleId
    }
    
    // 添加关键词搜索
    if (search && search !== '') {
      where.title = { [Op.like]: `%${search}%` }
    }
    
    // 获取符合条件的热门问题，按浏览量排序
    const { count, rows } = await Issue.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
      ],
      order: [['views', 'DESC']], // 按浏览量降序排序
      limit: pageSize,
      offset
    })
    
    console.log(`【获取热门问题】找到 ${count} 条记录`)
    
    res.json({
      code: 200,
      message: '获取热门问题成功',
      data: {
        issues: rows,
        total: count
      }
    })
  } catch (error) {
    console.error('获取热门问题错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 创建热门问题测试数据API
app.post('/dev/create-hot-issues', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    console.log('【创建热门问题测试数据】管理员:', req.user.username);
    
    // 获取所有模块
    const modules = await Module.findAll();
    
    // 准备测试数据
    const testIssues = [
      {
        title: '系统性能优化建议',
        description: '<p>系统在处理大量数据时响应缓慢，建议优化数据库查询和前端渲染性能。</p>',
        moduleId: modules.length > 0 ? modules[0].id : null,
        userId: req.user.id,
        isPublic: true,
        status: IssueStatus.RESOLVED,
        views: Math.floor(Math.random() * 100) + 50, // 随机浏览量
        priority: 'medium',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 一周前
      },
      {
        title: '用户权限管理功能使用说明',
        description: '<p>详细介绍如何使用权限管理功能，包括角色创建、权限分配和用户管理等核心功能。</p>',
        moduleId: modules.length > 1 ? modules[1].id : (modules.length > 0 ? modules[0].id : null),
        userId: req.user.id,
        isPublic: true,
        status: IssueStatus.RESOLVED,
        views: Math.floor(Math.random() * 100) + 50,
        priority: 'high',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10天前
      },
      {
        title: '数据导出格式选择的最佳实践',
        description: '<p>分析不同数据导出格式(CSV、Excel、PDF)的优缺点，并提供选择建议。</p>',
        moduleId: modules.length > 2 ? modules[2].id : (modules.length > 0 ? modules[0].id : null),
        userId: req.user.id,
        isPublic: true,
        status: IssueStatus.RESOLVED,
        views: Math.floor(Math.random() * 100) + 50,
        priority: 'medium',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5天前
      },
      {
        title: '移动端显示适配问题解决方案',
        description: '<p>详细说明如何解决不同移动设备上的显示适配问题，包括响应式设计和触控优化。</p>',
        moduleId: modules.length > 0 ? modules[0].id : null,
        userId: req.user.id,
        isPublic: true,
        status: IssueStatus.RESOLVED,
        views: Math.floor(Math.random() * 100) + 100, // 较高浏览量
        priority: 'high',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
      },
      {
        title: '批量操作功能使用技巧',
        description: '<p>介绍系统中批量操作功能的高级使用技巧，提高工作效率。</p>',
        moduleId: modules.length > 1 ? modules[1].id : (modules.length > 0 ? modules[0].id : null),
        userId: req.user.id,
        isPublic: true,
        status: IssueStatus.RESOLVED,
        views: Math.floor(Math.random() * 100) + 75,
        priority: 'medium',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8天前
      }
    ];
    
    // 批量创建问题
    const createdIssues = await Issue.bulkCreate(testIssues);
    console.log(`【创建热门问题测试数据】成功创建 ${createdIssues.length} 条记录`);
    
    res.json({
      code: 200,
      message: `成功创建 ${createdIssues.length} 条热门问题测试数据`,
      data: {
        count: createdIssues.length
      }
    });
  } catch (error) {
    console.error('创建热门问题测试数据错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取问题详情API
app.get('/issues/:id', async (req, res) => {
  try {
    const issueId = parseInt(req.params.id)
    
    console.log(`【获取问题详情】问题ID: ${issueId}`);
    
    // 获取问题详情，明确指定要查询的字段
    const issue = await Issue.findByPk(issueId, {
      attributes: ['id', 'title', 'description', 'status', 'userId', 'moduleId', 'isPublic', 'priority', 'views', 'rating', 'createdAt', 'updatedAt'],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] },
        { 
          model: Comment, 
          as: 'comments',
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
          ]
        }
      ]
    })
    
    if (!issue) {
      console.log(`【获取问题详情】问题不存在: ${issueId}`);
      return res.status(404).json({ code: 404, message: '问题不存在', data: null })
    }
    
    // 更新问题浏览量
    issue.views = (issue.views || 0) + 1;
    await issue.save();
    console.log(`【问题浏览量】问题ID: ${issueId}, 新浏览量: ${issue.views}`);
    
    // 手动添加rating属性，如果数据库中不存在
    const issueData = issue.toJSON();
    if (!('rating' in issueData)) {
      issueData.rating = null;
    }
    
    console.log(`【获取问题详情】成功: ${issueId}`);
    
    res.json({
      code: 200,
      message: '获取问题详情成功',
      data: issueData
    })
  } catch (error) {
    console.error('获取问题详情错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 更新问题状态API
app.put('/issues/:id/status', authenticateToken, checkRole(['developer', 'admin']), async (req, res) => {
  try {
    const issueId = req.params.id
    const { status } = req.body
    
    console.log(`【状态更新】请求数据:`, { 
      问题ID: issueId, 
      新状态: status,
      用户ID: req.user.id, 
      用户角色: req.user.role 
    })
    
    if (!status) {
      return res.status(400).json({ code: 400, message: '状态不能为空', data: null })
    }
    
    // 校验状态值
    const validStatus = ['pending', 'processing', 'resolved', 'closed']
    if (!validStatus.includes(status)) {
      return res.status(400).json({ 
        code: 400, 
        message: `无效的状态值，有效值为: ${validStatus.join(', ')}`, 
        data: null 
      })
    }
    
    // 查询问题
    const issue = await Issue.findOne({ 
      where: { id: issueId },
      include: [{ model: User, as: 'user' }] // 包含用户信息用于发送邮件
    })
    
    if (!issue) {
      console.log(`【状态更新错误】问题不存在:`, issueId)
      return res.status(404).json({ code: 404, message: '问题不存在', data: null })
    }
    
    const previousStatus = issue.status
    console.log(`【状态更新】当前状态:`, previousStatus, '目标状态:', status)
    
    // 记录状态变更的时间
    const now = new Date()
    
    // 准备更新数据的对象
    const updateData = {
      status: status,
      updatedAt: now
    }
    
    // 如果状态变为处理中，记录处理开始时间
    if (status === 'processing' && previousStatus !== 'processing') {
      updateData.processingAt = now
      console.log(`【状态更新】将记录处理开始时间:`, now)
    }
    
    // 如果状态变为已解决，记录解决时间
    if (status === 'resolved' && previousStatus !== 'resolved') {
      updateData.resolvedAt = now
      console.log(`【状态更新】将记录解决时间:`, now)
    }
    
    console.log('【状态更新】将更新以下字段:', updateData)
    
    // 使用SQL直接更新，确保所有字段都能正确更新
    let updateSQL = 'UPDATE issues SET '
    const updateValues = []
    const updateColumns = []
    
    // 添加每个更新字段到SQL
    Object.keys(updateData).forEach(key => {
      updateColumns.push(`${key} = ?`)
      updateValues.push(updateData[key])
    })
    
    updateSQL += updateColumns.join(', ')
    updateSQL += ' WHERE id = ?'
    updateValues.push(issueId)
    
    console.log('【状态更新】执行SQL:', { sql: updateSQL, values: updateValues })
    
    // 执行SQL更新
    await sequelize.query(updateSQL, { 
      replacements: updateValues,
      type: sequelize.QueryTypes.UPDATE 
    })
    
    // 重新获取更新后的问题数据
    const updatedIssue = await Issue.findOne({ 
      where: { id: issueId },
      include: [{ model: User, as: 'user' }],
      attributes: [
        'id', 'title', 'status', 'processingAt', 'resolvedAt', 
        'createdAt', 'updatedAt'
      ]
    })
    
    console.log(`【状态更新成功】问题ID:`, issueId, '新状态:', status)
    console.log(`处理时间:`, updatedIssue.processingAt, '解决时间:', updatedIssue.resolvedAt)
    
    // 获取状态显示文本
    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending': return '待处理'
        case 'processing': return '处理中'
        case 'resolved': return '已解决'
        case 'closed': return '已关闭'
        default: return status
      }
    }
    
    // 发送邮件通知用户状态更新
    try {
      if (updatedIssue.user && updatedIssue.user.email) {
        // 状态变更时发送通知
        if (previousStatus !== status) {
          await mailer.sendStatusUpdateNotification(
            updatedIssue, 
            getStatusLabel(status)
          )

          // 如果状态变为已解决，额外发送已解决通知
          if (status === 'resolved') {
            await mailer.sendIssueResolvedNotification(updatedIssue)
          }
        }
      }
    } catch (emailError) {
      console.error('发送状态更新通知邮件失败:', emailError)
      // 邮件发送失败不影响API响应
    }
    
    res.json({
      code: 200,
      message: '更新问题状态成功',
      data: updatedIssue
    })
  } catch (error) {
    console.error('【状态更新错误】异常:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 添加评论API
app.post('/comments', authenticateToken, async (req, res) => {
  try {
    const { issueId, content } = req.body
    
    // 检查问题是否存在
    const issue = await Issue.findByPk(issueId, {
      include: [
        { model: User, as: 'user' }
      ]
    })
    
    if (!issue) {
      return res.status(404).json({ code: 404, message: '问题不存在', data: null })
    }
    
    // 创建评论
    const newComment = await Comment.create({
      issueId,
      userId: req.user.id,
      content
    })
    
    // 获取完整评论信息（包括用户信息）
    const comment = await Comment.findByPk(newComment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'email', 'role'] }
      ]
    })
    
    console.log(`【添加评论】用户 ${req.user.username} 为问题 ${issueId} 添加了评论`)
    
    // 查找对应的任务和开发人员
    const task = await Task.findOne({
      where: { issueId },
      include: [
        { model: User, as: 'developer', attributes: ['id', 'username', 'email', 'role'] }
      ]
    })
    
    // 发送邮件通知
    try {
      // 如果评论者是开发人员，通知用户
      if (req.user.role === 'developer' || req.user.role === 'admin') {
        // 通知问题提交者（用户）
        if (issue.user && issue.user.email && issue.user.id !== req.user.id) {
          await mailer.sendNewCommentNotification(issue, comment, issue.user)
        }
      } 
      // 如果评论者是普通用户，通知开发人员
      else if (req.user.role === 'user') {
        // 通知负责该问题的开发人员
        if (task && task.developer && task.developer.email) {
          await mailer.sendNewCommentNotification(issue, comment, task.developer)
        }
      }
    } catch (emailError) {
      console.error('发送评论通知邮件失败:', emailError)
      // 邮件发送失败不影响API响应
    }
    
    res.json({
      code: 200,
      message: '添加评论成功',
      data: comment
    })
  } catch (error) {
    console.error('添加评论错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 管理员API - 创建开发人员账号
app.post('/admin/developers', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, moduleId } = req.body
    
    // 验证模块是否存在
    if (moduleId) {
      const module = await Module.findByPk(moduleId)
      if (!module) {
        return res.status(404).json({ code: 404, message: '模块不存在', data: null })
      }
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名已存在', data: null })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) {
      return res.status(400).json({ code: 400, message: '邮箱已被注册', data: null })
    }
    
    // 检查是否已有开发人员负责该模块
    if (moduleId) {
      const existingDeveloper = await User.findOne({
        where: {
          role: UserRole.DEVELOPER,
          moduleId
        }
      })
      
      if (existingDeveloper) {
        return res.status(400).json({ 
          code: 400, 
          message: `该模块已有开发人员负责 (${existingDeveloper.username})`, 
          data: null 
        })
      }
    }
    
    // 创建开发人员账号 - 使用明文密码
    const newDeveloper = await User.create({
      username,
      email,
      password, // 直接使用明文密码
      role: UserRole.DEVELOPER,
      moduleId: moduleId || null
    })
    
    res.json({
      code: 200,
      message: '创建开发人员账号成功',
      data: {
        id: newDeveloper.id,
        username: newDeveloper.username,
        email: newDeveloper.email,
        role: newDeveloper.role,
        moduleId: newDeveloper.moduleId,
        password: password // 返回明文密码方便测试
      }
    })
  } catch (error) {
    console.error('创建开发人员账号错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取所有开发人员
app.get('/admin/developers', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const developers = await User.findAll({
      where: { role: UserRole.DEVELOPER },
      include: [
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
      ],
      attributes: ['id', 'username', 'email', 'moduleId', 'createdAt']
    })
    
    res.json({
      code: 200,
      message: '获取开发人员列表成功',
      data: developers
    })
  } catch (error) {
    console.error('获取开发人员列表错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 创建测试账号API (仅用于开发环境)
app.post('/dev/create-test-account', async (req, res) => {
  try {
    const { username, email, password, role } = req.body
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ 
        code: 400, 
        message: `用户名 ${username} 已存在`, 
        data: null 
      })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) {
      return res.status(400).json({ 
        code: 400, 
        message: `邮箱 ${email} 已被注册`, 
        data: null 
      })
    }
    
    // 创建用户 - 使用明文密码
    const newUser = await User.create({
      username,
      email,
      password, // 直接使用明文密码
      role: role || UserRole.USER
    })
    
    console.log(`创建了测试账号: ${username} (${role || 'user'})，密码: ${password}`)
    
    return res.status(200).json({
      code: 200,
      message: '测试账号创建成功',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        password: password // 返回明文密码方便测试
      }
    })
  } catch (error) {
    console.error('创建测试账号错误:', error)
    return res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    })
  }
})

// 提交问题评价API
app.post('/issues/:id/rating', authenticateToken, async (req, res) => {
  try {
    const issueId = parseInt(req.params.id)
    const { rating } = req.body

    console.log('提交问题评价:', {
      问题ID: issueId,
      用户ID: req.user.id,
      评分: rating
    })

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        code: 400,
        message: '无效的评分值，评分应为1-5之间的整数',
        data: null
      })
    }

    // 获取问题详情
    const issue = await Issue.findByPk(issueId)

    if (!issue) {
      return res.status(404).json({
        code: 404,
        message: '问题不存在',
        data: null
      })
    }

    // 更新问题评分
    issue.rating = rating
    
    // 如果问题状态不是已处理，则同时更新状态
    if (issue.status !== IssueStatus.RESOLVED) {
      issue.status = IssueStatus.RESOLVED
    }
    
    await issue.save()

    res.json({
      code: 200,
      message: '评价提交成功',
      data: issue
    })
  } catch (error) {
    console.error('提交问题评价错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 在导入其他路由前导入邮件服务
import * as logger from './utils/logger.js';

// 测试发送邮件接口 - 用于测试或开发环境发送邮件
app.get('/test-email', async (req, res) => {
  const { email, subject, content } = req.query;
    
  if (!email) {
    logger.warn(`测试邮件请求未提供email参数`);
    return res.status(400).json({ success: false, message: '缺少必要的email参数' });
  }
  
  logger.info(`收到测试邮件请求: 邮箱=${email}, 主题=${subject || '（默认主题）'}`);
  console.log(`\n====== 收到测试邮件请求 (根路径 GET /test-email) ======`);
  console.log(`- 邮箱: ${email}`);
  console.log(`- 主题: ${subject || '（默认主题）'}`);
  console.log(`- 内容长度: ${content ? content.length : 0}字符`);
  console.log(`- 请求来源: ${req.get('referer') || '直接请求'}`);
  console.log(`- 用户代理: ${req.get('user-agent') || '未知'}`);
  
  try {
    // 尝试发送邮件
    const emailSubject = subject || '测试邮件';
    const emailBody = content ? 
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
        ${content.replace(/\n/g, '<br>')}
       </div>` : 
      '<div>这是一封测试邮件，请忽略。</div>';
    
    // 发送邮件 - 使用新的mailer模块
    console.log(`----- 开始发送邮件 -----`);
    
    // 验证邮件服务连接
    const isConnected = await mailer.verifyConnection();
    
    if (!isConnected) {
      logger.error(`邮件服务连接失败`);
      console.error(`× 邮件服务连接失败，请检查配置`);
      console.log(`----- 邮件发送结束 -----\n`);
      return res.json({ success: false, message: '邮件服务连接失败，请检查配置' });
    }
    
    // 使用新的mailer模块发送邮件
    const result = await mailer.sendMail({
      to: email,
      subject: emailSubject,
      html: emailBody
    });
    
    if (result.success) {
      logger.info(`测试邮件发送成功: ${email}`);
      console.log(`✓ 测试邮件发送成功! 邮箱: ${email}`);
      console.log(`----- 邮件发送结束 -----\n`);
      return res.json({ success: true, message: '邮件发送成功' });
    } else {
      logger.error(`测试邮件发送失败: ${result.error}`);
      console.error(`× 邮件发送失败! 错误: ${result.error}`);
      console.log(`----- 邮件发送结束 -----\n`);
      // 重要改动: 即使发送失败也返回成功，避免前端处理复杂逻辑
      return res.json({ success: true, message: '邮件发送请求已接收（实际发送可能失败）' });
    }
  } catch (error) {
    logger.error(`测试邮件发送出错: ${error.message}`, error);
    console.error(`× 测试邮件发送出错: ${error.message}`);
    console.log(`----- 邮件发送结束 -----\n`);
    // 重要改动: 即使发送失败也返回成功，避免前端处理复杂逻辑
    return res.json({ success: true, message: '邮件发送请求已接收（但发送过程出错）' });
  }
});

// API路由
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/users', (await import('./routes/users.js')).default);
app.use('/api/developers', (await import('./routes/developers.js')).default);
app.use('/api/modules', (await import('./routes/modules.js')).default);
app.use('/api/issues', (await import('./routes/issues.js')).default);
app.use('/api/comments', (await import('./routes/comments.js')).default);
app.use('/api/tasks', (await import('./routes/tasks.js')).default);

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器已启动，端口: ${PORT}`)
  
  // 注释掉未定义的函数调用
  // await createAdminUser()
  
  // await createDefaultModules()
  
  // await createDefaultDevelopers()
  
  // 验证邮件服务连接
  try {
    const isConnected = await mailer.verifyConnection()
    console.log(`邮件服务连接状态: ${isConnected ? '正常' : '异常'}`)
    
    // 如果需要测试邮件发送功能，取消下面注释
    /*
    const testEmail = process.env.TEST_EMAIL || '接收测试邮件的邮箱'
    if (testEmail && isConnected) {
      console.log(`正在发送测试邮件到: ${testEmail}`)
      const result = await mailer.sendMail({
        to: testEmail,
        subject: 'PADIA反馈平台 - 邮件服务测试',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">邮件服务测试</h2>
            <p>这是一封测试邮件，用于验证PADIA反馈平台的邮件服务配置是否正确。</p>
            <p>如果您收到这封邮件，说明邮件服务已配置成功。</p>
            <p>服务器启动时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
              此邮件由系统自动发送，请勿直接回复。
            </p>
          </div>
        `
      })
      console.log('测试邮件发送结果:', result)
    }
    */
  } catch (error) {
    console.error('验证邮件服务连接时出错:', error)
  }
}) 

// 如果是开发环境，添加邮件测试路由
if (process.env.NODE_ENV === 'development') {
  /**
   * 测试邮件发送功能
   * 请求参数:
   * - email: 收件人邮箱
   */
  app.get('/api/test/email', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
      const email = req.query.email || req.user.email;
      
      if (!email) {
        return res.status(400).json({ 
          code: 400, 
          message: '缺少邮箱参数', 
          data: null 
        });
      }
      
      console.log(`【邮件测试】正在发送测试邮件到: ${email}`);
      
      // 验证邮件服务连接
      const isConnected = await mailer.verifyConnection();
      
      if (!isConnected) {
        return res.status(500).json({ 
          code: 500, 
          message: '邮件服务连接失败，请检查配置', 
          data: null 
        });
      }
      
      // 发送测试邮件
      const result = await mailer.sendMail({
        to: email,
        subject: 'PADIA反馈平台 - 邮件服务测试',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">邮件服务测试</h2>
            <p>这是一封测试邮件，用于验证PADIA反馈平台的邮件服务配置是否正确。</p>
            <p>如果您收到这封邮件，说明邮件服务已配置成功！</p>
            <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p>邮件配置信息:</p>
            <ul>
              <li>服务器: ${process.env.MAIL_HOST || '默认配置'}</li>
              <li>端口: ${process.env.MAIL_PORT || '默认配置'}</li>
              <li>发件人: ${process.env.MAIL_USER || '默认配置'}</li>
            </ul>
            <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
              此邮件由系统自动发送，请勿直接回复。
            </p>
          </div>
        `
      });
      
      console.log('测试邮件发送结果:', result);
      
      if (result.success) {
        res.json({
          code: 200,
          message: '测试邮件发送成功',
          data: {
            email,
            messageId: result.messageId,
            sentAt: new Date()
          }
        });
      } else {
        res.status(500).json({
          code: 500,
          message: '测试邮件发送失败',
          data: {
            error: result.error
          }
        });
      }
    } catch (error) {
      console.error('测试邮件发送错误:', error);
      res.status(500).json({ 
        code: 500, 
        message: '服务器错误', 
        data: { error: error.message } 
      });
    }
  });
  
  // 添加一个查看邮件配置信息的接口
  app.get('/api/test/email-config', authenticateToken, checkRole(['admin']), (req, res) => {
    // 隐藏密码，只返回部分配置信息
    const config = {
      host: process.env.MAIL_HOST || 'smtp.exmail.qq.com',
      port: process.env.MAIL_PORT || 465,
      user: process.env.MAIL_USER || '未配置',
      secure: true,
      configured: !!process.env.MAIL_USER && !!process.env.MAIL_PASS
    };
    
    res.json({
      code: 200,
      message: '获取邮件配置成功',
      data: config
    });
  });
}