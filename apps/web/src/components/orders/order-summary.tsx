'use client';

import type { DailyOrder } from '@/lib/api/orders';

interface Props {
  orders: DailyOrder[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}`;
}

export function OrderSummary({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
        <p className="text-sm text-[#94A3B8]">No orders this week yet.</p>
      </div>
    );
  }

  const byDate = orders.reduce(
    (acc, o) => {
      const d = o.date.split('T')[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push(o);
      return acc;
    },
    {} as Record<string, DailyOrder[]>,
  );

  const weekTotal = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1E293B]">Weekly Summary</h3>
      </div>
      <div className="divide-y divide-[#E2E8F0]">
        {Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dayOrders]) => {
            const dayTotal = dayOrders.reduce((s, o) => s + Number(o.totalPrice), 0);
            return (
              <div key={date} className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    {formatDate(date)}
                  </span>
                  <span className="text-xs font-bold text-[#F97316]">{formatVND(dayTotal)}</span>
                </div>
                <div className="space-y-1">
                  {dayOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#475569]">
                        {o.weeklyMenuItem.menuItem.name}
                        {o.quantity > 1 && (
                          <span className="text-[#94A3B8] ml-1">×{o.quantity}</span>
                        )}
                      </span>
                      <span className="text-[#64748B]">{formatVND(Number(o.totalPrice))}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
      <div className="px-5 py-3 bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E293B]">Week Total</span>
        <span className="text-sm font-bold text-[#F97316]">{formatVND(weekTotal)}</span>
      </div>
    </div>
  );
}
