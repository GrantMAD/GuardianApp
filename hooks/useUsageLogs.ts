import { useQuery } from '@tanstack/react-query';
import { getDailyUsage, getDailyScreenTimeSummary } from '@/services/usageService';
import { useAuthStore } from '@/store/authStore';

export function useUsageLogs(childId: string | null, date: string) {
  const { session } = useAuthStore();

  const logsQuery = useQuery({
    queryKey: ['usage-logs', childId, date],
    queryFn: () => getDailyUsage(childId!, date),
    enabled: !!session && !!childId && !!date,
  });

  const summaryQuery = useQuery({
    queryKey: ['usage-summary', childId, date],
    queryFn: () => getDailyScreenTimeSummary(childId!, date),
    enabled: !!session && !!childId && !!date,
  });

  return {
    logs: logsQuery.data ?? [],
    summary: summaryQuery.data ?? null,
    isLoading: logsQuery.isLoading || summaryQuery.isLoading,
    error: logsQuery.error || summaryQuery.error,
    refetch: () => {
      logsQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
