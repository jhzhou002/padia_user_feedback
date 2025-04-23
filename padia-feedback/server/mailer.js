import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保日志目录存在
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志文件路径
const emailLogFile = path.join(logDir, 'email.log');

/**
 * 写入邮件日志
 * @param {string} level 日志级别
 * @param {string} message 日志消息
 * @param {Object} data 额外数据
 */
const writeEmailLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  try {
    fs.appendFileSync(
      emailLogFile,
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf8' }
    );
    
    // 控制台输出
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
    if (data) {
      console.log(`${' '.repeat(prefix.length + 1)}`, data);
    }
  } catch (error) {
    console.error('写入邮件日志失败:', error);
  }
};

/**
 * 邮件服务配置
 */
const mailConfig = {
  host: process.env.MAIL_HOST || 'smtp.qq.com',  // 邮箱服务器地址
  port: parseInt(process.env.MAIL_PORT || '465'),      // 邮箱服务器端口
  secure: true,                                       // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || '318352733@qq.com',  // 发件邮箱地址
    pass: process.env.MAIL_PASS || 'xjnxfmgzcogfbjij'              // 发件邮箱密码或授权码
  }
};

// 创建Nodemailer传输器
let transporter = null;

/**
 * 初始化邮件服务
 */
const initMailer = () => {
  try {
    writeEmailLog('info', '初始化邮件服务', {
      host: mailConfig.host,
      port: mailConfig.port,
      user: mailConfig.auth.user
    });
    
    // 创建传输器
    transporter = nodemailer.createTransport(mailConfig);
    writeEmailLog('info', '邮件服务初始化成功');
    return true;
  } catch (error) {
    writeEmailLog('error', '邮件服务初始化失败', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * 验证邮件服务连接
 * @returns {Promise<boolean>} 连接是否成功
 */
const verifyConnection = async () => {
  if (!transporter) {
    initMailer();
  }
  
  try {
    writeEmailLog('info', '验证邮件服务连接');
    await transporter.verify();
    writeEmailLog('info', '邮件服务连接正常');
    return true;
  } catch (error) {
    writeEmailLog('error', '邮件服务连接失败', {
      error: error.message,
      code: error.code || 'UNKNOWN',
      responseCode: error.responseCode,
      command: error.command
    });
    return false;
  }
};

/**
 * 发送邮件的基础函数
 * @param {Object} options 邮件选项
 * @returns {Promise<Object>} 发送结果
 */
const sendMail = async (options) => {
  if (!transporter) {
    initMailer();
  }
  
  const to = options.to;
  const subject = options.subject;
  
  writeEmailLog('info', `准备发送邮件`, {
    to,
    subject
  });
  
  try {
    const mailOptions = {
      from: `"PADIA反馈平台" <${mailConfig.auth.user}>`,
      ...options
    };
    
    writeEmailLog('debug', '开始发送邮件');
    const startTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    
    writeEmailLog('info', `邮件发送成功 (${duration}ms)`, {
      messageId: info.messageId,
      to,
      subject,
      response: info.response
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      duration
    };
  } catch (error) {
    writeEmailLog('error', '邮件发送失败', {
      to,
      subject,
      error: error.message,
      code: error.code || 'UNKNOWN',
      command: error.command,
      responseCode: error.responseCode
    });
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      command: error.command,
      responseCode: error.responseCode
    };
  }
};

/**
 * 将HTML内容转换为纯文本
 * @param {string} html HTML内容
 * @returns {string} 纯文本内容
 */
const getPlainText = (html) => {
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

/**
 * 格式化日期
 * @param {string} dateString 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
};

/**
 * 获取状态对应的颜色
 * @param {string} status 状态标识
 * @returns {string} 颜色代码
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#e74c3c';    // 红色
    case 'processing': return '#f39c12'; // 黄色
    case 'resolved': return '#2ecc71';   // 绿色
    case 'closed': return '#7f8c8d';     // 灰色
    default: return '#3498db';           // 蓝色
  }
};

/**
 * 发送新问题通知给开发人员
 * @param {Object} issue 问题对象
 * @param {Object} developer 开发人员对象
 * @returns {Promise<Object>} 发送结果
 */
const sendNewIssueNotification = async (issue, developer) => {
  if (!developer?.email) {
    console.log('开发人员邮箱不存在，无法发送通知');
    return { success: false, error: '开发人员邮箱不存在' };
  }

  return await sendMail({
    to: developer.email,
    subject: `[新问题] ${issue.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">新问题需要处理</h2>
        <p>您有一个新的问题需要处理：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${issue.title}</h3>
          <p><strong>问题描述：</strong> ${getPlainText(issue.description).substring(0, 200)}${getPlainText(issue.description).length > 200 ? '...' : ''}</p>
          <p><strong>提交时间：</strong> ${formatDate(issue.createdAt)}</p>
          <p><strong>提交用户：</strong> ${issue.user?.username || '未知用户'}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/developer/issue/${issue.id}" 
             style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看问题详情
          </a>
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台处理。
        </p>
      </div>
    `
  });
};

/**
 * 发送问题状态更新通知给用户
 * @param {Object} issue 问题对象
 * @param {string} statusLabel 状态文本标签
 * @returns {Promise<Object>} 发送结果
 */
const sendStatusUpdateNotification = async (issue, statusLabel) => {
  if (!issue.user?.email) {
    console.log('用户邮箱不存在，无法发送通知');
    return { success: false, error: '用户邮箱不存在' };
  }

  return await sendMail({
    to: issue.user.email,
    subject: `[状态更新] 您的问题"${issue.title}"状态已更新`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">问题状态已更新</h2>
        <p>您提交的问题状态已更新：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${issue.title}</h3>
          <p><strong>当前状态：</strong> <span style="color: ${getStatusColor(issue.status)}; font-weight: bold;">${statusLabel}</span></p>
          <p><strong>更新时间：</strong> ${formatDate(issue.updatedAt)}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/issue/${issue.id}" 
             style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看问题详情
          </a>
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台查看。
        </p>
      </div>
    `
  });
};

/**
 * 发送新评论通知
 * @param {Object} issue 问题对象
 * @param {Object} comment 评论对象
 * @param {Object} recipient 接收者对象
 * @returns {Promise<Object>} 发送结果
 */
const sendNewCommentNotification = async (issue, comment, recipient) => {
  if (!recipient?.email) {
    console.log('接收者邮箱不存在，无法发送通知');
    return { success: false, error: '接收者邮箱不存在' };
  }

  return await sendMail({
    to: recipient.email,
    subject: `[新回复] 问题"${issue.title}"有新回复`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">问题有新回复</h2>
        <p>您关注的问题有一条新回复：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${issue.title}</h3>
          <div style="border-left: 3px solid #007bff; padding-left: 10px; margin: 15px 0;">
            <p><strong>${comment.user?.username || '系统用户'}</strong> 在 ${formatDate(comment.createdAt)} 回复：</p>
            <p>${getPlainText(comment.content)}</p>
          </div>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/${recipient.role === 'developer' ? 'developer' : 'user'}/issue/${issue.id}" 
             style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看完整对话
          </a>
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台回复。
        </p>
      </div>
    `
  });
};

/**
 * 发送问题已解决通知给用户
 * @param {Object} issue 问题对象
 * @returns {Promise<Object>} 发送结果
 */
const sendIssueResolvedNotification = async (issue) => {
  if (!issue.user?.email) {
    console.log('用户邮箱不存在，无法发送通知');
    return { success: false, error: '用户邮箱不存在' };
  }

  return await sendMail({
    to: issue.user.email,
    subject: `[已解决] 您的问题"${issue.title}"已被解决`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">您的问题已解决</h2>
        <p>您提交的问题已被成功解决：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${issue.title}</h3>
          <p><strong>状态：</strong> <span style="color: #2ecc71; font-weight: bold;">已解决</span></p>
          <p><strong>解决时间：</strong> ${formatDate(issue.updatedAt)}</p>
        </div>
        <p>您可以在问题详情页查看解决方案或提供反馈。如果该解决方案对您有帮助，欢迎点击"接受解决方案"按钮确认。</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/issue/${issue.id}" 
             style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看解决方案
          </a>
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台查看。
        </p>
      </div>
    `
  });
};

/**
 * 发送开发者通知邮件
 * @param {string} email 开发者邮箱
 * @param {Object} issue 问题对象
 * @param {string} moduleName 模块名称
 * @returns {Promise<Object>} 发送结果
 */
const sendDeveloperNotification = async (email, issue, moduleName) => {
  if (!email) {
    writeEmailLog('warn', '开发者邮箱不存在，无法发送通知');
    return { success: false, error: '开发者邮箱不存在' };
  }

  return await sendMail({
    to: email,
    subject: `[新问题] ${issue.title || '未命名问题'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">新问题需要处理</h2>
        <p>您有一个新的问题需要处理：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">${issue.title || '未命名问题'}</h3>
          <p><strong>问题描述：</strong> ${getPlainText(issue.description || '').substring(0, 200)}${issue.description && issue.description.length > 200 ? '...' : ''}</p>
          <p><strong>所属模块：</strong> ${moduleName || '未指定模块'}</p>
          <p><strong>提交时间：</strong> ${formatDate(issue.createdAt)}</p>
        </div>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/developer/issue/${issue.id}" 
             style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
            查看问题详情
          </a>
        </p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台处理。
        </p>
      </div>
    `
  });
};

/**
 * 发送问题状态变更通知
 * @param {Object} issue 问题对象
 * @param {string} oldStatus 旧状态
 * @param {string} newStatus 新状态
 * @returns {Promise<Object>} 发送结果
 */
const sendStatusChangeNotification = async (issue, oldStatus, newStatus) => {
  try {
    // 查询完整的问题信息（包括用户信息）
    const issueWithUser = await issue.getUser();
    
    if (!issueWithUser || !issueWithUser.email) {
      writeEmailLog('warn', '用户邮箱不存在，无法发送状态变更通知');
      return { success: false, error: '用户邮箱不存在' };
    }
    
    // 获取状态标签
    const getStatusLabel = (status) => {
      switch(status) {
        case 'pending': return '待处理';
        case 'processing': return '处理中';
        case 'resolved': return '已解决';
        case 'closed': return '已关闭';
        default: return status;
      }
    };
    
    const oldStatusLabel = getStatusLabel(oldStatus);
    const newStatusLabel = getStatusLabel(newStatus);
    
    return await sendMail({
      to: issueWithUser.email,
      subject: `[状态更新] 您的问题"${issue.title}"状态已更新`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2c3e50; margin-top: 0;">问题状态已更新</h2>
          <p>您提交的问题状态已更新：</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #0056b3;">${issue.title}</h3>
            <p><strong>原状态：</strong> <span style="color: ${getStatusColor(oldStatus)};">${oldStatusLabel}</span></p>
            <p><strong>新状态：</strong> <span style="color: ${getStatusColor(newStatus)}; font-weight: bold;">${newStatusLabel}</span></p>
            <p><strong>更新时间：</strong> ${formatDate(issue.updatedAt)}</p>
          </div>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/issue/${issue.id}" 
               style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
              查看问题详情
            </a>
          </p>
          <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
            此邮件由系统自动发送，请勿直接回复。如有问题，请登录PADIA反馈平台查看。
          </p>
        </div>
      `
    });
  } catch (error) {
    writeEmailLog('error', '发送状态变更通知失败', {
      error: error.message,
      issueId: issue.id,
      oldStatus,
      newStatus
    });
    return { success: false, error: error.message };
  }
};

/**
 * 测试邮件发送功能
 * @param {string} email 收件人邮箱
 * @param {string} subject 可选的邮件主题
 * @param {string} text 可选的纯文本内容
 * @param {string} html 可选的HTML内容
 * @returns {Promise<Object>} 发送结果
 */
const testEmailSending = async (email, subject, text, html) => {
  if (!email) {
    writeEmailLog('warn', '测试邮件失败：未提供邮箱地址');
    return { success: false, error: '未提供邮箱地址' };
  }
  
  const mailSubject = subject || 'PADIA反馈平台 - 测试邮件';
  const mailText = text || '这是一封来自PADIA反馈平台的测试邮件，用于验证邮件发送功能是否正常。';
  const mailHtml = html || `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #2c3e50; margin-top: 0;">邮件发送测试</h2>
      <p>这是一封来自PADIA反馈平台的测试邮件，用于验证邮件发送功能是否正常。</p>
      <p>如果您收到这封邮件，表示邮件服务配置正确！</p>
      <p>发送时间: ${formatDate(new Date())}</p>
      <p>邮件配置信息:</p>
      <ul>
        <li>服务器: ${process.env.MAIL_HOST || '默认配置'}</li>
        <li>端口: ${process.env.MAIL_PORT || '默认配置'}</li>
        <li>发件人: ${process.env.MAIL_USER || '默认配置'}</li>
      </ul>
      <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
        此邮件由系统自动发送，请勿直接回复。
      </p>
    </div>
  `;
  
  writeEmailLog('info', `发送测试邮件`, {
    to: email,
    subject: mailSubject
  });
  
  return await sendMail({
    to: email,
    subject: mailSubject,
    text: mailText,
    html: mailHtml
  });
};

/**
 * 强制重新初始化邮件传输器
 * @returns {Promise<boolean>} 初始化是否成功
 */
const forceReinitializeTransporter = async () => {
  writeEmailLog('info', '强制重新初始化邮件传输器');
  
  // 如果存在旧传输器，关闭它
  if (transporter) {
    try {
      transporter.close();
    } catch (error) {
      writeEmailLog('warn', '关闭旧传输器失败，将继续初始化新传输器', {
        error: error.message
      });
    }
    transporter = null;
  }
  
  // 重新初始化
  return initMailer();
};

// 初始化邮件服务
initMailer();

// 导出邮件服务功能
export default {
  initMailer,
  verifyConnection,
  sendMail,
  sendNewIssueNotification,
  sendStatusUpdateNotification,
  sendNewCommentNotification,
  sendIssueResolvedNotification,
  sendDeveloperNotification,
  sendStatusChangeNotification,
  testEmailSending,
  forceReinitializeTransporter,
  writeEmailLog
}; 