import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

interface CreateNotificationParams {
  userId: string | Types.ObjectId;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = new Notification({
    user: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
  });

  await notification.save();

  // Optional: emit real‑time event via Socket.io (see next section)
  // if (global.io) global.io.to(`user:${params.userId}`).emit('new_notification', notification);

  return notification;
}