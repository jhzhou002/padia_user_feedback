import jwt from 'jsonwebtoken';

/**
 * 用户身份验证中间件
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
export const authMiddleware = (req, res, next) => {
  try {
    // 从请求头中获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null
      });
    }
    
    // 验证token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'padia_user_feedback_secret_key'
    );
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(401).json({
      code: 401,
      message: '认证失败，无效的令牌',
      data: null
    });
  }
}; 