'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { weeklyMenusApi, type WeeklyMenu } from '@/lib/api/weekly-menus';
import { menuItemsApi, type MenuItem } from '@/lib/api/menu-items';

interface WeeklyMenuBuilderProps {
  menu: WeeklyMenu | null;
  groupId: string;
  weekStart: Date;
  onConfirmed: () => void;
}

export function WeeklyMenuBuilder({
  menu: initialMenu,
  groupId,
  weekStart,
  onConfirmed,
}: WeeklyMenuBuilderProps) {
  const [menu, setMenu] = useState<WeeklyMenu | null>(initialMenu);
  const [showDishDialog, setShowDishDialog] = useState(false);
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMenu(initialMenu);
  }, [initialMenu]);

  async function handleCreateMenu() {
    setLoading(true);
    try {
      const { data } = await weeklyMenusApi.create({
        groupId,
        weekStartDate: weekStart.toISOString().split('T')[0],
      });
      setMenu(data);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDishDialog() {
    setShowDishDialog(true);
    if (allDishes.length === 0) {
      const { data } = await menuItemsApi.list({ limit: 100 });
      setAllDishes(data.items);
    }
  }

  async function handleAddDish(dish: MenuItem) {
    if (!menu) return;
    try {
      const { data } = await weeklyMenusApi.addItem(menu.id, {
        menuItemId: dish.id,
        price: 0,
      });
      setMenu((prev) =>
        prev ? { ...prev, items: [...(prev.items ?? []), data] } : prev
      );
    } catch {
      // ignore
    }
    setShowDishDialog(false);
  }

  async function handleRemoveDish(itemId: string) {
    if (!menu) return;
    await weeklyMenusApi.removeItem(menu.id, itemId);
    setMenu((prev) =>
      prev
        ? { ...prev, items: prev.items?.filter((i) => i.id !== itemId) }
        : prev
    );
  }

  async function handlePriceChange(itemId: string, price: number) {
    if (!menu) return;
    await weeklyMenusApi.updateItemPrice(menu.id, itemId, price);
    setMenu((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items?.map((i) =>
              i.id === itemId ? { ...i, price: String(price) } : i
            ),
          }
        : prev
    );
  }

  async function handleConfirm() {
    if (!menu) return;
    setSaving(true);
    try {
      await weeklyMenusApi.confirm(menu.id);
      onConfirmed();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (!menu) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
        <p className="text-sm text-[#94A3B8] mb-4">No menu created for this week yet.</p>
        <button
          onClick={handleCreateMenu}
          disabled={loading}
          className="inline-flex items-center gap-2 h-11 px-5 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          Create Menu
        </button>
      </div>
    );
  }

  const items = menu.items ?? [];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1E293B]">Build Menu</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
          Draft
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {items.length === 0 && (
          <p className="text-sm text-[#94A3B8] py-4 text-center">No dishes added yet.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 h-[60px] px-3 border border-[#E2E8F0] rounded-lg"
          >
            <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
              {item.menuItem?.imageUrl ? (
                <img
                  src={item.menuItem.imageUrl}
                  alt={item.menuItem.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <span className="text-[#94A3B8] text-xs font-bold">
                  {item.menuItem?.name?.slice(0, 2).toUpperCase() ?? '??'}
                </span>
              )}
            </div>
            <span className="flex-1 text-sm font-medium text-[#1E293B] truncate">
              {item.menuItem?.name ?? 'Unknown'}
            </span>
            <input
              type="number"
              min={0}
              value={parseFloat(item.price)}
              onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
              className="w-20 h-8 border border-[#E2E8F0] rounded-lg text-sm text-right px-2 focus:outline-none focus:border-[#F97316]"
            />
            <button
              onClick={() => handleRemoveDish(item.id)}
              className="text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleOpenDishDialog}
        className="w-full h-10 border border-dashed border-[#E2E8F0] rounded-lg text-sm text-[#94A3B8] hover:border-[#F97316] hover:text-[#F97316] transition-colors flex items-center justify-center gap-1 mb-4 cursor-pointer"
      >
        <Plus size={14} />
        Add Dish
      </button>

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={saving || items.length === 0}
          className="flex-1 h-11 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={16} />
          {saving ? 'Confirming...' : 'Confirm Menu'}
        </button>
      </div>

      {showDishDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[#1E293B]">Select a Dish</h4>
              <button
                onClick={() => setShowDishDialog(false)}
                className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto space-y-2">
              {allDishes.map((dish) => (
                <button
                  key={dish.id}
                  onClick={() => handleAddDish(dish)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] shrink-0 flex items-center justify-center">
                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#94A3B8]">
                        {dish.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{dish.name}</p>
                    {dish.category && (
                      <p className="text-xs text-[#94A3B8]">{dish.category}</p>
                    )}
                  </div>
                </button>
              ))}
              {allDishes.length === 0 && (
                <p className="text-sm text-[#94A3B8] text-center py-4">Loading dishes...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
