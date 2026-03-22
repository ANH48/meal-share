'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  Package,
  LayoutGrid,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';

const ADMIN_NAV = [
  { label: 'Menu Catalog', href: '/admin/menu-items', icon: Package },
  { label: 'Groups', href: '/admin/groups', icon: LayoutGrid },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const USER_NAV = [
  { label: 'My Groups', href: '/dashboard/groups', icon: LayoutGrid },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user?.name) {
      api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => {});
    }
  }, [hydrated, isAuthenticated, router, user?.name, setUser]);

  if (!hydrated) return null;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-[#E2E8F0] h-screen sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F97316' }}>
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="font-bold text-[#1E293B] text-[15px] font-mono flex-1">MealShare</span>
          <NotificationBell />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#FFF7ED] text-[#F97316]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]',
                )}
              >
                <Icon size={16} className={active ? 'text-[#F97316]' : 'text-[#94A3B8]'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B] truncate">{user?.name || user?.email || 'User'}</p>
              <p className="text-xs text-[#94A3B8] truncate">{user?.email ?? ''}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-[#64748B] transition-colors w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC]"
                aria-label="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
