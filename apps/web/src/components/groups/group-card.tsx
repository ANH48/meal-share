'use client';

import Link from 'next/link';
import type { Group, GroupMember } from '@/lib/api/groups';

const AVATAR_COLORS = [
  '#F97316',
  '#7C3AED',
  '#0EA5E9',
  '#EC4899',
  '#10B981',
  '#F59E0B',
];

function getAvatarColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface GroupCardProps {
  group: Group & { members?: Array<Pick<GroupMember, 'role' | 'status'>> };
  currentUserId?: string;
}

export function GroupCard({ group, currentUserId }: GroupCardProps) {
  const userMembership = group.members?.find(
    (m) => currentUserId && m.status === 'active',
  );
  const role = userMembership?.role ?? 'participant';
  const memberCount = group._count?.members ?? group.members?.length ?? 0;
  const avatarColor = getAvatarColor(group.name);
  const initials = getInitials(group.name);

  return (
    <Link href={`/dashboard/groups/${group.id}`}>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-white text-base font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1E293B] truncate">{group.name}</p>
            {group.description && (
              <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#64748B]">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              role === 'leader'
                ? 'bg-[#FFF7ED] text-[#F97316]'
                : 'bg-[#EFF6FF] text-[#2563EB]'
            }`}
          >
            {role === 'leader' ? 'Leader' : 'Member'}
          </span>
        </div>
      </div>
    </Link>
  );
}
