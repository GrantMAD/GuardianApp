import { supabase } from './supabase';
import type { AppCategory } from '@/constants/categories';
import { logParentAction } from './auditService';

export interface Rule {
  id: string;
  child_id: string;
  app_id: string | null;
  category: AppCategory | null;
  rule_type: 'TIME_LIMIT' | 'BLOCK' | 'ALLOW_ONLY';
  daily_limit_minutes: number | null;
  weekly_limit_minutes: number | null;
  is_active: boolean;
  installed_apps: { app_name: string; icon_url: string | null; package_name: string } | null;
}

export async function getRules(childId: string) {
  const { data, error } = await supabase
    .from('rules')
    .select('*, installed_apps(app_name, icon_url, package_name)')
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

  // Log action
  try {
    const { data: child } = await supabase.from('children').select('family_id').eq('id', childId).single();
    if (child?.family_id) {
      await logParentAction(
        child.family_id,
        'RULE_CREATED',
        `Created ${ruleType} rule`,
        childId
      );
    }
  } catch (e) {
    console.warn('Failed to log RULE_CREATED', e);
  }

  return data as Rule;
}

export async function deleteRule(ruleId: string) {
  // Fetch child_id and family_id before deleting
  let familyId = null;
  let childId = null;
  try {
    const { data: rule } = await supabase.from('rules').select('child_id').eq('id', ruleId).single();
    if (rule?.child_id) {
      childId = rule.child_id;
      const { data: child } = await supabase.from('children').select('family_id').eq('id', rule.child_id).single();
      familyId = child?.family_id;
    }
  } catch (e) {
    console.warn('Failed to fetch rule info for audit logging', e);
  }

  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw error;

  if (familyId) {
    await logParentAction(familyId, 'RULE_REMOVED', `Removed a rule`, childId);
  }
}
