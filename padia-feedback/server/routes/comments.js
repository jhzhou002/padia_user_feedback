import express from 'express';
import { Comment, User, Issue } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取问题的所有评论
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    
    const comments = await Comment.findAll({
      where: { issueId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      code: 200,
      message: '获取评论列表成功',
      data: comments
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 创建评论
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, issueId } = req.body;
    const userId = req.user.id;
    
    if (!content || !issueId) {
      return res.status(400).json({
        code: 400,
        message: '内容和问题ID不能为空',
        data: null
      });
    }
    
    // 检查问题是否存在
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({
        code: 404,
        message: '问题不存在',
        data: null
      });
    }
    
    const comment = await Comment.create({
      content,
      issueId,
      userId
    });
    
    // 获取包含用户信息的完整评论
    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.status(201).json({
      code: 201,
      message: '创建评论成功',
      data: fullComment
    });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

// 删除评论
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: '评论不存在',
        data: null
      });
    }
    
    // 检查权限：只有评论作者和管理员可以删除评论
    if (comment.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权限删除此评论',
        data: null
      });
    }
    
    await comment.destroy();
    
    res.json({
      code: 200,
      message: '删除评论成功',
      data: null
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误', 
      data: null 
    });
  }
});

export default router; 