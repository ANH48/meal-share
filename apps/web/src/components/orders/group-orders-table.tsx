'use client';

import type { GroupOrderUser } from '@/lib/api/orders';

interface Props {
  summary: GroupOrderUser[];
  selectedDay: Date | null;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B'];

function avatarColor(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export function GroupOrdersTable({ summary, selectedDay }: Props) {
  if (!selectedDay) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
        <p className="text-sm text-[#94A3B8]">Select a day to see group orders.</p>
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
        <p className="text-sm text-[#94A3B8]">No orders from any member yet.</p>
      </div>
    );
  }

  const groupTotal = summary.reduce((s, u) => s + u.total, 0);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1E293B]">
          Group Orders <span className="text-[#94A3B8] font-normal">({summary.length} members)</span>
        </h3>
        <span className="text-sm font-bold text-[#F97316]">{formatVND(groupTotal)}</span>
      </div>
      <div className="divide-y divide-[#E2E8F0]">
        {summary.map(({ user, orders, total }) => (
          <div key={user.id} className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(user.name ?? user.email) }}
                >
                  {getInitials(user.name ?? user.email)}
                </div>
                <span className="text-sm font-medium text-[#1E293B]">{user.name || user.email}</span>
              </div>
              <span className="text-sm font-bold text-[#F97316]">{formatVND(total)}</span>
            </div>
            <div className="ml-9 space-y-1">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">
                    {o.weeklyMenuItem.menuItem.name}
                    {o.quantity > 1 && <span className="text-[#94A3B8] ml-1">×{o.quantity}</span>}
                  </span>
                  <span className="text-[#94A3B8]">{formatVND(Number(o.totalPrice))}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
