import { create } from 'zustand';
import type { Rule } from '@/services/ruleService';
import type { Schedule } from '@/utils/scheduleEvaluator';

interface AgentState {
  activeRules: Rule[];
  activeSchedules: Schedule[];
  setActiveRules: (rules: Rule[]) => void;
  setActiveSchedules: (schedules: Schedule[]) => void;
  clearAgentData: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  activeRules: [],
  activeSchedules: [],
  setActiveRules: (rules) => set({ activeRules: rules }),
  setActiveSchedules: (schedules) => set({ activeSchedules: schedules }),
  clearAgentData: () => set({ activeRules: [], activeSchedules: [] }),
}));
