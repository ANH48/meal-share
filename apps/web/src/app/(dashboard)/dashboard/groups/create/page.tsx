'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { groupsApi, type Group } from '@/lib/api/groups';
import { InviteLink } from '@/components/groups/invite-link';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateGroupPage() {
  const router = useRouter();
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await groupsApi.create(values);
      setCreatedGroup(data);
    } catch {
      setServerError('Failed to create group. Please try again.');
    }
  }

  if (createdGroup) {
    return (
      <div className="p-8">
        <div className="max-w-[640px] mx-auto">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1E293B] font-mono mb-2">
              Group Created!
            </h2>
            <p className="text-[#64748B] text-sm mb-6">
              Your group <span className="font-semibold text-[#1E293B]">{createdGroup.name}</span> is ready.
            </p>
            <div className="text-left mb-6">
              <InviteLink inviteCode={createdGroup.inviteCode} />
            </div>
            <button
              onClick={() => router.push(`/dashboard/groups/${createdGroup.id}`)}
              className="w-full bg-[#F97316] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors"
            >
              View Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-[640px] mx-auto">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
          <h1 className="text-2xl font-bold text-[#1E293B] font-mono mb-6">
            Create New Group
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Office Lunch Group"
                className="w-full h-11 px-3 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#F97316] transition-colors"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Optional description for the group"
                rows={3}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#F97316] transition-colors resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-sm">{serverError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#F97316] text-white h-11 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
              <Link
                href="/dashboard/groups"
                className="flex-1 text-center border border-[#E2E8F0] text-[#64748B] h-11 rounded-lg text-sm font-medium hover:bg-[#F8FAFC] transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
