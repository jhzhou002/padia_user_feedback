import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

/**
 * 获取用户的未读消息数量
 * @returns {Promise} 未读消息数量的响应
 */
const getUnreadCount = () => {
  return axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
}

/**
 * 获取用户的未读消息列表
 * @returns {Promise} 未读消息列表的响应
 */
const getUnreadMessages = () => {
  return axios.get(`${API_BASE_URL}/api/notifications/unread`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
}

/**
 * 标记消息为已读
 * @param {number} messageId 消息ID
 * @returns {Promise} 操作结果的响应
 */
const markAsRead = (messageId: number) => {
  return axios.put(`${API_BASE_URL}/api/notifications/${messageId}/read`, {}, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
}

/**
 * 标记所有消息为已读
 * @returns {Promise} 操作结果的响应
 */
const markAllAsRead = () => {
  return axios.put(`${API_BASE_URL}/api/notifications/read-all`, {}, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
}

export default {
  getUnreadCount,
  getUnreadMessages,
  markAsRead,
  markAllAsRead
} 