import { api } from '@/lib/api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  leaderId: string;
  createdAt: string;
  members?: GroupMember[];
  _count?: { members: number };
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'leader' | 'participant';
  status: 'active' | 'removed';
  joinedAt: string;
  user?: { id: string; name: string; email: string; avatarUrl?: string };
}

export const groupsApi = {
  list: () => api.get<Group[]>('/groups'),
  getById: (id: string) => api.get<Group>(`/groups/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<Group>('/groups', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Group>(`/groups/${id}`, data),
  join: (code: string) => api.post<Group>('/groups/join', { code }),
  getMembers: (groupId: string) =>
    api.get<GroupMember[]>(`/groups/${groupId}/members`),
  removeMember: (groupId: string, memberId: string) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),
  leave: (groupId: string) => api.post(`/groups/${groupId}/leave`),
  regenerateInvite: (groupId: string) =>
    api.post<{ inviteCode: string }>(`/groups/${groupId}/regenerate-invite`),
};
