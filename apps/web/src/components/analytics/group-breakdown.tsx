'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { GroupBreakdown } from '@/lib/api/analytics';

const COLORS = ['#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + '₫';
}

interface Props {
  data: GroupBreakdown;
}

export function GroupBreakdownView({ data }: Props) {
  if (data.members.length === 0) {
    return <p className="text-sm text-[#94A3B8] py-4">No orders this week.</p>;
  }

  const pieData = data.members.map((m) => ({ name: m.name, value: m.total }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4">
        <p className="text-xs text-[#94A3B8] mb-1">Week Total</p>
        <p className="text-2xl font-bold text-[#F97316]">{formatVND(data.groupTotal)}</p>
        <p className="text-xs text-[#64748B] mt-1">{data.memberCount} members · {data.totalOrders} orders</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Donut chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => formatVND(Number(val))}
                contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {data.members.map((m, i) => (
              <div key={m.userId} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-[#64748B]">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member breakdown table */}
        <div className="space-y-2">
          {data.members.map((m, i) => (
            <div key={m.userId} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#1E293B] truncate">{m.name}</span>
                  <span className="text-sm font-semibold text-[#1E293B] ml-2">{formatVND(m.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-1 bg-[#F1F5F9] rounded-full flex-1 mr-2 overflow-hidden mt-1">
                    <div className="h-full rounded-full" style={{ width: `${m.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-xs text-[#94A3B8] shrink-0">{m.percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
