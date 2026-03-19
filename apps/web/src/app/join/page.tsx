'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { groupsApi } from '@/lib/api/groups';
import { useAuthStore } from '@/stores/auth-store';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/join?code=${encodeURIComponent(code)}`);
      return;
    }

    if (!code) {
      setError('No invite code provided.');
      return;
    }

    setJoining(true);
    groupsApi
      .join(code)
      .then(({ data }) => {
        router.replace(`/dashboard/groups/${data.id}`);
      })
      .catch((err) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg ?? 'Invalid or expired invite code.');
        setJoining(false);
      });
  }, [isAuthenticated, code, router]);

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] text-sm">Joining group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 max-w-sm w-full text-center">
          <div className="text-3xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-[#1E293B] mb-2">Unable to Join</h2>
          <p className="text-[#64748B] text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/groups')}
            className="w-full bg-[#F97316] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#EA6A00] transition-colors"
          >
            Go to My Groups
          </button>
        </div>
      </div>
    );
  }

  return null;
}
