import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export function useRealtimeRules(childId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!childId) return;

    const channel = supabase
      .channel(`rules:child_id=eq.${childId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'rules',
          filter: `child_id=eq.${childId}`,
        },
        () => {
          // Invalidate and refetch rules when a change occurs
          queryClient.invalidateQueries({ queryKey: ['rules', childId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, queryClient]);
}
