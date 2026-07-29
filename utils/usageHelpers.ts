import type { AppCategory } from '@/constants/categories';

// Shape returned by getDailyUsage (with joined installed_apps)
export interface UsageLogWithApp {
  id: string;
  child_id: string;
  app_id: string;
  date: string;
  usage_minutes: number;
  last_used_at: string | null;
  installed_apps: {
    package_name: string;
    app_name: string;
    category: AppCategory;
    icon_url: string | null;
  } | null;
}

export interface CategoryTotal {
  category: AppCategory;
  totalMinutes: number;
}

export interface ChartDataPoint {
  app_name: string;
  usage_minutes: number;
  category: AppCategory;
  icon_url: string | null;
}

export interface UsageDelta {
  delta: number;     // raw minute difference (positive = more today)
  percent: number;   // percentage change (0 if yesterday was 0)
}

/**
 * Groups usage logs by app category and returns total minutes per category,
 * sorted descending by totalMinutes.
 */
export function aggregateByCategory(logs: UsageLogWithApp[]): CategoryTotal[] {
  const map = new Map<AppCategory, number>();

  for (const log of logs) {
    const category = (log.installed_apps?.category ?? 'other') as AppCategory;
    map.set(category, (map.get(category) ?? 0) + log.usage_minutes);
  }

  return Array.from(map.entries())
    .map(([category, totalMinutes]) => ({ category, totalMinutes }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Returns the top N apps by usage_minutes, sorted descending.
 */
export function getTopApps(logs: UsageLogWithApp[], n: number = 5): UsageLogWithApp[] {
  return [...logs]
    .sort((a, b) => b.usage_minutes - a.usage_minutes)
    .slice(0, n);
}

/**
 * Sums all usage_minutes across a set of logs.
 */
export function getTotalMinutes(logs: UsageLogWithApp[]): number {
  return logs.reduce((sum, log) => sum + log.usage_minutes, 0);
}

/**
 * Calculates the screen time delta between two days.
 * @param todayMinutes  Total minutes today
 * @param yesterdayMinutes  Total minutes yesterday
 */
export function getUsageDelta(
  todayMinutes: number,
  yesterdayMinutes: number
): UsageDelta {
  const delta = todayMinutes - yesterdayMinutes;
  const percent =
    yesterdayMinutes === 0 ? 0 : Math.round((delta / yesterdayMinutes) * 100);
  return { delta, percent };
}

/**
 * Normalises usage logs into the shape expected by the UsageBarChart component.
 * Sorted descending by usage_minutes.
 */
export function formatUsageForChart(logs: UsageLogWithApp[]): ChartDataPoint[] {
  return [...logs]
    .sort((a, b) => b.usage_minutes - a.usage_minutes)
    .map((log) => ({
      app_name:      log.installed_apps?.app_name ?? 'Unknown',
      usage_minutes: log.usage_minutes,
      category:      (log.installed_apps?.category ?? 'other') as AppCategory,
      icon_url:      log.installed_apps?.icon_url ?? null,
    }));
}

/**
 * Returns a human-readable label for a usage delta.
 * e.g. "+45m more than yesterday" or "15m less than yesterday"
 */
export function formatDeltaLabel(delta: UsageDelta): string {
  if (delta.delta === 0) return 'Same as yesterday';
  const sign = delta.delta > 0 ? '+' : '';
  const mins = Math.abs(delta.delta);
  const hrs  = Math.floor(mins / 60);
  const rem  = mins % 60;
  const time = hrs > 0 ? `${hrs}h ${rem}m` : `${mins}m`;
  return `${sign}${time} ${delta.delta > 0 ? 'more' : 'less'} than yesterday`;
}
