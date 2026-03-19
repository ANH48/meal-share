'use client';

import Link from 'next/link';
import { LayoutGrid, Compass, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const USER_CARDS = [
  {
    label: 'My Groups',
    description: 'View and manage your meal groups',
    href: '/dashboard/groups',
    icon: LayoutGrid,
    color: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    label: 'Discover',
    description: 'Find new groups to join',
    href: '/dashboard/discover',
    icon: Compass,
    color: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    label: 'Invitations',
    description: 'Pending invitations from groups',
    href: '/dashboard/invitations',
    icon: Mail,
    color: '#FFF7ED',
    iconColor: '#F97316',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">
          Welcome back, {user?.name || user?.email || 'there'}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Here&apos;s what you can do today.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {USER_CARDS.map(({ label, description, href, icon: Icon, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-[#E2E8F0] bg-white p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: color }}
            >
              <Icon size={20} style={{ color: iconColor }} />
            </div>
            <p className="font-semibold text-[#1E293B] text-sm">{label}</p>
            <p className="text-xs text-[#64748B] mt-1">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
