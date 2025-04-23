<template>
  <div class="notification-badge">
    <el-popover
      placement="bottom"
      :width="300"
      trigger="click"
      popper-class="notification-popover"
    >
      <template #reference>
        <div class="badge-wrapper">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="badge-item" type="danger">
            <el-icon class="notification-icon"><Bell /></el-icon>
          </el-badge>
        </div>
      </template>
      
      <div class="notification-header">
        <h3>通知中心</h3>
        <el-button v-if="unreadCount > 0" link @click="markAllAsRead">全部标为已读</el-button>
      </div>
      
      <el-divider />
      
      <div v-if="loading" class="notification-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <div v-else-if="notifications.length === 0" class="empty-notifications">
        <el-empty description="暂无新通知" :image-size="80" />
      </div>
      
      <el-scrollbar max-height="300px" v-else>
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          @click="viewNotification(notification)"
        >
          <div class="notification-item-header">
            <span class="notification-title">{{ notification.title || '通知' }}</span>
            <span class="notification-badge-count" v-if="!notification.isRead">1</span>
          </div>
          <div class="notification-item-content">
            {{ getLatestMessage(notification) }}
          </div>
          <div class="notification-item-footer">
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            <el-tag size="small" :type="getStatusType(notification.type)">
              {{ getTypeLabel(notification.type) }}
            </el-tag>
          </div>
        </div>
      </el-scrollbar>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Bell, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notificationStore';

const router = useRouter();
const notificationStore = useNotificationStore();
const loading = computed(() => notificationStore.loading);
// 获取当前时间戳
const currentTime = new Date().getTime();

// 过滤当前时间之后的通知
const notifications = computed(() => {
  return notificationStore.notifications.filter(notification => {
    const notificationTime = new Date(notification.createdAt).getTime();
    return notificationTime >= currentTime;
  });
});

// 计算当前时间之后的未读通知数量
const unreadCount = computed(() => {
  return notifications.value.length;
});

const refreshInterval = ref(null);

// 初始化和轮询
onMounted(async () => {
  if (!notificationStore.initialized) {
    await notificationStore.fetchUnreadMessages();
  }
  
  // 设置定时刷新 (每分钟检查一次未读消息数量)
  refreshInterval.value = setInterval(() => {
    notificationStore.fetchUnreadMessages();
  }, 60000);
});

// 组件销毁前清除定时器
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead();
    ElMessage.success('已标记所有通知为已读');
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    ElMessage.error('标记已读失败，请稍后重试');
  }
};

// 查看通知详情并标记为已读
const viewNotification = async (notification) => {
  try {
    // 标记为已读
    await notificationStore.markAsRead(notification.id);
    
    // 导航到相应页面
    if (notification.type === 'task') {
      router.push(`/developer/issue/${notification.itemId}`);
    } else if (notification.type === 'issue') {
      router.push(`/developer/issue/${notification.itemId}`);
    } else if (notification.type === 'comment') {
      router.push(`/developer/issue/${notification.itemId}`);
    } else {
      // 默认导航到任务列表
      router.push('/developer/tasks');
    }
  } catch (error) {
    console.error('处理通知失败:', error);
    ElMessage.error('操作失败，请稍后重试');
  }
};

// 获取最新消息内容
const getLatestMessage = (notification) => {
  if (!notification.content) return '无内容';
  
  return notification.content.length > 40
    ? notification.content.substring(0, 40) + '...'
    : notification.content;
};

// 格式化时间为相对时间
const formatTime = (timestamp) => {
  const now = new Date();
  const msgTime = new Date(timestamp);
  const diffMs = now - msgTime;
  
  // 小于1分钟
  if (diffMs < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diffMs < 60 * 60 * 1000) {
    return Math.floor(diffMs / (60 * 1000)) + '分钟前';
  }
  
  // 小于1天
  if (diffMs < 24 * 60 * 60 * 1000) {
    return Math.floor(diffMs / (60 * 60 * 1000)) + '小时前';
  }
  
  // 小于1周
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + '天前';
  }
  
  // 大于1周，显示具体日期
  const year = msgTime.getFullYear();
  const month = String(msgTime.getMonth() + 1).padStart(2, '0');
  const day = String(msgTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 根据状态获取对应的类型
const getStatusType = (type) => {
  const typeMap = {
    'task': 'primary',     // 任务通知
    'issue': 'warning',    // 问题通知
    'comment': 'success',  // 评论通知
    'system': 'info'       // 系统通知
  };
  
  return typeMap[type] || 'info';
};

// 获取通知类型标签
const getTypeLabel = (type) => {
  const typeLabels = {
    'task': '任务',
    'issue': '问题',
    'comment': '评论',
    'system': '系统'
  };
  
  return typeLabels[type] || '通知';
};
</script>

<style scoped>
.notification-badge {
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.badge-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon {
  color: white;
  font-size: 22px;
}

.badge-item {
  line-height: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.notification-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #909399;
}

.empty-notifications {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.notification-item {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.notification-title {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.notification-badge-count {
  background-color: #f56c6c;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  padding: 0 6px;
  line-height: 16px;
  height: 16px;
  display: inline-block;
}

.notification-item-content {
  color: #606266;
  font-size: 13px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.notification-time {
  color: #909399;
}
</style>

<style>
.notification-popover {
  padding: 10px 0;
}

.el-badge__content.is-fixed {
  top: 8px;
  right: 8px;
}
</style> 