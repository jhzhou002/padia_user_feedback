<template>
  <div class="statistics-container">
    <h1>{{ $t('statistics.title') }}</h1>
    
    <div v-loading="loading" class="statistics-content">
      <el-empty v-if="showEmpty" :description="$t('statistics.noStatisticsData')">
        <template #image>
          <el-icon style="font-size: 60px"><data-analysis /></el-icon>
        </template>
        <template #description>
          <p>{{ $t('statistics.noStatisticsDesc1') }}</p>
          <p>{{ $t('statistics.noStatisticsDesc2') }}</p>
        </template>
      </el-empty>
      
      <el-row v-else :gutter="20">
        <!-- 核心数据卡片 -->
        <el-col :span="24">
          <div class="data-section">
            <h2>{{ $t('statistics.overview') }}</h2>
            <el-row :gutter="20">
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card total-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.totalIssues') }}</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.totalIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card pending-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.pendingIssues') }}</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.pendingIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card processing-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.processingIssues') }}</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.processingIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card resolved-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.resolvedIssues') }}</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.resolvedIssues }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
        
        <!-- 满意度评价区域 -->
        <el-col :span="24" :lg="12">
          <div class="data-section">
            <h2>{{ $t('statistics.userSatisfaction') }}</h2>
            <el-card shadow="hover">
              <div class="satisfaction-container">
                <div class="rating-summary">
                  <div class="average-rating">
                    <div class="rating-value">{{ statistics.averageRating }}</div>
                    <div class="rating-stars">
                      <el-rate
                        v-model="avgRating"
                        disabled
                        show-score
                        text-color="#ff9900"
                        :colors="ratingColors"
                      />
                    </div>
                    <div class="rating-count">
                      {{ $t('statistics.ratings', { count: statistics.ratingsCount }) }}
                    </div>
                  </div>
                </div>
                
                <div class="rating-distribution">
                  <div 
                    v-for="i in 5" 
                    :key="i" 
                    class="rating-bar-container"
                  >
                    <span class="rating-label">{{ i }} {{ $t('statistics.star') }}</span>
                    <div class="rating-bar-wrapper">
                      <div 
                        class="rating-bar" 
                        :style="{
                          width: getRatingPercentage(i) + '%',
                          backgroundColor: i >= 4 ? '#67C23A' : (i >= 3 ? '#E6A23C' : '#F56C6C')
                        }"
                      ></div>
                    </div>
                    <span class="rating-count-label">{{ statistics.ratingsDistribution[i] || 0 }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
        
        <!-- 效率指标区域 -->
        <el-col :span="24" :lg="12">
          <div class="data-section">
            <h2>{{ $t('statistics.efficiency') }}</h2>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover" class="time-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.avgResponseTime') }}</span>
                    </div>
                  </template>
                  <div class="time-value">
                    <span class="time-number">{{ statistics.responseTime }}</span>
                    <span class="time-unit">{{ $t('statistics.hour') }}</span>
                  </div>
                  <div class="time-description">{{ $t('statistics.responseTimeDesc') }}</div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover" class="time-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.avgResolveTime') }}</span>
                    </div>
                  </template>
                  <div class="time-value">
                    <span class="time-number">{{ statistics.resolveTime }}</span>
                    <span class="time-unit">{{ $t('statistics.hour') }}</span>
                  </div>
                  <div class="time-description">{{ $t('statistics.resolveTimeDesc') }}</div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" class="mt-20">
              <el-col :span="24">
                <el-card shadow="hover" class="completion-card">
                  <template #header>
                    <div class="card-header">
                      <span>{{ $t('statistics.completionRate') }}</span>
                    </div>
                  </template>
                  <div class="completion-container">
                    <el-progress 
                      type="circle" 
                      :percentage="completionRate" 
                      :color="getCompletionColor(completionRate)"
                      :stroke-width="10"
                    />
                    <div class="completion-description">
                      {{ $t('statistics.completionDesc', { resolved: statistics.resolvedIssues, total: statistics.totalIssues }) }}
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis } from '@element-plus/icons-vue'
import { issueApi } from '../../api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 加载状态
const loading = ref(true)

