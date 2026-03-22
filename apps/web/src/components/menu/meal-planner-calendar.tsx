'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekStart } from '@meal-share/utils';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function inSelectedWeek(day: Date, weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return day >= weekStart && day <= end;
}

interface Props {
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}

export function MealPlannerCalendar({ selectedDay, onSelectDay }: Props) {
  const [view, setView] = useState(() => selectedDay ? new Date(selectedDay) : new Date());

  function prevMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1)); }
  function nextMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1)); }

  const cells = getMonthCells(view.getFullYear(), view.getMonth());
  const selectedWeekStart = selectedDay ? getWeekStart(selectedDay) : null;

  function isSameDay(a: Date, b: Date) {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#1E293B]">
          {MONTH_NAMES[view.getMonth()]} {view.getFullYear()}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer">
            <ChevronLeft size={15} />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#94A3B8] tracking-wide py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-14" />;
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const today = isToday(day);
          const inWeek = selectedWeekStart ? inSelectedWeek(day, selectedWeekStart) : false;
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`relative flex items-center justify-center h-14 text-sm font-medium transition-colors cursor-pointer rounded-xl ${
                inWeek ? 'bg-[#FFF7ED]' : 'hover:bg-[#F8FAFC]'
              } ${isSelected || today ? 'text-[#F97316]' : inWeek ? 'text-[#F97316]' : 'text-[#475569]'}`}
            >
              <span className={isSelected ? 'w-7 h-7 flex items-center justify-center rounded-full bg-[#F97316] text-white font-bold text-sm' : ''}>
                {day.getDate()}
              </span>
              {today && !isSelected && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#F97316]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
