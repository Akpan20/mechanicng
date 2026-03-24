import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setNotifications,
  addNotification,
  setLoading,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from '@/store/notificationSlice';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/notifications';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(state => state.notifications);

  // Load initial notifications
  useEffect(() => {
    const load = async () => {
      dispatch(setLoading(true));
      try {
        const data = await fetchNotifications();
        dispatch(setNotifications(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        dispatch(setLoading(false));
      }
    };
    load();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(async () => {
      try {
        const sinceDate = notifications[0]?.createdAt;
        const params = sinceDate ? { since: sinceDate } : undefined;
        const newNotifs = await fetchNotifications(params);
        if (Array.isArray(newNotifs)) {
          newNotifs.forEach((n) => dispatch(addNotification(n)));
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Polling error', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, notifications]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      dispatch(markAsReadAction(id));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      dispatch(markAllAsReadAction());   // 👈 use the renamed action
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
  };
};