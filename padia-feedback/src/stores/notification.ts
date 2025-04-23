import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 消息类型枚举
export enum NotificationType {
  COMMENT = 'comment',      // 评论
  STATUS_CHANGE = 'status', // 状态变更
  ASSIGNMENT = 'assignment', // 任务分配
  SYSTEM = 'system'          // 系统通知
}

// 消息接口
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  sourceId: number;     // 关联ID（问题ID或任务ID）
  sourceType: 'issue' | 'task'; // 关联类型
  isRead: boolean;
  createdAt: string;
}

// 消息状态存储
export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  
  // 计算属性
  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)
  
  // 按关联ID获取未读消息数量
  const getUnreadCountBySource = (sourceId: number, sourceType: 'issue' | 'task') => {
    return notifications.value.filter(n => !n.isRead && n.sourceId === sourceId && n.sourceType === sourceType).length
  }
  
  // 添加通知
  const addNotification = (notification: Notification) => {
    notifications.value.unshift(notification)
  }
  
  // 标记通知为已读
  const markAsRead = (notificationId: number) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
    }
  }
  
  // 标记所有通知为已读
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.isRead = true
    })
  }
  
  // 标记特定来源的通知为已读
  const markSourceAsRead = (sourceId: number, sourceType: 'issue' | 'task') => {
    notifications.value.forEach(notification => {
      if (notification.sourceId === sourceId && notification.sourceType === sourceType) {
        notification.isRead = true
      }
    })
  }
  
  // 获取通知列表
  const fetchNotifications = async () => {
    loading.value = true
    try {
      // 获取实际通知数据，此处应替换为API调用
      // 目前暂时初始化为空数组，表示没有通知
      notifications.value = []
      loading.value = false
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  return {
    // 状态
    notifications,
    loading,
    
    // 计算属性
    unreadCount,
    
    // 操作
    addNotification,
    markAsRead,
    markAllAsRead,
    markSourceAsRead,
    fetchNotifications,
    getUnreadCountBySource
  }
}) 