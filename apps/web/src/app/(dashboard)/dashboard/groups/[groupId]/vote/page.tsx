'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { votesApi, type Vote, type VoteResult } from '@/lib/api/votes';
import { groupsApi } from '@/lib/api/groups';
import { useAuthStore } from '@/stores/auth-store';
import { VoteCard } from '@/components/vote/vote-card';
import { VoteResults } from '@/components/vote/vote-results';
import { CreateVoteForm } from '@/components/vote/create-vote-form';

export default function GroupVotePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultsMap, setResultsMap] = useState<Record<string, VoteResult[]>>({});

  useEffect(() => {
    groupsApi.getById(groupId).then(({ data }) => {
      setIsLeader(data.leaderId === user?.id);
    });
  }, [groupId, user?.id]);

  const fetchVotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await votesApi.list(groupId);
      setVotes(data);

      const closedVotes = data.filter((v) => v.status !== 'open');
      const resultsEntries = await Promise.all(
        closedVotes.map(async (v) => {
          try {
            const { data: r } = await votesApi.getResults(v.id);
            return [v.id, r] as [string, VoteResult[]];
          } catch {
            return [v.id, []] as [string, VoteResult[]];
          }
        })
      );
      setResultsMap(Object.fromEntries(resultsEntries));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const openVotes = votes.filter((v) => v.status === 'open');
  const closedVotes = votes.filter((v) => v.status !== 'open');

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1E293B]">Votes</h2>
        {isLeader && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Create Vote
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-[#F1F5F9] rounded-xl" />
          <div className="h-40 bg-[#F1F5F9] rounded-xl" />
        </div>
      ) : (
        <>
          {openVotes.length > 0 && (
            <div className="space-y-4 mb-6">
              {openVotes.map((vote) => (
                <VoteCard key={vote.id} vote={vote} onVoted={fetchVotes} />
              ))}
            </div>
          )}

          {closedVotes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                Closed Votes
              </h3>
              {closedVotes.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5"
                >
                  <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
                    {vote.title}
                  </h4>
                  <VoteResults results={resultsMap[vote.id] ?? []} />
                </div>
              ))}
            </div>
          )}

          {votes.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <p className="text-sm text-[#94A3B8]">No votes yet.</p>
              {isLeader && (
                <p className="text-xs text-[#94A3B8] mt-1">
                  Create a vote to let the group decide this week&apos;s menu.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <CreateVoteForm
          groupId={groupId}
          onCreated={fetchVotes}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
