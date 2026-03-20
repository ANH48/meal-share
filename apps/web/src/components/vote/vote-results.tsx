'use client';

import { Trophy } from 'lucide-react';
import type { VoteResult } from '@/lib/api/votes';

interface VoteResultsProps {
  results: VoteResult[];
}

export function VoteResults({ results }: VoteResultsProps) {
  if (results.length === 0) {
    return <p className="text-sm text-[#94A3B8]">No results available.</p>;
  }

  const maxCount = Math.max(...results.map((r) => r.count));

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const isWinner = result.count === maxCount && maxCount > 0;
        return (
          <div key={result.optionId} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#1E293B]">
                  {result.menuItemName}
                </span>
                {isWinner && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#F97316]">
                    <Trophy size={11} />
                    Most voted
                  </span>
                )}
              </div>
              <span className="text-sm text-[#64748B]">
                {result.count} vote{result.count !== 1 ? 's' : ''} · {result.percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${result.percentage}%`,
                  backgroundColor: isWinner ? '#F97316' : '#CBD5E1',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
