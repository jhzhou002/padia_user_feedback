<template>
  <div class="page-container">
    <h1 class="page-title">{{ $t('issue.title') }}</h1>
    
    <!-- 上方状态筛选标签 -->
    <div class="status-tabs">
      <el-tabs v-model="activeStatus" @tab-click="handleStatusTabClick" type="card">
        <el-tab-pane name="all">
          <template #label>
            <div class="tab-label">
              <el-icon><Document /></el-icon>
              <span>{{ $t('issue.allIssues') }}</span>
              <el-badge :value="statusCounts.all" class="status-count" type="info" v-if="statusCounts.all > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="pending">
          <template #label>
            <div class="tab-label">
              <el-icon><Clock /></el-icon>
              <span>{{ $t('issue.status.pending') }}</span>
              <el-badge :value="statusCounts.pending" class="status-count" type="danger" v-if="statusCounts.pending > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="processing">
          <template #label>
            <div class="tab-label">
              <el-icon><Loading /></el-icon>
              <span>{{ $t('issue.status.processing') }}</span>
              <el-badge :value="statusCounts.processing" class="status-count" type="warning" v-if="statusCounts.processing > 0" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane name="resolved">
          <template #label>
            <div class="tab-label">
              <el-icon><Select /></el-icon>
              <span>{{ $t('issue.status.resolved') }}</span>
              <el-badge :value="statusCounts.resolved" class="status-count" type="success" v-if="statusCounts.resolved > 0" />
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div class="issue-list-content">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('issue.searchPlaceholder')"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch"></el-button>
          </template>
        </el-input>
      </div>
      
      <el-card v-loading="loading" class="issue-list-card">
        <div v-if="issueList.length === 0 && !loading" class="empty-data">
          <el-empty :description="`${$t('issue.emptyIssuePrefix')}${getStatusLabel(activeStatus)}${$t('issue.emptyIssueSuffix')}`" />
        </div>
        
        <div v-for="issue in issueList" :key="issue.id" 
             class="issue-item" 
             @click="viewIssueDetail(issue.id)">
          <div class="issue-item-header">
            <span class="issue-title">{{ issue.title }}</span>
            <el-tag v-if="issue.status === IssueStatus.PENDING" type="danger" size="small">{{ $t('issue.status.pending') }}</el-tag>
            <el-tag v-else-if="issue.status === IssueStatus.PROCESSING" type="warning" size="small">{{ $t('issue.status.processing') }}</el-tag>
            <el-tag v-else-if="issue.status === IssueStatus.RESOLVED" type="success" size="small">{{ $t('issue.status.resolved') }}</el-tag>
            <el-tag v-else-if="issue.status === IssueStatus.CLOSED" type="info" size="small">{{ $t('issue.status.closed') }}</el-tag>
            <el-tag v-else type="danger" size="small">{{ $t('issue.status.pending') }}</el-tag>
          </div>
          <div class="issue-item-content" v-html="getTruncatedDescription(issue.description)"></div>
          <div class="issue-item-footer">
            <span class="time-info">创建于: {{ formatDate(issue.createdAt) }}</span>
            <span class="time-info">更新于: {{ formatDate(issue.updatedAt) }}</span>
          </div>
        </div>
        
        <div class="pagination-container" v-if="issueList.length > 0">
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Document, Clock, Loading, Select } from '@element-plus/icons-vue'
import { issueApi } from '../../api'
import { IssueStatus, type Issue } from '../../types'
import { useI18n } from 'vue-i18n'
import { cleanHtml, extractFirstSentence, findKeywords } from '../../utils/textProcessing'

const router = useRouter()
const { t } = useI18n()

// 搜索和过滤
const searchQuery = ref('')
const activeStatus = ref('all') // 默认显示全部问题

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const loading = ref(false)

// 问题列表
const issueList = ref<any[]>([])

// 各状态问题数量
const statusCounts = ref({
  all: 0,
  pending: 0,
  processing: 0,
  resolved: 0,
  closed: 0
})

