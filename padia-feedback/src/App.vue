<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useNotificationStore } from './stores/notificationStore'

const userStore = useUserStore()
const notificationStore = useNotificationStore()

// 在应用挂载时初始化用户信息
onMounted(async () => {
  // 如果有token，则初始化用户信息
  if (localStorage.getItem('token')) {
    await userStore.fetchUserInfo()
    console.log('用户信息初始化完成，当前角色:', userStore.userRole)
    
    // 初始化通知
    await notificationStore.initialize()
    console.log('通知系统初始化完成，未读通知数:', notificationStore.unreadCount)
  }
})
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
}
</style>
