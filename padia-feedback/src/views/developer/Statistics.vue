<template>
  <div class="statistics-container">
    <h1>数据统计</h1>
    
    <div v-loading="loading" class="statistics-content">
      <el-empty v-if="showEmpty" description="暂无统计数据">
        <template #image>
          <el-icon style="font-size: 60px"><data-analysis /></el-icon>
        </template>
        <template #description>
          <p>您暂时没有任何统计数据</p>
          <p>随着更多问题的处理，这里将显示您的处理效率</p>
        </template>
      </el-empty>
      
      <el-row v-else :gutter="20">
        <!-- 核心数据卡片 -->
        <el-col :span="24">
          <div class="data-section">
            <h2>概览</h2>
            <el-row :gutter="20">
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card total-card">
                  <template #header>
                    <div class="card-header">
                      <span>总问题数</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.totalIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card pending-card">
                  <template #header>
                    <div class="card-header">
                      <span>待处理问题</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.pendingIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card processing-card">
                  <template #header>
                    <div class="card-header">
                      <span>处理中问题</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.processingIssues }}</div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="6" :md="6" :lg="6">
                <el-card shadow="hover" class="data-card resolved-card">
                  <template #header>
                    <div class="card-header">
                      <span>已解决问题</span>
                    </div>
                  </template>
                  <div class="card-value">{{ statistics.resolvedIssues }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
        
        <!-- 效率指标区域 -->
        <el-col :span="24">
          <div class="data-section">
            <h2>处理效率</h2>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-card shadow="hover" class="time-card">
                  <template #header>
                    <div class="card-header">
                      <span>平均响应时间</span>
                    </div>
                  </template>
                  <div class="time-value">
                    <span class="time-number">{{ statistics.responseTime }}</span>
                    <span class="time-unit">小时</span>
                  </div>
                  <div class="time-description">从问题提交到首次回复的平均时间</div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-card shadow="hover" class="time-card">
                  <template #header>
                    <div class="card-header">
                      <span>平均解决时间</span>
                    </div>
                  </template>
                  <div class="time-value">
                    <span class="time-number">{{ statistics.resolveTime }}</span>
                    <span class="time-unit">小时</span>
                  </div>
                  <div class="time-description">从问题开始处理到解决的平均时间</div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" class="mt-20">
              <el-col :span="24">
                <el-card shadow="hover" class="completion-card">
                  <template #header>
                    <div class="card-header">
                      <span>完成率</span>
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
                      在总计{{ statistics.totalIssues }}个问题中，成功解决了{{ statistics.resolvedIssues }}个
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>

        <!-- 开发者对比区域 - 仅管理员可见 -->
        <el-col v-if="isAdmin && developerStats.length > 0" :span="24">
          <div class="data-section">
            <h2>开发者绩效对比</h2>
            <el-table :data="developerStats" style="width: 100%" border stripe>
              <el-table-column prop="developer.username" label="开发者" min-width="120">
                <template #default="scope">
                  <div class="developer-info">
                    <el-avatar v-if="scope.row.developer.avatar" :src="scope.row.developer.avatar" :size="30"></el-avatar>
                    <el-avatar v-else :size="30">{{ scope.row.developer.username.substring(0, 1) }}</el-avatar>
                    <span class="developer-name">{{ scope.row.developer.username }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="totalIssues" label="总问题数" width="100" sortable></el-table-column>
              <el-table-column prop="pendingIssues" label="待处理" width="100" sortable></el-table-column>
              <el-table-column prop="processingIssues" label="处理中" width="100" sortable></el-table-column>
              <el-table-column prop="resolvedIssues" label="已解决" width="100" sortable></el-table-column>
              <el-table-column prop="responseTime" label="平均响应时间(小时)" width="150" sortable></el-table-column>
              <el-table-column prop="resolveTime" label="平均解决时间(小时)" width="150" sortable></el-table-column>
              <el-table-column label="完成率" width="150" sortable>
                <template #default="scope">
                  <el-progress 
                    :percentage="getDevCompletionRate(scope.row)" 
                    :color="getCompletionColor(getDevCompletionRate(scope.row))"
                  ></el-progress>
                </template>
              </el-table-column>
            </el-table>
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
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

// 当前用户是否为管理员
const isAdmin = computed(() => {
  // 从userStore获取角色
  const storeRole = userStore.userRole;
  // 从localStorage获取角色
  const localRole = localStorage.getItem('role');
  
  console.log("从Store获取的角色:", storeRole);
  console.log("从localStorage获取的角色:", localRole);
  
  // 优先使用localRole，因为登录时直接存入了localStorage
  return localRole === 'admin' || storeRole === 'admin';
})

// 加载状态
const loading = ref(true)

// 开发者统计数据
const developerStats = ref([])

// 统计数据
const statistics = ref({
  totalIssues: 0,
  pendingIssues: 0,
  processingIssues: 0,
  resolvedIssues: 0,
  responseTime: '0.0',
  resolveTime: '0.0'
})

// 是否显示空状态
const showEmpty = computed(() => {
  // 管理员模式下，如果有开发者数据，永远不显示空状态
  if (isAdmin.value && developerStats.value.length > 0) {
    return false;
  }
  
  // 非管理员或没有开发者数据时，检查是否有统计数据
  return !loading.value && 
         statistics.value.totalIssues === 0 && 
         statistics.value.resolvedIssues === 0;
})

// 完成率
const completionRate = computed(() => {
  if (statistics.value.totalIssues === 0) return 0
  return Math.round((statistics.value.resolvedIssues / statistics.value.totalIssues) * 100)
})

// 获取完成率颜色
const getCompletionColor = (rate) => {
  if (rate < 30) return '#F56C6C'
  if (rate < 70) return '#E6A23C'
  return '#67C23A'
}

// 获取开发者完成率
const getDevCompletionRate = (developer) => {
  if (developer.totalIssues === 0) return 0
  return Math.round((developer.resolvedIssues / developer.totalIssues) * 100)
}

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    const response = await issueApi.getDeveloperStatistics()
    console.log('统计数据响应:', response?.data);
    
    if (response?.data?.code === 200) {
      // 使用类型断言处理数据结构
      const responseData = response.data.data as any || {};
      console.log('响应数据:', responseData);
      console.log('是否为管理员:', isAdmin.value);
      console.log('是否有summary:', responseData.summary ? '有' : '无');
      
      if (isAdmin.value && responseData.summary) {
        // 管理员看到全局数据
        const summaryData = responseData.summary as any;
        console.log('汇总数据:', summaryData);
        statistics.value = {
          totalIssues: summaryData.totalIssues || 0,
          pendingIssues: summaryData.pendingIssues || 0,
          processingIssues: summaryData.processingIssues || 0,
          resolvedIssues: summaryData.resolvedIssues || 0,
          responseTime: String(summaryData.avgResponseTime || '0.0'),
          resolveTime: String(summaryData.avgResolveTime || '0.0')
        }
        
        // 设置开发者详细数据
        developerStats.value = responseData.developers || [];
        console.log('开发者数据长度:', developerStats.value.length);
      } else {
        // 普通开发者只看自己的数据
        statistics.value = {
          totalIssues: responseData.totalIssues || 0,
          pendingIssues: responseData.pendingIssues || 0,
          processingIssues: responseData.processingIssues || 0,
          resolvedIssues: responseData.resolvedIssues || 0,
          responseTime: String(responseData.responseTime || '0.0'),
          resolveTime: String(responseData.resolveTime || '0.0')
        }
      }
      
      console.log('设置后的统计数据:', statistics.value);
      console.log('showEmpty计算结果:', showEmpty.value);
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

.time-card {
  height: 160px;
}

.time-value {
  text-align: center;
  margin: 10px 0;
  white-space: nowrap;
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

.developer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.developer-name {
  font-weight: 500;
}
</style>
