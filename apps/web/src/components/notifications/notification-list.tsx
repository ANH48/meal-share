'use client';

import { useRef } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AppNotification } from '@/lib/api/notifications';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  hasMore: boolean;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  onLoadMore,
  loadingMore,
  hasMore,
}: Props) {
  const router = useRouter();
  const hasUnread = notifications.some((n) => !n.readAt);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      onLoadMore();
    }
  }

  function handleClick(n: AppNotification) {
    if (!n.readAt) onMarkAsRead(n.id);
    if (n.type === 'new_message' && n.data?.groupId) {
      router.push(`/dashboard/groups/${n.data.groupId}/chat`);
      onClose();
    }
  }

  return (
    <div className="absolute left-0 top-11 w-80 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <span className="text-sm font-semibold text-[#1E293B]">Notifications</span>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-[#F97316] hover:text-[#EA6A00] transition-colors cursor-pointer"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[360px] overflow-y-auto"
      >
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#94A3B8]">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                  !n.readAt ? 'bg-[#FFF7ED]' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-[#F97316] mt-1.5 shrink-0" />
                  )}
                  <div className={!n.readAt ? '' : 'pl-4'}>
                    <p className="text-xs font-semibold text-[#1E293B]">{n.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 size={14} className="animate-spin text-[#94A3B8]" />
              </div>
            )}
            {!hasMore && notifications.length > 0 && (
              <div className="py-2 text-center">
                <p className="text-[10px] text-[#CBD5E1]">No more notifications</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
