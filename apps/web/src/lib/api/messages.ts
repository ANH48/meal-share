import { api } from '@/lib/api';

export interface Message {
  id: string;
  groupId: string;
  senderId: string | null;
  content: string;
  type: 'user' | 'system';
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export const messagesApi = {
  getByGroup: (groupId: string, before?: string, limit = 50) =>
    api.get<MessagesResponse>('/messages', { params: { groupId, before, limit } }),

  getById: (messageId: string) =>
    api.get<Message>(`/messages/${messageId}`),

  create: (groupId: string, content: string) =>
    api.post<Message>('/messages', { groupId, content }),

  update: (messageId: string, content: string) =>
    api.patch<Message>(`/messages/${messageId}`, { content }),

  delete: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
};
