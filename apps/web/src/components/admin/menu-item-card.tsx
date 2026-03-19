'use client';

import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import type { MenuItem } from '@/lib/api/menu-items';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'Com': { bg: '#DCFCE7', text: '#16A34A', label: 'Com/Rice' },
  'Bun': { bg: '#DBEAFE', text: '#2563EB', label: 'Bun/Noodles' },
  'Canh': { bg: '#FED7AA', text: '#EA580C', label: 'Canh/Soup' },
  'Khai vi': { bg: '#F3E8FF', text: '#7C3AED', label: 'Khai vi/Appetizer' },
  'Do uong': { bg: '#FEF3C7', text: '#D97706', label: 'Do uong/Beverage' },
};

const DEFAULT_CATEGORY = { bg: '#F1F5F9', text: '#64748B', label: '' };

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  const catStyle = item.category
    ? (CATEGORY_STYLES[item.category] ?? DEFAULT_CATEGORY)
    : DEFAULT_CATEGORY;

  return (
    <tr className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
      {/* Dish Name */}
      <td className="px-4 py-3 w-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F1F5F9] shrink-0">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#CBD5E1] text-lg">
                🍽
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-[#1E293B] line-clamp-2">{item.name}</span>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 w-36">
        {item.category ? (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
          >
            {catStyle.label || item.category}
          </span>
        ) : (
          <span className="text-xs text-[#94A3B8]">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-md text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-md text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
