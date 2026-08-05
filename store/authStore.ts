import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

type Role = 'parent' | 'child' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  childId: string | null;
  familyId: string | null;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setChildId: (id: string | null) => void;
  setFamilyId: (id: string | null) => void;
  setHydrated: (state: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      role: null,
      childId: null,
      familyId: null,
      isHydrated: false,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setChildId: (id) => set({ childId: id }),
      setFamilyId: (id) => set({ familyId: id }),
      setHydrated: (state) => set({ isHydrated: state }),
      signOut: () => set({ session: null, user: null, role: null, childId: null, familyId: null }),
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
