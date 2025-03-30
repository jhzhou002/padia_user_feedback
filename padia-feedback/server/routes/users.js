import express from 'express';
import { User } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取用户列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'avatar', 'createdAt']
    });
    
    res.json({
      code: 200,
      message: '获取用户列表成功',
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 获取用户详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'avatar', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取用户详情成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

export default router; 