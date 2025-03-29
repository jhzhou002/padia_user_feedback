import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Sequelize, Op } from 'sequelize'
import { initDatabase, User, Issue, Task, Comment, Module, UserRole, IssueStatus, ModuleType, sequelize } from '../src/db/models/index.js'

const app = express()
const PORT = process.env.PORT || 3000

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
      logging: false
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
    const { title, description, isPublic, moduleId } = req.body
    
    // 创建问题
    const newIssue = await Issue.create({
      title,
      description,
      status: IssueStatus.PENDING,
      isPublic: isPublic !== undefined ? isPublic : true,
      userId: req.user.id,
      moduleId: moduleId || null
    })
    
    // 如果指定了模块，尝试自动分配给对应模块的开发人员
    if (moduleId) {
      // 查找负责该模块的开发人员
      const developer = await User.findOne({
        where: {
          role: UserRole.DEVELOPER,
          moduleId
        }
      })
      
      if (developer) {
        // 创建任务并分配给开发人员
        await Task.create({
          issueId: newIssue.id,
          assignedTo: developer.id,
          remark: `自动分配的任务 - 来自模块: ${moduleId}`
        })
        
        console.log(`问题 #${newIssue.id} 已自动分配给开发人员 #${developer.id}`)
      }
    }
    
    res.json({
      code: 200,
      message: '问题提交成功',
      data: newIssue
    })
  } catch (error) {
    console.error('提交问题错误:', error)
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

// 获取开发人员任务API
app.get('/tasks', authenticateToken, checkRole(['developer']), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, search } = req.query
    const developerId = req.user.id
    const offset = (page - 1) * pageSize

    let issueWhere = {}
    
    // 处理搜索
    if (search) {
      issueWhere.title = { [Op.like]: `%${search}%` }
    }

    // 处理状态过滤
    if (status) {
      if (status === 'pending') {
        // 对于待处理状态，将除了已处理和处理中的所有状态归为待处理
        issueWhere.status = {
          [Op.notIn]: [IssueStatus.RESOLVED, IssueStatus.PROCESSING]
        }
      } else {
        // 处理中和已处理状态直接匹配
        issueWhere.status = status
      }
    }

    // 查询开发人员负责的任务总数
    const counts = {
      total: 0,
      pending: 0,
      processing: 0,
      resolved: 0,
      closed: 0
    }

    // 获取总任务数
    counts.total = await Task.count({
      where: { assignedTo: developerId },
      include: [{ model: Issue, as: 'issue' }]
    })

    // 获取处理中任务数
    counts.processing = await Task.count({
      where: { assignedTo: developerId },
      include: [{
        model: Issue,
        as: 'issue',
        where: { status: IssueStatus.PROCESSING }
      }]
    })

    // 获取已处理任务数
    counts.resolved = await Task.count({
      where: { assignedTo: developerId },
      include: [{
        model: Issue,
        as: 'issue',
        where: { status: IssueStatus.RESOLVED }
      }]
    })

    // 获取待处理任务数 - 除了处理中和已处理状态外的所有任务
    counts.pending = await Task.count({
      where: { assignedTo: developerId },
      include: [{
        model: Issue,
        as: 'issue',
        where: {
          status: {
            [Op.notIn]: [IssueStatus.RESOLVED, IssueStatus.PROCESSING]
          }
        }
      }]
    })

    // 查询开发人员负责的任务
    const { count, rows } = await Task.findAndCountAll({
      where: { assignedTo: developerId },
      include: [
        {
          model: Issue,
          as: 'issue',
          where: issueWhere,
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] },
            { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
          ]
        },
        { model: User, as: 'developer', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    })

    res.json({
      code: 200,
      message: '获取任务列表成功',
      data: {
        tasks: rows,
        total: count,
        counts: counts
      }
    })
  } catch (error) {
    console.error('获取任务列表错误:', error)
    res.status(500).json({ code: 500, message: '服务器错误', data: null })
  }
})

