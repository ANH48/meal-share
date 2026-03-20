import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PersonalAnalytics } from '@/lib/api/analytics';

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + '₫';
}

interface Props {
  data: PersonalAnalytics;
  period: 'weekly' | 'monthly';
}

export function PersonalSummaryCard({ data, period }: Props) {
  const label = period === 'weekly' ? 'This Week' : 'This Month';
  const vs = data.vsLastPeriod;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Total spend */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-xs text-[#94A3B8] font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#1E293B]">{formatVND(data.totalSpend)}</p>
        <p className="text-xs text-[#94A3B8] mt-1">{data.ordersCount} orders</p>
      </div>

      {/* Daily average */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-xs text-[#94A3B8] font-medium mb-1">Daily Average</p>
        <p className="text-2xl font-bold text-[#1E293B]">{formatVND(data.dailyAverage)}</p>
        <p className="text-xs text-[#94A3B8] mt-1">per day</p>
      </div>

      {/* vs last period */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-xs text-[#94A3B8] font-medium mb-1">vs Last {period === 'weekly' ? 'Week' : 'Month'}</p>
        {vs === null ? (
          <>
            <div className="flex items-center gap-1">
              <Minus size={18} className="text-[#94A3B8]" />
              <p className="text-2xl font-bold text-[#94A3B8]">—</p>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">No prior data</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {vs > 0 ? (
                <TrendingUp size={18} className="text-[#EF4444]" />
              ) : vs < 0 ? (
                <TrendingDown size={18} className="text-[#10B981]" />
              ) : (
                <Minus size={18} className="text-[#94A3B8]" />
              )}
              <p className={`text-2xl font-bold ${vs > 0 ? 'text-[#EF4444]' : vs < 0 ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                {vs > 0 ? '+' : ''}{vs.toFixed(1)}%
              </p>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">{vs > 0 ? 'More than before' : vs < 0 ? 'Less than before' : 'Same as before'}</p>
          </>
        )}
      </div>
    </div>
  );
}
