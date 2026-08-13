import { supabase } from './supabase';
import {
  aggregateByCategory,
  type UsageLogWithApp,
  type CategoryTotal,
} from '@/utils/usageHelpers';

export interface PeriodUsageSummary {
  date: string;
  total_minutes: number;
  logs: UsageLogWithApp[];
}

export interface TopAppEntry {
  app_id: string;
  app_name: string;
  category: string;
  icon_url: string | null;
  total_minutes: number;
}

export interface AuditLogEntry {
  id: string;
  family_id: string;
  parent_id: string;
  child_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Fetches 7 days of usage logs for a child starting from startDate (YYYY-MM-DD).
 * Returns one entry per date with the logs and daily total.
 */
export async function getWeeklyUsage(
  childId: string,
  startDate: string,
  days: number = 7
): Promise<PeriodUsageSummary[]> {
  const { data, error } = await supabase
    .from('app_usage_logs')
    .select(`
      *,
      installed_apps(package_name, app_name, category, icon_url)
    `)
    .eq('child_id', childId)
    .gte('date', startDate)
    .lte('date', new Date(new Date(startDate).getTime() + (days - 1) * 86400000).toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('usage_minutes', { ascending: false });

  if (error) throw error;

  const logs = (data ?? []) as UsageLogWithApp[];

  // Group by date
  const byDate = new Map<string, UsageLogWithApp[]>();
  for (const log of logs) {
    const existing = byDate.get(log.date) ?? [];
    existing.push(log);
    byDate.set(log.date, existing);
  }

  return Array.from(byDate.entries()).map(([date, dayLogs]) => ({
    date,
    total_minutes: dayLogs.reduce((s, l) => s + l.usage_minutes, 0),
    logs: dayLogs,
  }));
}

/**
 * Fetches usage logs for a full calendar month.
 * @param year  e.g. 2026
 * @param month e.g. 7 (July)
 */
export async function getMonthlyUsage(
  childId: string,
  year: number,
  month: number
): Promise<PeriodUsageSummary[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate   = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  const { data, error } = await supabase
    .from('app_usage_logs')
    .select(`
      *,
      installed_apps(package_name, app_name, category, icon_url)
    `)
    .eq('child_id', childId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('usage_minutes', { ascending: false });

  if (error) throw error;

  const logs = (data ?? []) as UsageLogWithApp[];

  const byDate = new Map<string, UsageLogWithApp[]>();
  for (const log of logs) {
    const existing = byDate.get(log.date) ?? [];
    existing.push(log);
    byDate.set(log.date, existing);
  }

  return Array.from(byDate.entries()).map(([date, dayLogs]) => ({
    date,
    total_minutes: dayLogs.reduce((s, l) => s + l.usage_minutes, 0),
    logs: dayLogs,
  }));
}

/**
 * Returns a category breakdown for a specific date using aggregateByCategory.
 */
export async function getCategoryBreakdown(
  childId: string,
  date: string
): Promise<CategoryTotal[]> {
  const { data, error } = await supabase
    .from('app_usage_logs')
    .select(`
      *,
      installed_apps(package_name, app_name, category, icon_url)
    `)
    .eq('child_id', childId)
    .eq('date', date);

  if (error) throw error;
  return aggregateByCategory((data ?? []) as UsageLogWithApp[]);
}

/**
 * Returns the top N apps by total usage between startDate and endDate (inclusive).
 */
export async function getTopAppsForPeriod(
  childId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopAppEntry[]> {
  const { data, error } = await supabase
    .from('app_usage_logs')
    .select(`
      app_id,
      usage_minutes,
      installed_apps(app_name, category, icon_url)
    `)
    .eq('child_id', childId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  // Aggregate by app_id
  const totals = new Map<string, TopAppEntry>();
  for (const row of data ?? []) {
    const existing = totals.get(row.app_id);
    const app = (row.installed_apps as any) ?? {};
    if (existing) {
      existing.total_minutes += row.usage_minutes;
    } else {
      totals.set(row.app_id, {
        app_id:        row.app_id,
        app_name:      app.app_name  ?? 'Unknown',
        category:      app.category  ?? 'other',
        icon_url:      app.icon_url  ?? null,
        total_minutes: row.usage_minutes,
      });
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.total_minutes - a.total_minutes)
    .slice(0, limit);
}

/**
 * Fetches the parent activity audit log for a family, most recent first.
 */
export async function getAuditLog(
  familyId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('parent_audit_log')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AuditLogEntry[];
}
