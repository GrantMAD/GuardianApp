/**
 * Format a number of minutes into a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45m", 0 → "0m"
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format seconds into a compact string.
 * e.g. 3661 → "1h 1m"
 */
export function formatSeconds(seconds: number): string {
  return formatMinutes(Math.floor(seconds / 60));
}

/**
 * Return the fraction of usage vs limit (0–1), clamped.
 */
export function usageFraction(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(used / limit, 1);
}

/**
 * Return a colour token based on usage fraction.
 */
export function usageColor(fraction: number): string {
  if (fraction >= 1)   return '#EF4444'; // danger
  if (fraction >= 0.9) return '#EF4444'; // danger
  if (fraction >= 0.5) return '#F59E0B'; // warning
  return '#22C55E';                       // success
}
