import express from 'express';
import { User, Module } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取开发者列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const developers = await User.findAll({
      where: { role: 'developer' },
      include: [
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
      ],
      attributes: ['id', 'username', 'email', 'moduleId', 'createdAt']
    });
    
    res.json({
      code: 200,
      message: '获取开发者列表成功',
      data: developers
    });
  } catch (error) {
    console.error('获取开发者列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 获取开发者详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const developerId = req.params.id;
    
    const developer = await User.findOne({
      where: { 
        id: developerId,
        role: 'developer'
      },
      include: [
        { model: Module, as: 'module', attributes: ['id', 'name', 'code'] }
      ],
      attributes: ['id', 'username', 'email', 'moduleId', 'createdAt']
    });
    
    if (!developer) {
      return res.status(404).json({
        code: 404,
        message: '开发者不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取开发者详情成功',
      data: developer
    });
  } catch (error) {
    console.error('获取开发者详情错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

export default router; 