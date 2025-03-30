/**
 * 邮件服务 - 用于发送通知邮件给模块负责人
 */
import nodemailer from 'nodemailer';
import { User, Module } from '../../src/db/models/index.js';
import * as logger from '../utils/logger.js';
import axios from 'axios';

// 创建邮件发送器配置
let transporter;

/**
 * 初始化邮件发送器
 */
async function initializeTransporter() {
  console.log("\n\x1b[36m%s\x1b[0m", "===== 初始化邮件发送器开始 =====");
  try {
    logger.info('初始化邮件发送器...');
    
    // 使用QQ邮箱SMTP发送
    console.log('\x1b[36m%s\x1b[0m', '配置QQ邮箱SMTP服务...');
    let qqConfig = {
      host: 'smtp.qq.com',
      port: 465,
      secure: true, // 使用SSL
      auth: {
        user: '318352733@qq.com', // QQ邮箱账号
        pass: 'eamcixwnjmmxbhdh' // QQ邮箱授权码
      },
      logger: true, // 启用日志
      debug: false, // 禁用调试，避免过多日志
      tls: {
        rejectUnauthorized: false // 不验证服务器证书，解决某些SSL问题
      }
    };

    console.log('\x1b[36m%s\x1b[0m', `邮箱配置: ${qqConfig.host}:${qqConfig.port} (secure: ${qqConfig.secure})`);
    console.log('\x1b[36m%s\x1b[0m', `邮箱账号: ${qqConfig.auth.user}`);
    console.log('\x1b[36m%s\x1b[0m', `授权码长度: ${qqConfig.auth.pass.length}位`);

    // 创建SMTP发送器
    console.log('\x1b[33m%s\x1b[0m', '正在创建SMTP发送器...');
    transporter = nodemailer.createTransport(qqConfig);
    console.log('\x1b[32m%s\x1b[0m', 'SMTP发送器创建成功');
    
    // 验证配置是否正确
    console.log('\x1b[33m%s\x1b[0m', '正在验证QQ邮箱配置...');
    try {
      await transporter.verify();
      console.log('\x1b[32m%s\x1b[0m', '✓ QQ邮箱SMTP配置验证成功！邮件服务已准备就绪');
      logger.info('邮件发送器初始化成功 (QQ邮箱)');
      console.log("\x1b[32m%s\x1b[0m", "===== 初始化邮件发送器完成 =====");
      return true;
    } catch (verifyError) {
      console.error('\x1b[31m%s\x1b[0m', `× 验证SMTP配置失败: ${verifyError.message}`);
      if (verifyError.code) {
        console.error('\x1b[31m%s\x1b[0m', `  错误代码: ${verifyError.code}`);
      }
      throw verifyError; // 重新抛出以便上层捕获
    }
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `× 邮件发送器初始化失败: ${error.message}`);
    console.error(`\x1b[31m%s\x1b[0m`, `  错误类型: ${error.name}`);
    console.error(`\x1b[31m%s\x1b[0m`, `  错误代码: ${error.code || '无'}`);
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      console.error(`\x1b[31m%s\x1b[0m`, `  错误堆栈(部分): ${stackLines.join('\n  ')}`);
    }
    
    logger.error(`邮件发送器初始化失败: ${error.message}`, error);
    console.log("\x1b[31m%s\x1b[0m", "===== 初始化邮件发送器失败 =====");
    
    throw new Error(`邮件发送器初始化失败: ${error.message}`);
  }
}

// 立即初始化邮件发送器
initializeTransporter().then(() => {
  logger.info('邮件服务初始化完成');
}).catch(error => {
  logger.error('邮件服务初始化失败:', error);
});

/**
 * 直接发送邮件的简化方法
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件HTML内容
 * @returns {Promise<Object|boolean>} - 发送结果
 */
async function sendMail(to, subject, html, text = null) {
  console.log(`\n===== 开始发送邮件 =====`);
  console.log(`目标邮箱: ${to}`);
  console.log(`邮件主题: ${subject}`);
  
  if (!to || !subject) {
    console.error('发送邮件失败: 邮箱地址或主题不能为空');
    return false;
  }
  
  try {
    // 确保邮件服务已初始化
    if (!transporter) {
      console.log('邮件发送器未初始化，正在初始化...');
      await initializeTransporter();
    }
    
    // 构建邮件选项
    const mailOptions = {
      from: '"PADIA反馈系统" <318352733@qq.com>', // 发件人
      to: to, // 收件人
      subject: subject, // 主题
      html: html, // HTML内容
      text: text || html.replace(/<[^>]*>/g, '') // 纯文本内容
    };
    
    console.log('正在发送邮件...');
    
    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✓ 邮件发送成功!`);
    console.log(`邮件ID: ${info.messageId}`);
    console.log(`===== 邮件发送完成 =====\n`);
    
    return info;
  } catch (error) {
    console.error(`邮件发送失败: ${error.message}`);
    logger.error('邮件发送失败:', error);
    
    // 尝试重新初始化并重试
    try {
      console.log('尝试重新初始化邮件发送器并重试...');
      await forceReinitializeTransporter();
      
      if (!transporter) {
        console.error('重新初始化失败，无法发送邮件');
        return false;
      }
      
      const mailOptions = {
        from: '"PADIA反馈系统" <318352733@qq.com>',
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, '')
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✓ 重试后邮件发送成功!`);
      console.log(`邮件ID: ${info.messageId}`);
      console.log(`===== 邮件发送完成 =====\n`);
      
      return info;
    } catch (retryError) {
      console.error(`重试发送失败: ${retryError.message}`);
      logger.error('重试发送邮件失败:', retryError);
      console.log(`===== 邮件发送失败 =====\n`);
      return false;
    }
  }
}

