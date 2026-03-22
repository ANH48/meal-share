'use client';

import { UtensilsCrossed } from 'lucide-react';
import type { WeeklyMenu, WeeklyMenuItem } from '@/lib/api/weekly-menus';

interface WeeklyMenuViewProps {
  menu: WeeklyMenu;
  memberCount?: number;
}

function formatPrice(price: string): string {
  return parseFloat(price).toLocaleString('vi-VN') + ' đ';
}

const CATEGORY_COLORS: Record<string, string> = {
  main:    'bg-orange-100 text-orange-700',
  side:    'bg-blue-100 text-blue-700',
  drink:   'bg-green-100 text-green-700',
  dessert: 'bg-pink-100 text-pink-700',
  noodle:  'bg-yellow-100 text-yellow-700',
  rice:    'bg-lime-100 text-lime-700',
};

function categoryColor(cat?: string | null) {
  if (!cat) return 'bg-slate-100 text-slate-600';
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
}

function MealCard({ item, status }: { item: WeeklyMenuItem; status: string }) {
  const dish = item.menuItem;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 bg-[#F1F5F9]">
        {dish?.imageUrl ? (
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF7ED] to-[#FEE4C4]">
            <UtensilsCrossed size={32} className="text-[#F97316] opacity-60" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-[#F97316] text-white'
          }`}>
            {status === 'confirmed' ? 'Confirmed' : 'Pending'}
          </span>
          {dish?.category && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-[#475569]">
              {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-[#1E293B] leading-tight">{dish?.name ?? 'Unknown dish'}</h3>
          <span className="text-sm font-bold text-[#F97316] shrink-0">{formatPrice(item.price)}</span>
        </div>

        {dish?.category && (
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide ${categoryColor(dish.category)}`}>
            {dish.category}
          </span>
        )}
      </div>
    </div>
  );
}

export function WeeklyMenuView({ menu, memberCount }: WeeklyMenuViewProps) {
  const items = menu.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
        <UtensilsCrossed size={32} className="text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-sm text-[#94A3B8]">No dishes added to this week&apos;s menu yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748B]">
          <span className="font-semibold text-[#1E293B]">{items.length}</span> meal{items.length !== 1 ? 's' : ''} scheduled
          {memberCount ? ` · ${memberCount} member${memberCount !== 1 ? 's' : ''}` : ''}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MealCard key={item.id} item={item} status={menu.status} />
        ))}
      </div>
    </div>
  );
}
