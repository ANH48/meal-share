'use client';

import { Trash2 } from 'lucide-react';
import type { GroupMember } from '@/lib/api/groups';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface MemberListProps {
  members: GroupMember[];
  currentUserId?: string;
  isLeader?: boolean;
  onRemove?: (userId: string) => void;
}

export function MemberList({ members, currentUserId, isLeader, onRemove }: MemberListProps) {
  return (
    <ul className="space-y-3">
      {members.map((member) => {
        const name = member.user?.name ?? 'Unknown';
        const email = member.user?.email ?? '';
        const initials = getInitials(name);
        const isSelf = member.userId === currentUserId;
        const canRemove = isLeader && member.role !== 'leader' && !isSelf;

        return (
          <li
            key={member.id}
            className="flex items-center gap-3 py-2"
          >
            <div className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
              <span className="text-[#64748B] text-xs font-semibold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B] truncate">{name}</p>
              <p className="text-xs text-[#94A3B8] truncate">{email}</p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                member.role === 'leader'
                  ? 'bg-[#FFF7ED] text-[#F97316]'
                  : 'bg-[#EFF6FF] text-[#2563EB]'
              }`}
            >
              {member.role === 'leader' ? 'Leader' : 'Member'}
            </span>
            {canRemove && onRemove && (
              <button
                onClick={() => onRemove(member.userId)}
                className="text-[#94A3B8] hover:text-red-500 transition-colors ml-1"
                aria-label={`Remove ${name}`}
              >
                <Trash2 size={15} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
