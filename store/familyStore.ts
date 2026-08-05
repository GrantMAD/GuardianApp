import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Family, Child } from '@/services/childService';

interface FamilyState {
  family: Family | null;
  children: Child[];
  selectedChildId: string | null;
  theme: 'light' | 'dark';
  setFamily: (family: Family | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChildId: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      family: null,
      children: [],
      selectedChildId: null,
      theme: 'light',
      setFamily: (family) => set({ family, theme: family?.theme ?? 'light' }),
      setChildren: (children) => set({ children }),
      setSelectedChildId: (id) => set({ selectedChildId: id }),
      setTheme: (theme) => set({ theme }),
      clearFamily: () => set({ family: null, children: [], selectedChildId: null, theme: 'light' }),
    }),
    {
      name: 'guardian-family-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the theme — all other state comes from the DB after sign-in
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
