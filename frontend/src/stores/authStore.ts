import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company } from '@/types';
import api from '@/services/api';

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasSeenTour: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    companyName: string;
    industry: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  setCompany: (company: Company) => void;
  markTourAsSeen: () => void;
  replayTour: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasSeenTour: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { accessToken, refreshToken, user, company } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            company,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed. Please try again.',
          });
          throw error;
        }
      },
      
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', data);
          const { accessToken, refreshToken, user, company } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            company,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed. Please try again.',
          });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          company: null,
          isAuthenticated: false,
          error: null,
        });
      },
      
      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          set({
            user: response.data.user,
            company: response.data.company,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            company: null,
            isAuthenticated: false,
          });
        }
      },
      
      clearError: () => set({ error: null }),
      setCompany: (company) => set({ company }),
      markTourAsSeen: () => set({ hasSeenTour: true }),
      replayTour: () => set({ hasSeenTour: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
        hasSeenTour: state.hasSeenTour,
      }),
    }
  )
);
