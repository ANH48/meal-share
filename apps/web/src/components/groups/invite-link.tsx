'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface InviteLinkProps {
  inviteCode: string;
}

export function InviteLink({ inviteCode }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${inviteCode}`
      : `/join?code=${inviteCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Invite Link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 overflow-hidden">
          <p className="font-mono text-sm text-[#1E293B] truncate">{fullUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#64748B] hover:border-[#F97316] hover:text-[#F97316] transition-colors shrink-0"
          aria-label="Copy invite link"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <p className="text-xs text-[#94A3B8]">
        Share this link to invite people to your group
      </p>
    </div>
  );
}
