<template>
  <div class="page-container">
    <h1 class="page-title">{{ $t('nav.submitIssue') }}</h1>
    <div class="card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item :label="$t('form.module')" prop="moduleId">
          <el-select v-model="form.moduleId" :placeholder="$t('form.selectModule')" style="width: 100%">
            <el-option 
              v-for="module in moduleOptions" 
              :key="module.id" 
              :label="module.name" 
              :value="module.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('form.issueDescription')" prop="description">
          <QiniuEditor v-model="form.description" :placeholder="$t('form.detailDescription')" @update:modelValue="generateTitle" />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="form.isPublic">{{ $t('form.isPublic') }}</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">{{ $t('form.submit') }}</el-button>
          <el-button @click="resetForm">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import QiniuEditor from '../../components/QiniuEditor.vue'
import { issueApi } from '../../api'
import { moduleApi } from '../../api'
import { useRouter } from 'vue-router'
import type { Module } from '../../types'
import { useI18n } from 'vue-i18n'

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

// 根据问题描述自动生成标题
const generateTitle = (content: string) => {
  if (!content) return
  
  // 移除HTML标签获取纯文本
  const plainText = content.replace(/<[^>]+>/g, '')
  
  // 取前20个字符作为标题（如果文本长度超过20）
  const title = plainText.length > 20 
    ? plainText.substring(0, 20) + '...' 
    : plainText
    
  // 添加模块前缀（如果已选择模块）
  if (form.value.moduleId) {
    const selectedModule = moduleOptions.value.find(m => m.id === form.value.moduleId)
    const moduleName = selectedModule?.name || ''
    form.value.title = `[${moduleName}] ${title}`
  } else {
    form.value.title = title
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (!form.value.title.trim()) {
      generateTitle(form.value.description)
    }
    
    loading.value = true
    const response = await issueApi.submitIssue({
      title: form.value.title,
      description: form.value.description,
      isPublic: form.value.isPublic,
      moduleId: form.value.moduleId
    })
    
    console.log('提交问题响应:', response)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('问题提交成功')
      // 重置表单
      resetForm()
      
      // 跳转到问题列表页面
      router.push('/user/issues')
    } else {
      ElMessage.error(response.data?.message || '提交失败')
    }
  } catch (error) {
    console.error('提交问题失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    loading.value = false
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
const { t } = useI18n()

// 页面加载时获取模块列表
onMounted(() => {
  getModules()
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
</style> 