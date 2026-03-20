'use client';

import type { WeeklyMenu } from '@/lib/api/weekly-menus';

interface WeeklyMenuViewProps {
  menu: WeeklyMenu;
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num.toLocaleString('vi-VN') + ' đ';
}

const CATEGORY_COLORS: Record<string, string> = {
  main: 'bg-orange-100 text-orange-700',
  side: 'bg-blue-100 text-blue-700',
  drink: 'bg-green-100 text-green-700',
  dessert: 'bg-pink-100 text-pink-700',
};

export function WeeklyMenuView({ menu }: WeeklyMenuViewProps) {
  const items = menu.items ?? [];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1E293B]">This Week&apos;s Menu</h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            menu.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {menu.status === 'confirmed' ? 'Confirmed' : 'Draft'}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">No dishes added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const dish = item.menuItem;
            const categoryColor =
              dish?.category && CATEGORY_COLORS[dish.category.toLowerCase()]
                ? CATEGORY_COLORS[dish.category.toLowerCase()]
                : 'bg-slate-100 text-slate-600';

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-[#F1F5F9] last:border-0"
              >
                {dish?.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                    <span className="text-[#94A3B8] text-xs font-bold">
                      {dish?.name?.slice(0, 2).toUpperCase() ?? '??'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">
                    {dish?.name ?? 'Unknown dish'}
                  </p>
                  {dish?.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                      {dish.category}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-[#F97316] shrink-0">
                  {formatPrice(item.price)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
