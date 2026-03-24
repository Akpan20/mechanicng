import { api } from './client';
import type { Notification } from '@/store/notificationSlice';

export const fetchNotifications = async (params?: { since?: string }): Promise<Notification[]> => {
  const response = await api.get<{ notifications: Notification[] } | Notification[]>(
    '/notifications',
    params
  );

  // Handle both shapes: plain array OR { notifications: [] }
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.notifications)) return response.notifications;
  return [];
};

export const markNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`, {});
};

export const markAllNotificationsRead = async () => {
  await api.patch('/notifications/read-all', {});
};