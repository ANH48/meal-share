'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import type { Message } from '@/lib/api/messages';

const AVATAR_COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B'];

function getAvatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

interface Props {
  onSend: (content: string) => Promise<void>;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  userName?: string;
  disabled?: boolean;
}

export function MessageInput({ onSend, editingMessage, onCancelEdit, userName = '', disabled }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    } else {
      setContent('');
    }
  }, [editingMessage]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setContent('');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-[#E2E8F0] bg-white px-4 py-3 shrink-0">
      {editingMessage && (
        <div className="flex items-center justify-between text-xs text-[#F97316] mb-2 px-1">
          <span>Editing message...</span>
          <button
            onClick={onCancelEdit}
            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        {/* User avatar */}
        {userName && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 text-white text-[10px] font-bold"
            style={{ backgroundColor: getAvatarColor(userName) }}
          >
            {getInitials(userName)}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] placeholder-[#CBD5E1] outline-none focus:border-[#F97316] transition-colors disabled:opacity-50 bg-[#F8FAFC]"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />

        <button
          onClick={handleSend}
          disabled={!content.trim() || sending || disabled}
          className="w-10 h-10 rounded-xl bg-[#F97316] hover:bg-[#EA6A00] flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
