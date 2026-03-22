'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Lock, LockOpen } from 'lucide-react';
import { groupsApi } from '@/lib/api/groups';
import { weeklyMenusApi } from '@/lib/api/weekly-menus';
import type { WeeklyMenu } from '@/lib/api/weekly-menus';
import { ordersApi, type DailyOrder, type GroupOrderUser } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/auth-store';
import { DailyOrderForm } from '@/components/orders/daily-order-form';
import { OrderSummary } from '@/components/orders/order-summary';
import { GroupOrdersTable } from '@/components/orders/group-orders-table';
import { getWeekStart, formatWeekLabel } from '@meal-share/utils';
import { BackButton } from '@/components/ui/back-button';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateLabel(d: Date) {
  return `${DAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function GroupOrdersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const [isLeader, setIsLeader] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [myOrders, setMyOrders] = useState<DailyOrder[]>([]);
  const [myWeeklyOrders, setMyWeeklyOrders] = useState<DailyOrder[]>([]);
  const [groupSummary, setGroupSummary] = useState<GroupOrderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDayLocked, setIsDayLocked] = useState(false);

  useEffect(() => {
    groupsApi.getById(groupId).then(({ data }) => {
      setIsLeader(data.leaderId === user?.id);
    });
  }, [groupId, user?.id]);

  const weekStr = toDateStr(weekStart);
  const dayStr = selectedDay ? toDateStr(selectedDay) : null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!dayStr) {
        const { data } = await ordersApi.getMyWeekly(groupId, weekStr).catch(() => ({ data: [] as DailyOrder[] }));
        setMenu(null);
        setMyOrders([]);
        setMyWeeklyOrders((data as DailyOrder[]) ?? []);
        return;
      }
      const [menuRes, myDailyRes, myWeeklyRes, lockRes] = await Promise.all([
        weeklyMenusApi.getByGroupAndDate(groupId, dayStr).catch(() => ({ data: null })),
        ordersApi.getMyDaily(groupId, dayStr).catch(() => ({ data: [] as DailyOrder[] })),
        ordersApi.getMyWeekly(groupId, weekStr).catch(() => ({ data: [] as DailyOrder[] })),
        weeklyMenusApi.getDayLock(groupId, dayStr).catch(() => ({ data: { isLocked: false } })),
      ]);
      setMenu((menuRes.data as WeeklyMenu | null) ?? null);
      setMyOrders((myDailyRes.data as DailyOrder[]) ?? []);
      setMyWeeklyOrders((myWeeklyRes.data as DailyOrder[]) ?? []);
      setIsDayLocked(lockRes.data?.isLocked ?? false);
    } finally {
      setLoading(false);
    }
  }, [groupId, dayStr, weekStr]);

  const fetchGroupSummary = useCallback(async () => {
    if (!isLeader || !dayStr) {
      setGroupSummary([]);
      return;
    }
    try {
      const { data } = await ordersApi.getGroupDaily(groupId, dayStr);
      const flat = (data ?? []) as import('@/lib/api/orders').DailyOrder[];
      const byUser = flat.reduce<Record<string, import('@/lib/api/orders').GroupOrderUser>>((acc, o) => {
        const uid = o.userId;
        if (!acc[uid]) {
          acc[uid] = { user: o.user ?? { id: uid, name: uid, email: uid }, orders: [], total: 0 };
        }
        acc[uid].orders.push(o);
        acc[uid].total += Number(o.totalPrice);
        return acc;
      }, {});
      setGroupSummary(Object.values(byUser));
    } catch {
      setGroupSummary([]);
    }
  }, [groupId, dayStr, isLeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchGroupSummary();
  }, [fetchGroupSummary]);

  function handleOrdersChange(orders: DailyOrder[]) {
    setMyOrders(orders);
    ordersApi.getMyWeekly(groupId, weekStr).then(({ data }) => setMyWeeklyOrders(data));
    if (isLeader) fetchGroupSummary();
  }

  function prevWeek() {
    setSelectedDay(null);
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setSelectedDay(null);
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }

  const weekDays = getWeekDays(weekStart);
  const confirmedMenu = menu?.status === 'confirmed' ? menu : null;

  async function handleToggleLock() {
    if (!confirmedMenu) return;
    const { data } = await weeklyMenusApi.setDayLock(groupId, dayStr, !isDayLocked);
    setIsDayLocked(data.isLocked);
  }

  return (
    <div className="p-8">
      <BackButton href={`/dashboard/groups/${groupId}`} label="Back to Group" />
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevWeek}
          className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-[#1E293B]">{formatWeekLabel(weekStart)}</span>
        <button
          onClick={nextWeek}
          className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const ds = toDateStr(d);
          const isSelected = ds === dayStr;
          const hasOrders = myWeeklyOrders.some((o) => o.date.split('T')[0] === ds);
          return (
            <button
              key={ds}
              onClick={() => setSelectedDay(d)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'border-[#F97316] bg-[#FFF7ED] text-[#F97316]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#F97316] hover:text-[#F97316]'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {DAY_LABELS[(d.getDay() + 6) % 7]}
              </span>
              <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
              {hasOrders && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-[#F97316]' : 'bg-[#94A3B8]'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!selectedDay ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 flex flex-col items-center justify-center text-center gap-2">
              <Calendar size={28} className="text-[#CBD5E1] mb-1" />
              <p className="text-sm font-semibold text-[#1E293B]">You need to select a day</p>
              <p className="text-xs text-[#94A3B8]">Pick a day above to view or place your order.</p>
            </div>
          ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#F97316]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">
                  Order for {formatDateLabel(selectedDay)}
                </h3>
                {isDayLocked && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                    <Lock size={10} />
                    Locked
                  </span>
                )}
              </div>
              {isLeader && confirmedMenu && (
                <button
                  onClick={handleToggleLock}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDayLocked
                      ? 'border-green-200 text-green-600 hover:bg-green-50'
                      : 'border-red-200 text-red-500 hover:bg-red-50'
                  }`}
                >
                  {isDayLocked ? <LockOpen size={12} /> : <Lock size={12} />}
                  {isDayLocked ? 'Unlock Orders' : 'Lock Orders'}
                </button>
              )}
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[#F1F5F9] rounded-lg" />
                ))}
              </div>
            ) : !confirmedMenu ? (
              <p className="text-sm text-[#94A3B8] text-center py-4">
                No confirmed menu for this day. Ask your group leader to set up the menu first.
              </p>
            ) : !confirmedMenu.items || confirmedMenu.items.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-4">No menu items available.</p>
            ) : (
              <DailyOrderForm
                menu={confirmedMenu}
                groupId={groupId}
                date={dayStr!}
                existingOrders={myOrders.filter((o) => o.date.split('T')[0] === dayStr)}
                onOrdersChange={handleOrdersChange}
                onRefetch={fetchData}
                isLocked={isDayLocked}
              />
            )}
          </div>
          )}
        </div>

        <div>
          <OrderSummary orders={myWeeklyOrders} selectedDay={selectedDay} />
        </div>
      </div>

      {isLeader && (
        <div className="mt-6">
          <GroupOrdersTable summary={groupSummary} selectedDay={selectedDay} />
        </div>
      )}
    </div>
  );
}
