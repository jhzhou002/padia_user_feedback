<template>
  <div class="page-container">
    <h1 class="page-title">热门问题</h1>
    
    <div class="filter-container">
      <!-- 模块筛选 -->
      <el-select
        v-model="moduleFilter"
        placeholder="选择模块"
        clearable
        class="module-filter"
        @change="handleModuleChange"
      >
        <el-option
          v-for="item in moduleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      
      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索热门问题"
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch"></el-button>
        </template>
      </el-input>
    </div>
    
    <div class="hot-issues-container" v-loading="loading">
      <div v-if="hotIssues.length === 0 && !loading" class="empty-container">
        <el-empty description="暂无热门问题" />
      </div>
      
      <div class="issue-cards">
        <div
          v-for="issue in hotIssues" 
          :key="issue.id" 
          class="issue-card-item"
          @click="viewIssueDetail(issue.id)"
        >
          <div class="issue-card-header">
            <span class="issue-title">{{ issue.title }}</span>
            <el-tag type="info" size="small" class="module-tag">{{ getModuleName(issue.module) }}</el-tag>
          </div>
          <div class="issue-card-content" v-html="issue.description"></div>
          <div class="issue-card-footer">
            <span class="views-info">
              <el-icon><View /></el-icon> 
              {{ issue.views || 0 }} 次浏览
            </span>
          </div>
        </div>
      </div>
      
      <div class="pagination-container" v-if="hotIssues.length > 0">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 添加测试数据按钮 - 仅在管理员模式下显示 -->
      <div class="admin-tools" v-if="isAdmin">
        <el-divider>管理员工具</el-divider>
        <el-button type="primary" @click="createTestHotIssues" :loading="creatingTestData">
          生成测试热门问题
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { issueApi, moduleApi } from '../../api'

// 定义问题状态枚举（从数据库模型移到前端）
enum IssueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// 定义模块类型
interface Module {
  id: number
  name: string
  code: string
  description?: string
}

// 定义UI展示的问题类型
interface UiIssue {
  id: number | string
  title: string
  description: string
  status: IssueStatus | string
  createTime?: string
  updateTime?: string
  isPublic: boolean
  moduleId?: number
  module?: Module
  createdAt?: string | Date
  updatedAt?: string | Date
  userId?: number
  views?: number
  priority?: string
}

const router = useRouter()

// 搜索关键词
const searchQuery = ref('')

// 模块筛选
const moduleFilter = ref('')

// 模块选项
const moduleOptions = ref<Array<{label: string, value: number | string}>>([])

// 获取模块名称
const getModuleName = (module: Module | null | undefined) => {
  if (!module) return '未分类'
  return module.name || '未知模块'
}

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载状态
const loading = ref(false)

// 热门问题列表
const hotIssues = ref<UiIssue[]>([])

// 添加管理员检查 - 暂时简化处理，先检查localStorage中的角色
const isAdmin = computed(() => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.role === 'admin'
    }
    return false
  } catch (e) {
    return false
  }
})

// 创建测试数据状态
const creatingTestData = ref(false)

// 获取热门问题（只获取已处理的问题）
const getHotIssues = async () => {
  try {
    loading.value = true
    const response = await issueApi.getHotIssues({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      module: moduleFilter.value
    })
    
    // 确保响应数据存在
    if (response && response.data) {
      const responseData = response.data
      if (responseData.code === 200 && responseData.data) {
        // 将API返回的Issue类型转换为前端使用的UiIssue类型
        hotIssues.value = responseData.data.issues?.map(issue => ({
          ...issue,
          createTime: issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '',
          updateTime: issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : ''
        })) || []
        total.value = responseData.data.total || 0
      } else {
        hotIssues.value = []
        total.value = 0
      }
    } else {
      hotIssues.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取热门问题失败:', error)
    ElMessage.error('获取热门问题失败')
    hotIssues.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理模块变更
const handleModuleChange = () => {
  currentPage.value = 1
  getHotIssues()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  getHotIssues()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getHotIssues()
}

// 查看问题详情
const viewIssueDetail = (id: number) => {
  router.push(`/user/issue/${id}`)
}

// 加载模块列表
const loadModules = async () => {
  try {
    const response = await moduleApi.getModules()
    if (response && response.data && response.data.code === 200) {
      moduleOptions.value = response.data.data.map((item: Module) => ({
        label: item.name,
        value: item.id
      }))
    }
  } catch (error) {
    console.error('加载模块列表失败:', error)
    ElMessage.error('加载模块列表失败')
  }
}

// 创建测试热门问题
const createTestHotIssues = async () => {
  if (!isAdmin.value) return
  
  creatingTestData.value = true
  try {
    // 使用后端API创建测试热门问题
    const response = await issueApi.createHotIssueTestData()
    
    if (response && response.data) {
      const responseData = response.data
      if (responseData.code === 200 && responseData.data && responseData.data.count > 0) {
        ElMessage.success(`成功创建${responseData.data.count}条测试热门问题`)
        getHotIssues() // 刷新列表
      } else {
        ElMessage.warning('未创建任何测试数据')
      }
    } else {
      ElMessage.warning('创建测试数据响应异常')
    }
  } catch (error) {
    console.error('创建测试数据失败:', error)
    ElMessage.error('创建测试数据失败')
  } finally {
    creatingTestData.value = false
  }
}

// 页面加载时获取热门问题和模块列表
onMounted(() => {
  loadModules()
  getHotIssues()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #303133;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.module-filter {
  width: 180px;
}

.search-input {
  width: 350px;
}

.hot-issues-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  min-height: 400px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.issue-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.issue-card-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  transition: all 0.3s;
  cursor: pointer;
  height: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.issue-card-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.issue-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.issue-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-tag {
  flex-shrink: 0;
}

.issue-card-content {
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.issue-card-footer {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.views-info {
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.views-info .el-icon {
  font-size: 16px;
  color: #a0cfff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.admin-tools {
  margin-top: 20px;
  text-align: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style> 