// 评分颜色
const ratingColors = ['#F56C6C', '#F56C6C', '#E6A23C', '#E6A23C', '#67C23A']

// 统计数据
const statistics = ref({
  totalIssues: 0,
  pendingIssues: 0,
  processingIssues: 0,
  resolvedIssues: 0,
  averageRating: '0.0',
  ratingsCount: 0,
  ratingsDistribution: {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  },
  responseTime: '0.0',
  resolveTime: '0.0'
})

// 是否显示空状态
const showEmpty = computed(() => {
  return !loading.value && (
    statistics.value.totalIssues === 0 || 
    (statistics.value.ratingsCount === 0 && statistics.value.resolvedIssues === 0)
  )
})

// 平均评分
const avgRating = computed(() => {
  return parseFloat(statistics.value.averageRating) || 0
})

// 完成率
const completionRate = computed(() => {
  if (statistics.value.totalIssues === 0) return 0
  return Math.round((statistics.value.resolvedIssues / statistics.value.totalIssues) * 100)
})

// 获取评分百分比
const getRatingPercentage = (rating) => {
  if (statistics.value.ratingsCount === 0) return 0
  return Math.round((statistics.value.ratingsDistribution[rating] / statistics.value.ratingsCount) * 100)
}

// 获取完成率颜色
const getCompletionColor = (rate) => {
  if (rate < 30) return '#F56C6C'
  if (rate < 70) return '#E6A23C'
  return '#67C23A'
}

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    const response = await issueApi.getDeveloperStatistics()
    if (response?.data?.code === 200 && response.data.data) {
      // 确保类型匹配
      statistics.value = {
        totalIssues: response.data.data.totalIssues || 0,
        pendingIssues: response.data.data.pendingIssues || 0,
        processingIssues: response.data.data.processingIssues || 0,
        resolvedIssues: response.data.data.resolvedIssues || 0,
        averageRating: String(response.data.data.averageRating || '0.0'),
        ratingsCount: response.data.data.ratingsCount || 0,
        ratingsDistribution: {
          '1': response.data.data.ratingsDistribution['1'] || 0,
          '2': response.data.data.ratingsDistribution['2'] || 0,
          '3': response.data.data.ratingsDistribution['3'] || 0,
          '4': response.data.data.ratingsDistribution['4'] || 0,
          '5': response.data.data.ratingsDistribution['5'] || 0
        },
        responseTime: String(response.data.data.responseTime || '0.0'),
        resolveTime: String(response.data.data.resolveTime || '0.0')
      }
    } else {
      ElMessage.error('获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据错误:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.statistics-content {
  margin-top: 20px;
}

.data-section {
  margin-bottom: 30px;
}

.data-section h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 600;
}

.data-card {
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.data-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  padding: 10px 0;
}

.total-card .card-value {
  color: #409EFF;
}

.pending-card .card-value {
  color: #909399;
}

.processing-card .card-value {
  color: #E6A23C;
}

.resolved-card .card-value {
  color: #67C23A;
}

.satisfaction-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rating-summary {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.average-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rating-value {
  font-size: 42px;
  font-weight: bold;
  color: #FF9900;
}

.rating-stars {
  margin: 5px 0;
}

.rating-count {
  font-size: 14px;
  color: #909399;
}

.rating-distribution {
  padding: 0 20px;
}

.rating-bar-container {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.rating-label {
  min-width: 40px;
  text-align: right;
  margin-right: 10px;
}

.rating-bar-wrapper {
  flex: 1;
  background-color: #EBEEF5;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.rating-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.rating-count-label {
  min-width: 30px;
  text-align: right;
  margin-left: 10px;
  color: #909399;
}

.time-card {
  height: 160px;
}

.time-value {
  text-align: center;
  margin: 10px 0;
}

.time-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.time-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
}

.time-description {
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.completion-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.completion-description {
  margin-top: 15px;
  font-size: 14px;
  color: #606266;
}

.mt-20 {
  margin-top: 20px;
}
</style>
