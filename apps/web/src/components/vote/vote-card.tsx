'use client';

import { useState } from 'react';
import { Timer, Check } from 'lucide-react';
import { votesApi, type Vote } from '@/lib/api/votes';

interface VoteCardProps {
  vote: Vote;
  onVoted: () => void;
}

function getTimeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function VoteCard({ vote, onVoted }: VoteCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    vote.userResponse?.voteOptionId ?? null
  );
  const [hasVoted, setHasVoted] = useState(!!vote.userResponse);
  const [submitting, setSubmitting] = useState(false);

  const options = vote.options ?? [];
  const totalVotes = options.reduce((sum, o) => sum + (o._count?.responses ?? 0), 0);
  const isOpen = vote.status === 'open' && new Date(vote.endsAt) > new Date();

  async function handleCastVote() {
    if (!selectedOptionId || submitting) return;
    setSubmitting(true);
    try {
      await votesApi.respond(vote.id, selectedOptionId);
      setHasVoted(true);
      onVoted();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-[#1E293B]">{vote.title}</h4>
        {isOpen && (
          <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FFF3CD] text-[#92600A]">
            <Timer size={12} />
            Closes in {getTimeLeft(vote.endsAt)}
          </span>
        )}
        {!isOpen && (
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#64748B]">
            Closed
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {options.map((option) => {
          const count = option._count?.responses ?? 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !hasVoted && isOpen && setSelectedOptionId(option.id)}
              disabled={hasVoted || !isOpen}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#F97316]'
                  : 'border-[#E2E8F0]'
              } disabled:cursor-default`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#F97316] bg-[#F97316]'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium text-[#1E293B] flex-1">
                  {option.menuItem?.name ?? 'Option'}
                </span>
                <span className="text-xs text-[#64748B]">
                  {count} vote{count !== 1 ? 's' : ''} · {percentage}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: isSelected ? '#FFE5C2' : '#F2F3F0' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isSelected ? '#F97316' : '#CBD5E1',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted ? (
        <div className="h-11 flex items-center justify-center gap-2 text-sm text-[#64748B] bg-[#F8FAFC] rounded-lg">
          <Check size={16} className="text-green-500" />
          You voted!
        </div>
      ) : isOpen ? (
        <button
          onClick={handleCastVote}
          disabled={!selectedOptionId || submitting}
          className="w-full h-11 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={16} />
          {submitting ? 'Submitting...' : 'Cast My Vote'}
        </button>
      ) : null}
    </div>
  );
}
