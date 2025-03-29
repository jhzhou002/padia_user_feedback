<template>
  <div class="issue-submit-container">
    <el-card class="issue-form-card">
      <template #header>
        <div class="card-header">
          <h2>提交新问题</h2>
        </div>
      </template>
      
      <el-form 
        ref="issueFormRef"
        :model="issueForm" 
        :rules="rules" 
        label-position="top"
        v-loading="loading"
      >
        <el-form-item label="问题标题" prop="title">
          <el-input 
            v-model="issueForm.title" 
            placeholder="请输入问题标题（简洁明了，不超过50个字符）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="功能模块" prop="moduleId">
          <el-select 
            v-model="issueForm.moduleId" 
            placeholder="请选择问题相关的功能模块"
            style="width: 100%"
          >
            <el-option 
              v-for="module in modules" 
              :key="module.id" 
              :label="module.name" 
              :value="module.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="问题优先级" prop="priority">
          <el-radio-group v-model="issueForm.priority">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="问题描述" prop="description">
          <el-input 
            v-model="issueForm.description" 
            type="textarea" 
            :rows="5"
            placeholder="请详细描述您遇到的问题，包括操作步骤、期望结果和实际结果等"
          />
        </el-form-item>
        
        <el-form-item label="是否公开" prop="isPublic">
          <el-switch 
            v-model="issueForm.isPublic"
            active-text="公开问题（其他用户可见）"
            inactive-text="私有问题（仅自己和管理员可见）"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitIssue">提交问题</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { useRouter } from 'vue-router'
import { IssuePriority, Module } from '../../types'
import * as issueApi from '../../api/issues'
import * as moduleApi from '../../api/modules'

const router = useRouter()

// 表单引用
const issueFormRef = ref<InstanceType<typeof ElForm>>()

// 模块列表
const modules = ref<Module[]>([])

// 加载状态
const loading = ref(false)

// 表单数据
const issueForm = ref({
  title: '',
  description: '',
  moduleId: undefined as number | undefined,
  priority: IssuePriority.MEDIUM,
  isPublic: true
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' },
    { min: 5, max: 50, message: '标题长度应在5-50个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, message: '描述太短，请详细描述您的问题', trigger: 'blur' }
  ],
  moduleId: [
    { required: true, message: '请选择功能模块', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择问题优先级', trigger: 'change' }
  ]
}

// 获取模块列表
const getModules = async () => {
  loading.value = true
  try {
    const response = await moduleApi.getModules()
    modules.value = response.data || []
  } catch (error) {
    console.error('获取模块列表失败:', error)
    ElMessage.error('获取模块列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 提交问题
const submitIssue = async () => {
  if (!issueFormRef.value) return
  
  await issueFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await issueApi.createIssue({
          title: issueForm.value.title,
          description: issueForm.value.description,
          moduleId: issueForm.value.moduleId,
          priority: issueForm.value.priority as IssuePriority,
          isPublic: issueForm.value.isPublic
        })
        ElMessage.success('问题提交成功！')
        router.push('/issues')
      } catch (error) {
        console.error('提交问题失败:', error)
        ElMessage.error('提交问题失败，请稍后重试')
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.warning('请完善表单内容')
    }
  })
}

// 重置表单
const resetForm = () => {
  if (issueFormRef.value) {
    issueFormRef.value.resetFields()
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 初始化
onMounted(() => {
  getModules()
})
</script>

<style scoped>
.issue-submit-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.issue-form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}
</style> 