/**
 * 强制重新初始化发送器
 */
async function forceReinitializeTransporter() {
  console.log("\n\x1b[36m%s\x1b[0m", "【邮件服务】强制重新初始化发送器");
  
  // 确保旧的发送器被清理
  if (transporter) {
    console.log('\x1b[33m%s\x1b[0m', '关闭现有发送器连接...');
    try {
      transporter.close();
    } catch (err) {
      console.log('\x1b[31m%s\x1b[0m', `关闭发送器出错 (忽略): ${err.message}`);
    }
    transporter = null;
  }
  
  // 重新初始化
  console.log('\x1b[33m%s\x1b[0m', '开始创建新的邮件发送器...');
  return initializeTransporter();
}

/**
 * 发送问题通知邮件给模块负责人
 * @param {Object} issue - 问题详情
 * @param {number} moduleId - 模块ID
 * @returns {Promise<boolean>} - 发送结果
 */
async function sendIssueNotification(issue, moduleId) {
  console.log("\n\x1b[36m%s\x1b[0m", "【邮件服务】开始发送问题通知邮件");
  console.log("\x1b[36m%s\x1b[0m", `问题ID: ${issue?.id || 'undefined'}, 模块ID: ${moduleId || 'undefined'}`);
  
  // 检查参数是否有效
  if (!issue || !issue.id) {
    console.error('\x1b[31m%s\x1b[0m', '无效的问题对象:', issue);
    return false;
  }
  
  if (!moduleId) {
    console.error('\x1b[31m%s\x1b[0m', '无效的模块ID:', moduleId);
    return false;
  }
  
  try {
    logger.info(`============ 开始发送问题通知邮件 ============`);
    logger.info(`问题ID: ${issue.id}, 模块ID: ${moduleId}`);
    
    // 获取模块信息
    const module = await Module.findByPk(moduleId);
    if (!module) {
      logger.error(`模块不存在，ID: ${moduleId}`);
      console.error(`\x1b[31m%s\x1b[0m`, `模块不存在，ID: ${moduleId}`);
      return false;
    }
    console.log(`\x1b[36m%s\x1b[0m`, `找到模块: ${module.name} (ID: ${moduleId})`);

    // 查找模块的开发负责人
    const developer = await User.findOne({
      where: {
        role: 'developer',
        moduleId: moduleId
      }
    });

    if (!developer) {
      logger.error(`未找到模块 ${module.name} (ID: ${moduleId}) 的负责人`);
      console.error(`\x1b[31m%s\x1b[0m`, `未找到模块 ${module.name} (ID: ${moduleId}) 的负责人`);
      return false;
    }
    console.log(`\x1b[36m%s\x1b[0m`, `找到开发负责人: ${developer.username} (ID: ${developer.id})`);
    
    if (!developer.email) {
      logger.error(`模块 ${module.name} (ID: ${moduleId}) 的负责人 ${developer.username} 无邮箱`);
      console.error(`\x1b[31m%s\x1b[0m`, `模块 ${module.name} (ID: ${moduleId}) 的负责人 ${developer.username} 无邮箱`);
      return false;
    }
    console.log(`\x1b[36m%s\x1b[0m`, `开发负责人邮箱: ${developer.email}`);
    
    // 构建邮件HTML内容
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
        <h2 style="color: #333;">有新的问题需要处理</h2>
        <p><strong>问题标题:</strong> ${issue.title || '未命名问题'}</p>
        <p><strong>所属模块:</strong> ${module.name}</p>
        <p><strong>问题描述:</strong></p>
        <div style="padding: 10px; background-color: #f5f5f5; border-left: 4px solid #2196F3; margin: 10px 0;">
          ${issue.description.substring(0, 1000)}${issue.description.length > 1000 ? '...(内容过长已截断)' : ''}
        </div>
        <p>请尽快登录 <a href="http://localhost:5173/developer/tasks">PADIA反馈平台</a> 查看并处理。</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">此邮件为系统自动发送，请勿直接回复。</p>
      </div>
    `;
    
    // 构建纯文本内容
    const textContent = `有新的问题需要处理
问题标题: ${issue.title || '未命名问题'}
所属模块: ${module.name}
问题描述: 
${issue.description.substring(0, 1000)}${issue.description.length > 1000 ? '...(内容过长已截断)' : ''}

请尽快登录PADIA反馈平台查看并处理。`;

    // 使用开发者专用的邮件发送函数
    const emailResult = await sendDeveloperNotification(
      developer.email,
      issue,
      module.name
    );
    
    if (emailResult) {
      logger.info(`邮件通知发送成功，邮箱：${developer.email}`);
      console.log(`\x1b[32m%s\x1b[0m`, `✓ 邮件通知发送成功！`);
      return true;
    } else {
      logger.error(`邮件通知发送失败，邮箱：${developer.email}`);
      console.error(`\x1b[31m%s\x1b[0m`, `× 邮件通知发送失败！`);
      return false;
    }
  } catch (error) {
    logger.error(`发送问题通知邮件时出错: ${error.message}`, error);
    console.error(`\x1b[31m%s\x1b[0m`, `发送问题通知邮件时出错: ${error.message}`);
    return false;
  }
}

/**
 * 发送任务状态变更通知给用户
 * @param {Object} issue - 问题详情
 * @param {string} oldStatus - 原状态
 * @param {string} newStatus - 新状态
 * @returns {Promise<boolean>} - 发送结果
 */
async function sendStatusChangeNotification(issue, oldStatus, newStatus) {
  try {
    logger.info(`开始处理状态变更通知邮件，问题ID: ${issue.id}, 状态变更: ${oldStatus} -> ${newStatus}`);
    
    // 获取提交问题的用户
    const user = await User.findByPk(issue.userId);
    if (!user) {
      logger.error(`未找到用户，用户ID: ${issue.userId}`);
      return false;
    }
    
    if (!user.email) {
      logger.error(`用户 ${user.username} (ID: ${user.id}) 无邮箱`);
      return false;
    }
    
    logger.info(`准备向用户 ${user.username} (${user.email}) 发送状态变更通知邮件`);
    
    // 状态显示名称映射
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'resolved': '已解决',
      'closed': '已关闭'
    };

    // 构建HTML邮件内容
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
        <h2 style="color: #333;">您的问题状态已更新</h2>
        <p><strong>问题标题:</strong> ${issue.title || '未命名问题'}</p>
        <p><strong>状态变更:</strong> <span style="color: #ff9800;">${statusMap[oldStatus] || oldStatus}</span> → <span style="color: #4caf50;">${statusMap[newStatus] || newStatus}</span></p>
        <p>请登录 <a href="http://localhost:5173/user/issues">PADIA反馈平台</a> 查看详情。</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">此邮件为系统自动发送，请勿直接回复。</p>
      </div>
    `;
    
    // 构建纯文本内容
    const textContent = `您好，
您提交的问题状态已更新
问题标题: ${issue.title || '未命名问题'}
状态变更: ${statusMap[oldStatus] || oldStatus} → ${statusMap[newStatus] || newStatus}
请登录PADIA反馈平台查看详情。

此邮件为系统自动发送，请勿直接回复。`;

    // 发送邮件
    const result = await sendMail(
      user.email,
      `【状态更新】您的问题"${issue.title || '未命名问题'}"`,
      htmlContent,
      textContent
    );
    
    return !!result;
  } catch (error) {
    logger.error('发送状态变更通知邮件失败:', error);
    console.error(`发送状态变更通知邮件失败: ${error.message}`);
    return false;
  }
}

/**
 * 发送测试邮件
 * @param {string} email - 目标邮箱
 * @param {string} subject - 可选的自定义主题
 * @param {string} text - 可选的自定义文本内容
 * @param {string} html - 可选的自定义HTML内容
 * @returns {Promise<Object|boolean>} - 发送结果
 */
async function testEmailSending(email, subject, text, html) {
  console.log(`\n========== 开始发送测试邮件 ==========`);
  console.log(`目标邮箱: ${email}`);
  
  if (!email) {
    console.error('× 无效的邮箱地址');
    console.log(`========== 邮件测试失败 ==========\n`);
    return false;
  }
  
  // 自定义主题和内容
  const customSubject = subject || `PADIA反馈系统测试邮件 - ${new Date().toLocaleString()}`;
  const customText = text || '这是一封测试邮件，用于检查邮件系统是否正常工作。';
  const customHtml = html || `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
      <h2 style="color: #333;">这是一封测试邮件</h2>
      <p>如果您收到此邮件，说明PADIA问题反馈系统的邮件功能正常工作。</p>
      <p><strong>发送时间:</strong> ${new Date().toLocaleString()}</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">此邮件为系统自动发送，请勿直接回复。</p>
    </div>
  `;
  
  try {
    return await sendMail(email, customSubject, customHtml, customText);
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    return false;
  }
}

/**
 * 发送开发者问题通知邮件
 * @param {string} email - 开发者邮箱
 * @param {Object} issue - 问题对象
 * @param {string} moduleName - 模块名称
 * @returns {Promise<boolean>} - 是否发送成功
 */
async function sendDeveloperNotification(email, issue, moduleName) {
  if (!email) {
    logger.warn('发送开发者通知邮件失败: 邮箱地址为空');
    return false;
  }

  logger.info(`准备发送开发者通知邮件: ${email}`);
  console.log(`准备发送开发者通知邮件: ${email}`);

  try {
    // 构建邮件主题和内容
    const emailSubject = `【新问题通知】${issue.title}`;
    const description = issue.description.replace(/<[^>]*>?/gm, ''); // 简单移除HTML标签
    
    const emailContent = `有新的问题需要处理
问题ID: ${issue.id}
问题标题: ${issue.title}
所属模块: ${moduleName}
提交时间: ${new Date(issue.createdAt).toLocaleString('zh-CN')}
问题描述: 
${description.substring(0, 500)}${description.length > 500 ? '...(内容过长已截断)' : ''}

请尽快登录PADIA反馈平台查看并处理。`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
        <h2 style="color: #333;">有新的问题需要处理</h2>
        <p><strong>问题ID:</strong> ${issue.id}</p>
        <p><strong>问题标题:</strong> ${issue.title}</p>
        <p><strong>所属模块:</strong> ${moduleName}</p>
        <p><strong>提交时间:</strong> ${new Date(issue.createdAt).toLocaleString('zh-CN')}</p>
        <p><strong>问题描述:</strong></p>
        <div style="padding: 10px; background-color: #f5f5f5; border-left: 4px solid #2196F3; margin: 10px 0;">
          ${description.substring(0, 500)}${description.length > 500 ? '...(内容过长已截断)' : ''}
        </div>
        <p>请尽快登录 <a href="http://localhost:5173/developer/tasks">PADIA反馈平台</a> 查看并处理。</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">此邮件为系统自动发送，请勿直接回复。</p>
      </div>
    `;

    // 首先使用测试邮件相同的API实现方式
    try {
      // 使用与测试邮件相同的接口方式，但内容是根据问题信息构建的
      const testEmailUrl = `http://localhost:3000/test-email?email=${encodeURIComponent(email)}&subject=${encodeURIComponent(emailSubject)}&content=${encodeURIComponent(emailContent)}`;
      
      logger.info(`调用邮件API发送开发者通知: ${testEmailUrl}`);
      console.log(`调用邮件API发送开发者通知...`);

      // 使用axios发送HTTP请求
      const response = await axios.get(testEmailUrl);
      
      if (response.status === 200) {
        logger.info(`开发者通知邮件API调用成功: ${email}`);
        console.log(`✓ 开发者通知邮件发送成功!`);
        return true;
      } else {
        logger.error(`开发者通知邮件API调用失败: ${response.status}`);
        console.error(`× 开发者通知邮件API调用失败: ${response.status}`);
        
        // 如果API调用失败，尝试直接使用邮件服务
        const result = await testEmailSending(email, emailSubject, emailContent, htmlContent);
        
        if (result) {
          logger.info(`使用备用方法发送开发者通知成功`);
          console.log(`✓ 使用备用方法发送开发者通知成功!`);
          return true;
        } else {
          logger.error(`所有方法发送开发者通知均失败`);
          console.error(`× 所有方法发送开发者通知均失败!`);
          return false;
        }
      }
    } catch (error) {
      logger.error(`开发者通知邮件发送异常: ${error.message}`, error);
      console.error(`开发者通知邮件发送异常: ${error.message}`);
      
      // 如果出现异常，尝试直接使用邮件服务
      try {
        const result = await testEmailSending(email, emailSubject, emailContent, htmlContent);
        
        if (result) {
          logger.info(`异常后使用备用方法发送开发者通知成功`);
          console.log(`✓ 异常后使用备用方法发送开发者通知成功!`);
          return true;
        }
      } catch (finalError) {
        logger.error(`最终尝试发送开发者通知也失败: ${finalError.message}`);
        console.error(`× 最终尝试发送开发者通知也失败!`);
      }
      
      return false;
    }
  } catch (error) {
    logger.error(`开发者通知邮件准备失败: ${error.message}`, error);
    console.error(`开发者通知邮件准备失败: ${error.message}`);
    return false;
  }
}

export default {
  sendIssueNotification,
  sendStatusChangeNotification,
  testEmailSending,
  forceReinitializeTransporter,
  sendMail,
  sendDeveloperNotification
}; 