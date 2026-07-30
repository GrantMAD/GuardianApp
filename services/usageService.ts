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

export async function syncInstalledApps(childId: string) {
  // Import dynamically to avoid web issues if we add web support later
  const UsageStatsModule = (await import('@/modules/android/UsageStatsModule')).default;
  if (!UsageStatsModule) return;

  const apps = await UsageStatsModule.getInstalledApps();
  if (!apps || apps.length === 0) return;

  const updates = apps.map(app => ({
    child_id: childId,
    package_name: app.packageName,
    app_name: app.appName,
    category: 'other', // Default category
    is_system_app: false,
    is_visible: true,
  }));

  // Upsert apps (requires a UNIQUE constraint on child_id + package_name)
  const { error } = await supabase
    .from('installed_apps')
    .upsert(updates, { onConflict: 'child_id,package_name' });
    
  if (error) console.error('Error syncing installed apps:', error);
}

export async function syncUsageStats(childId: string) {
  const UsageStatsModule = (await import('@/modules/android/UsageStatsModule')).default;
  if (!UsageStatsModule) return;

  // We only sync today's stats for now
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  
  const stats = await UsageStatsModule.getUsageStats(startOfDay.getTime(), endOfDay.getTime());
  if (!stats || stats.length === 0) return;

  // 1. Get installed apps to map package_name to app_id
  const { data: installedApps, error: appsError } = await supabase
    .from('installed_apps')
    .select('id, package_name')
    .eq('child_id', childId);

  if (appsError || !installedApps) {
    console.error('Error fetching installed apps for sync:', appsError);
    return;
  }

  const appMap = new Map(installedApps.map(a => [a.package_name, a.id]));

  // 2. Push usage for each mapped app
  const today = startOfDay.toISOString().slice(0, 10);
  
  for (const stat of stats) {
    const appId = appMap.get(stat.packageName);
    if (!appId) continue; // App not in DB yet

    const usageMinutes = Math.floor(stat.totalTimeInForeground / 60000);
    if (usageMinutes <= 0) continue;

    const lastUsed = new Date(stat.lastTimeUsed).toISOString();

    const { error } = await supabase.rpc('upsert_app_usage', {
      p_child_id: childId,
      p_app_id: appId,
      p_date: today,
      p_usage_minutes: usageMinutes,
      p_last_used_at: lastUsed
    });

    if (error) console.error(`Error syncing usage for ${stat.packageName}:`, error);
  }
}
