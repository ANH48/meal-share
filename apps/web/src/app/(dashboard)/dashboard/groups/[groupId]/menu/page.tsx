'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { Calendar, Pencil, Plus, X } from 'lucide-react';
import { weeklyMenusApi, type WeeklyMenu } from '@/lib/api/weekly-menus';
import { groupsApi } from '@/lib/api/groups';
import { useAuthStore } from '@/stores/auth-store';
import { WeeklyMenuView } from '@/components/menu/weekly-menu-view';
import { WeeklyMenuBuilder } from '@/components/menu/weekly-menu-builder';
import { MealPlannerCalendar } from '@/components/menu/meal-planner-calendar';
import { getWeekStart } from '@meal-share/utils';
import { BackButton } from '@/components/ui/back-button';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDayLabel(d: Date) {
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type MenuMode = 'daily' | 'weekly';

export default function GroupMenuPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [memberCount, setMemberCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>('daily');
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    groupsApi.getById(groupId).then(({ data }) => {
      setIsLeader(data.leaderId === user?.id);
      setMemberCount(data._count?.members ?? data.members?.length);
    });
  }, [groupId, user?.id]);

  const fetchMenu = useCallback(async () => {
    if (!selectedDay) return;
    setLoading(true);
    try {
      const { data } = await weeklyMenusApi.getByGroupAndDate(groupId, toDateStr(selectedDay));
      setMenu(data ?? null);
      setShowBuilder(false);
    } catch {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, selectedDay ? toDateStr(selectedDay) : null]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  function handleSelectDay(day: Date) {
    setSelectedDay(day);
    setShowBuilder(false);
    setShowModeModal(false);
  }

  function handleAddMenu() {
    if (isDayInPast) return;
    if (menu) {
      setMenuMode(menu.menuDate ? 'daily' : 'weekly');
      setShowBuilder(true);
    } else {
      setShowModeModal(true);
    }
  }

  function handleSelectMode(mode: MenuMode) {
    setMenuMode(mode);
    setShowModeModal(false);
    setShowBuilder(true);
  }

  const isConfirmed = menu?.status === 'confirmed';
  const weekStart = selectedDay ? getWeekStart(selectedDay) : new Date();

  function isPastDay(d: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }
  const isDayInPast = selectedDay ? isPastDay(selectedDay) : false;

  return (
    <div className="p-8 max-w-5xl">
      <BackButton href={`/dashboard/groups/${groupId}`} label="Back to Group" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">Meal Planner</h1>
        <p className="text-sm text-[#64748B] mt-1">Organize your collective dining experience for the month.</p>
      </div>

      <div className="mb-8">
        <MealPlannerCalendar selectedDay={selectedDay} onSelectDay={handleSelectDay} />
      </div>

      {/* This Day's Menu */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-[#F97316]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">This Day&apos;s Menu</h2>
            <p className="text-xs text-[#94A3B8]">
              {selectedDay ? formatDayLabel(selectedDay) : 'Select a day on the calendar'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isConfirmed && !showBuilder && selectedDay && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                {menu?.menuType === 'daily' ? 'Daily · Confirmed' : 'Weekly · Confirmed'}
              </span>
            )}
            {isLeader && selectedDay && !showBuilder && !isDayInPast && (
              <button
                onClick={handleAddMenu}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#F97316] hover:text-[#F97316] transition-colors cursor-pointer"
              >
                {isConfirmed ? <Pencil size={12} /> : <Plus size={12} />}
                {menu ? 'Edit Menu' : 'Add Menu'}
              </button>
            )}
          </div>
        </div>

        {/* Menu type selection modal */}
        {showModeModal && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#1E293B]">Set menu for…</p>
              <button onClick={() => setShowModeModal(false)} className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectMode('daily')}
                className="flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors cursor-pointer text-left"
              >
                <span className="text-lg">📅</span>
                <span className="text-sm font-semibold text-[#1E293B]">This day only</span>
                <span className="text-xs text-[#94A3B8]">{selectedDay ? formatDayLabel(selectedDay) : ''}</span>
              </button>
              <button
                onClick={() => handleSelectMode('weekly')}
                className="flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors cursor-pointer text-left"
              >
                <span className="text-lg">🗓️</span>
                <span className="text-sm font-semibold text-[#1E293B]">Entire week</span>
                <span className="text-xs text-[#94A3B8]">Applies to Mon–Sun of this week</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!selectedDay ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] border-dashed p-12 text-center">
            <p className="text-sm text-[#94A3B8]">Click a day on the calendar to see the menu.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-[#F1F5F9] rounded-2xl animate-pulse" />)}
          </div>
        ) : showBuilder ? (
          <WeeklyMenuBuilder
            menu={menu}
            groupId={groupId}
            weekStart={weekStart}
            selectedDay={selectedDay}
            menuMode={menuMode}
            onConfirmed={fetchMenu}
          />
        ) : isConfirmed ? (
          <WeeklyMenuView menu={menu!} memberCount={memberCount} />
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] border-dashed p-12 text-center">
            <p className="text-sm text-[#94A3B8]">
              {isDayInPast
                ? 'This date is in the past. Menu cannot be created or edited.'
                : menu
                ? 'Menu is not confirmed yet.'
                : 'No menu set for this day yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
