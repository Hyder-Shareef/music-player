import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/music';
import { musicApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithGoogle: (email: string, name?: string, avatar?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null, token?: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoginModalOpen: false,
      isLoading: false,
      error: null,

      openLoginModal: () => set({ isLoginModalOpen: true, error: null }),
      closeLoginModal: () => set({ isLoginModalOpen: false, error: null }),

      loginWithGoogle: async (email: string, name?: string, avatar?: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await musicApi.loginWithGoogle(email, name, avatar);
          localStorage.setItem('chong_auth_token', data.token);
          localStorage.setItem('chong_user_id', data.user.id);
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoginModalOpen: false,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          const msg = err.response?.data?.detail || 'Failed to authenticate with Google';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('chong_auth_token');
        const guestId = `chong_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('chong_user_id', guestId);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user, token = null) => {
        if (token) localStorage.setItem('chong_auth_token', token);
        if (user) localStorage.setItem('chong_user_id', user.id);
        set({
          user,
          token: token || get().token,
          isAuthenticated: !!user,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('chong_auth_token');
        if (!token) return;
        try {
          const user = await musicApi.getMe();
          set({ user, isAuthenticated: true });
        } catch (err) {
          console.warn('Token validation expired or invalid, clearing auth session');
          get().logout();
        }
      },
    }),
    {
      name: 'chong_auth_state',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
