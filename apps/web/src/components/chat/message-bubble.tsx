import { Pencil, Trash2 } from 'lucide-react';
import type { Message } from '@/lib/api/messages';

const AVATAR_COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B'];

function getAvatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  message: Message;
  isOwn: boolean;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, onEdit, onDelete }: Props) {
  const senderName = message.sender?.name ?? 'Unknown';
  const isDeleted = !!message.deletedAt;

  return (
    <div className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 text-white text-[10px] font-bold"
          style={{ backgroundColor: getAvatarColor(senderName) }}
        >
          {getInitials(senderName)}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-[#94A3B8] px-1">{senderName}</span>
        )}

        <div className="flex items-end gap-1.5">
          {/* Actions (own messages) */}
          {isOwn && !isDeleted && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(message)}
                className="w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-[#1E293B] transition-colors cursor-pointer"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => onDelete(message)}
                className="w-6 h-6 flex items-center justify-center text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isOwn
                ? 'bg-[#F97316] text-white rounded-tr-sm'
                : 'bg-white border border-[#E2E8F0] text-[#1E293B] rounded-tl-sm'
            } ${isDeleted ? 'opacity-60' : ''}`}
          >
            {isDeleted ? (
              <span className="italic text-xs">Message deleted</span>
            ) : (
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</span>
            )}
          </div>
        </div>

        {/* Timestamp + edited */}
        <div className={`flex items-center gap-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[#CBD5E1]">{formatTime(message.createdAt)}</span>
          {message.editedAt && !isDeleted && (
            <span className="text-[10px] text-[#CBD5E1]">(edited)</span>
          )}
        </div>
      </div>
    </div>
  );
}
