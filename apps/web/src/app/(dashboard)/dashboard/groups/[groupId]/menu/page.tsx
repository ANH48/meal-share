'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { weeklyMenusApi, type WeeklyMenu } from '@/lib/api/weekly-menus';
import { groupsApi } from '@/lib/api/groups';
import { useAuthStore } from '@/stores/auth-store';
import { WeeklyMenuView } from '@/components/menu/weekly-menu-view';
import { WeeklyMenuBuilder } from '@/components/menu/weekly-menu-builder';
import { getWeekStart, formatWeekLabel } from '@meal-share/utils';

export default function GroupMenuPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart());
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsApi.getById(groupId).then(({ data }) => {
      setIsLeader(data.leaderId === user?.id);
    });
  }, [groupId, user?.id]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const weekStr = weekStart.toISOString().split('T')[0];
      const { data } = await weeklyMenusApi.getByGroupAndWeek(groupId, weekStr);
      setMenu(data ?? null);
    } catch {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, weekStart]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  function prevWeek() {
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Week selector */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevWeek}
          className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1E293B]">
            {formatWeekLabel(weekStart)}
          </span>
          {menu && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                menu.status === 'confirmed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {menu.status === 'confirmed' ? 'Confirmed' : 'Draft'}
            </span>
          )}
        </div>
        <button
          onClick={nextWeek}
          className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-[#F1F5F9] rounded-lg" />
          <div className="h-12 bg-[#F1F5F9] rounded-lg" />
          <div className="h-12 bg-[#F1F5F9] rounded-lg" />
        </div>
      ) : isLeader && menu?.status !== 'confirmed' ? (
        <WeeklyMenuBuilder
          menu={menu}
          groupId={groupId}
          weekStart={weekStart}
          onConfirmed={fetchMenu}
        />
      ) : menu ? (
        <WeeklyMenuView menu={menu} />
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
          <p className="text-sm text-[#94A3B8]">No menu set for this week yet.</p>
        </div>
      )}
    </div>
  );
}
