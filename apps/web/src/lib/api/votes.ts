import { api } from '@/lib/api';

export interface VoteOption {
  id: string;
  voteId: string;
  menuItemId: string;
  menuItem?: { id: string; name: string };
  _count?: { responses: number };
}

export interface Vote {
  id: string;
  groupId: string;
  title: string;
  weekStartDate: string;
  endsAt: string;
  status: 'open' | 'closed' | 'results';
  options?: VoteOption[];
  userResponse?: { voteOptionId: string };
}

export interface VoteResult {
  optionId: string;
  menuItemName: string;
  count: number;
  percentage: number;
}

export const votesApi = {
  list: (groupId: string) =>
    api.get<Vote[]>('/votes', { params: { groupId } }),

  getById: (id: string) =>
    api.get<Vote>(`/votes/${id}`),

  create: (data: {
    groupId: string;
    title: string;
    weekStartDate: string;
    endsAt: string;
    menuItemIds: string[];
  }) => api.post<Vote>('/votes', data),

  respond: (voteId: string, voteOptionId: string) =>
    api.post(`/votes/${voteId}/respond`, { voteOptionId }),

  getResults: (voteId: string) =>
    api.get<VoteResult[]>(`/votes/${voteId}/results`),
};
