'use client';

import { use, useEffect, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { messagesApi, type Message } from '@/lib/api/messages';
import { groupsApi, type Group } from '@/lib/api/groups';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';

const AVATAR_COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B'];

function getAvatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ChatPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const { messages, isLoading, loadMore, isLoadingMore, hasMore } = useRealtimeMessages(groupId);
  const [group, setGroup] = useState<Group | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null);

  useEffect(() => {
    groupsApi.getById(groupId).then(({ data }) => setGroup(data)).catch(() => {});
  }, [groupId]);

  async function handleSend(content: string) {
    if (editingMessage) {
      await messagesApi.update(editingMessage.id, content);
      setEditingMessage(null);
    } else {
      await messagesApi.create(groupId, content);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    await messagesApi.delete(confirmDelete.id);
    setConfirmDelete(null);
  }

  const memberCount = group?._count?.members ?? group?.members?.length ?? 0;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-[#94A3B8] text-sm">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E2E8F0] shrink-0">
        <button
          onClick={() => router.push(`/dashboard/groups/${groupId}`)}
          className="text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        {group && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
            style={{ backgroundColor: getAvatarColor(group.name) }}
          >
            {getInitials(group.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[#1E293B] truncate">
            {group?.name ?? 'Group Chat'}
          </h1>
          {memberCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <Users size={10} />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user?.id ?? ''}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onEdit={(msg) => setEditingMessage(msg)}
        onDelete={(msg) => setConfirmDelete(msg)}
      />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        userName={user?.name ?? ''}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-2">Delete message?</h3>
            <p className="text-xs text-[#64748B] mb-5">This message will be marked as deleted.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
