'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, Save } from 'lucide-react';
import type { WeeklyMenu } from '@/lib/api/weekly-menus';
import { ordersApi, type DailyOrder } from '@/lib/api/orders';

interface Props {
  menu: WeeklyMenu;
  groupId: string;
  date: string;
  existingOrders: DailyOrder[];
  onOrdersChange: (orders: DailyOrder[]) => void;
  onRefetch?: () => void;
  isLocked?: boolean;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function DailyOrderForm({ menu, groupId, date, existingOrders, onOrdersChange, onRefetch, isLocked = false }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync local quantities when existingOrders or date changes
  useEffect(() => {
    const map: Record<string, number> = {};
    existingOrders.forEach((o) => { map[o.weeklyMenuItemId] = o.quantity; });
    setQuantities(map);
    setSaved(false);
  }, [existingOrders, date]);

  const items = menu.items ?? [];

  function setQty(weeklyMenuItemId: string, qty: number) {
    setSaved(false);
    setQuantities((prev) => ({ ...prev, [weeklyMenuItemId]: Math.max(0, Math.min(10, qty)) }));
  }

  const localTotal = items.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 0;
    return sum + qty * Number(item.price);
  }, 0);

  const localItemCount = items.filter((i) => (quantities[i.id] ?? 0) > 0).length;

  const isDirty = items.some((item) => {
    const existing = existingOrders.find((o) => o.weeklyMenuItemId === item.id);
    return (quantities[item.id] ?? 0) !== (existing?.quantity ?? 0);
  });

  async function handleSave() {
    setSaving(true);
    try {
      let updatedOrders = [...existingOrders];
      for (const item of items) {
        const newQty = quantities[item.id] ?? 0;
        const existing = existingOrders.find((o) => o.weeklyMenuItemId === item.id);
        if (existing && newQty === 0) {
          await ordersApi.remove(existing.id);
          updatedOrders = updatedOrders.filter((o) => o.id !== existing.id);
        } else if (existing && newQty !== existing.quantity) {
          const { data } = await ordersApi.update(existing.id, newQty);
          updatedOrders = updatedOrders.map((o) => o.id === existing.id ? data : o);
        } else if (!existing && newQty > 0) {
          const { data } = await ordersApi.create({ groupId, date, weeklyMenuItemId: item.id, quantity: newQty });
          updatedOrders.push(data);
        }
      }
      onOrdersChange(updatedOrders);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleErrorOk() {
    setErrorMsg(null);
    onRefetch?.();
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <p className="text-2xl mb-2">😅</p>
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Oops!</h3>
            <p className="text-sm text-[#64748B] mb-5">{errorMsg}</p>
            <button
              onClick={handleErrorOk}
              className="w-full h-10 bg-[#F97316] text-white text-sm font-semibold rounded-lg hover:bg-[#EA6A00] transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {items.map((item) => {
        const qty = quantities[item.id] ?? 0;
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
              <button
                onClick={() => setQty(item.id, qty - 1)}
                disabled={qty === 0 || isLocked}
                className="w-7 h-7 flex items-center justify-center border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-[#1E293B]">{qty}</span>
              <button
                onClick={() => setQty(item.id, qty + 1)}
                disabled={qty >= 10 || isLocked}
                className="w-7 h-7 flex items-center justify-center border border-[#E2E8F0] rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <ShoppingCart size={14} />
          <span>{localItemCount} item{localItemCount !== 1 ? 's' : ''}</span>
          {localItemCount > 0 && (
            <span className="font-bold text-[#1E293B]">
              · Total: <span className="text-[#F97316]">{formatVND(localTotal)}</span>
            </span>
          )}
        </div>
        {isLocked ? (
          <span className="text-xs text-red-400 font-medium">Orders locked</span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 h-9 px-4 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <Save size={14} />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}
