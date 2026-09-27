import { create } from 'zustand';
import { UserDto } from '@nexchat/shared';
import { setStoredToken } from '../lib/api';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserDto, accessToken: string) => Promise<void>;
  setUser: (user: UserDto) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken) => {
    await setStoredToken(accessToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await setStoredToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
