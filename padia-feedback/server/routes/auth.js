import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../src/db/models/index.js';
import * as logger from '../utils/logger.js';

const router = express.Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    console.log('【登录请求】收到数据:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('【登录失败】用户名或密码为空');
      return res.status(400).json({ 
        code: 400, 
        message: '用户名和密码不能为空', 
        data: null 
      });
    }
    
    // 查找用户（支持用户名或邮箱登录）
    let user = await User.findOne({ where: { username } });
    
    // 如果用户名没找到，尝试邮箱
    if (!user) {
      user = await User.findOne({ where: { email: username } });
    }
    
    console.log('【登录查询】用户查询结果:', user ? '找到用户' : '未找到用户');
    
    if (!user) {
      console.log('【登录失败】用户不存在:', username);
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null 
      });
    }
    
    console.log('【登录验证】用户信息:', { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      密码: user.password
    });
    
    // 验证密码(明文比较)
    const isPasswordValid = await user.validatePassword(password);
    console.log('【登录验证】密码验证结果:', isPasswordValid ? '密码正确' : '密码错误');
    
    if (!isPasswordValid) {
      console.log('【登录失败】密码错误:', username, '输入密码:', password, '数据库密码:', user.password);
      return res.status(401).json({ 
        code: 401, 
        message: '用户名或密码错误', 
        data: null
      });
    }
    
    // 生成token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'padia_user_feedback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      avatar: user.avatar || null
    };
    
    console.log('【登录成功】用户:', username, '角色:', user.role);
    
    // 返回登录成功响应
    const responseData = {
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userData
      }
    };
    
    console.log('【登录响应】数据:', JSON.stringify(responseData));
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('【登录错误】异常:', error);
    return res.status(500).json({ 
      code: 500, 
      message: '服务器错误: ' + (error.message || '未知错误'), 
      data: null 
    });
  }
});

// 注册API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名已存在', data: null });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ code: 400, message: '邮箱已被注册', data: null });
    }
    
    // 创建用户 - 使用明文密码
    const newUser = await User.create({
      username,
      email,
      password, // 直接使用明文密码
      role: 'user'
    });
    
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
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取用户信息API
router.get('/user-info', async (req, res) => {
  try {
    // 从请求头中获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌', data: null });
    }
    
    // 验证token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'padia_user_feedback_secret_key'
    );
    
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
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
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router; 