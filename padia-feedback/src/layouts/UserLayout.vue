<template>
  <div class="user-layout">
    <header class="header">
      <div class="logo">{{ $t('common.platformName') }}</div>
      <div class="nav">
        <router-link to="/user/submit" class="nav-item">{{ $t('nav.submitIssue') }}</router-link>
        <router-link to="/user/issues" class="nav-item">{{ $t('nav.issueList') }}</router-link>
        <router-link to="/user/hot" class="nav-item">{{ $t('nav.hotIssues') }}</router-link>
      </div>
      <div class="user-info">
        <el-dropdown @command="handleCommand" class="user-dropdown">
          <span class="user-dropdown-link">
            <el-icon class="user-icon"><User /></el-icon>
            {{ username }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">{{ $t('common.profile') }}</el-dropdown-item>
              <el-dropdown-item command="language">{{ $t('common.switchLanguage') }}<el-icon class="el-icon--right"><arrow-right /></el-icon></el-dropdown-item>
              <el-dropdown-item command="logout">{{ $t('common.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dialog
          v-model="languageDialogVisible"
          :title="$t('common.switchLanguage')"
          width="300px"
          align-center
        >
          <div class="language-options">
            <el-button @click="changeLanguage('zh-CN')" plain size="large" class="language-btn" :class="{ 'language-active': languageStore.language === 'zh-CN' }">简体中文</el-button>
            <el-button @click="changeLanguage('en-US')" plain size="large" class="language-btn" :class="{ 'language-active': languageStore.language === 'en-US' }">English</el-button>
          </div>
        </el-dialog>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <div>{{ $t('common.copyright') }}</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, User, ArrowRight } from '@element-plus/icons-vue'
import authApi from '../api/auth'
import { useLanguageStore, type LanguageType } from '../stores/language'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const username = ref('用户')
const languageStore = useLanguageStore()
const { t } = useI18n()
const languageDialogVisible = ref(false)

// 语言显示文本
const currentLanguageText = computed(() => {
  return languageStore.language === 'zh-CN' ? '简体中文' : 'English'
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
    ElMessage.info(t('common.comingSoon'))
  } else if (command === 'language') {
    // 打开语言选择对话框
    languageDialogVisible.value = true
  }
}

// 切换语言
const changeLanguage = (lang: LanguageType) => {
  languageStore.changeLanguage(lang)
  languageDialogVisible.value = false
  ElMessage.success(t('common.languageChanged'))
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

.language-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.language-btn {
  width: 100%;
  font-size: 16px;
}

.language-active {
  border-color: #004a96;
  color: #004a96;
  font-weight: bold;
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