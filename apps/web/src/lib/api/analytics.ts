import { api } from '@/lib/api';

export interface PersonalAnalytics {
  totalSpend: number;
  dailyAverage: number;
  ordersCount: number;
  vsLastPeriod: number | null;
  trend: { date: string; amount: number }[];
}

export interface GroupBreakdown {
  weekStart: string;
  groupTotal: number;
  totalOrders: number;
  memberCount: number;
  members: {
    userId: string;
    name: string;
    total: number;
    ordersCount: number;
    percentage: number;
  }[];
}

export interface TopDishesResponse {
  dishes: {
    menuItemId: string;
    name: string;
    category: string;
    ordersCount: number;
    totalSpend: number;
  }[];
}

export const analyticsApi = {
  getPersonal: (groupId: string, period: 'weekly' | 'monthly') =>
    api.get<PersonalAnalytics>('/analytics/personal', { params: { groupId, period } }),

  getTopDishes: (groupId: string) =>
    api.get<TopDishesResponse>('/analytics/personal/top-dishes', { params: { groupId } }),

  getGroupBreakdown: (groupId: string, weekStart: string) =>
    api.get<GroupBreakdown>('/analytics/group', { params: { groupId, weekStart } }),
};
