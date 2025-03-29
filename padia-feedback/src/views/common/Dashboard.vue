<template>
  <div class="dashboard-container">
    <h1 class="page-title">控制面板</h1>
    
    <el-row :gutter="20">
      <!-- 用户控制面板 -->
      <template v-if="userRole === 'user'">
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>我的问题</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ userStats.total || 0 }}</div>
              <div class="stat-label">问题总数</div>
            </div>
            <div class="card-footer">
              <el-button type="primary" @click="router.push('/issues/submit')">
                提交新问题
              </el-button>
              <el-button @click="router.push('/issues/list')">
                查看我的问题
              </el-button>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><ChatDotRound /></el-icon>
                <span>待解决问题</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ userStats.pending || 0 }}</div>
              <div class="stat-label">等待解决</div>
            </div>
            <el-progress 
              :percentage="calculatePercentage(userStats.pending, userStats.total)" 
              :status="userStats.pending > 0 ? 'warning' : 'success'" 
            />
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><Check /></el-icon>
                <span>已解决问题</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ userStats.resolved || 0 }}</div>
              <div class="stat-label">已成功解决</div>
            </div>
            <el-progress 
              :percentage="calculatePercentage(userStats.resolved, userStats.total)" 
              :status="'success'" 
            />
          </el-card>
        </el-col>
      </template>
      
      <!-- 开发人员控制面板 -->
      <template v-if="userRole === 'developer'">
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><List /></el-icon>
                <span>我的任务</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ devStats.total || 0 }}</div>
              <div class="stat-label">任务总数</div>
            </div>
            <div class="card-footer">
              <el-button type="primary" @click="router.push('/tasks')">
                查看我的任务
              </el-button>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><Loading /></el-icon>
                <span>处理中任务</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ devStats.processing || 0 }}</div>
              <div class="stat-label">正在处理</div>
            </div>
            <el-progress 
              :percentage="calculatePercentage(devStats.processing, devStats.total)" 
              status="warning" 
            />
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><Check /></el-icon>
                <span>已解决任务</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ devStats.resolved || 0 }}</div>
              <div class="stat-label">成功解决</div>
            </div>
            <el-progress 
              :percentage="calculatePercentage(devStats.resolved, devStats.total)" 
              status="success" 
            />
          </el-card>
        </el-col>
      </template>
      
      <!-- 管理员控制面板 -->
      <template v-if="userRole === 'admin'">
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><User /></el-icon>
                <span>用户统计</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ adminStats.userCount || 0 }}</div>
              <div class="stat-label">平台用户总数</div>
            </div>
            <div class="card-footer">
              <el-button type="primary" @click="router.push('/admin/users')">
                用户管理
              </el-button>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>问题统计</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ adminStats.issueCount || 0 }}</div>
              <div class="stat-label">平台问题总数</div>
            </div>
            <div class="card-footer">
              <el-button type="primary" @click="router.push('/admin/issues')">
                问题管理
              </el-button>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <el-icon><WarningFilled /></el-icon>
                <span>待处理问题</span>
              </div>
            </template>
            <div class="card-content">
              <div class="stat-number">{{ adminStats.pendingIssues || 0 }}</div>
              <div class="stat-label">待分配开发人员</div>
            </div>
            <el-progress 
              :percentage="calculatePercentage(adminStats.pendingIssues, adminStats.issueCount)" 
              :status="adminStats.pendingIssues > 0 ? 'warning' : 'success'" 
            />
          </el-card>
        </el-col>
      </template>
    </el-row>
    
    <el-divider content-position="center">最近活动</el-divider>
    
    <el-card class="recent-activities">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
          <el-button type="text" @click="loadRecentActivities">刷新</el-button>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="activities.length === 0" class="empty-data">
        <el-empty description="暂无活动记录" />
      </div>
      
      <div v-else class="activity-list">
        <div v-for="(activity, index) in activities" :key="index" class="activity-item">
          <div class="activity-icon">
            <el-avatar :size="32" :icon="getActivityIcon(activity.type)"></el-avatar>
          </div>
          <div class="activity-content">
            <div class="activity-title">
              {{ activity.title }}
            </div>
            <div class="activity-time">
              {{ formatDate(activity.time) }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document, ChatDotRound, Check, List, Loading, 
  User, WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 用户角色
const userRole = computed(() => userStore.userRole)

// 数据统计
const userStats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  resolved: 0
})

const devStats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  resolved: 0
})

const adminStats = ref({
  userCount: 0,
  issueCount: 0,
  pendingIssues: 0
})

// 最近活动
const activities = ref([])
const loading = ref(true)

// 初始化
onMounted(async () => {
  await loadDashboardData()
  await loadRecentActivities()
})

// 加载控制面板数据
const loadDashboardData = async () => {
  try {
    // 这里应调用API获取真实数据
    // 为演示目的，使用模拟数据
    
    setTimeout(() => {
      // 根据角色设置不同的模拟数据
      if (userRole.value === 'user') {
        userStats.value = {
          total: 5,
          pending: 2,
          processing: 1,
          resolved: 2
        }
      } else if (userRole.value === 'developer') {
        devStats.value = {
          total: 8,
          pending: 3,
          processing: 3,
          resolved: 2
        }
      } else if (userRole.value === 'admin') {
        adminStats.value = {
          userCount: 15,
          issueCount: 25,
          pendingIssues: 8
        }
      }
    }, 500)
    
  } catch (error) {
    console.error('加载控制面板数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  }
}

// 加载最近活动
const loadRecentActivities = async () => {
  loading.value = true
  
  try {
    // 这里应调用API获取真实数据
    // 为演示目的，使用模拟数据
    
    setTimeout(() => {
      activities.value = [
        {
          type: 'issue',
          title: '新问题已提交: 系统无法导出数据',
          time: new Date(new Date().getTime() - 30 * 60 * 1000)
        },
        {
          type: 'comment',
          title: '开发人员回复了您的问题',
          time: new Date(new Date().getTime() - 2 * 60 * 60 * 1000)
        },
        {
          type: 'status',
          title: '问题状态已更新为: 处理中',
          time: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
        },
        {
          type: 'resolved',
          title: '问题已解决: 无法登录系统',
          time: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        }
      ]
      
      loading.value = false
    }, 800)
    
  } catch (error) {
    console.error('加载最近活动失败:', error)
    ElMessage.error('加载活动数据失败，请稍后重试')
    loading.value = false
  }
}

// 计算百分比
const calculatePercentage = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

// 获取活动图标
const getActivityIcon = (type) => {
  switch (type) {
    case 'issue':
      return Document
    case 'comment':
      return ChatDotRound
    case 'status':
      return Loading
    case 'resolved':
      return Check
    default:
      return Document
  }
}

// 格式化日期
const formatDate = (date) => {
  return date.toLocaleString()
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.dashboard-card {
  height: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.card-content {
  padding: 20px 0;
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.card-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.recent-activities {
  margin-top: 20px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 15px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.loading-container,
.empty-data {
  padding: 30px 0;
  text-align: center;
}
</style> 