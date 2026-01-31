import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// [CẬP NHẬT] Khớp với response từ Node.js (user_id, full_name...)
interface User {
  id: number;          // user_id
  fullName: string;    // full_name
  role: string;        // role
  avatarUrl?: string;  // avatar_url
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        AsyncStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);