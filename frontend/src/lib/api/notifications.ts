// src/lib/api/notifications.ts
import { api } from './client'
import type { Notification } from '@/store/notificationSlice'

export const fetchNotifications = async (params?: { since?: string }): Promise<Notification[]> => {
  const response = await api.get<{ notifications: Notification[] } | Notification[]>(
    '/notifications',
    params
  )
  if (Array.isArray(response))              return response
  if (Array.isArray(response?.notifications)) return response.notifications
  return []
}

export const markNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`, {})
}

export const markAllNotificationsRead = async () => {
  await api.patch('/notifications/read-all', {})
}

// ── Admin only ─────────────────────────────────────────────
export type SendTarget = 'all' | 'role' | 'user'
export type NotifType  = 'info' | 'success' | 'warning' | 'error'

export interface SendNotificationPayload {
  target:   SendTarget
  role?:    'user' | 'mechanic'
  userId?:  string
  type:     NotifType
  title:    string
  message:  string
  link?:    string
}

export interface SendNotificationResult {
  success: boolean
  sent:    number
}

export const adminSendNotification = async (
  payload: SendNotificationPayload
): Promise<SendNotificationResult> => {
  return api.post<SendNotificationResult>('/notifications/send', payload)
}