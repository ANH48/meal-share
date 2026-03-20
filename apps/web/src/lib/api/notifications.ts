import { api } from '@/lib/api';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  nextCursor: string | null;
}

export const notificationsApi = {
  list: (cursor?: string) =>
    api.get<NotificationsPage>('/notifications', { params: cursor ? { cursor } : {} }),
  unreadCount: () => api.get<number>('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
