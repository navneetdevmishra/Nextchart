import { create } from 'zustand';
import { UserDto } from '@nexchat/shared';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserDto, accessToken: string) => void;
  setUser: (user: UserDto) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('nexchat_token') : null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexchat_token', accessToken);
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexchat_token');
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
