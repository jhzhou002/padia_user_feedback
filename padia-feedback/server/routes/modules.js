import express from 'express';
import { Module } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取所有模块
router.get('/', async (req, res) => {
  try {
    const modules = await Module.findAll({
      attributes: ['id', 'name', 'code', 'description']
    });
    
    res.json({
      code: 200,
      message: '获取模块列表成功',
      data: modules
    });
  } catch (error) {
    console.error('获取模块列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 获取模块详情
router.get('/:id', async (req, res) => {
  try {
    const moduleId = req.params.id;
    
    const module = await Module.findByPk(moduleId);
    
    if (!module) {
      return res.status(404).json({
        code: 404,
        message: '模块不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取模块详情成功',
      data: module
    });
  } catch (error) {
    console.error('获取模块详情错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

export default router; 