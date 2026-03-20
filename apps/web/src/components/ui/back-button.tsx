'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  href: string;
  label?: string;
}

export function BackButton({ href, label = 'Back' }: Props) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer mb-5"
    >
      <ArrowLeft size={15} />
      <span>{label}</span>
    </button>
  );
}
