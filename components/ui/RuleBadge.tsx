import React from 'react';
import { Text, View } from 'react-native';

type RuleStatus = 'blocked' | 'limited' | 'scheduled' | 'none';

interface RuleBadgeProps {
  status: RuleStatus;
}

const config: Record<RuleStatus, { label: string; bg: string; text: string }> = {
  blocked:   { label: '🔴 Blocked',   bg: 'bg-danger/20',   text: 'text-danger' },
  limited:   { label: '🟡 Limited',   bg: 'bg-warning/20',  text: 'text-warning' },
  scheduled: { label: '🕐 Scheduled', bg: 'bg-accent/20',   text: 'text-accent-light' },
  none:      { label: '✅ No Rule',   bg: 'bg-success/20',  text: 'text-success' },
};

export function RuleBadge({ status }: RuleBadgeProps) {
  const c = config[status];
  return (
    <View className={`px-2.5 py-1 rounded-full ${c.bg}`}>
      <Text className={`text-xs font-semibold ${c.text}`}>{c.label}</Text>
    </View>
  );
}
