import { defineStore } from 'pinia'
import notificationApi from '../api/notification'

interface Notification {
  id: number
  type: string
  isRead: boolean
  title: string
  content: string
  itemId: number
  itemType: string
  createdAt: string
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    unreadCount: 0,
    notifications: [] as Notification[],
    loading: false,
    initialized: false,
    initTime: new Date().getTime() // 记录初始化时间
  }),
  
  actions: {
    // 获取未读消息数量
    async fetchUnreadCount() {
      try {
        this.loading = true
        const response = await notificationApi.getUnreadCount()
        if (response.data && response.data.code === 200) {
          this.unreadCount = response.data.data.total || 0
          this.initialized = true
        }
        return this.unreadCount
      } catch (error) {
        console.error('获取未读消息数量失败:', error)
        return 0
      } finally {
        this.loading = false
      }
    },
    
    // 获取未读消息列表
    async fetchUnreadMessages() {
      try {
        this.loading = true
        const response = await notificationApi.getUnreadMessages()
        
        if (response.data && response.data.code === 200) {
          // 过滤出当前时间之后的通知
          const allNotifications = response.data.data || []
          
          // 在生产环境中，只有实际时间在初始化时间之后的通知才会显示
          // 这是实际系统中的正确行为
          this.notifications = allNotifications.filter(notification => {
            const notificationTime = new Date(notification.createdAt).getTime()
            return notificationTime >= this.initTime
          })
          
          this.unreadCount = this.notifications.length
          this.initialized = true
        }
        
        return this.notifications
      } catch (error) {
        console.error('获取未读消息列表失败:', error)
        return []
      } finally {
        this.loading = false
      }
    },
    
    // 标记消息为已读
    async markAsRead(notificationId: number) {
      try {
        const response = await notificationApi.markAsRead(notificationId)
        
        if (response.data && response.data.code === 200) {
          // 更新本地状态
          const notification = this.notifications.find(item => item.id === notificationId)
          if (notification) {
            notification.isRead = true
            this.unreadCount = Math.max(0, this.unreadCount - 1)
          }
        }
      } catch (error) {
        console.error('标记消息为已读失败:', error)
      }
    },
    
    // 标记所有消息为已读
    async markAllAsRead() {
      try {
        const response = await notificationApi.markAllAsRead()
        
        if (response.data && response.data.code === 200) {
          // 更新本地状态
          this.notifications.forEach(notification => {
            notification.isRead = true
          })
          this.unreadCount = 0
        }
      } catch (error) {
        console.error('标记所有消息为已读失败:', error)
      }
    },
    
    // 初始化通知状态
    async initialize() {
      if (!this.initialized) {
        await this.fetchUnreadMessages()
      }
    }
  }
}) 