import express from 'express';
import { Task, User, Issue } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取所有任务
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Issue,
          as: 'issue',
          attributes: ['id', 'title', 'status']
        }
      ]
    });
    
    res.json({
      code: 200,
      message: '获取任务列表成功',
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 获取任务详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Issue,
          as: 'issue',
          attributes: ['id', 'title', 'status', 'description']
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取任务详情成功',
      data: task
    });
  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 创建任务
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, issueId, assigneeId, deadline } = req.body;
    
    if (!title || !issueId) {
      return res.status(400).json({
        code: 400,
        message: '标题和关联问题不能为空',
        data: null
      });
    }
    
    const task = await Task.create({
      title,
      description,
      issueId,
      assigneeId,
      deadline,
      status: 'pending'
    });
    
    res.status(201).json({
      code: 201,
      message: '创建任务成功',
      data: task
    });
    
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 更新任务状态
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        code: 400,
        message: '状态不能为空',
        data: null
      });
    }
    
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      });
    }
    
    task.status = status;
    await task.save();
    
    res.json({
      code: 200,
      message: '更新任务状态成功',
      data: task
    });
    
  } catch (error) {
    console.error('更新任务状态错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

export default router; 