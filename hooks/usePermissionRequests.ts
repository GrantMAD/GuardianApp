import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export interface PermissionRequest {
  id: string;
  child_id: string;
  app_id: string | null;
  request_type: 'extra_time' | 'unblock';
  extra_minutes: number | null;
  message: string | null;
  status: 'pending' | 'approved' | 'denied';
  approved_minutes: number | null;
  responded_at: string | null;
  created_at: string;
}

export function usePermissionRequests(childId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['permission-requests', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_requests')
        .select('*')
        .eq('child_id', childId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PermissionRequest[];
    },
    enabled: !!childId,
  });

  const respondMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      approvedMinutes,
    }: {
      requestId: string;
      status: 'approved' | 'denied';
      approvedMinutes?: number;
    }) => {
      const { error } = await supabase.rpc('respond_to_permission_request', {
        p_request_id: requestId,
        p_status: status,
        p_approved_minutes: approvedMinutes ?? null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-requests', childId] });
    },
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    respondToRequest: respondMutation.mutateAsync,
    isResponding: respondMutation.isPending,
  };
}
