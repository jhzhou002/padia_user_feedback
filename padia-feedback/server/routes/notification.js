const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');

// 获取指定用户的未读通知数量
router.get('/unread/count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找与用户相关的未读任务和问题
    const taskCount = await Task.countDocuments({
      developer: userId,
      'messages.isRead': false
    });
    
    const issueCount = await Issue.countDocuments({
      assignedDeveloper: userId,
      'messages.isRead': false
    });
    
    const totalCount = taskCount + issueCount;
    
    res.json({
      code: 200,
      message: '获取未读通知数量成功',
      data: {
        total: totalCount,
        taskCount,
        issueCount
      }
    });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，获取未读通知数量失败',
      error: error.message
    });
  }
});

// 获取指定用户的未读通知列表
router.get('/unread/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找与用户相关的未读任务消息
    const tasks = await Task.find({
      developer: userId,
      'messages.isRead': false
    })
    .select('_id title lastUpdated messages status')
    .sort({ lastUpdated: -1 });
    
    // 查找与用户相关的未读问题消息
    const issues = await Issue.find({
      assignedDeveloper: userId,
      'messages.isRead': false
    })
    .select('_id title lastUpdated messages status')
    .sort({ lastUpdated: -1 });
    
    // 整合未读消息
    const unreadMessages = [
      ...tasks.map(task => ({
        id: task._id,
        type: 'task',
        title: task.title,
        lastUpdated: task.lastUpdated,
        status: task.status,
        unreadCount: task.messages.filter(m => !m.isRead).length,
        messages: task.messages.filter(m => !m.isRead).map(m => ({
          id: m._id,
          content: m.content,
          sender: m.sender,
          createdAt: m.createdAt
        }))
      })),
      ...issues.map(issue => ({
        id: issue._id,
        type: 'issue',
        title: issue.title,
        lastUpdated: issue.lastUpdated,
        status: issue.status,
        unreadCount: issue.messages.filter(m => !m.isRead).length,
        messages: issue.messages.filter(m => !m.isRead).map(m => ({
          id: m._id,
          content: m.content,
          sender: m.sender,
          createdAt: m.createdAt
        }))
      }))
    ];
    
    // 按最后更新时间排序
    unreadMessages.sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    );
    
    res.json({
      code: 200,
      message: '获取未读通知列表成功',
      data: unreadMessages
    });
  } catch (error) {
    console.error('获取未读通知列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，获取未读通知列表失败',
      error: error.message
    });
  }
});

// 标记指定任务或问题的所有消息为已读
router.put('/mark-as-read', auth, async (req, res) => {
  try {
    const { type, id } = req.body;
    
    if (!type || !id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    if (!['task', 'issue'].includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '类型参数无效'
      });
    }
    
    // 根据类型选择模型
    const Model = type === 'task' ? Task : Issue;
    const userIdField = type === 'task' ? 'developer' : 'assignedDeveloper';
    
    // 查找并更新所有未读消息
    const result = await Model.findOneAndUpdate(
      { 
        _id: id,
        [userIdField]: req.user.id
      },
      { 
        $set: { 'messages.$[elem].isRead': true } 
      },
      {
        arrayFilters: [{ 'elem.isRead': false }],
        new: true
      }
    );
    
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '未找到指定记录或您无权操作'
      });
    }
    
    res.json({
      code: 200,
      message: '标记为已读成功',
      data: { id, type }
    });
  } catch (error) {
    console.error('标记为已读失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，标记为已读失败',
      error: error.message
    });
  }
});

// 标记所有通知为已读
router.put('/mark-all-as-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 更新所有任务的未读消息
    await Task.updateMany(
      { developer: userId },
      { $set: { 'messages.$[elem].isRead': true } },
      { arrayFilters: [{ 'elem.isRead': false }] }
    );
    
    // 更新所有问题的未读消息
    await Issue.updateMany(
      { assignedDeveloper: userId },
      { $set: { 'messages.$[elem].isRead': true } },
      { arrayFilters: [{ 'elem.isRead': false }] }
    );
    
    res.json({
      code: 200,
      message: '所有通知已标记为已读'
    });
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，标记所有通知为已读失败',
      error: error.message
    });
  }
});

module.exports = router; 