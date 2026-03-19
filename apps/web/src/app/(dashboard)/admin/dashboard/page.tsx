'use client';

import Link from 'next/link';
import { Package, Users, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const ADMIN_CARDS = [
  {
    label: 'Menu Catalog',
    description: 'Add, edit and remove dishes',
    href: '/admin/menu-items',
    icon: Package,
    color: '#FFF7ED',
    iconColor: '#F97316',
  },
  {
    label: 'Groups',
    description: 'Manage all meal groups',
    href: '/admin/groups',
    icon: LayoutGrid,
    color: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    label: 'Users',
    description: 'Manage user accounts and roles',
    href: '/admin/users',
    icon: Users,
    color: '#F0FDF4',
    iconColor: '#16A34A',
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7ED] mb-3">
          <span className="text-xs font-semibold text-[#F97316]">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">
          Welcome, {user?.name || user?.email || 'Admin'}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your MealShare platform.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ADMIN_CARDS.map(({ label, description, href, icon: Icon, color, iconColor }) => (
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
