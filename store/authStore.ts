import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

type Role = 'parent' | 'child' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setHydrated: (state: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      role: null,
      isHydrated: false,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setHydrated: (state) => set({ isHydrated: state }),
      signOut: () => set({ session: null, user: null, role: null }),
    }),
    {
      name: 'guardian-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);
