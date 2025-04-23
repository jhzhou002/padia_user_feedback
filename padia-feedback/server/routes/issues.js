import express from 'express';
import { Issue, User, Module, Task } from '../../src/db/models/index.js';
import { authMiddleware } from '../middleware/auth.js';
// 替换emailService引用为mailer
// import emailService from '../services/emailService.js';
import mailer from '../mailer.js';
import * as logger from '../utils/logger.js';
import nodemailer from 'nodemailer';
import axios from 'axios';

const router = express.Router();

// 提交问题新路由 - 前端直接发送到 /issues 的请求
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { description, moduleId, title, screenshots } = req.body;
    const userId = req.user.id;
    
    console.log('\n============ 收到提交问题请求 (/issues) ============');
    console.log(`用户ID: ${userId}`);
    console.log(`模块ID: ${moduleId}`);
    console.log(`标题长度: ${title ? title.length : 0}`);
    console.log(`描述长度: ${description ? description.length : 0}`);
    console.log(`截图数量: ${screenshots ? screenshots.length : 0}`);
    
    // 验证必要的字段
    if (!description) {
      console.log('提交问题验证失败: 缺少描述');
      return res.status(400).json({ message: '请提供问题描述' });
    }
    
    if (!moduleId) {
      console.log('提交问题验证失败: 缺少模块ID');
      return res.status(400).json({ message: '请选择问题所属的模块' });
    }
    
    // 验证模块是否存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      console.log(`提交问题验证失败: 模块不存在 (ID: ${moduleId})`);
      return res.status(404).json({ message: '所选模块不存在' });
    }
    console.log(`模块验证通过: ${module.name} (ID: ${moduleId})`);
    
    // 查找该模块负责的开发者
    const developer = await User.findOne({
      where: {
        role: 'developer',
        moduleId: moduleId
      }
    });
    
    if (developer) {
      console.log(`找到负责的开发者: ${developer.username} (${developer.email || '无邮箱'})`);
    } else {
      console.log(`未找到模块 ${module.name} 的负责开发者`);
    }
    
    // 创建问题记录
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === '') {
      // 如果没有提供标题，生成一个简单标题
      finalTitle = `关于${module.name}的反馈 (${new Date().toLocaleDateString('zh-CN')})`;
      console.log(`自动生成标题: ${finalTitle}`);
    }
    
    // 创建问题
    const newIssue = await Issue.create({
      title: finalTitle,
      description,
      status: 'pending',
      userId,
      moduleId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`问题创建成功: ID ${newIssue.id} - ${finalTitle}`);
    
    // 如果有截图，保存截图
    if (screenshots && screenshots.length > 0) {
      try {
        console.log(`截图数据可用，但当前未实现截图保存功能`);
        // 这里可以添加截图处理逻辑，例如将Base64保存到文件系统或云存储
      } catch (screenshotError) {
        console.error('处理截图失败:', screenshotError.message);
        logger.error('处理截图失败:', screenshotError);
        // 处理截图失败不影响问题提交
      }
    }
    
    // 跟踪邮件发送状态
    let emailSent = false;
    
    // 查询是否有开发者负责此模块，并创建对应的任务
    if (developer) {
      console.log(`为开发者 ${developer.username} 创建任务...`);
      try {
        // 为该开发者创建任务
        const newTask = await Task.create({
          issueId: newIssue.id,
          assignedTo: developer.id,
          priority: 'normal', // 默认优先级
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`问题 #${newIssue.id} 已自动分配给开发人员 #${developer.id}`);
        
        // 任务创建成功后立即发送邮件通知
        if (developer.email) {
          console.log(`\n====== 开始发送邮件通知给开发者 ======`);
          logger.info(`开始向开发者 ${developer.username} (${developer.email}) 发送问题通知邮件`);
          console.log(`开发者: ${developer.username}`);
          console.log(`邮箱: ${developer.email}`);
          
          // 使用新的专用方法发送开发者通知邮件
          try {
            const result = await mailer.sendDeveloperNotification(
              developer.email,
              newIssue,
              module.name
            );
            
            if (result) {
              console.log(`✓ 开发者通知邮件发送成功!`);
              logger.info(`成功发送通知邮件到 ${developer.email}`);
              emailSent = true;
            } else {
              console.log(`× 开发者通知邮件发送失败!`);
              logger.error(`发送通知邮件到 ${developer.email} 失败`);
            }
          } catch (emailError) {
            console.error(`邮件发送过程中出错: ${emailError.message}`);
            logger.error(`邮件发送过程中出错: ${emailError.message}`, emailError);
          }
          
          console.log(`====== 邮件通知结束 (${emailSent ? '成功' : '失败'}) ======\n`);
          logger.info(`邮件通知结束 (${emailSent ? '成功' : '失败'}), 开发者: ${developer.username}, 邮箱: ${developer.email}`);
        } else {
          console.log(`开发者 ${developer.username} 没有邮箱，无法发送通知`);
          logger.info(`开发者 ${developer.username} 没有邮箱，无法发送通知`);
        }
      } catch (taskError) {
        console.error(`创建任务失败: ${taskError.message}`);
        logger.error(`为问题 ${newIssue.id} 创建任务失败:`, taskError);
      }
    } else {
      console.log(`没有发送邮件: 未找到开发者`);
      logger.info(`没有发送邮件: 未找到模块 ${module.name} 的负责开发者`);
    }
    
    // 查询刚刚创建的问题并返回，包括模块和开发者信息
    const createdIssue = await Issue.findByPk(newIssue.id, {
      include: [{
        model: Module,
        as: 'module'
      }, {
        model: User,
        as: 'user'
      }]
    });
    
    console.log(`问题提交完成: ID ${newIssue.id}`);
    console.log(`邮件通知状态: ${emailSent ? '已发送' : '未发送'} (最终状态)`);
    console.log('============ 问题提交请求处理完毕 ============\n');
    
    return res.status(201).json({
      message: '问题提交成功' + (emailSent ? '，已通知开发者' : ''),
      issue: createdIssue,
      emailSent: emailSent
    });
  } catch (error) {
    console.error('提交问题时发生错误:', error);
    logger.error('提交问题时发生错误:', error);
    return res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

// 提交新问题 - 向后兼容老版本客户端，新版本请使用 /api/issues
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { description, moduleId, title, screenshots } = req.body;
    const userId = req.user.id;
    
    console.log('\n============ 收到提交问题请求 ============');
    console.log(`用户ID: ${userId}`);
    console.log(`模块ID: ${moduleId}`);
    console.log(`标题长度: ${title ? title.length : 0}`);
    console.log(`描述长度: ${description ? description.length : 0}`);
    console.log(`截图数量: ${screenshots ? screenshots.length : 0}`);
    
    // 验证必要的字段
    if (!description) {
      console.log('提交问题验证失败: 缺少描述');
      return res.status(400).json({ message: '请提供问题描述' });
    }
    
    if (!moduleId) {
      console.log('提交问题验证失败: 缺少模块ID');
      return res.status(400).json({ message: '请选择问题所属的模块' });
    }
    
    // 验证模块是否存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      console.log(`提交问题验证失败: 模块不存在 (ID: ${moduleId})`);
      return res.status(404).json({ message: '所选模块不存在' });
    }
    console.log(`模块验证通过: ${module.name} (ID: ${moduleId})`);
    
    // 查找该模块负责的开发者
    const developer = await User.findOne({
      where: {
        role: 'developer',
        moduleId: moduleId
      }
    });
    
    if (developer) {
      console.log(`找到负责的开发者: ${developer.username} (${developer.email || '无邮箱'})`);
    } else {
      console.log(`未找到模块 ${module.name} 的负责开发者`);
    }
    
    // 创建问题记录
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === '') {
      // 如果没有提供标题，生成一个简单标题
      finalTitle = `关于${module.name}的反馈 (${new Date().toLocaleDateString('zh-CN')})`;
      console.log(`自动生成标题: ${finalTitle}`);
    }
    
    // 创建问题
    const newIssue = await Issue.create({
      title: finalTitle,
      description,
      status: 'pending',
      userId,
      moduleId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`问题创建成功: ID ${newIssue.id} - ${finalTitle}`);
    
    // 如果有截图，保存截图
    if (screenshots && screenshots.length > 0) {
      try {
        console.log(`截图数据可用，但当前未实现截图保存功能`);
        // 这里可以添加截图处理逻辑，例如将Base64保存到文件系统或云存储
      } catch (screenshotError) {
        console.error('处理截图失败:', screenshotError.message);
        logger.error('处理截图失败:', screenshotError);
        // 处理截图失败不影响问题提交
      }
    }
    
    // 跟踪邮件发送状态
    let emailSent = false;
    
    // 查询是否有开发者负责此模块，并创建对应的任务
    if (developer) {
      console.log(`为开发者 ${developer.username} 创建任务...`);
      try {
        // 为该开发者创建任务
        const newTask = await Task.create({
          issueId: newIssue.id,
          assignedTo: developer.id,
          priority: 'normal', // 默认优先级
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`问题 #${newIssue.id} 已自动分配给开发人员 #${developer.id}`);
        
        // 任务创建成功后立即发送邮件通知
        if (developer.email) {
          console.log(`\n====== 开始发送邮件通知给开发者 ======`);
          logger.info(`开始向开发者 ${developer.username} (${developer.email}) 发送问题通知邮件`);
          console.log(`开发者: ${developer.username}`);
          console.log(`邮箱: ${developer.email}`);
          
          // 使用新的专用方法发送开发者通知邮件
          try {
            const result = await mailer.sendDeveloperNotification(
              developer.email,
              newIssue,
              module.name
            );
            
            if (result) {
              console.log(`✓ 开发者通知邮件发送成功!`);
              logger.info(`成功发送通知邮件到 ${developer.email}`);
              emailSent = true;
            } else {
              console.log(`× 开发者通知邮件发送失败!`);
              logger.error(`发送通知邮件到 ${developer.email} 失败`);
            }
          } catch (emailError) {
            console.error(`邮件发送过程中出错: ${emailError.message}`);
            logger.error(`邮件发送过程中出错: ${emailError.message}`, emailError);
          }
          
          console.log(`====== 邮件通知结束 (${emailSent ? '成功' : '失败'}) ======\n`);
          logger.info(`邮件通知结束 (${emailSent ? '成功' : '失败'}), 开发者: ${developer.username}, 邮箱: ${developer.email}`);
        } else {
          console.log(`开发者 ${developer.username} 没有邮箱，无法发送通知`);
          logger.info(`开发者 ${developer.username} 没有邮箱，无法发送通知`);
        }
      } catch (taskError) {
        console.error(`创建任务失败: ${taskError.message}`);
        logger.error(`为问题 ${newIssue.id} 创建任务失败:`, taskError);
      }
    } else {
      console.log(`没有发送邮件: 未找到开发者`);
      logger.info(`没有发送邮件: 未找到模块 ${module.name} 的负责开发者`);
    }
    
    // 查询刚刚创建的问题并返回，包括模块和开发者信息
    const createdIssue = await Issue.findByPk(newIssue.id, {
      include: [{
        model: Module,
        as: 'module'
      }, {
        model: User,
        as: 'user'
      }]
    });
    
    console.log(`问题提交完成: ID ${newIssue.id}`);
    console.log(`邮件通知状态: ${emailSent ? '已发送' : '未发送'} (最终状态)`);
    console.log('============ 问题提交请求处理完毕 ============\n');
    
    return res.status(201).json({
      message: '问题提交成功' + (emailSent ? '，已通知开发者' : ''),
      issue: createdIssue,
      emailSent: emailSent
    });
  } catch (error) {
    console.error('提交问题时发生错误:', error);
    logger.error('提交问题时发生错误:', error);
    return res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

// 更新问题状态
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // 验证状态值
    const validStatus = ['pending', 'processing', 'resolved', 'closed'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }

    // 查询问题
    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({
        code: 404,
        message: '问题不存在'
      });
    }

    // 记录旧状态
    const oldStatus = issue.status;

    // 更新状态
    issue.status = status;
    await issue.save();

    logger.info(`问题状态已更新`, { issueId: id, oldStatus, newStatus: status, updatedBy: userId });

    // 发送状态变更邮件通知给用户
    try {
      await mailer.sendStatusChangeNotification(issue, oldStatus, status);
      logger.info(`已向用户发送状态变更通知邮件`);
    } catch (emailError) {
      logger.error('发送状态变更邮件通知失败', emailError);
      // 邮件发送失败不影响状态更新
    }

    return res.status(200).json({
      code: 200,
      message: '状态更新成功',
      data: {
        issue
      }
    });
  } catch (error) {
    logger.error('更新问题状态失败', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 测试邮件发送接口
router.post('/test-email', authMiddleware, async (req, res) => {
  try {
    // 支持查询参数和请求体两种方式传递邮箱
    const email = req.query.email || req.body.email;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱地址不能为空'
      });
    }
    
    // 发送测试邮件
    const success = await mailer.testEmailSending(email);
    
    if (success) {
      logger.info(`测试邮件已发送到 ${email}`);
      return res.status(200).json({
        code: 200,
        message: '测试邮件发送成功，请检查收件箱',
        data: { email }
      });
    } else {
      logger.error(`发送测试邮件到 ${email} 失败`);
      return res.status(500).json({
        code: 500,
        message: '测试邮件发送失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('测试邮件发送失败', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 测试邮件发送接口 - GET方法(便于在浏览器中测试)
router.get('/test-email', authMiddleware, async (req, res) => {
  try {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱地址不能为空'
      });
    }
    
    // 发送测试邮件
    const success = await mailer.testEmailSending(email);
    
    if (success) {
      logger.info(`测试邮件已发送到 ${email}`);
      return res.status(200).json({
        code: 200,
        message: '测试邮件发送成功，请检查收件箱',
        data: { email }
      });
    } else {
      logger.error(`发送测试邮件到 ${email} 失败`);
      return res.status(500).json({
        code: 500,
        message: '测试邮件发送失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('测试邮件发送失败', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 测试邮件发送接口 - 公开接口，无需认证(仅用于开发测试)
router.get('/open-test-email', async (req, res) => {
  try {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱地址不能为空'
      });
    }
    
    console.log(`接收到公开测试邮件请求，目标邮箱: ${email}`);
    
    // 发送测试邮件
    const success = await mailer.testEmailSending(email);
    
    if (success) {
      logger.info(`公开测试邮件已发送到 ${email}`);
      return res.status(200).json({
        code: 200,
        message: '测试邮件发送成功，请检查收件箱',
        data: { email }
      });
    } else {
      logger.error(`发送公开测试邮件到 ${email} 失败`);
      return res.status(500).json({
        code: 500,
        message: '测试邮件发送失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('公开测试邮件发送失败', error);
    return res.status(500).json({
      code: 500,
      message: `服务器错误: ${error.message || '未知错误'}`
    });
  }
});

// 添加一个新的根路径测试接口，方便直接在浏览器访问测试
router.get('/public-email-test', async (req, res) => {
  try {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '请在URL中添加 email 参数，例如：/api/issues/public-email-test?email=your@email.com'
      });
    }
    
    console.log(`接收到公开测试邮件请求 (public)，目标邮箱: ${email}`);
    
    // 发送测试邮件
    const success = await mailer.testEmailSending(email);
    
    if (success) {
      logger.info(`公开测试邮件已发送到 ${email}`);
      return res.status(200).json({
        code: 200,
        message: '测试邮件发送成功，请检查收件箱',
        data: { email }
      });
    } else {
      logger.error(`发送公开测试邮件到 ${email} 失败`);
      return res.status(500).json({
        code: 500,
        message: '测试邮件发送失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('公开测试邮件发送失败', error);
    return res.status(500).json({
      code: 500,
      message: `服务器错误: ${error.message || '未知错误'}`
    });
  }
});

// 专门测试QQ邮箱连接接口
router.get('/test-qq-email', async (req, res) => {
  try {
    const email = req.query.email || 'jhzhou0704@163.com';
    
    console.log(`收到QQ邮箱连接测试请求，目标邮箱: ${email}`);
    
    // 测试QQ邮箱连接
    const success = await mailer.testEmailSending(email);
    
    if (success) {
      logger.info(`QQ邮箱测试成功，目标邮箱: ${email}`);
      return res.status(200).json({
        code: 200,
        message: 'QQ邮箱连接测试成功，请检查收件箱',
        data: { email }
      });
    } else {
      logger.error(`QQ邮箱测试失败，目标邮箱: ${email}`);
      return res.status(500).json({
        code: 500,
        message: 'QQ邮箱连接测试失败，请检查服务器日志',
        data: { email }
      });
    }
  } catch (error) {
    logger.error('测试QQ邮箱失败', error);
    return res.status(500).json({
      code: 500,
      message: `服务器错误: ${error.message || '未知错误'}`,
      data: { error: error.toString() }
    });
  }
});

// 重新初始化邮件服务接口
router.get('/reinit-email', async (req, res) => {
  try {
    console.log('收到重新初始化邮件服务请求');
    
    // 强制重新初始化邮件发送器
    const success = await mailer.forceReinitializeTransporter();
    
    if (success) {
      logger.info('邮件服务重新初始化成功');
      return res.status(200).json({
        code: 200,
        message: '邮件服务重新初始化成功',
        data: { timestamp: new Date().toISOString() }
      });
    } else {
      logger.error('邮件服务重新初始化失败');
      return res.status(500).json({
        code: 500,
        message: '邮件服务重新初始化失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('重新初始化邮件服务失败', error);
    return res.status(500).json({
      code: 500,
      message: `服务器错误: ${error.message || '未知错误'}`
    });
  }
});

// 直接测试邮件服务 - 不经过认证
router.get('/test-email-direct', async (req, res) => {
  try {
    console.log('\n============ 邮件服务直接测试 ============');
    const email = req.query.email || '318352733@qq.com'; // 默认测试邮箱
    console.log(`\x1b[36m测试目标邮箱: ${email}\x1b[0m`);

    // 强制初始化邮件服务
    await mailer.forceReinitializeTransporter();
    
    // 创建一个简单的测试邮件
    const testMailOptions = {
      from: '"PADIA系统测试" <318352733@qq.com>',
      to: email,
      subject: `测试邮件 - ${new Date().toLocaleString()}`,
      text: '这是一封来自PADIA反馈系统的测试邮件，用于验证邮件服务是否正常工作。',
      html: '<div style="padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;"><h2 style="color: #1890ff;">PADIA反馈系统</h2><p>这是一封来自PADIA反馈系统的测试邮件，用于验证邮件服务是否正常工作。</p><p>如果您收到此邮件，表示邮件服务配置正确。</p><p style="color: #999;">发送时间: ' + new Date().toLocaleString() + '</p></div>'
    };
    
    console.log('\x1b[36m正在发送邮件...\x1b[0m');
    
    try {
      // 尝试发送
      const info = await mailer.testEmailSending(email);
      if (info) {
        console.log(`\x1b[32m✓ 邮件发送成功!\x1b[0m`);
        console.log(`\x1b[32m消息ID: ${info.messageId}\x1b[0m`);
        return res.json({
          success: true,
          message: '测试邮件发送成功',
          messageId: info.messageId,
          previewURL: nodemailer.getTestMessageUrl(info)
        });
      } else {
        console.log(`\x1b[31m× 邮件发送失败: 未返回结果\x1b[0m`);
        return res.status(500).json({
          success: false,
          message: '测试邮件发送失败: 未返回结果'
        });
      }
    } catch (err) {
      console.error(`\x1b[31m× 邮件发送失败: ${err.message}\x1b[0m`);
      console.error(err.stack);
      return res.status(500).json({
        success: false,
        message: `测试邮件发送失败: ${err.message}`,
        error: err.stack
      });
    }
  } catch (error) {
    console.error('\x1b[31m测试邮件接口错误:\x1b[0m', error);
    return res.status(500).json({
      success: false,
      message: '测试邮件接口错误: ' + error.message,
      error: error.stack
    });
  } finally {
    console.log('============ 邮件测试完成 ============\n');
  }
});

// 测试邮件发送接口 - 直接在根路径访问，无需认证（用于内部请求）
router.get('/test-email', async (req, res) => {
  try {
    const email = req.query.email;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱地址不能为空'
      });
    }
    
    console.log(`\n====== 收到测试邮件请求 (根路径) ======`);
    console.log(`目标邮箱: ${email}`);
    
    // 获取自定义主题和内容参数，如果没有则使用默认值
    const subject = req.query.subject || `PADIA反馈系统通知 - ${new Date().toLocaleString()}`;
    const content = req.query.content || '您有新的问题需要处理，请登录系统查看详情。';
    
    console.log(`邮件主题: ${subject}`);
    console.log(`邮件内容: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    
    // 使用自定义主题和内容发送测试邮件
    const result = await mailer.testEmailSending(
      email, 
      subject,
      content,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
          <h2 style="color: #333;">PADIA反馈系统通知</h2>
          <div style="padding: 10px; background-color: #f5f5f5; border-left: 4px solid #2196F3; margin: 10px 0;">
            ${content}
          </div>
          <p>请登录 <a href="http://localhost:5173/developer/tasks">PADIA反馈平台</a> 查看详情。</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">此邮件为系统自动发送，请勿直接回复。</p>
          <p style="color: #666; font-size: 12px;"><strong>发送时间:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    );

    if (result) {
      logger.info(`测试邮件已发送到 ${email}`);
      console.log(`邮件已成功发送到 ${email}`);
      return res.status(200).json({
        code: 200,
        message: '测试邮件发送成功，请检查收件箱',
        data: result
      });
    } else {
      logger.error(`测试邮件发送失败，目标邮箱: ${email}`);
      console.log(`邮件发送失败，目标邮箱: ${email}`);
      return res.status(500).json({
        code: 500,
        message: '测试邮件发送失败，请检查服务器日志'
      });
    }
  } catch (error) {
    logger.error('测试邮件发送失败', error);
    console.error('测试邮件发送失败:', error);
    return res.status(500).json({
      code: 500,
      message: `测试邮件发送失败: ${error.message || '未知错误'}`
    });
  }
});

// 保留其他原有的路由处理函数...

export default router; 