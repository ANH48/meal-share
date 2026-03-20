'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { votesApi } from '@/lib/api/votes';
import { menuItemsApi, type MenuItem } from '@/lib/api/menu-items';
import { groupDishesApi, type GroupDish } from '@/lib/api/group-dishes';

type DishOption = { id: string; name: string; category?: string | null };

interface CreateVoteFormProps {
  groupId: string;
  onCreated: () => void;
  onClose: () => void;
}

export function CreateVoteForm({ groupId, onCreated, onClose }: CreateVoteFormProps) {
  const [title, setTitle] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allDishes, setAllDishes] = useState<DishOption[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      menuItemsApi.list({ limit: 100 }).catch(() => ({ data: { items: [] as MenuItem[] } })),
      groupDishesApi.list(groupId).catch(() => ({ data: [] as GroupDish[] })),
    ]).then(([{ data: global }, { data: group }]) => {
      if (cancelled) return;
      const merged: DishOption[] = [
        ...group.map((d) => ({ id: d.id, name: d.name, category: d.category })),
        ...global.items.map((d: MenuItem) => ({ id: d.id, name: d.name, category: d.category })),
      ];
      // deduplicate by id
      const seen = new Set<string>();
      setAllDishes(merged.filter((d) => (seen.has(d.id) ? false : seen.add(d.id) && true)));
      setLoadingDishes(false);
    });
    return () => { cancelled = true; };
  }, [groupId]);

  function toggleDish(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (!endsAt || new Date(endsAt) <= new Date()) {
      setError('Closes At must be a future date/time.');
      return;
    }
    if (selectedIds.length < 2) {
      setError('Please select at least 2 dishes.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await votesApi.create({
        groupId,
        title,
        weekStartDate,
        endsAt: new Date(endsAt).toISOString(),
        menuItemIds: selectedIds,
      });
      onCreated();
      onClose();
    } catch {
      setError('Failed to create vote. Please try again.');
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#1E293B]">Create Vote</h3>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vote for this week's menu"
              className="w-full h-10 border border-[#E2E8F0] rounded-lg px-3 text-sm focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Week Start Date</label>
            <input
              type="date"
              required
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full h-10 border border-[#E2E8F0] rounded-lg px-3 text-sm focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1">Closes At</label>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full h-10 border border-[#E2E8F0] rounded-lg px-3 text-sm focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-2">
              Dishes to vote on <span className="text-[#94A3B8]">(select at least 2)</span>
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2">
              {loadingDishes ? (
                <p className="text-xs text-[#94A3B8] text-center py-2">Loading dishes...</p>
              ) : allDishes.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-2">No dishes available. Add dishes in Group Settings first.</p>
              ) : allDishes.map((dish) => {
                const checked = selectedIds.includes(dish.id);
                return (
                  <label
                    key={dish.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDish(dish.id)}
                      className="accent-[#F97316]"
                    />
                    <span className="text-sm text-[#1E293B]">{dish.name}</span>
                    {dish.category && (
                      <span className="text-xs text-[#94A3B8]">{dish.category}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
