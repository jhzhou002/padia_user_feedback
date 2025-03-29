<template>
  <div class="page-container">
    <h1 class="page-title">任务列表</h1>
    
    <!-- 状态筛选标签 -->
    <div class="status-tabs">
      <el-tabs v-model="activeStatus" @tab-click="handleStatusTabClick" type="card">
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
              <span>已处理</span>
              <el-badge :value="resolvedCount" class="status-count" type="success" v-if="resolvedCount > 0" />
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
      
      <el-card v-loading="loading" class="task-list-card">
        <div v-if="taskList.length === 0 && !loading" class="empty-data">
          <el-empty :description="`暂无${getStatusLabel(activeStatus)}任务`" />
        </div>
        
        <div v-for="task in taskList" :key="task.id" 
             class="task-item" 
             @click="handleViewDetail(task)">
          <div class="task-item-header">
            <span class="task-title">{{ task.issue.title }}</span>
            <div class="tag-group">
              <el-tag :type="getStatusType(task.issue.status)" size="small" class="tag-item">{{ getStatusLabel(task.issue.status) }}</el-tag>
            </div>
          </div>
          <div class="task-item-content">
            {{ getTruncatedDescription(task.issue.description) }}
          </div>
          <div class="task-item-footer">
            <span class="time-info">分配时间: {{ formatDate(task.createdAt) }}</span>
            <el-button size="small" type="primary" @click.stop="handleViewDetail(task)" link>处理</el-button>
          </div>
        </div>
        
        <div class="pagination-container" v-if="taskList.length > 0">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Search, Document, Clock, Loading, Select 
} from '@element-plus/icons-vue'
import developerApi from '../../api/task'
import { IssueStatus, type Task } from '../../types'

const router = useRouter()

// 搜索和过滤
const searchQuery = ref('')
const activeStatus = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const loading = ref(false)

// 任务列表
const taskList = ref<Task[]>([])

// 各状态任务数量
const statusCounts = ref({
  all: 0,
  pending: 0,
  processing: 0,
  resolved: 0,
  closed: 0
})

// 计算已处理数量 (已解决 + 已关闭)
const resolvedCount = computed(() => {
  return statusCounts.value.resolved || 0
})

// 状态选项
const statusOptions = [
  { label: '待处理', value: IssueStatus.PENDING },
  { label: '处理中', value: IssueStatus.PROCESSING },
  { label: '已解决', value: IssueStatus.RESOLVED },
  { label: '已关闭', value: IssueStatus.CLOSED }
]

// 优先级选项
const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

// 获取状态标签
const getStatusLabel = (status: string) => {
  if (status === 'resolved') return '已处理'
  if (status === 'processing') return '处理中'
  
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
    default:
      // 默认其他状态都使用'info'类型，代表待处理
      return 'info'
  }
}

// 获取优先级标签
const getPriorityLabel = (priority: string) => {
  const option = priorityOptions.find(item => item.value === priority)
  return option ? option.label : priority
}

// 获取优先级对应的标签类型
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

// 截断描述，只显示一部分
const getTruncatedDescription = (description: string) => {
  // 移除HTML标签后截取前100个字符
  const plainText = description.replace(/<[^>]+>/g, '')
  return plainText.length > 100 
    ? plainText.substring(0, 100) + '...' 
    : plainText
}

// 获取任务列表
const getTasks = async (status = activeStatus.value) => {
  loading.value = true
  try {
    const response = await developerApi.getDeveloperTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: status !== 'all' ? status : undefined,
      search: searchQuery.value
    })
    
    if (response.data && response.data.code === 200) {
      taskList.value = response.data.data.tasks || []
      total.value = response.data.data.total || 0
      
      // 更新各状态数量
      statusCounts.value = {
        all: response.data.data.counts.total || 0,
        pending: response.data.data.counts.pending || 0,
        processing: response.data.data.counts.processing || 0,
        resolved: response.data.data.counts.resolved || 0,
        closed: response.data.data.counts.closed || 0
      }
    } else {
      ElMessage.error(response.data?.message || '获取任务列表失败')
      taskList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败，请稍后重试')
    taskList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理状态标签点击
const handleStatusTabClick = () => {
  currentPage.value = 1
  getTasks()
}

// 处理状态切换
const handleStatusSelect = (status: string) => {
  activeStatus.value = status
  currentPage.value = 1 // 重置页码
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
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getTasks()
}

// 查看问题详情
const handleViewDetail = (row: Task) => {
  router.push(`/developer/issue/${row.issueId}`)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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