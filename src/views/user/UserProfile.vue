<template>
  <div class="user-profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
        </div>
      </template>
      
      <div v-loading="loading">
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="formRules"
          label-position="top"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" />
          </el-form-item>
          
          <el-form-item label="品牌" prop="brand">
            <el-input v-model="profileForm.brand" placeholder="请输入您的品牌名称" />
          </el-form-item>
          
          <el-form-item label="工厂" prop="factory">
            <el-input v-model="profileForm.factory" placeholder="请输入您的工厂名称" />
          </el-form-item>
          
          <el-form-item label="头像">
            <div class="avatar-uploader">
              <el-avatar
                :size="100"
                :src="profileForm.avatar || defaultAvatar"
                shape="square"
              ></el-avatar>
              <el-button
                class="avatar-change-btn"
                type="primary"
                size="small"
                @click="handleAvatarChange"
              >
                更换头像
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveProfile" :loading="saving">
              保存修改
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useUserStore } from '../../stores/user'

// 获取用户存储
const userStore = useUserStore()

// 表单引用
const profileFormRef = ref<FormInstance>()

// 默认头像
const defaultAvatar = '/src/assets/images/default-avatar.png'

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 表单数据
const profileForm = ref({
  username: '',
  email: '',
  brand: '',
  factory: '',
  avatar: ''
})

// 表单验证规则
const formRules = {
  email: [
    { type: 'email', message: '请输入有效的电子邮箱地址', trigger: 'blur' }
  ],
  brand: [
    { max: 50, message: '品牌名称不能超过50个字符', trigger: 'blur' }
  ],
  factory: [
    { max: 50, message: '工厂名称不能超过50个字符', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initForm = () => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    profileForm.value = {
      username: userInfo.username || '',
      email: userInfo.email || '',
      brand: userInfo.brand || '',
      factory: userInfo.factory || '',
      avatar: userInfo.avatar || ''
    }
  }
}

// 加载用户资料
const loadUserProfile = async () => {
  loading.value = true
  try {
    const success = await userStore.fetchUserInfo()
    if (success) {
      initForm()
    } else {
      ElMessage.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('加载用户资料错误:', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 保存用户资料
const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        const result = await userStore.updateUserInfo({
          email: profileForm.value.email,
          brand: profileForm.value.brand,
          factory: profileForm.value.factory
        })
        
        if (result.success) {
          ElMessage.success('个人资料更新成功')
        } else {
          ElMessage.error(result.message || '更新失败')
        }
      } catch (error) {
        console.error('保存用户资料错误:', error)
        ElMessage.error('更新个人资料失败，请稍后重试')
      } finally {
        saving.value = false
      }
    } else {
      ElMessage.warning('请完善表单内容')
    }
  })
}

// 重置表单
const resetForm = () => {
  initForm()
}

// 更换头像
const handleAvatarChange = () => {
  ElMessage.info('头像上传功能暂未实现')
  // TODO: 实现头像上传功能
}

// 初始化
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.user-profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 0 20px;
}

.profile-card {
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

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-change-btn {
  margin-top: 10px;
}
</style> 