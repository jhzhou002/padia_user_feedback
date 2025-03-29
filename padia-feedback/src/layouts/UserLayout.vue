<template>
  <div class="user-layout">
    <header class="header">
      <div class="logo">PADIA用户反馈平台</div>
      <div class="nav">
        <router-link to="/user/submit" class="nav-item">提交问题</router-link>
        <router-link to="/user/issues" class="nav-item">问题列表</router-link>
        <router-link to="/user/hot" class="nav-item">热门问题</router-link>
      </div>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown-link">
            {{ username }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <div>© 2024 PADIA用户反馈平台. All rights reserved.</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import authApi from '../api/auth'

const router = useRouter()
const username = ref('用户')

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await authApi.getUserInfo()
    if (response.data && response.data.code === 200 && response.data.data) {
      username.value = response.data.data.username
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 处理下拉命令
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'profile') {
    // 跳转到个人中心页面
    ElMessage.info('个人中心功能即将上线')
  }
}

// 退出登录
const handleLogout = () => {
  try {
    // 清除登录状态
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('rememberUser')
    localStorage.removeItem('rememberedUsername')
    
    ElMessage.success('退出成功')
    router.push('/auth/login')
  } catch (error) {
    console.error('退出失败:', error)
    router.push('/auth/login')
  }
}

onMounted(() => {
  // 页面加载后获取用户信息
  getUserInfo()
})
</script>

<style scoped>
.user-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #409eff;
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.nav {
  display: flex;
  flex: 1;
  justify-content: center;
}

.nav-item {
  color: white;
  text-decoration: none;
  margin-left: 20px;
  padding: 0 10px;
  height: 60px;
  display: flex;
  align-items: center;
  position: relative;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-info {
  margin-left: 20px;
}

.user-dropdown-link {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.footer {
  background-color: #f5f7fa;
  padding: 20px;
  text-align: center;
  color: #606266;
  border-top: 1px solid #e4e7ed;
}
</style> 