<template>
  <div class="page-container">
    <h1 class="page-title">反馈列表</h1>
    <div class="feedback-list-container">
      <!-- 左侧筛选区域 -->
      <div class="filter-panel">
        <div class="filter-title">状态筛选</div>
        <el-menu
          :default-active="activeStatus"
          class="filter-menu"
          @select="handleStatusSelect"
        >
          <el-menu-item index="all">
            <el-icon><Document /></el-icon>
            <span>全部反馈</span>
            <el-badge :value="statusCounts.all" class="status-count" type="info" v-if="statusCounts.all > 0" />
          </el-menu-item>
          <el-menu-item index="pending">
            <el-icon><Clock /></el-icon>
            <span>待处理</span>
            <el-badge :value="statusCounts.pending" class="status-count" type="danger" v-if="statusCounts.pending > 0" />
          </el-menu-item>
          <el-menu-item index="processing">
            <el-icon><Loading /></el-icon>
            <span>处理中</span>
            <el-badge :value="statusCounts.processing" class="status-count" type="warning" v-if="statusCounts.processing > 0" />
          </el-menu-item>
          <el-menu-item index="resolved">
            <el-icon><Select /></el-icon>
            <span>已解决</span>
            <el-badge :value="statusCounts.resolved" class="status-count" type="success" v-if="statusCounts.resolved > 0" />
          </el-menu-item>
          <el-menu-item index="closed">
            <el-icon><CloseBold /></el-icon>
            <span>已关闭</span>
            <el-badge :value="statusCounts.closed" class="status-count" v-if="statusCounts.closed > 0" />
          </el-menu-item>
        </el-menu>
        
        <div class="filter-title visibility-title">可见性筛选</div>
        <el-menu
          :default-active="activeVisibility"
          class="filter-menu"
          @select="handleVisibilitySelect"
        >
          <el-menu-item index="all">
            <el-icon><List /></el-icon>
            <span>全部反馈</span>
          </el-menu-item>
          <el-menu-item index="public">
            <el-icon><View /></el-icon>
            <span>公开反馈</span>
            <el-badge :value="visibilityCounts.public" class="status-count" type="primary" v-if="visibilityCounts.public > 0" />
          </el-menu-item>
          <el-menu-item index="private">
            <el-icon><Hide /></el-icon>
            <span>私密反馈</span>
            <el-badge :value="visibilityCounts.private" class="status-count" type="info" v-if="visibilityCounts.private > 0" />
          </el-menu-item>
        </el-menu>
      </div>
      
      <!-- 右侧反馈列表 -->
      <div class="feedback-content">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索反馈"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch"></el-button>
            </template>
          </el-input>
        </div>
        
        <el-card v-loading="loading" class="feedback-list-card">
          <div v-if="feedbackList.length === 0 && !loading" class="empty-data">
            <el-empty description="暂无反馈数据" />
          </div>
          
          <div v-for="feedback in feedbackList" :key="feedback.id" 
               class="feedback-item" 
               @click="handleViewDetail(feedback)">
            <div class="feedback-item-header">
              <span class="feedback-title">{{ feedback.title }}</span>
              <div class="tag-group">
                <el-tag :type="getStatusType(feedback.status)" size="small" class="tag-item">{{ getStatusLabel(feedback.status) }}</el-tag>
                <el-tag type="primary" size="small" class="tag-item" v-if="feedback.isPublic">公开</el-tag>
                <el-tag type="info" size="small" class="tag-item" v-else>私密</el-tag>
              </div>
            </div>
            <div class="feedback-item-content">
              {{ getTruncatedDescription(feedback.description) }}
            </div>
            <div class="feedback-item-footer">
              <span class="user-info">
                <el-avatar :size="20" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                {{ feedback.createdBy || '匿名用户' }} · {{ feedback.createTime }}
              </span>
              <div class="actions">
                <el-button size="small" type="success" @click.stop="handleAssign(feedback)" link>分配</el-button>
                <el-button size="small" type="primary" @click.stop="handleViewDetail(feedback)" link>查看</el-button>
              </div>
            </div>
          </div>
          
          <div class="pagination-container" v-if="feedbackList.length > 0">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 分配任务对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配任务" width="400px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="问题ID">
          <span>{{ assignForm.issueId }}</span>
        </el-form-item>
        <el-form-item label="问题标题">
          <span>{{ assignForm.title }}</span>
        </el-form-item>
        <el-form-item label="开发人员">
          <el-select v-model="assignForm.developer" placeholder="选择开发人员" style="width: 100%">
            <el-option
              v-for="developer in developerOptions"
              :key="developer.value"
              :label="developer.label"
              :value="developer.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="assignForm.priority" placeholder="选择优先级" style="width: 100%">
            <el-option
              v-for="priority in priorityOptions"
              :key="priority.value"
              :label="priority.label"
              :value="priority.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Search, Document, Clock, Loading, Select, CloseBold, 
  View, Hide, List 
} from '@element-plus/icons-vue'
import { adminApi } from '../../api'
import { IssueStatus, type Feedback } from '../../types'

const router = useRouter()

// 搜索和过滤参数
const searchQuery = ref('')
const activeStatus = ref('all')
const activeVisibility = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const loading = ref(false)

// 反馈列表
const feedbackList = ref<Feedback[]>([])

