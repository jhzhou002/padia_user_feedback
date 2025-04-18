<template>
  <div class="statistics-container">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="showEmpty" class="empty-container">
      <el-empty description="暂无统计数据" />
    </div>

    <!-- 有数据状态 -->
    <template v-else>
      <!-- 核心数据卡片 -->
      <div class="card-container">
        <div class="stats-card">
          <div class="card-title">总问题数</div>
          <div class="card-value">{{ summary?.totalIssues || 0 }}</div>
        </div>
        <div class="stats-card">
          <div class="card-title">待处理问题</div>
          <div class="card-value">{{ summary?.pendingIssues || 0 }}</div>
        </div>
        <div class="stats-card">
          <div class="card-title">处理中问题</div>
          <div class="card-value">{{ summary?.processingIssues || 0 }}</div>
        </div>
        <div class="stats-card">
          <div class="card-title">已解决问题</div>
          <div class="card-value">{{ summary?.resolvedIssues || 0 }}</div>
        </div>
      </div>

      <!-- 效率指标 -->
      <div class="time-container">
        <div class="section-title">效率指标</div>
        <div class="time-card-container">
          <div class="time-card">
            <div class="time-title">平均响应时间</div>
            <div class="time-value">{{ summary?.avgResponseTime || '0.0' }}</div>
            <div class="time-unit">小时</div>
          </div>
          <div class="time-card">
            <div class="time-title">平均解决时间</div>
            <div class="time-value">{{ summary?.avgResolveTime || '0.0' }}</div>
            <div class="time-unit">小时</div>
          </div>
          <div class="time-card completion-container">
            <div class="time-title">问题完成率</div>
            <div class="time-value">{{ formattedCompletionRate }}</div>
            <div class="time-unit">%</div>
          </div>
        </div>
      </div>

      <!-- 开发者列表 -->
      <div class="developer-comparison">
        <div class="section-title">开发者列表</div>
        <el-table :data="developerStats" style="width: 100%">
          <el-table-column prop="developer.username" label="开发人员" width="150">
            <template #default="scope">
              <span>{{ scope.row.developer.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalIssues" label="总问题" width="100" sortable></el-table-column>
          <el-table-column prop="resolvedIssues" label="已解决" width="100" sortable></el-table-column>
          <el-table-column prop="avgResponseTime" label="平均响应时间" width="130" sortable>
            <template #default="scope">
              {{ scope.row.avgResponseTime || '0.0' }} 小时
            </template>
          </el-table-column>
          <el-table-column prop="avgResolveTime" label="平均解决时间" width="130" sortable>
            <template #default="scope">
              {{ scope.row.avgResolveTime || '0.0' }} 小时
            </template>
          </el-table-column>
          <el-table-column prop="completionRate" label="问题完成率" width="130" sortable>
            <template #default="scope">
              {{ calculateCompletionRate(scope.row) }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import developerApi from '../../api/task'
import type { DeveloperStatistics, StatisticsSummary } from '../../types/developer'

// 状态管理
const loading = ref(true)
const summary = ref<StatisticsSummary | null>(null)
const developerStats = ref<DeveloperStatistics[]>([])

// 计算属性
const showEmpty = computed(() => {
  return !loading.value && (!summary.value || (summary.value.totalIssues === 0 && developerStats.value.length === 0))
})

const formattedCompletionRate = computed(() => {
  if (!summary.value) return '0.0'
  return calculateCompletionRate(summary.value)
})

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    console.log('开始获取管理员统计数据')
    const response = await developerApi.getStatistics()
    console.log('管理员统计数据响应:', response.data)
    
    if (response.data && response.data.code === 200) {
      const data = response.data.data
      
      // 设置汇总数据
      if (data.summary) {
        console.log('设置汇总数据:', data.summary)
        // 确保数据存在且格式正确
        summary.value = {
          totalIssues: data.summary.totalIssues || 0,
          pendingIssues: data.summary.pendingIssues || 0,
          processingIssues: data.summary.processingIssues || 0,
          resolvedIssues: data.summary.resolvedIssues || 0,
          avgResponseTime: data.summary.avgResponseTime || '0.0',
          avgResolveTime: data.summary.avgResolveTime || '0.0',
          ratingsCount: data.summary.ratingsCount || 0,
          averageRating: data.summary.averageRating || '0.0',
          ratingsDistribution: data.summary.ratingsDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        }
      }
      
      // 设置开发者统计数据
      if (data.developers && Array.isArray(data.developers)) {
        console.log('设置开发者统计数据, 长度:', data.developers.length)
        developerStats.value = data.developers.map((dev: any) => ({
          developer: dev.developer || { id: 0, username: '未知', email: '', avatar: '' },
          totalIssues: dev.totalIssues || 0,
          pendingIssues: dev.pendingIssues || 0,
          processingIssues: dev.processingIssues || 0,
          resolvedIssues: dev.resolvedIssues || 0,
          avgResponseTime: dev.responseTime || '0.0',
          avgResolveTime: dev.resolveTime || '0.0',
          ratingsCount: dev.ratingsCount || 0,
          averageRating: dev.averageRating || '0.0'
        }))
      }
    } else {
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 辅助方法
const calculateCompletionRate = (stats: any) => {
  if (!stats || !stats.totalIssues || stats.totalIssues === 0) return '0.0'
  const rate = (stats.resolvedIssues / stats.totalIssues) * 100
  return rate.toFixed(1)
}

// 生命周期钩子
onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.loading-container, .empty-container {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #004a96;
  padding-left: 10px;
}

.satisfaction-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.rating-flex {
  display: flex;
  gap: 30px;
}

.rating-summary {
  min-width: 200px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.rating-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.rating-value {
  font-size: 36px;
  font-weight: bold;
  color: #ff9900;
}

.rating-count {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.rating-bars {
  flex: 1;
}

.rating-bar-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.rating-label {
  min-width: 30px;
  margin-right: 10px;
}

.rating-bar-wrapper {
  flex: 1;
  height: 10px;
  background-color: #ebeef5;
  border-radius: 5px;
  overflow: hidden;
}

.rating-bar {
  height: 100%;
  background-color: #ff9900;
  border-radius: 5px;
}

.rating-percentage {
  min-width: 90px;
  text-align: right;
  margin-left: 10px;
  font-size: 12px;
  color: #606266;
}

.time-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.time-card-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.time-card {
  flex: 1;
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.time-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.time-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.time-unit {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.completion-container {
  background-color: #ecf5ff;
}

.completion-container .time-value {
  color: #409eff;
  white-space: nowrap;
}

.developer-comparison {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.developer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style> 