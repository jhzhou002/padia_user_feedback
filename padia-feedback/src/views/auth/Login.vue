<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">PADIA用户反馈平台</h1>
      <div class="tabs">
        <span 
          class="tab" 
          :class="{ active: activeTab === 'login' }" 
          @click="activeTab = 'login'"
        >登录</span>
        <span 
          class="tab" 
          :class="{ active: activeTab === 'register' }" 
          @click="activeTab = 'register'"
        >注册</span>
      </div>
      
      <!-- 登录表单 -->
      <div v-if="activeTab === 'login'" class="form-box">
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="用户名" 
              prefix-icon="User"
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="密码" 
              prefix-icon="Lock"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <span class="forgot-password">忘记密码?</span>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="submit-btn" @click="handleLogin">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 注册表单 -->
      <div v-else class="form-box">
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef">
          <el-form-item prop="username">
            <el-input 
              v-model="registerForm.username" 
              placeholder="用户名" 
              prefix-icon="User"
            ></el-input>
          </el-form-item>
          <el-form-item prop="email">
            <el-input 
              v-model="registerForm.email" 
              placeholder="邮箱" 
              prefix-icon="Message"
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="密码" 
              prefix-icon="Lock"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="确认密码" 
              prefix-icon="Lock"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="submit-btn" @click="handleRegister">注册</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import authApi from '../../api/auth'
import type { ApiResponse, LoginData, LoginResponse } from '../../api/auth'

const router = useRouter()

// 当前激活的标签页
const activeTab = ref('login')

// 登录表单引用
const loginFormRef = ref()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ]
}

// 注册表单引用
const registerFormRef = ref()

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 注册表单验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        console.log('提交登录表单:', loginForm)
        
        const response = await authApi.login({
          username: loginForm.username,
          password: loginForm.password
        })

        console.log('登录响应:', response)

        // 检查响应数据格式
        if (response && response.data && response.data.code === 200) {
          // 保存token和用户信息
          const userData = response.data.data
          localStorage.setItem('token', userData.token)
          localStorage.setItem('role', userData.user.role)
          localStorage.setItem('userId', userData.user.id.toString())
          localStorage.setItem('username', userData.user.username)

          // 如果选择了"记住我"，保存用户名
          if (loginForm.remember) {
            localStorage.setItem('rememberUser', 'true')
            localStorage.setItem('rememberedUsername', loginForm.username)
          }

          ElMessage.success('登录成功')
          
          // 根据用户角色跳转到不同页面
          const role = userData.user.role
          if (role === 'admin') {
            router.push('/admin/feedback')
          } else if (role === 'developer') {
            router.push('/developer/tasks')
          } else {
            router.push('/user/submit')
          }
        } else {
          ElMessage.error(response?.data?.message || '登录失败，响应数据格式错误')
        }
      } catch (error: any) {
        console.error('登录错误:', error)
        ElMessage.error(error?.response?.data?.message || '登录失败，请重试')
      }
    }
  })
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 调用注册API
        const response = await authApi.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        console.log('注册响应:', response)
        
        if (response.data && response.data.code === 200) {
          // 注册成功
          ElMessage.success('注册成功，正在自动登录...')
          
          // 自动登录
          try {
            const loginResponse = await authApi.login({
              username: registerForm.username,
              password: registerForm.password
            })
            
            console.log('自动登录响应:', loginResponse)
            
            if (loginResponse.data && loginResponse.data.code === 200) {
              // 保存token和用户信息
              const userData = loginResponse.data.data
              localStorage.setItem('token', userData.token)
              localStorage.setItem('role', userData.user.role)
              localStorage.setItem('userId', userData.user.id.toString())
              localStorage.setItem('username', userData.user.username)
              
              ElMessage.success('登录成功')
              
              // 跳转到用户页面
              router.push('/user/submit')
            } else {
              // 如果自动登录失败，切换到登录标签页
              ElMessage.warning('自动登录失败，请手动登录')
              activeTab.value = 'login'
              
              // 预填充登录表单的用户名
              loginForm.username = registerForm.username
            }
          } catch (loginError) {
            console.error('自动登录失败:', loginError)
            
            // 切换到登录标签页
            activeTab.value = 'login'
            
            // 预填充登录表单的用户名
            loginForm.username = registerForm.username
          }
          
          // 清空注册表单
          registerFormRef.value.resetFields()
        } else {
          ElMessage.error(response.data?.message || '注册失败')
        }
      } catch (error: any) {
        console.error('注册失败:', error)
        if (error.response?.status === 404) {
          ElMessage.error('服务器连接失败，请检查网络设置')
        } else if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else {
          ElMessage.error('注册失败，请稍后重试')
        }
      }
    } else {
      return false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #dcdfe6;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  position: relative;
  color: #606266;
}

.tab.active {
  color: #409eff;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 2px;
  background-color: #409eff;
}

.form-box {
  margin-top: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
}
</style> 