// 各状态反馈数量
const statusCounts = ref({
  all: 0,
  pending: 0,
  processing: 0,
  resolved: 0,
  closed: 0
})

// 各可见性反馈数量
const visibilityCounts = ref({
  public: 0,
  private: 0
})

// 状态选项
const statusOptions = [
  { label: '待处理', value: IssueStatus.PENDING },
  { label: '处理中', value: IssueStatus.PROCESSING },
  { label: '已解决', value: IssueStatus.RESOLVED },
  { label: '已关闭', value: IssueStatus.CLOSED }
]

// 获取状态标签
const getStatusLabel = (status: string) => {
  const option = statusOptions.find(item => item.value === status)
  return option ? option.label : status
}

// 获取状态对应的标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case IssueStatus.PENDING:
      return 'info'
    case IssueStatus.PROCESSING:
      return 'warning'
    case IssueStatus.RESOLVED:
      return 'success'
    case IssueStatus.CLOSED:
      return ''
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

// 分配任务表单
const assignDialogVisible = ref(false)
const assignForm = ref({
  issueId: '',
  title: '',
  developer: '',
  priority: 'medium'
})

// 开发人员选项
const developerOptions = [
  { label: '开发者1', value: 'dev1' },
  { label: '开发者2', value: 'dev2' },
  { label: '开发者3', value: 'dev3' }
]

// 优先级选项
const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

// 获取反馈列表数据
const fetchFeedbackList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    // const res = await adminApi.getFeedbackList()
    
    // 模拟数据
    setTimeout(() => {
      const mockFeedbacks = Array(10).fill(0).map((_, index) => {
        const status = Object.values(IssueStatus)[index % 4]
        const isPublic = index % 3 !== 0
        
        return {
          id: `feedback-${index + 1}`,
          title: `[系统模块] 反馈标题 ${index + 1}`,
          description: `<p>这是反馈描述 ${index + 1}，包含详细信息。这是反馈描述，包含详细信息。这是反馈描述，包含详细信息。</p>`,
          status: status,
          isPublic: isPublic,
          createdBy: `用户${index % 5 + 1}`,
          createTime: new Date().toLocaleString(),
          updateTime: new Date().toLocaleString()
        }
      })
      
      // 根据选择的状态和可见性过滤
      let filteredFeedbacks = [...mockFeedbacks]
      
      if (activeStatus.value !== 'all') {
        filteredFeedbacks = filteredFeedbacks.filter(feedback => feedback.status === activeStatus.value)
      }
      
      if (activeVisibility.value !== 'all') {
        const isPublic = activeVisibility.value === 'public'
        filteredFeedbacks = filteredFeedbacks.filter(feedback => feedback.isPublic === isPublic)
      }
      
      feedbackList.value = filteredFeedbacks
      total.value = 100 // 模拟总数据量
      
      // 模拟各状态数量
      statusCounts.value = {
        all: 100,
        pending: 35,
        processing: 25,
        resolved: 30,
        closed: 10
      }
      
      // 模拟各可见性数量
      visibilityCounts.value = {
        public: 70,
        private: 30
      }
      
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    ElMessage.error('获取反馈列表失败')
    loading.value = false
  }
}

// 处理状态选择
const handleStatusSelect = (index: string) => {
  activeStatus.value = index
  currentPage.value = 1
  fetchFeedbackList()
}

// 处理可见性选择
const handleVisibilitySelect = (index: string) => {
  activeVisibility.value = index
  currentPage.value = 1
  fetchFeedbackList()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchFeedbackList()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchFeedbackList()
}

// 查看反馈详情
const handleViewDetail = (feedback: Feedback) => {
  router.push(`/admin/feedback/${feedback.id}`)
}

// 打开分配任务对话框
const handleAssign = (feedback: Feedback) => {
  assignForm.value = {
    issueId: feedback.id,
    title: feedback.title,
    developer: '',
    priority: 'medium'
  }
  assignDialogVisible.value = true
}

// 提交分配任务
const handleAssignSubmit = async () => {
  try {
    // 模拟API调用
    // await adminApi.assignTask(assignForm.value)
    
    // 模拟成功
    setTimeout(() => {
      ElMessage.success('任务分配成功')
      assignDialogVisible.value = false
      
      // 更新状态
      const index = feedbackList.value.findIndex(item => item.id === assignForm.value.issueId)
      if (index !== -1) {
        feedbackList.value[index].status = IssueStatus.PROCESSING
      }
    }, 500)
  } catch (error) {
    console.error('分配任务失败:', error)
    ElMessage.error('分配任务失败')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchFeedbackList()
})
</script>

<style scoped>
.feedback-list-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.filter-panel {
  flex: 0 0 220px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-title {
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}

.visibility-title {
  margin-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.filter-menu {
  border-right: none;
}

.status-count {
  margin-left: auto;
  margin-right: 16px;
}

.feedback-content {
  flex: 1;
  min-width: 0;
}

.search-bar {
  margin-bottom: 15px;
}

.feedback-list-card {
  padding: 0;
}

.feedback-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.feedback-item:hover {
  background-color: #f5f7fa;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.feedback-title {
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

.feedback-item-content {
  color: #606266;
  margin-bottom: 10px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.feedback-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.actions {
  display: flex;
  gap: 8px;
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