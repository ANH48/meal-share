import { api } from '@/lib/api';

export interface GroupDish {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  groupId: string;
  createdAt: string;
}

export const groupDishesApi = {
  list: (groupId: string) =>
    api.get<GroupDish[]>(`/groups/${groupId}/dishes`),

  create: (groupId: string, data: FormData) =>
    api.post<GroupDish>(`/groups/${groupId}/dishes`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (groupId: string, dishId: string, data: FormData) =>
    api.patch<GroupDish>(`/groups/${groupId}/dishes/${dishId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  remove: (groupId: string, dishId: string) =>
    api.delete(`/groups/${groupId}/dishes/${dishId}`),
};
