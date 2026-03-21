'use client';

import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { ref, onChildAdded, off, query, orderByChild, startAt } from 'firebase/database';
import { getFirebaseMessaging, getFirebaseDatabase } from '@/lib/firebase';
import { notificationsApi, type AppNotification } from '@/lib/api/notifications';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function useNotifications() {
  const { isAuthenticated, user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data.notifications);
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await notificationsApi.list(nextCursor);
      setNotifications((prev) => [...prev, ...data.notifications]);
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // FCM setup
  useEffect(() => {
    if (!isAuthenticated) return;
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    Notification.requestPermission().then(async (permission) => {
      if (permission !== 'granted') return;
      try {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          await api.patch('/users/fcm-token', { token });
        }
      } catch {
        // ignore
      }
    });

    // Refresh from DB on foreground FCM so we get the real notification with correct ID
    const unsub = onMessage(messaging, () => {
      fetchNotifications();
    });

    return () => unsub();
  }, [isAuthenticated, fetchNotifications]);

  async function markAsRead(id: string) {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }

  async function markAllAsRead() {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
  }

  // Firebase RTDB listener for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const db = getFirebaseDatabase();
    if (!db) return;

    const listenFrom = Date.now();
    const notifRef = query(ref(db, `notification/${user.id}`), orderByChild('at'), startAt(listenFrom));

    const handler = onChildAdded(notifRef, (snapshot) => {
      const data = snapshot.val() as AppNotification & { at: number };
      if (!data?.id) return;

      setNotifications((prev) => {
        if (prev.find((n) => n.id === data.id)) return prev;
        return [data, ...prev];
      });
    });

    return () => off(notifRef, 'child_added', handler);
  }, [isAuthenticated, user?.id]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadMore,
    loadingMore,
    hasMore: !!nextCursor,
    refresh: fetchNotifications,
  };
}
