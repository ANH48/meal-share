'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { menuItemsApi, type MenuItem } from '@/lib/api/menu-items';

const CATEGORIES = [
  { value: 'Com', label: 'Com/Rice' },
  { value: 'Bun', label: 'Bun/Noodles' },
  { value: 'Canh', label: 'Canh/Soup' },
  { value: 'Khai vi', label: 'Khai vi/Appetizer' },
  { value: 'Do uong', label: 'Do uong/Beverage' },
];

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MenuItemFormProps {
  item?: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}

export function MenuItemForm({ item, onClose, onSaved }: MenuItemFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(item?.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      category: item?.category ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: item?.name ?? '',
      description: item?.description ?? '',
      category: item?.category ?? '',
    });
    setPreview(item?.imageUrl ?? null);
    setFile(null);
  }, [item, reset]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const fd = new FormData();
      fd.append('name', values.name);
      if (values.description) fd.append('description', values.description);
      if (values.category) fd.append('category', values.category);
      if (file) fd.append('image', file);

      if (item) {
        await menuItemsApi.update(item.id, fd);
      } else {
        await menuItemsApi.create(fd);
      }
      onSaved();
    } catch {
      setServerError('Failed to save. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-[#1E293B]">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Dish name"
              className="h-9 border-[#E2E8F0]"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium text-[#1E293B]">
              Description
            </Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Short description..."
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-colors resize-none"
              {...register('description')}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-medium text-[#1E293B]">
              Category
            </Label>
            <select
              id="category"
              className="w-full h-9 rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#1E293B] bg-white outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-colors"
              {...register('category')}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">Image</Label>
            {preview && (
              <div className="w-full h-32 rounded-lg overflow-hidden bg-[#F1F5F9] mb-2">
                <Image
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-9 rounded-lg border border-dashed border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            >
              {file ? file.name : 'Choose image...'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 text-white"
              style={{ background: '#F97316' }}
            >
              {isSubmitting ? 'Saving...' : item ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
