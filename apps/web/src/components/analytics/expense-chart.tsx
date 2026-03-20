'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  amount: number;
}

function formatVND(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k₫';
  return n + '₫';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

interface Props {
  data: DataPoint[];
}

export function ExpenseChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-sm text-[#94A3B8]">
        No expense data for this period
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatVND}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(val) => [new Intl.NumberFormat('vi-VN').format(Number(val)) + '₫', 'Spend']}
          labelStyle={{ color: '#1E293B', fontSize: 12 }}
          contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#F97316"
          strokeWidth={2}
          dot={{ fill: '#F97316', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
