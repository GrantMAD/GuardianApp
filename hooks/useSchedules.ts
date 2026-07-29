import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '@/services/scheduleService';
import type { Schedule } from '@/utils/scheduleEvaluator';

export function useSchedules(childId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['schedules', childId],
    queryFn: () => getSchedules(childId!),
    enabled: !!childId,
  });

  const createMutation = useMutation({
    mutationFn: (schedule: Omit<Schedule, 'id' | 'is_active'>) => createSchedule(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', childId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', childId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ scheduleId, isActive }: { scheduleId: string; isActive: boolean }) =>
      toggleSchedule(scheduleId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', childId] });
    },
  });

  return {
    schedules: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createSchedule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteSchedule: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    toggleSchedule: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  };
}
