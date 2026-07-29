import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRules, createRule, deleteRule } from '@/services/ruleService';
import type { AppCategory } from '@/constants/categories';

export function useRules(childId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rules', childId],
    queryFn: () => getRules(childId!),
    enabled: !!childId,
  });

  const createMutation = useMutation({
    mutationFn: ({
      ruleType,
      appId,
      category,
      dailyLimitMinutes,
    }: {
      ruleType: 'TIME_LIMIT' | 'BLOCK' | 'ALLOW_ONLY';
      appId?: string;
      category?: AppCategory;
      dailyLimitMinutes?: number;
    }) => createRule(childId!, ruleType, appId, category, dailyLimitMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', childId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', childId] });
    },
  });

  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createRule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteRule: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
