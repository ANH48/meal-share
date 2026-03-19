'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuItemCard } from '@/components/admin/menu-item-card';
import { MenuItemForm } from '@/components/admin/menu-item-form';
import { menuItemsApi, type MenuItem } from '@/lib/api/menu-items';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Com', label: 'Com/Rice' },
  { value: 'Bun', label: 'Bun/Noodles' },
  { value: 'Canh', label: 'Canh/Soup' },
  { value: 'Khai vi', label: 'Khai vi/Appetizer' },
  { value: 'Do uong', label: 'Do uong/Beverage' },
];

const LIMIT = 20;

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(
    async (s: string, cat: string, p: number) => {
      setLoading(true);
      try {
        const { data } = await menuItemsApi.list({
          search: s || undefined,
          category: cat || undefined,
          page: p,
          limit: LIMIT,
        });
        setItems(data.items);
        setTotal(data.total);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchItems(search, category, page);
  }, [fetchItems, search, category, page]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(e.target.value);
    setPage(1);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuItemsApi.remove(id);
      fetchItems(search, category, page);
    } catch {
      alert('Failed to delete item.');
    }
  }

  function handleEdit(item: MenuItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleAddNew() {
    setEditItem(undefined);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditItem(undefined);
  }

  function handleFormSaved() {
    handleFormClose();
    fetchItems(search, category, page);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B] font-mono">Menu Catalog</h1>
        <Button
          onClick={handleAddNew}
          className="h-9 gap-2 text-[13px] font-semibold text-white cursor-pointer"
          style={{ background: '#F97316' }}
        >
          <Plus size={15} />
          Add Item
        </Button>
      </div>

      {/* Search / Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search dishes..."
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 bg-white transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="h-9 rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#1E293B] bg-white outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-colors"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide w-60">
                Dish Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide w-36">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-sm text-[#94A3B8]">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-sm text-[#94A3B8]">
                  No menu items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-[#64748B]">
          {total === 0 ? '0 items' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total} items`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </Button>
          <span className="text-sm text-[#64748B] font-medium px-1">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {formOpen && (
        <MenuItemForm
          item={editItem}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