// 获取开发者统计数据API
app.get('/developer/statistics', authenticateToken, checkRole(['developer', 'admin']), async (req, res) => {
  try {
    const developerId = req.user.id;
    console.log(`【开发者统计】获取统计数据，开发者ID: ${developerId}`);
    
    // 获取开发者负责的所有问题(通过任务关联)
    const developerTasks = await Task.findAll({
      where: { assignedTo: developerId },
      include: [{ model: Issue, as: 'issue' }]
    });
    
    // 提取问题ID
    const issueIds = developerTasks.map(task => task.issue ? task.issue.id : null).filter(id => id !== null);
    
    // 获取这些问题的详细信息
    const issues = await Issue.findAll({
      where: { id: { [Op.in]: issueIds } },
      attributes: [
        'id', 'status', 'createdAt', 'updatedAt', 'rating',
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('HOUR'), sequelize.col('createdAt'), sequelize.literal('CASE WHEN status="viewed" OR status="processing" OR status="resolved" THEN updatedAt ELSE NOW() END')), 'responseTime'],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('HOUR'), sequelize.col('createdAt'), sequelize.literal('CASE WHEN status="resolved" THEN updatedAt ELSE NOW() END')), 'resolveTime']
      ]
    });
    
    // 统计各种指标
    const totalIssues = issues.length;
    // 待处理计数包含所有非处理中和非已处理的任务
    const pendingIssues = issues.filter(issue => 
      ![IssueStatus.PROCESSING, IssueStatus.RESOLVED].includes(issue.status)
    ).length;
    const processingIssues = issues.filter(issue => issue.status === IssueStatus.PROCESSING).length;
    const resolvedIssues = issues.filter(issue => issue.status === IssueStatus.RESOLVED).length;
    
    // 处理评分相关统计
    const ratedIssues = issues.filter(issue => issue.rating !== null && issue.rating > 0);
    const ratingsCount = ratedIssues.length;
    const totalRating = ratedIssues.reduce((sum, issue) => sum + issue.rating, 0);
    const averageRating = ratingsCount > 0 ? (totalRating / ratingsCount).toFixed(1) : 0;
    
    // 统计评分分布
    const ratingsDistribution = {
      '1': ratedIssues.filter(issue => issue.rating === 1).length,
      '2': ratedIssues.filter(issue => issue.rating === 2).length,
      '3': ratedIssues.filter(issue => issue.rating === 3).length,
      '4': ratedIssues.filter(issue => issue.rating === 4).length,
      '5': ratedIssues.filter(issue => issue.rating === 5).length
    };
    
    // 计算平均响应时间和解决时间
    const respondedIssues = issues.filter(issue => 
      issue.status === IssueStatus.VIEWED || 
      issue.status === IssueStatus.PROCESSING || 
      issue.status === IssueStatus.RESOLVED
    );
    
    const resolvedIssuesData = issues.filter(issue => issue.status === IssueStatus.RESOLVED);
    
    // 计算平均响应时间（小时）
    const totalResponseTime = respondedIssues.reduce((sum, issue) => {
      const responseTime = issue.dataValues.responseTime;
      return sum + (responseTime || 0);
    }, 0);
    
    // 计算平均解决时间（小时）
    const totalResolveTime = resolvedIssuesData.reduce((sum, issue) => {
      const resolveTime = issue.dataValues.resolveTime;
      return sum + (resolveTime || 0);
    }, 0);
    
    const responseTime = respondedIssues.length > 0 ? (totalResponseTime / respondedIssues.length).toFixed(1) : 0;
    const resolveTime = resolvedIssuesData.length > 0 ? (totalResolveTime / resolvedIssuesData.length).toFixed(1) : 0;
    
    // 返回统计数据
    res.json({
      code: 200,
      message: '获取开发者统计数据成功',
      data: {
        totalIssues,
        pendingIssues,
        processingIssues,
        resolvedIssues,
        ratingsCount,
        averageRating,
        ratingsDistribution,
        responseTime,
        resolveTime
      }
    });
  } catch (error) {
    console.error('获取开发者统计数据错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
})

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
    const issueId = parseInt(req.params.id)
    const { status } = req.body
    
    console.log(`【状态更新】接收到PUT请求:`, { 
      issueId, 
      状态: status,
      body: req.body,
      用户ID: req.user.id,
      请求头: req.headers
    })
    
    // 检查状态是否有效
    const validStatusValues = Object.values(IssueStatus)
    console.log(`【状态验证】接收到状态:`, status, `类型:`, typeof status)
    console.log(`【状态验证】有效状态列表:`, validStatusValues)
    
    if (!status || !validStatusValues.includes(status)) {
      console.log(`【状态更新错误】无效状态:`, status, `不在有效列表中:`, validStatusValues)
      return res.status(400).json({ code: 400, message: `无效的状态: "${status}"`, data: null })
    }
    
    // 更新问题状态
    const issue = await Issue.findByPk(issueId)
    
    if (!issue) {
      console.log(`【状态更新错误】问题不存在:`, issueId)
      return res.status(404).json({ code: 404, message: '问题不存在', data: null })
    }
    
    console.log(`【状态更新】当前状态:`, issue.status, '目标状态:', status)
    
    issue.status = status
    await issue.save()
    
    console.log(`【状态更新成功】问题ID:`, issueId, '新状态:', status)
    
    res.json({
      code: 200,
      message: '更新问题状态成功',
      data: issue
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
    const issue = await Issue.findByPk(issueId)
    
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
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
      ]
    })
    
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，端口: ${PORT}`)
}) 