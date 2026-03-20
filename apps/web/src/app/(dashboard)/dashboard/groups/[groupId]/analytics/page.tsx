'use client';

import { use, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { analyticsApi, type PersonalAnalytics, type GroupBreakdown, type TopDishesResponse } from '@/lib/api/analytics';
import { PersonalSummaryCard } from '@/components/analytics/personal-summary-card';
import { ExpenseChart } from '@/components/analytics/expense-chart';
import { TopDishes } from '@/components/analytics/top-dishes';
import { GroupBreakdownView } from '@/components/analytics/group-breakdown';
import { BackButton } from '@/components/ui/back-button';

type Period = 'weekly' | 'monthly';
type Tab = 'personal' | 'group';

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d.toISOString().split('T')[0];
}

export default function AnalyticsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('personal');
  const [period, setPeriod] = useState<Period>('weekly');
  const [personal, setPersonal] = useState<PersonalAnalytics | null>(null);
  const [topDishes, setTopDishes] = useState<TopDishesResponse | null>(null);
  const [groupData, setGroupData] = useState<GroupBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    if (tab === 'personal') {
      Promise.all([
        analyticsApi.getPersonal(groupId, period),
        analyticsApi.getTopDishes(groupId),
      ]).then(([{ data: p }, { data: t }]) => {
        setPersonal(p);
        setTopDishes(t);
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      analyticsApi.getGroupBreakdown(groupId, getWeekStart())
        .then(({ data }) => setGroupData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [groupId, tab, period, user]);

  return (
    <div className="p-8 space-y-6">
      <BackButton href={`/dashboard/groups/${groupId}`} label="Back to Group" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E293B]">Analytics</h2>

        {/* Tab switch */}
        <div className="flex bg-[#F1F5F9] rounded-lg p-1 gap-1">
          {(['personal', 'group'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer capitalize ${
                tab === t ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'personal' && (
        <>
          {/* Period selector */}
          <div className="flex gap-2">
            {(['weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer capitalize ${
                  period === p
                    ? 'border-[#F97316] text-[#F97316] bg-[#FFF7ED]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#F97316]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">{[0,1,2].map((i) => <div key={i} className="h-24 bg-[#F1F5F9] rounded-xl animate-pulse" />)}</div>
              <div className="h-64 bg-[#F1F5F9] rounded-xl animate-pulse" />
            </div>
          ) : personal ? (
            <>
              <PersonalSummaryCard data={personal} period={period} />

              {/* Expense trend chart */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Expense Trend</h3>
                <ExpenseChart data={personal.trend} />
              </div>

              {/* Top dishes */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Top Dishes</h3>
                <TopDishes dishes={topDishes?.dishes ?? []} />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <p className="text-sm text-[#94A3B8]">No data available for this period.</p>
            </div>
          )}
        </>
      )}

      {tab === 'group' && (
        <>
          {loading ? (
            <div className="h-64 bg-[#F1F5F9] rounded-xl animate-pulse" />
          ) : groupData ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-sm font-semibold text-[#1E293B] mb-4">This Week&apos;s Breakdown</h3>
              <GroupBreakdownView data={groupData} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <p className="text-sm text-[#94A3B8]">No group order data for this week.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
