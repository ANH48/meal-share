'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import type { WeeklyMenu } from '@/lib/api/weekly-menus';
import { ordersApi, type DailyOrder } from '@/lib/api/orders';

interface Props {
  menu: WeeklyMenu;
  groupId: string;
  date: string;
  existingOrders: DailyOrder[];
  onOrdersChange: (orders: DailyOrder[]) => void;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function DailyOrderForm({ menu, groupId, date, existingOrders, onOrdersChange }: Props) {
  const [saving, setSaving] = useState<string | null>(null);

  const getOrder = (weeklyMenuItemId: string) =>
    existingOrders.find((o) => o.weeklyMenuItemId === weeklyMenuItemId);

  async function handleQuantityChange(weeklyMenuItemId: string, delta: number) {
    const existing = getOrder(weeklyMenuItemId);
    const currentQty = existing?.quantity ?? 0;
    const newQty = Math.max(0, Math.min(10, currentQty + delta));

    setSaving(weeklyMenuItemId);
    try {
      if (newQty === 0 && existing) {
        await ordersApi.remove(existing.id);
        onOrdersChange(existingOrders.filter((o) => o.id !== existing.id));
      } else if (newQty > 0) {
        const { data } = await ordersApi.create({ groupId, date, weeklyMenuItemId, quantity: newQty });
        onOrdersChange([
          ...existingOrders.filter((o) => o.weeklyMenuItemId !== weeklyMenuItemId),
          data,
        ]);
      }
    } catch {
      // silently ignore
    } finally {
      setSaving(null);
    }
  }

  async function handleRemove(orderId: string, weeklyMenuItemId: string) {
    setSaving(weeklyMenuItemId);
    try {
      await ordersApi.remove(orderId);
      onOrdersChange(existingOrders.filter((o) => o.id !== orderId));
    } catch {
      //
    } finally {
      setSaving(null);
    }
  }

  const dayTotal = existingOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);

  return (
    <div className="space-y-3">
      {(menu.items ?? []).map((item) => {
        const order = getOrder(item.id);
        const qty = order?.quantity ?? 0;
        const isSaving = saving === item.id;

        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              qty > 0 ? 'border-[#F97316] bg-[#FFF7ED]' : 'border-[#E2E8F0] bg-white'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B] truncate">{item.menuItem?.name}</p>
              <p className="text-xs text-[#64748B]">{item.menuItem?.category}</p>
            </div>
            <span className="text-sm font-semibold text-[#F97316] shrink-0">
              {formatVND(Number(item.price))}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {qty > 0 && (
                <button
                  onClick={() => order && handleRemove(order.id, item.id)}
                  disabled={isSaving}
                  className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={isSaving || qty === 0}
                className="w-7 h-7 flex items-center justify-center border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-[#1E293B]">{qty}</span>
              <button
                onClick={() => handleQuantityChange(item.id, 1)}
                disabled={isSaving || qty >= 10}
                className="w-7 h-7 flex items-center justify-center border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        );
      })}

      {existingOrders.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <ShoppingCart size={14} />
            <span>{existingOrders.length} item{existingOrders.length !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-sm font-bold text-[#1E293B]">
            Total: <span className="text-[#F97316]">{formatVND(dayTotal)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
