<template>
  <div class="issue-detail-container" v-loading="loading">
    <!-- 问题详情卡片 -->
    <el-card class="issue-card" v-if="issue">
      <template #header>
        <div class="issue-header">
          <div class="issue-title-section">
            <h2 class="issue-title">{{ issue.title }}</h2>
            <div class="issue-tags">
              <el-tag :type="getStatusType(issue.status)" size="small">
                {{ getStatusText(issue.status) }}
              </el-tag>
              <el-tag :type="getPriorityType(issue.priority)" size="small" style="margin-left: 8px">
                {{ getPriorityText(issue.priority) }}
              </el-tag>
              <el-tag v-if="issue.isPublic" type="info" size="small" style="margin-left: 8px">{{ $t('issue.detail.public') }}</el-tag>
              <el-tag v-else type="warning" size="small" style="margin-left: 8px">{{ $t('issue.detail.private') }}</el-tag>
            </div>
          </div>
          
          <div class="issue-actions">
            <el-button v-if="canEdit" type="primary" size="small" @click="goToEdit">
              <el-icon><Edit /></el-icon>{{ $t('common.edit') }}
            </el-button>
            <el-button v-if="canDelete" type="danger" size="small" @click="confirmDelete">
              <el-icon><Delete /></el-icon>{{ $t('common.delete') }}
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="issue-info">
        <div class="info-item">
          <span class="info-label">{{ $t('issue.detail.submitter') }}:</span>
          <span>{{ issue.user?.username || $t('issue.detail.unknownUser') }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ $t('issue.detail.module') }}:</span>
          <span>{{ issue.module?.name || $t('issue.detail.unspecified') }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ $t('issue.detail.createTime') }}:</span>
          <span>{{ formatDate(issue.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ $t('issue.detail.updateTime') }}:</span>
          <span>{{ formatDate(issue.updatedAt) }}</span>
        </div>
      </div>
      
      <el-divider />
      
      <div class="issue-description">
        <h3>{{ $t('issue.detail.description') }}</h3>
        <div class="description-content">{{ issue.description }}</div>
      </div>
      
      <!-- 任务状态 (对开发者可见) -->
      <div v-if="isTaskVisible && task" class="issue-task">
        <el-divider />
        <h3>{{ $t('issue.detail.taskStatus') }}</h3>
        
        <div class="task-info">
          <div class="task-status">
            <span class="info-label">{{ $t('issue.detail.currentStatus') }}:</span>
            <el-tag :type="getStatusType(issue.status)">{{ getStatusText(issue.status) }}</el-tag>
          </div>
          
          <div class="task-priority">
            <span class="info-label">{{ $t('issue.detail.priority') }}:</span>
            <el-tag :type="getPriorityType(task.priority)">{{ getPriorityText(task.priority) }}</el-tag>
          </div>
          
          <div class="task-assignee">
            <span class="info-label">{{ $t('issue.detail.assignee') }}:</span>
            <span>{{ task.developer?.username || $t('issue.detail.unassigned') }}</span>
          </div>
        </div>
        
        <div v-if="isDeveloper" class="task-actions">
          <el-button-group v-if="issue.status === 'pending'">
            <el-button type="primary" @click="updateStatus('processing')">{{ $t('issue.detail.startProcessing') }}</el-button>
          </el-button-group>
          
          <el-button-group v-if="issue.status === 'processing'">
            <el-button type="success" @click="updateStatus('resolved')">{{ $t('issue.detail.markAsResolved') }}</el-button>
          </el-button-group>
          
          <el-button-group v-if="issue.status === 'resolved'">
            <el-button type="danger" @click="updateStatus('processing')">{{ $t('issue.detail.reopen') }}</el-button>
            <el-button type="info" @click="updateStatus('closed')">{{ $t('issue.detail.closeTask') }}</el-button>
          </el-button-group>
          
          <el-button-group v-if="issue.status === 'closed'">
            <el-button type="warning" @click="updateStatus('processing')">{{ $t('issue.detail.reopen') }}</el-button>
          </el-button-group>
        </div>
        
        <div v-if="task.remark" class="task-remark">
          <span class="info-label">{{ $t('issue.detail.remark') }}:</span>
          <div class="remark-content">{{ task.remark }}</div>
        </div>
      </div>
    </el-card>
    
    <!-- 评论列表卡片 -->
    <el-card class="comments-card" v-if="issue">
      <template #header>
        <div class="card-header">
          <h3>{{ $t('issue.detail.comments') }}</h3>
        </div>
      </template>
      
      <div class="comments-list" v-if="comments.length > 0">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <div class="comment-user">
              <span class="username">{{ comment.user?.username || $t('issue.detail.unknownUser') }}</span>
              <el-tag size="small" v-if="comment.user?.role === 'admin'">{{ $t('issue.detail.admin') }}</el-tag>
              <el-tag size="small" type="warning" v-else-if="comment.user?.role === 'developer'">{{ $t('issue.detail.developer') }}</el-tag>
              <el-tag size="small" type="info" v-else>{{ $t('issue.detail.user') }}</el-tag>
            </div>
            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
      
      <div v-else class="no-comments">
        {{ $t('issue.detail.noComments') }}
      </div>
      
      <!-- 添加评论表单 -->
      <div class="add-comment">
        <el-divider />
        <h4>{{ $t('issue.detail.addComment') }}</h4>
        <el-form :model="commentForm" ref="commentFormRef">
          <el-form-item prop="content" :rules="[{ required: true, message: $t('issue.detail.commentRequired'), trigger: 'blur' }]">
            <el-input
              v-model="commentForm.content"
              type="textarea"
              :rows="3"
              :placeholder="$t('issue.detail.commentPlaceholder')"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitComment" :loading="commentLoading">
              {{ $t('issue.detail.submitComment') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { UserRole, Issue, IssueStatus, IssuePriority, Comment, Task } from '../../types'
import * as issueApi from '../../api/issues'
import * as taskApi from '../../api/task'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../../stores/language'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const languageStore = useLanguageStore()

// 表单引用
const commentFormRef = ref<InstanceType<typeof ElForm>>()

// 状态
const loading = ref(false)
const commentLoading = ref(false)
const issue = ref<Issue | null>(null)
const comments = ref<Comment[]>([])
const task = ref<Task | null>(null)

// 评论表单
const commentForm = ref({
  content: ''
})

// 是否为开发者或管理员
const isDeveloper = computed(() => {
  const role = userStore.userRole
  return role === UserRole.DEVELOPER || role === UserRole.ADMIN
})

// 是否为管理员
const isAdmin = computed(() => {
  return userStore.userRole === UserRole.ADMIN
})

// 是否为问题创建者
const isCreator = computed(() => {
  if (!issue.value || !userStore.userInfo) return false
  return issue.value.userId === userStore.userInfo.id
})

// 是否可编辑问题
const canEdit = computed(() => {
  if (!issue.value) return false
  
  // 管理员可以编辑所有问题
  if (isAdmin.value) return true
  
  // 创建者可以编辑状态为待处理的问题
  if (isCreator.value && issue.value.status === IssueStatus.PENDING) {
    return true
  }
  
  return false
})

// 是否可删除问题
const canDelete = computed(() => {
  if (!issue.value) return false
  
  // 只有管理员可以删除问题
  return isAdmin.value
})

// 是否显示任务信息（开发者和管理员可见）
const isTaskVisible = computed(() => {
  return isDeveloper.value || isAdmin.value
})

// 获取问题ID
const issueId = computed(() => {
  return Number(route.params.id)
})

// 获取问题详情
const getIssueDetail = async () => {
  if (!issueId.value) return
  
  loading.value = true
  try {
    const response = await issueApi.getIssueDetail(issueId.value)
    issue.value = response.data || null
    
    // 如果是开发者或管理员，获取任务信息
    if (isDeveloper.value && issue.value) {
      await getTaskInfo()
    }
    
    // 获取评论
    await getComments()
  } catch (error) {
    console.error('获取问题详情失败:', error)
    ElMessage.error('获取问题详情失败')
  } finally {
    loading.value = false
  }
}

// 获取任务信息
const getTaskInfo = async () => {
  if (!issueId.value) return
  
  try {
    const response = await taskApi.getTaskByIssueId(issueId.value)
    task.value = response.data || null
  } catch (error) {
    console.error('获取任务信息失败:', error)
  }
}

// 获取评论列表
const getComments = async () => {
  if (!issueId.value) return
  
  try {
    const response = await issueApi.getIssueComments(issueId.value)
    comments.value = response.data || []
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error(t('issue.detail.commentsError'))
  }
}

// 提交评论
const submitComment = async () => {
  if (!issueId.value || !commentFormRef.value) return
  
  await commentFormRef.value.validate(async (valid) => {
    if (valid) {
      commentLoading.value = true
      try {
        await issueApi.addIssueComment(issueId.value, commentForm.value.content)
        ElMessage.success(t('issue.detail.commentSuccess'))
        
        // 清空表单
        commentForm.value.content = ''
        
        // 重新获取评论列表
        await getComments()
      } catch (error) {
        console.error('添加评论失败:', error)
        ElMessage.error(t('issue.detail.commentError'))
      } finally {
        commentLoading.value = false
      }
    }
  })
}

// 更新问题状态（开发者功能）
const updateStatus = async (status: IssueStatus) => {
  if (!issueId.value || !issue.value) return
  
  try {
    await issueApi.updateIssue(issueId.value, { status })
    ElMessage.success(t('issue.detail.statusUpdateSuccess', { status: getStatusText(status) }))
    
    // 更新当前问题数据
    await getIssueDetail()
  } catch (error) {
    console.error('更新问题状态失败:', error)
    ElMessage.error(t('issue.detail.statusUpdateError'))
  }
}

// 跳转到编辑页面
const goToEdit = () => {
  router.push(`/edit-issue/${issueId.value}`)
}

// 确认删除
const confirmDelete = () => {
  ElMessageBox.confirm(
    t('issue.detail.deleteConfirm'),
    t('common.confirm'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  )
  .then(() => {
    deleteIssue()
  })
  .catch(() => {
    // 用户取消删除
  })
}

// 删除问题
const deleteIssue = async () => {
  if (!issueId.value) return
  
  try {
    await issueApi.deleteIssue(issueId.value)
    ElMessage.success(t('issue.detail.deleteSuccess'))
    router.push('/issues')
  } catch (error) {
    console.error('删除问题失败:', error)
    ElMessage.error(t('issue.detail.deleteError'))
  }
}

// 状态映射
const getStatusText = (status: string) => {
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
      return status
  }
}

const getStatusType = (status: string) => {
  const statusTypeMap: Record<string, string> = {
    [IssueStatus.PENDING]: 'warning',
    [IssueStatus.PROCESSING]: 'info',
    [IssueStatus.RESOLVED]: 'success',
    [IssueStatus.CLOSED]: 'danger'
  }
  return statusTypeMap[status] || 'info'
}

// 优先级映射
const getPriorityText = (priority: string) => {
  switch (priority) {
    case IssuePriority.HIGH:
      return t('task.priority.high')
    case IssuePriority.MEDIUM:
      return t('task.priority.medium')
    case IssuePriority.LOW:
      return t('task.priority.low')
    default:
      return priority
  }
}

const getPriorityType = (priority: string) => {
  const priorityTypeMap: Record<string, string> = {
    [IssuePriority.LOW]: 'info',
    [IssuePriority.MEDIUM]: 'warning',
    [IssuePriority.HIGH]: 'danger'
  }
  return priorityTypeMap[priority] || 'info'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return t('issue.detail.unknownTime');
  const date = new Date(dateStr);
  
  // 根据当前语言选择日期格式
  const locale = languageStore.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 初始化
onMounted(() => {
  getIssueDetail()
})
</script>

<style scoped>
.issue-detail-container {
  margin: 20px;
}

.issue-card {
  margin-bottom: 20px;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.issue-title-section {
  flex: 1;
}

.issue-title {
  margin: 0 0 10px 0;
  font-size: 20px;
}

.issue-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
}

.issue-description {
  margin: 20px 0;
}

.description-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
}

.issue-task {
  margin-top: 20px;
}

.task-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
}

.task-actions {
  margin: 15px 0;
}

.task-remark {
  margin-top: 15px;
}

.remark-content {
  margin-top: 5px;
  white-space: pre-wrap;
  color: #606266;
  line-height: 1.6;
}

.comments-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comments-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.comment-user {
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  margin-right: 10px;
}

.comment-time {
  color: #909399;
  font-size: 13px;
}

.comment-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  margin: 20px 0;
  color: #909399;
}

.add-comment {
  margin-top: 20px;
}

h3, h4 {
  margin-top: 0;
  color: #303133;
}
</style> 