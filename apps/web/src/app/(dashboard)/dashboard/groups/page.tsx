'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { groupsApi, type Group, type GroupMember } from '@/lib/api/groups';
import { GroupCard } from '@/components/groups/group-card';
import { useAuthStore } from '@/stores/auth-store';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-[#F1F5F9]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#F1F5F9] rounded w-3/4" />
          <div className="h-3 bg-[#F1F5F9] rounded w-1/2" />
        </div>
      </div>
      <div className="flex justify-between mt-3">
        <div className="h-3 bg-[#F1F5F9] rounded w-20" />
        <div className="h-5 bg-[#F1F5F9] rounded-full w-16" />
      </div>
    </div>
  );
}

type GroupWithMembership = Group & { members?: Array<Pick<GroupMember, 'role' | 'status'>> };

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsApi.list()
      .then(({ data }) => setGroups(data as GroupWithMembership[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">My Groups</h1>
        <Link
          href="/dashboard/groups/create"
          className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors"
        >
          <Plus size={16} />
          Create Group
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#FFF7ED] rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-[#F97316]" />
          </div>
          <p className="text-[#1E293B] font-semibold text-lg mb-1">No groups yet</p>
          <p className="text-[#64748B] text-sm mb-6">Create your first group to get started</p>
          <Link
            href="/dashboard/groups/create"
            className="flex items-center gap-2 bg-[#F97316] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors"
          >
            <Plus size={16} />
            Create your first group
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
