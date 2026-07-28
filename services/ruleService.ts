import { supabase } from './supabase';
import type { AppCategory } from '@/constants/categories';

export interface Rule {
  id: string;
  child_id: string;
  app_id: string | null;
  category: AppCategory | null;
  rule_type: 'TIME_LIMIT' | 'BLOCK' | 'ALLOW_ONLY';
  daily_limit_minutes: number | null;
  weekly_limit_minutes: number | null;
  is_active: boolean;
}

export async function getRules(childId: string) {
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('child_id', childId)
    .eq('is_active', true);

  if (error) throw error;
  return data as Rule[];
}

export async function createRule(
  childId: string,
  ruleType: 'TIME_LIMIT' | 'BLOCK' | 'ALLOW_ONLY',
  appId?: string,
  category?: AppCategory,
  dailyLimitMinutes?: number
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rules')
    .insert({
      child_id: childId,
      rule_type: ruleType,
      app_id: appId || null,
      category: category || null,
      daily_limit_minutes: dailyLimitMinutes || null,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Rule;
}

export async function deleteRule(ruleId: string) {
  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw error;
}
