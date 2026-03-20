'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, UserPlus, ArrowLeft } from 'lucide-react';
import { groupsApi, type Group } from '@/lib/api/groups';
import { InviteLink } from '@/components/groups/invite-link';
import { MemberList } from '@/components/groups/member-list';
import { useAuthStore } from '@/stores/auth-store';

const TABS = ['Overview', 'Menu', 'Vote', 'Orders', 'Chat', 'Analytics'];

const TAB_ROUTES: Record<string, string | null> = {
  Overview: null,
  Menu: 'menu',
  Vote: 'vote',
  Orders: 'orders',
  Chat: 'chat',
  Analytics: 'analytics',
};

const AVATAR_COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B'];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}
function getAvatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    groupsApi.getById(groupId)
      .then(({ data }) => setGroup(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F1F5F9]" />
          <div className="space-y-2">
            <div className="h-6 bg-[#F1F5F9] rounded w-48" />
            <div className="h-4 bg-[#F1F5F9] rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) return <div className="p-8 text-[#64748B]">Group not found.</div>;

  const isLeader = group.leaderId === user?.id;
  const members = group.members ?? [];
  const memberCount = group._count?.members ?? members.length;
  const previewMembers = members.slice(0, 3);
  const extraCount = memberCount - previewMembers.length;

  function handleRemoveMember(userId: string) {
    groupsApi.removeMember(groupId, userId).then(() => {
      setGroup((prev) =>
        prev ? {
          ...prev,
          members: prev.members?.filter((m) => m.userId !== userId),
          _count: { members: (prev._count?.members ?? 1) - 1 },
        } : prev
      );
    });
  }

  return (
    <div>
      {/* Back button */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-3">
        <button
          onClick={() => router.push('/dashboard/groups')}
          className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>My Groups</span>
        </button>
      </div>

      {/* Group header card */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: getAvatarColor(group.name) }}
            >
              <span className="text-white text-lg font-bold">{getInitials(group.name)}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1E293B] font-mono">{group.name}</h1>
              {group.description && (
                <p className="text-sm text-[#64748B] mt-0.5">{group.description}</p>
              )}
              {/* Member avatar stack */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {previewMembers.map((m, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: getAvatarColor(m.user?.name ?? String(i)) }}
                    >
                      {getInitials(m.user?.name ?? '?')}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-[#94A3B8]">
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                  {extraCount > 0 ? ` (+${extraCount} more)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/join?code=${group.inviteCode}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#F97316] hover:bg-[#EA6A00] px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              Invite
            </button>
            {isLeader && (
              <Link
                href={`/dashboard/groups/${groupId}/settings`}
                className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E293B] border border-[#E2E8F0] px-3 py-2 rounded-lg transition-colors"
              >
                <Settings size={14} />
                Settings
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E2E8F0] px-8">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const subRoute = TAB_ROUTES[tab];
            if (subRoute) {
              return (
                <button
                  key={tab}
                  onClick={() => router.push(`/dashboard/groups/${groupId}/${subRoute}`)}
                  className="px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer border-transparent text-[#64748B] hover:text-[#1E293B]"
                >
                  {tab}
                </button>
              );
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
                  activeTab === tab
                    ? 'border-[#F97316] text-[#F97316]'
                    : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-8">
        {activeTab === 'Overview' ? (
          <div className="grid grid-cols-3 gap-6">
            {/* Left: invite + coming soon cards */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Invite Link</h3>
                <InviteLink inviteCode={group.inviteCode} />
              </div>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">This Week&apos;s Menu</h3>
                <p className="text-sm text-[#94A3B8]">No menu set yet. Coming in Phase 06.</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Recent Activity</h3>
                <p className="text-sm text-[#94A3B8]">Activity feed coming soon.</p>
              </div>
            </div>
            {/* Right: members */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 h-fit">
              <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
                Members <span className="text-[#94A3B8] font-normal">({memberCount})</span>
              </h3>
              <MemberList
                members={members}
                currentUserId={user?.id}
                isLeader={isLeader}
                onRemove={handleRemoveMember}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center max-w-md">
            <p className="text-[#94A3B8] text-sm font-medium">{activeTab} — coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
