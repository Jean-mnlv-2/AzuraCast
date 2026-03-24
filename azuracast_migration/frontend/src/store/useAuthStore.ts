import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: number;
    email: string;
    name: string | null;
    is_superuser?: boolean;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (access: string, refresh: string, user: AuthState['user']) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      setAuth: (access, refresh, user) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: !!access,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      login: async (email, password) => {
        try {
          const { data } = await api.post('/auth/login/', { email, password });
          const { access, refresh } = data as { access: string; refresh: string };
          set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
          const userRes = await api.get('/users/me/');
          const userData = userRes.data as AuthState['user'];
          set({ user: userData });
          return true;
        } catch {
          return false;
        }
      },
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'bantuwave-auth-storage',
    }
  )
);
