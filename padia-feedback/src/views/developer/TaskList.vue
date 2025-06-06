<template>
  <div class="page-container">
    <h1 class="page-title">任务列表</h1>
    
    <!-- 状态筛选标签 -->
    <div class="status-tabs">
      <el-tabs v-model="activeStatus" @tab-click="handleTabClick" type="card">
        <el-tab-pane name="all">
          <template #label>
            <div class="tab-label">
              <el-icon><Document /></el-icon>
              <span>全部任务</span>
              <el-badge :value="statusCounts.all" class="status-count" type="info" v-if="statusCounts.all > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="pending">
          <template #label>
            <div class="tab-label">
              <el-icon><Clock /></el-icon>
              <span>待处理</span>
              <el-badge :value="statusCounts.pending" class="status-count" type="danger" v-if="statusCounts.pending > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="processing">
          <template #label>
            <div class="tab-label">
              <el-icon><Loading /></el-icon>
              <span>处理中</span>
              <el-badge :value="statusCounts.processing" class="status-count" type="warning" v-if="statusCounts.processing > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="resolved">
          <template #label>
            <div class="tab-label">
              <el-icon><Select /></el-icon>
              <span>已解决</span>
              <el-badge :value="statusCounts.resolved" class="status-count" type="success" v-if="statusCounts.resolved > 0" />
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div class="task-content">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索任务"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch"></el-button>
          </template>
        </el-input>
      </div>
      
      <el-card v-loading="isLoading" class="task-list-card">
        <div v-if="tasks.length === 0 && !isLoading" class="empty-data">
          <el-empty :description="`暂无${getStatusLabel(activeStatus)}任务`" />
        </div>
        
        <div v-for="task in tasks" :key="task.id" 
             class="task-item" 
             @click="viewTaskDetails(task.id)">
          <div class="task-item-header">
            <span class="task-title">{{ task.issue?.title }}</span>
            <div class="task-user-info">
              <span v-if="task.issue?.user?.email">
                <el-tag size="small" effect="plain" type="info">{{ task.issue?.user?.email }}</el-tag>
              </span>
              <span v-if="task.issue?.user?.brand">
                <el-tag size="small" effect="plain" type="info">{{ task.issue?.user?.brand }}</el-tag>
              </span>
              <span v-if="task.issue?.user?.factory">
                <el-tag size="small" effect="plain" type="info">{{ task.issue?.user?.factory }}</el-tag>
              </span>
            </div>
          </div>
          <div class="task-item-content">
            {{ getTruncatedDescription(task.issue?.description || '') }}
          </div>
          <div class="task-item-footer">
            <span class="time-info">分配时间: {{ formatTaskDate(task.createdAt) }}</span>
            <div class="tag-group">
              <el-tag :type="getStatusType(task.issue?.status || '')" size="small" class="tag-item">{{ getStatusLabel(task.issue?.status || '') }}</el-tag>
            </div>
          </div>
        </div>
        
        <div class="pagination-container" v-if="tasks.length > 0">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Search, Document, Clock, Loading, Select 
} from '@element-plus/icons-vue'
import developerApi from '../../api/task'
import { IssueStatus } from '../../types'

const router = useRouter()

// 搜索和过滤
const searchQuery = ref('')
const activeStatus = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const isLoading = ref(false)

// 任务列表
const tasks = ref<any[]>([])

// 各状态任务数量
const statusCounts = computed(() => {
  const counts = { 
    all: tasks.value.length,
    pending: 0,
    processing: 0,
    resolved: 0,
    closed: 0
  }
  
  Object.values(IssueStatus).forEach(status => {
    // @ts-ignore
    counts[status] = tasks.value.filter(task => task.issue?.status === status).length
  })
  
  return counts
})

// 获取状态标签
const getStatusLabel = (status: string) => {
  if (status === 'resolved') return '已解决'
  if (status === 'processing') return '处理中'
  if (status === 'pending') return '待处理'
  if (status === 'closed') return '已关闭'
  if (status === 'all') return '全部'
  
  // 默认其他状态都显示为待处理
  return '待处理'
}

// 获取状态对应的标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case IssueStatus.PROCESSING:
      return 'warning'
    case IssueStatus.RESOLVED:
      return 'success'
    case IssueStatus.CLOSED:
      return 'info'
    case IssueStatus.PENDING:
      return 'danger'
    default:
      // 默认其他状态都使用'info'类型，代表待处理
      return 'info'
  }
}

// 截断描述，只显示一部分
const getTruncatedDescription = (description: string) => {
  if (!description) return ''
  
  // 移除HTML标签
  const textOnly = description.replace(/<\/?[^>]+(>|$)/g, '')
  
  // 截断描述
  return textOnly.length > 100 ? textOnly.substring(0, 100) + '...' : textOnly
}

// 获取任务列表
const getTasks = async () => {
  isLoading.value = true
  try {
    const response = await developerApi.getDeveloperTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: activeStatus.value !== 'all' ? activeStatus.value : undefined,
      search: searchQuery.value || undefined
    })
    
    if (response.data && response.data.code === 200) {
      tasks.value = response.data.data.tasks || []
      total.value = response.data.data.total || 0
    } else {
      ElMessage.error(response.data?.message || '获取任务列表失败')
      tasks.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败，请稍后重试')
    tasks.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// 处理状态标签点击
const handleTabClick = () => {
  currentPage.value = 1
  getTasks()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置页码
  getTasks()
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  getTasks()
}

// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  getTasks()
}

// 查看任务详情
const viewTaskDetails = (taskId: string) => {
  router.push(`/developer/issue/${taskId}`)
}

// 格式化任务分配日期为具体时间
const formatTaskDate = (dateString: string) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateString
  }
}

// 页面挂载时获取数据
onMounted(() => {
  getTasks()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.status-tabs {
  margin: 20px 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-count {
  margin-left: 5px;
}

.task-content {
  margin-top: 15px;
}

.search-bar {
  margin-bottom: 15px;
}

.task-list-card {
  padding: 0;
}

.task-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  flex: 1;
}

.task-user-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.tag-group {
  display: flex;
  gap: 8px;
}

.tag-item {
  white-space: nowrap;
}

.task-item-content {
  color: #606266;
  margin-bottom: 10px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.task-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.time-info {
  color: #909399;
}

.empty-data {
  padding: 40px 0;
}

.pagination-container {
  padding: 15px;
  display: flex;
  justify-content: center;
}
</style> 