<template>
  <div class="page-container">
    <div class="card" v-loading="loading">
      <div v-if="issue">
        <div class="issue-header">
          <h1 class="issue-title">{{ issue.title }}</h1>
          <el-tag :type="getStatusType(issue.status)" class="status-tag">{{ getStatusLabel(issue.status) }}</el-tag>
        </div>
        
        <div class="issue-meta">
          <span>创建时间: {{ createTime }}</span>
          <span>更新时间: {{ updateTime }}</span>
          <span v-if="issue.module">模块: {{ issue.module.name }}</span>
        </div>
        
        <!-- 状态追踪组件 -->
        <div class="status-tracking">
          <h3>状态追踪</h3>
          <el-steps :active="getStatusStep(issue.status)" finish-status="success" process-status="success">
            <el-step title="待处理" description="问题已提交" />
            <el-step title="处理中" description="开发人员正在处理" />
            <el-step title="已处理" description="问题解决完成" />
          </el-steps>
        </div>
        
        <div class="issue-content">
          <h3>问题描述</h3>
          <div class="description" v-html="issue.description"></div>
        </div>
        
        <div class="issue-attachments" v-if="issue.attachments && issue.attachments.length > 0">
          <h3>附件</h3>
          <div class="attachment-list">
            <el-tag v-for="(attachment, index) in issue.attachments" :key="index" class="attachment-item">
              <a :href="attachment" target="_blank">附件 {{ index + 1 }}</a>
            </el-tag>
          </div>
        </div>
        
        <el-divider />
        
        <div class="comment-section">
          <h3>问题沟通</h3>
          
          <div class="comment-list" v-if="issue.comments && issue.comments.length > 0">
            <div 
              v-for="comment in issue.comments" 
              :key="comment.id" 
              class="comment-item"
              :class="{ 
                'current-user-comment': isCurrentUser(comment),
                'other-user-comment': !isCurrentUser(comment)
              }"
            >
              <div class="comment-header">
                <span class="comment-user">{{ comment.user?.username || '未知用户' }}</span>
                <span class="comment-time">{{ getCommentTime(comment) }}</span>
              </div>
              <div class="comment-content" v-html="comment.content"></div>
            </div>
          </div>
          <div v-else class="empty-comments">
            <el-empty description="暂无评论" />
          </div>
          
          <div class="add-comment">
            <h4>添加评论</h4>
            <QiniuEditor v-model="commentContent" placeholder="请输入评论内容..." />
            <div class="comment-actions">
              <el-button type="primary" @click="addComment">提交评论</el-button>
            </div>
          </div>
        </div>
        
        <!-- 开发人员状态更新按钮 -->
        <div class="issue-actions" v-if="isDeveloper && issue.status !== IssueStatus.RESOLVED">
          <h3>状态管理</h3>
          <div class="status-actions">
            <el-button 
              type="primary" 
              @click="updateIssueStatus(IssueStatus.PROCESSING)"
              :disabled="issue.status === IssueStatus.PROCESSING"
            >
              设为处理中
            </el-button>
            <el-button 
              type="success" 
              @click="resolveIssue"
              :disabled="issue.status === IssueStatus.PENDING"
            >
              标记为已解决
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loading" class="not-found">
        <el-result
          icon="warning"
          title="问题未找到"
          sub-title="您查询的问题可能不存在或已被删除"
        >
          <template #extra>
            <el-button type="primary" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { issueApi, authApi } from '../../api'
import { IssueStatus, type Issue, type Comment, UserRole, ModuleType } from '../../types'
import QiniuEditor from '../../components/QiniuEditor.vue'

const route = useRoute()
const router = useRouter()

// 问题ID
const issueId = computed(() => route.params.id as string)

// 是否为开发者身份（从路由meta中获取）
const isDeveloper = computed(() => !!route.meta.isDeveloper)

// 加载状态
const loading = ref(false)

// 问题信息的扩展接口，确保包含评论和其他可能的属性
interface IssueWithComments extends Issue {
  comments?: Comment[];
  attachments?: string[];
  module?: {
    id: number;
    name: string;
    code: ModuleType | string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    avatar?: string;
  };
}

// 问题信息
const issue = ref<IssueWithComments | null>(null)

// 用于界面显示的格式化日期
const createTime = computed(() => issue.value ? new Date(issue.value.createdAt).toLocaleString() : '')
const updateTime = computed(() => issue.value ? new Date(issue.value.updatedAt).toLocaleString() : '')

// 评论内容
const commentContent = ref('')

