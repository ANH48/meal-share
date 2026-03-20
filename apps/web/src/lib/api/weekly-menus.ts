import { api } from '@/lib/api';

export interface WeeklyMenuItemDetail {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

export interface WeeklyMenuItem {
  id: string;
  weeklyMenuId: string;
  menuItemId: string;
  price: string;
  isAvailable: boolean;
  menuItem?: WeeklyMenuItemDetail;
}

export interface WeeklyMenu {
  id: string;
  groupId: string;
  weekStartDate: string;
  status: 'draft' | 'confirmed';
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  items?: WeeklyMenuItem[];
}

export const weeklyMenusApi = {
  getByGroupAndWeek: (groupId: string, weekStart: string) =>
    api.get<WeeklyMenu>('/weekly-menus', { params: { groupId, weekStart } }),

  getById: (id: string) =>
    api.get<WeeklyMenu>(`/weekly-menus/${id}`),

  create: (data: { groupId: string; weekStartDate: string }) =>
    api.post<WeeklyMenu>('/weekly-menus', data),

  addItem: (menuId: string, data: { menuItemId: string; price: number }) =>
    api.post<WeeklyMenuItem>(`/weekly-menus/${menuId}/items`, data),

  removeItem: (menuId: string, itemId: string) =>
    api.delete(`/weekly-menus/${menuId}/items/${itemId}`),

  updateItemPrice: (menuId: string, itemId: string, price: number) =>
    api.patch(`/weekly-menus/${menuId}/items/${itemId}`, { price }),

  confirm: (menuId: string) =>
    api.patch<WeeklyMenu>(`/weekly-menus/${menuId}/confirm`),

  lock: (menuId: string) =>
    api.patch<WeeklyMenu>(`/weekly-menus/${menuId}/lock`),

  unlock: (menuId: string) =>
    api.patch<WeeklyMenu>(`/weekly-menus/${menuId}/unlock`),
};
