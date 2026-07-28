import { supabase } from './supabase';

export interface UsageLog {
  id: string;
  child_id: string;
  app_id: string;
  date: string; // YYYY-MM-DD
  usage_minutes: number;
  last_used_at: string | null;
}

export interface DailyScreenTime {
  child_id: string;
  child_name: string;
  family_id: string;
  date: string; // YYYY-MM-DD
  total_minutes: number;
  apps_used: number;
}

export async function getDailyUsage(childId: string, date: string) {
  const { data, error } = await supabase
    .from('app_usage_logs')
    .select(`
      *,
      installed_apps(package_name, app_name, category, icon_url)
    `)
    .eq('child_id', childId)
    .eq('date', date)
    .order('usage_minutes', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDailyScreenTimeSummary(childId: string, date: string) {
  const { data, error } = await supabase
    .from('v_daily_screen_time')
    .select('*')
    .eq('child_id', childId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data as DailyScreenTime | null;
}

export async function getInstalledApps(childId: string) {
  const { data, error } = await supabase
    .from('installed_apps')
    .select('*')
    .eq('child_id', childId)
    .eq('is_visible', true)
    .order('app_name');

  if (error) throw error;
  return data;
}
