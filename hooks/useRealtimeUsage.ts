import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export function useRealtimeUsage(childId: string | null, date: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!childId || !date) return;

    const channel = supabase
      .channel(`app_usage_logs:child_id=eq.${childId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'app_usage_logs',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          // Only invalidate if the change is for the currently viewed date
          const newRecordDate = (payload.new as any)?.date;
          const oldRecordDate = (payload.old as any)?.date;
          
          if (newRecordDate === date || oldRecordDate === date) {
            queryClient.invalidateQueries({ queryKey: ['usage-logs', childId, date] });
            queryClient.invalidateQueries({ queryKey: ['usage-summary', childId, date] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, date, queryClient]);
}
