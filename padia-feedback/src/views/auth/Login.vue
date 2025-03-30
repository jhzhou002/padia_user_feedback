<template>
  <div class="login-container">
    <!-- 左侧品牌区域 -->
    <div class="brand-section">
      <div class="brand-content">
        <h1 class="welcome-text">Welcome to the</h1>
        <h1 class="brand-name">PADIA</h1>
        <h2 class="brand-slogan">User Feedback Platform</h2>
      </div>
      <!-- 去掉底部文本 -->
      <div class="brand-footer">
      </div>
    </div>

    <!-- 右侧登录区域 -->
    <div class="auth-section">
      <div class="auth-container">
        <!-- PADIA Logo -->
        <div class="logo-container">
          <img src="../../assets/padia-logo.svg" alt="PADIA Logo" class="padia-logo" />
        </div>

        <div class="tabs">
          <span 
            class="tab" 
            :class="{ active: activeTab === 'login' }" 
            @click="activeTab = 'login'"
          >Login</span>
          <span 
            class="tab" 
            :class="{ active: activeTab === 'register' }" 
            @click="activeTab = 'register'"
          >Register</span>
        </div>
        
        <!-- 登录表单 -->
        <div v-if="activeTab === 'login'" class="form-box">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="用户名/邮箱" 
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
            <el-form-item prop="brand">
              <el-select 
                v-model="registerForm.brand" 
                placeholder="请选择品牌" 
                class="full-width"
                @change="handleBrandChange"
              >
                <el-option
                  v-for="item in brandOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="factory">
              <el-select 
                v-model="registerForm.factory" 
                placeholder="请选择工厂" 
                class="full-width"
              >
                <el-option
                  v-for="item in factoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
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

// 检查是否有记住的用户
onMounted(() => {
  const rememberUser = localStorage.getItem('rememberUser')
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  
  if (rememberUser === 'true' && rememberedUsername) {
    loginForm.username = rememberedUsername
    loginForm.remember = true
  }
})

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度应为3-50个字符', trigger: 'blur' }
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
  confirmPassword: '',
  brand: '',
  factory: ''
})

// 品牌选项
const brandOptions = ref([
  { value: 'TESLA', label: 'TESLA' },
  { value: '小米', label: '小米' },
]);

// 工厂选项映射
interface FactoryMapType {
  [key: string]: { value: string; label: string }[];
}

const factoryMap = reactive<FactoryMapType>({
  'TESLA': [
    { value: 'GF3 P1', label: 'GF3 P1' },
    { value: 'GF3 P2', label: 'GF3 P2' },
  ],
  '小米': [
    { value: 'Xiaomi-BJ', label: 'Xiaomi-BJ' },
  ]
});

// 根据当前选择的品牌筛选工厂选项
const factoryOptions = computed(() => {
  if (!registerForm.brand) return [];
  return factoryMap[registerForm.brand] || [];
});

// 当品牌改变时，重置工厂选择
const handleBrandChange = () => {
  registerForm.factory = '';
};

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
  brand: [
    { required: true, message: '请选择品牌', trigger: 'change' },
  ],
  factory: [
    { required: true, message: '请选择工厂', trigger: 'change' },
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
          password: registerForm.password,
          brand: registerForm.brand,
          factory: registerForm.factory
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
  min-height: 100vh;
  background-color: #f0f2f5;
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  background-color: #004A96;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 80px 60px;
  position: relative;
}

.brand-content {
  margin-top: 10vh;
}

.welcome-text {
  font-size: 38px;
  font-weight: 400;
  margin-bottom: 10px;
  color: #f0f2f5;
}

.brand-name {
  font-size: 80px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.brand-slogan {
  font-size: 36px;
  font-weight: 400;
  margin-top: 5px;
  margin-bottom: 40px;
  color: #f0f2f5;
}

.get-started-btn {
  background-color: #2b82e3;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.get-started-btn:hover {
  background-color: #1a70d2;
}

.brand-footer {
  margin-top: auto;
}

.brand-footnote {
  font-size: 16px;
  color: #9e9e9e;
}

/* 右侧登录区域 */
.auth-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

.auth-container {
  width: 400px;
  padding: 40px 30px;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.logo-container {
  text-align: center;
  margin-bottom: 40px;
}

.padia-logo {
  max-width: 180px;
  height: auto;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
  border-bottom: 1px solid #dcdfe6;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  position: relative;
  color: #606266;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.tab.active {
  color: #004a96;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 2px;
  background-color: #004a96;
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
  color: #004a96;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background-color: #004a96;
  border-color: #004a96;
}

.submit-btn:hover {
  background-color: #003a77;
  border-color: #003a77;
}

/* 媒体查询，适应小屏幕 */
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
  }
  
  .brand-section {
    display: none;
  }
  
  .auth-section {
    padding: 40px 20px;
  }
  
  .auth-container {
    width: 100%;
    max-width: 400px;
  }
}

.full-width {
  width: 100%;
}
</style> 