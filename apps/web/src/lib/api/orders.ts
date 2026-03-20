import { api } from '@/lib/api';

export interface DailyOrder {
  id: string;
  userId: string;
  groupId: string;
  date: string;
  weeklyMenuItemId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  weeklyMenuItem: {
    id: string;
    price: number;
    menuItem: {
      id: string;
      name: string;
      category: string;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GroupOrderUser {
  user: { id: string; name: string; email: string };
  orders: DailyOrder[];
  total: number;
}

export const ordersApi = {
  create: (data: { groupId: string; date: string; weeklyMenuItemId: string; quantity: number }) =>
    api.post<DailyOrder>('/orders', data),

  update: (orderId: string, quantity: number) =>
    api.patch<DailyOrder>(`/orders/${orderId}`, { quantity }),

  remove: (orderId: string) =>
    api.delete(`/orders/${orderId}`),

  getMyDaily: (groupId: string, date: string) =>
    api.get<DailyOrder[]>('/orders/my', { params: { groupId, date } }),

  getMyWeekly: (groupId: string, weekStart: string) =>
    api.get<DailyOrder[]>('/orders/my/week', { params: { groupId, weekStart } }),

  getGroupDaily: (groupId: string, date: string) =>
    api.get<DailyOrder[]>('/orders/group', { params: { groupId, date } }),

  getGroupWeekly: (groupId: string, weekStart: string) =>
    api.get<GroupOrderUser[]>('/orders/group/week', { params: { groupId, weekStart } }),
};