// 计算已处理数量 (已解决 + 已关闭)
const resolvedCount = computed(() => {
  return statusCounts.value.resolved
})

// 状态选项
const statusOptions = [
  { label: '待处理', value: IssueStatus.PENDING },
  { label: '处理中', value: IssueStatus.PROCESSING },
  { label: '已处理', value: IssueStatus.RESOLVED }
]

// 获取状态标签
const getStatusLabel = (status: string) => {
  switch (status) {
    case IssueStatus.PENDING:
      return t('issue.status.pending')
    case IssueStatus.PROCESSING:
      return t('issue.status.processing')
    case IssueStatus.RESOLVED:
      return t('issue.status.resolved')
    case IssueStatus.CLOSED:
      return t('issue.status.closed')
    default:
      return t('issue.status.all')
  }
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
      // 默认值使用'danger'类型，代表待处理
      return 'danger'
  }
}

// 截断描述，只显示一部分
const getTruncatedDescription = (description: string) => {
  if (!description) return ''

  // 清理HTML标记
  const plainText = cleanHtml(description)
  
  // 尝试提取第一个句子
  let displayText = extractFirstSentence(plainText)
  
  // 如果第一个句子太长或没找到句子，则限制长度
  if (displayText.length > 100) {
    displayText = plainText.substring(0, 100) + '...'
  }
  
  // 查找关键词并高亮
  const keywords = findKeywords(plainText)
  let highlightedText = displayText
  
  // 为关键词添加高亮
  keywords.forEach(keyword => {
    // 创建不区分大小写的正则表达式
    const regex = new RegExp(`(${keyword})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<span class="keyword-highlight">$1</span>')
  })
  
  return highlightedText
}

// 获取问题列表数据
const getIssueList = async () => {
  loading.value = true
  try {
    const response = await issueApi.getUserIssues({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: activeStatus.value === 'all' ? undefined : activeStatus.value,
      search: searchQuery.value
    })
    
    console.log('获取问题列表响应:', response)
    
    const responseData = response.data
    if (responseData && responseData.code === 200) {
      issueList.value = responseData.data.issues || []
      
      // 当筛选条件是"全部"时，使用返回的total
      // 当筛选条件是特定状态时，使用当前筛选结果的总数作为total
      if (activeStatus.value !== 'all') {
        total.value = responseData.data.issues?.length || 0
      } else {
        total.value = responseData.data.total || 0
      }
      
      // 更新各状态数量
      statusCounts.value = {
        // "全部"标签始终显示所有问题的总数量，不随筛选条件变化
        all: responseData.data.total || 0,
        pending: responseData.data.counts?.pending || 0,
        processing: responseData.data.counts?.processing || 0,
        resolved: responseData.data.counts?.resolved || 0,
        closed: responseData.data.counts?.closed || 0
      }
    } else {
      ElMessage.error(responseData?.message || '获取问题列表失败')
    }
  } catch (error) {
    console.error('获取问题列表失败:', error)
    ElMessage.error('获取问题列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理状态标签点击
const handleStatusTabClick = () => {
  currentPage.value = 1
  getIssueList()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  getIssueList()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getIssueList()
}

// 查看问题详情
const viewIssueDetail = (id: number) => {
  router.push(`/user/issue/${id}`)
}

// 页面挂载时获取数据
onMounted(() => {
  getIssueList()
})

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
</script>

<style scoped>
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

.issue-list-content {
  margin-top: 15px;
}

.search-bar {
  margin-bottom: 15px;
}

.issue-list-card {
  padding: 0;
}

.issue-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.issue-item:hover {
  background-color: #f5f7fa;
}

.issue-item:last-child {
  border-bottom: none;
}

.issue-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.issue-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.issue-item-content {
  color: #606266;
  margin-bottom: 10px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.issue-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #909399;
  margin-top: 8px;
}

.keyword-highlight {
  background-color: rgba(255, 230, 0, 0.3);
  font-weight: bold;
  padding: 0 2px;
  border-radius: 2px;
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