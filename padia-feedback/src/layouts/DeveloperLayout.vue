<template>
  <div class="developer-layout">
    <header class="header">
      <div class="logo">PADIA开发者反馈平台</div>
      <div class="nav">
        <router-link to="/developer/tasks" class="nav-item">任务列表</router-link>
        <router-link v-if="!isAdmin" to="/developer/statistics" class="nav-item">数据统计</router-link>
        <router-link v-if="isAdmin" to="/developer/admin-statistics" class="nav-item">数据统计</router-link>
        <router-link v-if="isAdmin" to="/user/submit" class="nav-item">用户页面</router-link>
      </div>
      <div class="user-info">
        <notification-badge />
        <el-dropdown @command="handleCommand" class="user-dropdown">
          <span class="user-dropdown-link">
            <el-icon class="user-icon"><User /></el-icon>
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
      <div>© 2025 PADIA User Feedback Platform. All rights reserved.</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, User } from '@element-plus/icons-vue'
import authApi from '../api/auth'
import NotificationBadge from '../components/NotificationBadge.vue'

const router = useRouter()
const username = ref('开发者')

// 判断是否为管理员
const isAdmin = computed(() => {
  const localRole = localStorage.getItem('role')
  console.log("管理员角色判断 - localStorage中的角色:", localRole)
  return localRole === 'admin'
})

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
    ElMessage.info('功能即将上线')
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
.developer-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #004a96;
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
}

.logo-image {
  height: 40px;
  max-width: 200px;
  object-fit: contain;
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
  display: flex;
  align-items: center;
}

.user-dropdown-link {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.user-icon {
  margin-right: 4px;
  font-size: 20px;
}

.main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  margin-bottom: 40px;
  margin-top: 60px; /* 添加顶部边距，避免内容被导航栏遮挡 */
}

.footer {
  background-color: #f5f7fa;
  padding: 10px;
  text-align: center;
  color: #606266;
  border-top: 1px solid #e4e7ed;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 10;
}
</style> 