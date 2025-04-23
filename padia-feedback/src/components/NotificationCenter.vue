<template>
  <div class="notification-center">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
      <el-dropdown trigger="click" @visible-change="handleVisibleChange">
        <div class="notification-icon">
          <el-icon size="20">
            <Bell />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="notification-dropdown">
            <div class="notification-header">
              <span class="notification-title">消息通知</span>
              <span v-if="unreadCount > 0" class="mark-all-read" @click="handleMarkAllAsRead">
                全部标为已读
              </span>
            </div>
            <div v-if="loading" class="notification-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              加载中...
            </div>
            <div v-else-if="notifications.length === 0" class="empty-notification">
              <el-empty description="暂无消息通知" :image-size="60" />
            </div>
            <div v-else class="notification-list">
              <el-dropdown-item 
                v-for="notification in notifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="{'unread': !notification.isRead}"
              >
                <div class="notification-item">
                  <div class="notification-icon-wrapper">
                    <el-icon v-if="notification.type === 'comment'" class="notification-type-icon comment-icon">
                      <ChatDotRound />
                    </el-icon>
                    <el-icon v-else-if="notification.type === 'status'" class="notification-type-icon status-icon">
                      <MessageBox />
                    </el-icon>
                    <el-icon v-else-if="notification.type === 'assignment'" class="notification-type-icon assignment-icon">
                      <Document />
                    </el-icon>
                    <el-icon v-else class="notification-type-icon system-icon">
                      <Bell />
                    </el-icon>
                  </div>
                  <div class="notification-content">
                    <div class="notification-item-title">{{ notification.title }}</div>
                    <div class="notification-item-content">{{ notification.content }}</div>
                    <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                  </div>
                  <div v-if="!notification.isRead" class="unread-marker"></div>
                </div>
              </el-dropdown-item>
            </div>
            <div class="notification-footer">
              <span class="view-all">查看全部消息</span>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-badge>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, ChatDotRound, MessageBox, Document, Loading } from '@element-plus/icons-vue'
import { useNotificationStore, type Notification } from '../stores/notification'

const notificationStore = useNotificationStore()
const router = useRouter()

// 从store获取通知状态
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const loading = computed(() => notificationStore.loading)

// 当通知下拉框显示时，获取最新的通知
const handleVisibleChange = (visible: boolean) => {
  if (visible) {
    notificationStore.fetchNotifications()
  }
}

// 格式化时间显示
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于一分钟显示"刚刚"
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于一小时显示"x分钟前"
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于一天显示"x小时前"
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于一周显示"x天前"
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 其他情况显示日期
  return date.toLocaleDateString('zh-CN')
}

// 点击通知项
const handleNotificationClick = (notification: Notification) => {
  // 标记为已读
  notificationStore.markAsRead(notification.id)
  
  // 导航到相应的页面
  const userRole = localStorage.getItem('role')
  if (notification.sourceType === 'issue') {
    if (userRole === 'developer' || userRole === 'admin') {
      router.push(`/developer/issue/${notification.sourceId}`)
    } else {
      router.push(`/user/issue/${notification.sourceId}`)
    }
  } else if (notification.sourceType === 'task') {
    if (userRole === 'developer' || userRole === 'admin') {
      router.push(`/developer/tasks`)
    }
  }
}

// 标记所有通知为已读
const handleMarkAllAsRead = (event: Event) => {
  event.stopPropagation()
  notificationStore.markAllAsRead()
}

// 组件挂载时获取通知
onMounted(() => {
  notificationStore.fetchNotifications()
})
</script>

<style scoped>
.notification-center {
  position: relative;
}

.notification-badge {
  margin-right: 10px;
}

.notification-icon {
  cursor: pointer;
  color: white;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-dropdown {
  width: 350px;
  padding: 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.notification-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-title {
  font-weight: bold;
  font-size: 16px;
}

.mark-all-read {
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
}

.mark-all-read:hover {
  text-decoration: underline;
}

.notification-list {
  overflow-y: auto;
  max-height: 60vh;
}

.notification-loading,
.empty-notification {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.loading-icon {
  animation: rotating 2s linear infinite;
  margin-right: 5px;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notification-item {
  display: flex;
  padding: 10px 16px;
  transition: background-color 0.3s;
  position: relative;
}

.unread {
  background-color: #f0f9ff;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-icon-wrapper {
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-type-icon {
  padding: 8px;
  border-radius: 50%;
  font-size: 16px;
  color: white;
}

.comment-icon {
  background-color: #409eff;
}

.status-icon {
  background-color: #67c23a;
}

.assignment-icon {
  background-color: #e6a23c;
}

.system-icon {
  background-color: #909399;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-item-title {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 14px;
  color: #303133;
}

.notification-item-content {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  white-space: normal;
  word-break: break-word;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
  top: 16px;
  right: 16px;
}

.notification-footer {
  padding: 10px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
}

.view-all {
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}
</style> 