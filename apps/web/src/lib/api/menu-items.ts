import { api } from '@/lib/api';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMenuItems {
  items: MenuItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MenuItemsListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const menuItemsApi = {
  list: (params?: MenuItemsListParams) =>
    api.get<PaginatedMenuItems>('/menu-items', { params }),

  getById: (id: string) =>
    api.get<MenuItem>(`/menu-items/${id}`),

  create: (formData: FormData) =>
    api.post<MenuItem>('/menu-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    api.patch<MenuItem>(`/menu-items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  remove: (id: string) =>
    api.delete(`/menu-items/${id}`),
};
