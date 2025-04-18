<template>
  <div class="page-container">
    <h1 class="page-title">提交问题</h1>
    <div class="card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item v-if="form.title">
          <div class="title-preview">
            <strong>自动生成标题:</strong> {{ form.title }}
          </div>
        </el-form-item>
        
        <el-form-item label="所属模块" prop="moduleId">
          <el-select v-model="form.moduleId" placeholder="请选择所属模块" style="width: 100%" @change="updateTitle">
            <el-option 
              v-for="module in moduleOptions" 
              :key="module.id" 
              :label="module.name" 
              :value="module.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="问题描述" prop="description">
          <QiniuEditor v-model="form.description" placeholder="请详细描述您遇到的问题..." @update:modelValue="generateTitle" />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="form.isPublic">在处理完成后公开此问题</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import QiniuEditor from '../../components/QiniuEditor.vue'
import { moduleApi } from '../../api'
import { useRouter } from 'vue-router'
import type { Module } from '../../types'
import { extractTitleWithModule, cleanHtml, findKeywords } from '../../utils/textProcessing'
import axios from 'axios'

// 表单引用
const formRef = ref()

// 模块选项
const moduleOptions = ref<Module[]>([])

// 加载状态
const loading = ref(false)

// 获取模块列表
const getModules = async () => {
  try {
    const response = await moduleApi.getModules()
    if (response.data && response.data.code === 200) {
      moduleOptions.value = response.data.data || []
    } else {
      ElMessage.error('获取模块列表失败')
    }
  } catch (error) {
    console.error('获取模块列表错误:', error)
    ElMessage.error('获取模块列表失败，请稍后重试')
  }
}

// 表单数据
const form = ref({
  title: '', // 自动生成的标题
  description: '',
  moduleId: undefined as number | undefined,
  isPublic: true // 默认公开
})

// 表单验证规则
const rules = {
  moduleId: [
    { required: true, message: '请选择问题所属模块', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
}

// 当模块改变时更新标题
const updateTitle = () => {
  if (form.value.description) {
    generateTitle(form.value.description)
  }
}

// 根据问题描述自动生成标题
const generateTitle = (content: string) => {
  if (!content) return
  
  // 获取模块名称（如果已选择）
  let moduleName = ''
  if (form.value.moduleId) {
    const selectedModule = moduleOptions.value.find(m => m.id === form.value.moduleId)
    if (selectedModule) {
      moduleName = selectedModule.name
    }
  }
  
  // 清理HTML内容
  const cleanText = cleanHtml(content)
  
  // 提取关键词
  const keywords = findKeywords(cleanText, 3)
  
  // 生成标题
  if (keywords.length > 0) {
    // 如果有模块名，添加到标题前
    form.value.title = extractTitleWithModule(content, moduleName)
    console.log('自动生成标题:', form.value.title)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 确保有标题，如果没有则生成一个
    if (!form.value.title.trim() && form.value.description) {
      generateTitle(form.value.description)
    }
    
    loading.value = true
    
    // 使用axios直接提交，避免使用旧的API封装
    const requestData = {
      title: form.value.title,
      description: form.value.description,
      isPublic: form.value.isPublic,
      moduleId: form.value.moduleId
    };

    try {
      // 修改请求路径为 /api/issues 确保与后端匹配
      const response = await axios.post('/api/issues', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('提交问题响应:', response.data);
      
      // 成功处理
      ElMessage({
        type: 'success',
        message: response.data.message || '问题提交成功',
        duration: 5000
      });
    
      // 显示邮件通知状态
      if (response.data.hasOwnProperty('emailSent')) {
        setTimeout(() => {
          if (response.data.emailSent === true) {
            ElMessage({
              type: 'success',
              message: '邮件通知已发送给负责的开发者',
              duration: 4000
            });
          } else {
            ElMessage({
              type: 'warning',
              message: '邮件通知发送失败，但问题已成功提交',
              duration: 4000
            });
          }
        }, 1000);
      }
      
      // 重置表单
      resetForm();
      
      // 跳转到问题列表页面
      router.push('/user/issues');
    } catch (error: any) {
      console.error('提交问题失败:', error);
      ElMessage.error(error.response?.data?.message || '提交失败，请稍后重试');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
    ElMessage.error('请检查表单填写是否完整');
  } finally {
    loading.value = false;
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.value = {
    title: '',
    description: '',
    moduleId: undefined,
    isPublic: true
  }
}

const router = useRouter()

// 页面加载时获取模块列表
onMounted(() => {
  getModules()
})

// 监视内容变化，实时生成标题
watchEffect(() => {
  if (form.value.description && form.value.description.length > 10) {
    generateTitle(form.value.description)
  }
})
</script>

<style scoped>
.card {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.title-preview {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 16px;
}
</style> 