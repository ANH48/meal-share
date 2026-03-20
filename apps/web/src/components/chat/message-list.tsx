'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { Message } from '@/lib/api/messages';
import { MessageBubble } from './message-bubble';
import { SystemMessage } from './system-message';

interface Props {
  messages: Message[];
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}

export function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onEdit,
  onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const added = messages.length - prevLengthRef.current;
    prevLengthRef.current = messages.length;
    // Auto-scroll to bottom only when new messages appended (not when loading older)
    if (added > 0 && messages.length <= 50) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (added === 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-xs text-[#F97316] hover:text-[#EA6A00] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              'Load older messages'
            )}
          </button>
        </div>
      )}

      {messages.map((msg) =>
        msg.type === 'system' ? (
          <SystemMessage key={msg.id} message={msg} />
        ) : (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      )}

      <div ref={bottomRef} />
    </div>
  );
}
