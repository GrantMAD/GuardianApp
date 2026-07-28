import type { AppCategory } from '@/constants/categories';

export interface Schedule {
  id: string;
  child_id: string;
  name: string;
  days_of_week: number[];   // 0=Sun … 6=Sat
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
  scope: 'all' | 'category' | 'specific_apps';
  category?: AppCategory;
  app_ids?: string[];
  block_type: 'block' | 'allow_only';
  is_active: boolean;
}

/**
 * Returns true if the given schedule is active right now.
 * Uses the device's local time (family timezone enforcement
 * is handled server-side via Edge Functions).
 */
export function isScheduleActive(schedule: Schedule, now: Date = new Date()): boolean {
  if (!schedule.is_active) return false;

  const dayOfWeek = now.getDay(); // 0=Sun
  if (!schedule.days_of_week.includes(dayOfWeek)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = schedule.start_time.split(':').map(Number);
  const [endH, endM]     = schedule.end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes   = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Given a list of schedules and an app (by package or category),
 * returns whether that app is currently blocked by any schedule.
 */
export function isAppBlockedBySchedule(
  schedules: Schedule[],
  packageName: string,
  category: AppCategory,
  appId: string,
): boolean {
  return schedules.some((s) => {
    if (!isScheduleActive(s)) return false;
    if (s.block_type !== 'block') return false;

    if (s.scope === 'all') return true;
    if (s.scope === 'category' && s.category === category) return true;
    if (s.scope === 'specific_apps' && s.app_ids?.includes(appId)) return true;
    return false;
  });
}
