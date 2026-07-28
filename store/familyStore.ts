import { create } from 'zustand';
import type { Family, Child } from '@/services/childService';

interface FamilyState {
  family: Family | null;
  children: Child[];
  selectedChildId: string | null;
  setFamily: (family: Family | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChildId: (id: string | null) => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  children: [],
  selectedChildId: null,
  setFamily: (family) => set({ family }),
  setChildren: (children) => set({ children }),
  setSelectedChildId: (id) => set({ selectedChildId: id }),
  clearFamily: () => set({ family: null, children: [], selectedChildId: null }),
}));
