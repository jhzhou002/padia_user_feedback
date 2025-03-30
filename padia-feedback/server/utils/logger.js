/**
 * 日志工具 - 用于记录系统操作和错误信息
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建日志目录
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志等级
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * 获取当前时间字符串
 * @returns {string} 格式化的时间字符串
 */
function getTimeString() {
  const now = new Date();
  return now.toISOString();
}

/**
 * 写入日志到文件
 * @param {string} level - 日志等级
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function writeToFile(level, message, data) {
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = {
    timestamp: getTimeString(),
    level,
    message,
    ...(data ? { data } : {})
  };
  
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
}

/**
 * 记录信息日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
export function info(message, data) {
  console.log(`[INFO] ${message}`);
  writeToFile(LOG_LEVELS.INFO, message, data);
}

/**
 * 记录警告日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
export function warn(message, data) {
  console.warn(`[WARN] ${message}`);
  writeToFile(LOG_LEVELS.WARN, message, data);
}

/**
 * 记录错误日志
 * @param {string} message - 日志消息
 * @param {Object|Error} data - 错误对象或附加数据
 */
export function error(message, data) {
  console.error(`[ERROR] ${message}`);
  
  // 如果是Error对象，提取错误信息
  if (data instanceof Error) {
    writeToFile(LOG_LEVELS.ERROR, message, {
      errorMessage: data.message,
      stack: data.stack
    });
  } else {
    writeToFile(LOG_LEVELS.ERROR, message, data);
  }
}

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
export function debug(message, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`);
    writeToFile(LOG_LEVELS.DEBUG, message, data);
  }
} 