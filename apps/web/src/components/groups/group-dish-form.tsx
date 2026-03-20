'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { GroupDish } from '@/lib/api/group-dishes';

interface Props {
  groupId: string;
  editing?: GroupDish | null;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ['Rice', 'Noodle', 'Soup', 'Drink', 'Snack', 'Other'];

export function GroupDishForm({ editing, onSave, onCancel }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (description) fd.append('description', description);
      if (category) fd.append('category', category);
      if (imageFile) fd.append('image', imageFile);
      await onSave(fd);
    } catch {
      setError('Failed to save dish.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <div>
        <label className="block text-xs font-medium text-[#64748B] mb-1.5">Photo (optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-full h-28 rounded-xl border-2 border-dashed border-[#E2E8F0] hover:border-[#F97316] transition-colors cursor-pointer flex items-center justify-center overflow-hidden bg-[#F8FAFC]"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#94A3B8]">
              <ImagePlus size={20} />
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-[#64748B] mb-1.5">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cơm Tấm"
          className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#F97316] transition-colors"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-[#64748B] mb-1.5">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#F97316] transition-colors bg-white"
        >
          <option value="">— Select —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[#64748B] mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#F97316] transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 h-10 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA6A00] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Dish'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 border border-[#E2E8F0] text-[#64748B] text-sm rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
