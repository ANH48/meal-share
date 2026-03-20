import { Info } from 'lucide-react';
import type { Message } from '@/lib/api/messages';

interface Props {
  message: Message;
}

export function SystemMessage({ message }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <div className="flex items-center gap-1.5 bg-[#F1F5F9] rounded-full px-3 py-1">
        <Info size={11} className="text-[#94A3B8]" />
        <span className="text-xs text-[#64748B]">{message.content}</span>
      </div>
    </div>
  );
}
