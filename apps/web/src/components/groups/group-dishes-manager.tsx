'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { groupDishesApi, type GroupDish } from '@/lib/api/group-dishes';
import { GroupDishForm } from './group-dish-form';

interface Props {
  groupId: string;
}

export function GroupDishesManager({ groupId }: Props) {
  const [dishes, setDishes] = useState<GroupDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GroupDish | null>(null);

  useEffect(() => {
    groupDishesApi.list(groupId)
      .then(({ data }) => setDishes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleSave(fd: FormData) {
    if (editing) {
      const { data } = await groupDishesApi.update(groupId, editing.id, fd);
      setDishes((prev) => prev.map((d) => d.id === data.id ? data : d));
    } else {
      const { data } = await groupDishesApi.create(groupId, fd);
      setDishes((prev) => [data, ...prev]);
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(dish: GroupDish) {
    await groupDishesApi.remove(groupId, dish.id);
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
  }

  if (loading) return <div className="h-16 bg-[#F1F5F9] rounded-xl animate-pulse" />;

  return (
    <div>
      {dishes.length === 0 && !showForm ? (
        <div className="py-6 text-center">
          <p className="text-sm text-[#94A3B8] mb-3">No dishes yet. Add your group&apos;s dishes.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {dishes.map((dish) => (
            <div key={dish.id} className="flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] shrink-0 overflow-hidden flex items-center justify-center">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#94A3B8]">{dish.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B] truncate">{dish.name}</p>
                {dish.category && <p className="text-xs text-[#94A3B8]">{dish.category}</p>}
              </div>
              <button
                onClick={() => { setEditing(dish); setShowForm(true); }}
                className="text-[#94A3B8] hover:text-[#F97316] transition-colors cursor-pointer"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(dish)}
                className="text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
          <p className="text-xs font-semibold text-[#1E293B] mb-3">
            {editing ? 'Edit Dish' : 'New Dish'}
          </p>
          <GroupDishForm
            groupId={groupId}
            editing={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      ) : (
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 text-sm text-[#F97316] hover:text-[#EA6A00] font-medium transition-colors cursor-pointer"
        >
          <Plus size={15} />
          Add Dish
        </button>
      )}
    </div>
  );
}
