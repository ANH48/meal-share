'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function decodeTokenPayload(token: string): { sub: string; email: string; role: string } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        const payload = decodeTokenPayload(accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          document.cookie = 'auth-logged-in=1; path=/; max-age=604800; SameSite=Lax';
          if (payload?.role) {
            document.cookie = `user-role=${payload.role}; path=/; max-age=604800; SameSite=Lax`;
          }
        }
        const partialUser = payload
          ? { id: payload.sub, email: payload.email, role: payload.role, name: '' }
          : null;
        set((state) => ({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          user: state.user ?? partialUser,
        }));
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'auth-logged-in=; path=/; max-age=0';
          document.cookie = 'user-role=; path=/; max-age=0';
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
