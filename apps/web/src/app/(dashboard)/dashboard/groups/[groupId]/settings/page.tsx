'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { groupsApi, type Group } from '@/lib/api/groups';
import { MemberList } from '@/components/groups/member-list';
import { InviteLink } from '@/components/groups/invite-link';
import { GroupDishesManager } from '@/components/groups/group-dishes-manager';
import { BackButton } from '@/components/ui/back-button';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    groupsApi.getById(groupId)
      .then(({ data }) => {
        setGroup(data);
        reset({ name: data.name, description: data.description ?? '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId, reset]);

  if (loading) {
    return <div className="p-8 animate-pulse"><div className="h-8 bg-[#F1F5F9] rounded w-48" /></div>;
  }

  if (!group) return <div className="p-8 text-[#64748B]">Group not found.</div>;

  if (group.leaderId !== user?.id) {
    router.replace(`/dashboard/groups/${groupId}`);
    return null;
  }

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await groupsApi.update(groupId, values);
      setGroup((prev) => prev ? { ...prev, ...data } : prev);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setServerError('Failed to save changes.');
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const { data } = await groupsApi.regenerateInvite(groupId);
      setGroup((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : prev);
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  }

  function handleRemoveMember(userId: string) {
    groupsApi.removeMember(groupId, userId).then(() => {
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.filter((m) => m.userId !== userId),
              _count: { members: (prev._count?.members ?? 1) - 1 },
            }
          : prev,
      );
    });
  }

  return (
    <div className="p-8">
      <div className="max-w-[640px] mx-auto space-y-6">
        <BackButton href={`/dashboard/groups/${groupId}`} label="Back to Group" />
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">Group Settings</h1>

        {/* Edit form */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Group Details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Name</label>
              <input
                {...register('name')}
                className="w-full h-11 px-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#F97316] transition-colors"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#F97316] transition-colors resize-none"
              />
            </div>
            {serverError && <p className="text-red-500 text-xs">{serverError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#F97316] text-white h-11 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors disabled:opacity-60"
              >
                {saveSuccess ? 'Saved!' : isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/dashboard/groups/${groupId}`}
                className="flex-1 text-center border border-[#E2E8F0] text-[#64748B] h-11 rounded-lg text-sm font-medium hover:bg-[#F8FAFC] transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Invite code */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1E293B]">Invite Link</h2>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#F97316] border border-[#E2E8F0] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
          </div>
          <InviteLink inviteCode={group.inviteCode} />
        </div>

        {/* Group Dishes */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Group Dishes</h2>
          <p className="text-xs text-[#94A3B8] mb-4">Manage dishes specific to this group. Members can order these in the weekly menu.</p>
          <GroupDishesManager groupId={groupId} />
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Members</h2>
          <MemberList
            members={group.members ?? []}
            currentUserId={user?.id}
            isLeader
            onRemove={handleRemoveMember}
          />
        </div>
      </div>
    </div>
  );
}