// 获取状态对应的步骤
const getStatusStep = (status: string) => {
  switch (status) {
    case IssueStatus.PENDING:
      return 0
    case IssueStatus.PROCESSING:
      return 1
    case IssueStatus.RESOLVED:
      return 2
    case IssueStatus.CLOSED:
      return 3
    default:
      return 0
  }
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusLabels = {
    [IssueStatus.PENDING]: '待处理',
    [IssueStatus.PROCESSING]: '处理中',
    [IssueStatus.RESOLVED]: '已处理',
    [IssueStatus.CLOSED]: '已关闭'
  }
  return statusLabels[status] || status
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

// 获取评论用户类型
const getCommentUserType = (comment: Comment) => {
  return comment.user?.role === 'developer' ? 'developer' : 'user'
}

// 获取评论创建时间
const getCommentTime = (comment: Comment) => {
  return new Date(comment.createdAt).toLocaleString()
}

// 获取当前用户ID
const currentUserId = ref<number | null>(null)

// 获取当前用户信息
const getCurrentUserInfo = async () => {
  try {
    const response = await authApi.getUserInfo()
    if (response?.data?.code === 200 && response.data.data) {
      currentUserId.value = response.data.data.id
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 判断评论是否来自当前用户
const isCurrentUser = (comment: Comment) => {
  return comment.userId === currentUserId.value
}

// 获取问题详情
const fetchIssueDetail = async () => {
  if (!issueId.value) return
  
  loading.value = true
  try {
    const response = await issueApi.getIssueDetail(parseInt(issueId.value))
    
    if (response?.data?.code === 200 && response.data.data) {
      // 从API获取的原始数据
      const apiIssueData = response.data.data
      
      // 转换为前端需要的格式
      const frontendIssueData: IssueWithComments = {
        id: apiIssueData.id,
        title: apiIssueData.title,
        description: apiIssueData.description,
        status: apiIssueData.status as IssueStatus,
        userId: apiIssueData.userId,
        moduleId: apiIssueData.moduleId,
        isPublic: apiIssueData.isPublic,
        createdAt: apiIssueData.createdAt,
        updatedAt: apiIssueData.updatedAt
      }
      
      // 处理用户信息
      if (apiIssueData.user) {
        frontendIssueData.user = {
          ...apiIssueData.user,
          role: apiIssueData.user.role as UserRole
        }
      }
      
      // 处理模块信息
      if (apiIssueData.module) {
        frontendIssueData.module = apiIssueData.module
      }
      
      // 处理评论
      if (Array.isArray(apiIssueData.comments)) {
        frontendIssueData.comments = apiIssueData.comments.map(comment => ({
          ...comment,
          user: comment.user ? {
            ...comment.user,
            role: comment.user.role as UserRole
          } : undefined
        }))
      }
      
      // 处理附件
      if (Array.isArray(apiIssueData.attachments)) {
        frontendIssueData.attachments = apiIssueData.attachments
      }
      
      // 设置状态
      issue.value = frontendIssueData
    } else {
      issue.value = null
      ElMessage.error('获取问题详情失败')
    }
  } catch (error) {
    console.error('获取问题详情失败:', error)
    ElMessage.error('获取问题详情失败')
    issue.value = null
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 添加评论
const addComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  try {
    const response = await issueApi.addComment(parseInt(issueId.value), commentContent.value)
    
    if (response?.data?.code === 200) {
      // 重新获取问题详情，包含最新评论
      await fetchIssueDetail()
      
      // 清空评论内容
      commentContent.value = ''
      ElMessage.success('评论已添加')
    } else {
      ElMessage.error('添加评论失败')
    }
  } catch (error) {
    console.error('添加评论失败:', error)
    ElMessage.error('添加评论失败')
  }
}

// 更新问题状态
const updateIssueStatus = async (newStatus: IssueStatus) => {
  if (!issue.value) return
  
  try {
    console.log('准备更新问题状态:', { 
      问题ID: issueId.value, 
      当前状态: issue.value.status, 
      目标状态: newStatus,
      '目标状态类型': typeof newStatus
    })
    
    // 确保发送的是字符串类型
    const statusValue = String(newStatus)
    
    console.log('发送状态更新请求:', { 
      url: `/issues/${issueId.value}/status`,
      statusValue,
      '状态值类型': typeof statusValue
    })
    
    const response = await issueApi.updateIssueStatus(parseInt(issueId.value), statusValue)
    
    console.log('状态更新响应:', response)
    
    if (response?.data?.code === 200) {
      // 重新获取问题详情，包含最新状态
      await fetchIssueDetail()
      ElMessage.success(`状态已更新为"${getStatusLabel(newStatus)}"`)
    } else {
      console.error('更新状态失败:', response?.data)
      ElMessage.error(`更新状态失败: ${response?.data?.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('更新状态请求错误:', error)
    ElMessage.error('更新状态失败: 请求异常')
  }
}

// 解决问题
const resolveIssue = async () => {
  if (!issue.value) return
  
  try {
    console.log('准备解决问题:', { 
      问题ID: issueId.value, 
      当前状态: issue.value.status, 
      目标状态: IssueStatus.RESOLVED
    })
    
    // 更新问题状态
    await updateIssueStatus(IssueStatus.RESOLVED)
    
    ElMessage.success('问题已解决')
  } catch (error) {
    console.error('解决问题失败:', error)
    ElMessage.error('解决问题失败')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  getCurrentUserInfo()
  fetchIssueDetail()
})
</script>

<style scoped>
.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.issue-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.status-tag {
  font-size: 14px;
}

.issue-meta {
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}

.issue-meta span {
  margin-right: 20px;
}

/* 状态追踪样式 */
.status-tracking {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.status-tracking h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 600;
}

.issue-content {
  margin-bottom: 20px;
}

.issue-content h3,
.issue-attachments h3,
.comment-section h3,
.issue-actions h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
}

.description {
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
  line-height: 1.6;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment-item a {
  text-decoration: none;
  color: inherit;
}

.comment-list {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding: 15px;
  border-radius: 8px;
  position: relative;
  max-width: 80%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.current-user-comment {
  background: #f0f9eb;
  align-self: flex-end;
  border-top-right-radius: 0;
}

.other-user-comment {
  background: #ecf5ff;
  align-self: flex-start;
  border-top-left-radius: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
}

.current-user-comment .comment-header {
  color: #67C23A;
  flex-direction: row-reverse;
}

.other-user-comment .comment-header {
  color: #409EFF;
}

.comment-user {
  font-weight: bold;
}

.comment-time {
  color: #909399;
}

.comment-content {
  line-height: 1.6;
  word-break: break-word;
}

.empty-comments {
  margin: 30px 0;
}

.add-comment h4 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
}

.comment-actions {
  margin-top: 15px;
  text-align: right;
}

.issue-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.status-actions {
  display: flex;
  gap: 15px;
}

.not-found {
  padding: 40px 0;
}
</style> 