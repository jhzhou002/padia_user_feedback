// 用户登录
router.post('/login', async (req, res) => {
  try {
    console.log('登录请求:', req.body)
    
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ 
        code: 400, 
        message: '用户名和密码不能为空', 
        data: null 
      })
    }
    
    // 查找用户
    const user = await User.findOne({ where: { username } })
    console.log('查找用户结果:', user ? '找到用户' : '未找到用户')
    
    if (!user) {
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null 
      })
    }
    
    // 验证密码
    const isValidPassword = await user.validatePassword(password)
    console.log('密码验证结果:', isValidPassword ? '密码正确' : '密码错误')
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null 
      })
    }
    
    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )
    
    // 返回用户信息和token（不包含密码）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
    
    console.log('登录成功，返回数据')
    
    return res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userData
      }
    })
    
  } catch (error) {
    console.error('登录错误:', error)
    return res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    })
  }
}) 