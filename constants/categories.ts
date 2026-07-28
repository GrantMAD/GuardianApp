export const APP_CATEGORIES = [
  { value: 'social',         label: 'Social Media',   emoji: '💬' },
  { value: 'games',          label: 'Games',           emoji: '🎮' },
  { value: 'education',      label: 'Education',       emoji: '📚' },
  { value: 'entertainment',  label: 'Entertainment',   emoji: '🎬' },
  { value: 'productivity',   label: 'Productivity',    emoji: '⚡' },
  { value: 'communication',  label: 'Communication',   emoji: '📞' },
  { value: 'utilities',      label: 'Utilities',       emoji: '🔧' },
  { value: 'other',          label: 'Other',           emoji: '📱' },
] as const;

export type AppCategory = typeof APP_CATEGORIES[number]['value'];

export const CATEGORY_COLORS: Record<AppCategory, string> = {
  social:        '#7C6AF5',
  games:         '#EF4444',
  education:     '#22C55E',
  entertainment: '#F59E0B',
  productivity:  '#4ECDC4',
  communication: '#3B82F6',
  utilities:     '#9090A8',
  other:         '#6B7280',
};
