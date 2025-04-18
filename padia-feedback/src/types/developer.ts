// 开发者信息
export interface Developer {
  id: string
  username: string
  email?: string
  avatar?: string
}

// 开发者统计数据
export interface DeveloperStatistics {
  developer: Developer
  totalIssues: number
  pendingIssues: number
  processingIssues: number
  resolvedIssues: number
  ratingsCount: number
  avgRating: string | number
  avgResponseTime: string | number
  avgResolveTime: string | number
}

// 评分分布
export interface RatingsDistribution {
  [key: string]: number
}

// 统计数据汇总
export interface StatisticsSummary {
  totalIssues: number
  pendingIssues: number
  processingIssues: number
  resolvedIssues: number
  ratingsCount: number
  avgRating: string | number
  avgResponseTime?: string | number
  avgResolveTime?: string | number
  ratingsDistribution?: RatingsDistribution
}

// 统计数据响应
export interface StatisticsResponse {
  summary: StatisticsSummary
  developerStats?: DeveloperStatistics[]
} 