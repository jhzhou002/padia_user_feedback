/**
 * 文本处理工具函数
 * 用于智能提取标题和关键词处理
 */
import { debounce } from 'lodash';
import _ from 'lodash';

// 技术领域常见关键词，用于提升关键词权重
const TECH_KEYWORDS = [
  'error', '错误', 'bug', '问题', 'fail', '失败', 
  'exception', '异常', '崩溃', 'crash', 
  'not working', '无法', '不能', '无效',
  'database', '数据库', 'server', '服务器',
  'login', '登录', 'access', '访问',
  'permission', '权限', 'security', '安全',
  'UI', '界面', 'display', '显示',
  'slow', '慢', 'performance', '性能',
  'data', '数据', 'lost', '丢失'
];

// 中文常见停用词
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就',
  '不', '人', '都', '一', '一个', '上', '也', '很',
  '到', '说', '要', '去', '你', '会', '着', '没有',
  '看', '好', '自己', '这', '吗', '吧', '里', '啊',
  '还', '能', '它', '对', '这个', '那个', '什么', '呢'
]);

/**
 * 增强版文本清洗函数，处理HTML和常见文本问题
 * @param htmlText HTML格式的文本
 * @returns 清理后的纯文本
 */
export function cleanHtml(htmlText: string): string {
  if (!htmlText) return '';
  
  // 移除HTML标签
  let text = htmlText.replace(/<[^>]+>/g, ' ');
  
  // 替换特殊字符和换行
  text = text
    .replace(/[\r\n\t]+/g, ' ')       // 替换换行和制表符
    .replace(/&[a-zA-Z]+;/g, ' ')     // 替换HTML实体
    .replace(/\s+/g, ' ')             // 合并连续空格
    .trim();
  
  return text;
}

/**
 * 提取第一个完整句子，支持中英文标点
 * @param text 纯文本
 * @returns 第一个完整句子
 */
export function extractFirstSentence(text: string): string {
  if (!text) return '';
  
  // 中英文句子结束标志
  const sentenceEndings = ['。', '？', '！', '；', '.', '?', '!', ';'];
  
  // 尝试获取第一个句子
  for (const ending of sentenceEndings) {
    const index = text.indexOf(ending);
    if (index !== -1 && index < 100) {  // 避免过长的句子
      return text.substring(0, index + 1);
    }
  }
  
  // 如果没有找到句子结束标志，尝试按逗号切分
  const commaIndex = text.indexOf('，');
  if (commaIndex !== -1 && commaIndex < 50) {
    return text.substring(0, commaIndex + 1);
  }
  
  // 兜底方案：返回前30个字符
  return text.length > 30 ? text.substring(0, 30) + '...' : text;
}

/**
 * 根据字符频率和特殊关键词的简单关键词提取
 * @param text 要分析的文本
 * @param topN 要提取的关键词数量
 * @returns 找到的关键词列表
 */
export function findKeywords(text: string, topN: number = 5): string[] {
  if (!text) return [];
  
  // 匹配技术关键词
  const techKeywords = TECH_KEYWORDS.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // 如果找到了技术关键词，优先返回
  if (techKeywords.length > 0) {
    return techKeywords.slice(0, 3);
  }
  
  // 移除常见的停用词
  const stopWords = Array.from(STOP_WORDS);
  
  // 分词并过滤停用词（简单按空格分词，适用于英文，中文效果有限）
  const words = text.split(/\s+/)
    .filter(word => word.length > 1)
    .filter(word => !stopWords.includes(word.toLowerCase()));
  
  // 统计词频
  const wordCount = _.countBy(words);
  
  // 根据词频排序并获取前N个词
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
}

/**
 * 增强版智能标题生成
 * @param htmlContent HTML内容
 * @param maxLength 最大标题长度
 * @returns 生成的标题
 */
export function generateSmartTitle(htmlContent: string, maxLength: number = 50): string {
  if (!htmlContent) return '';
  
  // 清理HTML内容
  const cleanText = cleanHtml(htmlContent);
  
  // 提取第一个句子
  let title = extractFirstSentence(cleanText);
  
  // 使用简单方法提取关键词
  const keywords = findKeywords(cleanText);
  
  // 如果标题中没有关键词，则添加关键词
  if (keywords.length > 0 && !keywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase()))) {
    
    // 如果标题末尾没有标点，添加冒号和关键词
    if (!/[。；，！？\.;,!\?]$/.test(title)) {
      // 如果标题很短，直接附加关键词
      if (title.length < 15) {
        title += `（${keywords.join(' ')}）`;
      } 
      // 标题较长，只添加最重要的关键词
      else {
        title += `：${keywords[0]}`;
      }
    } else {
      // 插入关键词到标题的开头，如果标题不是很长
      if (title.length < 30) {
        title = `${keywords[0]} - ${title}`;
      }
    }
  }
  
  // 截断过长的标题
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  
  return title;
}

/**
 * 智能提取标题（带模块前缀）
 * @param htmlContent HTML内容 
 * @param moduleName 可选的模块名称
 * @returns 格式化的标题
 */
export function extractTitleWithModule(htmlContent: string, moduleName?: string): string {
  const title = generateSmartTitle(htmlContent);
  
  if (moduleName) {
    return `[${moduleName}] ${title}`;
  }
  
  return title;
}

/**
 * 带防抖功能的标题生成函数
 * @param htmlContent HTML内容
 * @param callback 回调函数，接收生成的标题
 * @param moduleName 可选的模块名称
 */
export const debouncedGenerateTitle = debounce((
  htmlContent: string, 
  callback: (title: string) => void,
  moduleName?: string
) => {
  const title = extractTitleWithModule(htmlContent, moduleName);
  callback(title);
}, 300);

/**
 * 根据关键词生成推荐标题
 * @param keywords 关键词列表
 * @param content 文本内容
 * @param maxLength 最大标题长度
 * @returns 生成的标题
 */
export function generateTitleFromKeywords(keywords: string[], content: string, maxLength: number = 30): string {
  if (!keywords || keywords.length === 0 || !content) return '';
  
  // 首先尝试从内容中提取第一句话
  const firstSentence = extractFirstSentence(content);
  
  // 如果第一句话不为空且长度合适，直接使用
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }
  
  // 否则，基于关键词组合生成标题
  const topKeywords = keywords.slice(0, 3);
  let title = topKeywords.join('相关');
  
  // 如果标题太短，添加更多内容
  if (title.length < 10 && firstSentence) {
    const shortenedSentence = firstSentence.substring(0, maxLength - title.length - 3);
    title = `${title}: ${shortenedSentence}`;
  }
  
  // 确保标题不超过最大长度
  return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
} 