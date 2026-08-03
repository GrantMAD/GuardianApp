import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { RuleBadge } from './RuleBadge';
import { formatMinutes } from '@/utils/formatTime';
import { KNOWN_ICONS } from '@/constants/appIcons';

type RuleStatus = 'blocked' | 'limited' | 'scheduled' | 'none';

interface AppCardProps {
  appName: string;
  packageName: string;
  iconUrl?: string | null;
  category?: string;
  todayMinutes: number;
  ruleStatus: RuleStatus;
  onPress?: () => void;
}

export function AppCard({
  appName,
  packageName,
  iconUrl,
  category,
  todayMinutes,
  ruleStatus,
  onPress,
}: AppCardProps) {
  const initial = appName.charAt(0).toUpperCase();
  const resolvedIcon = iconUrl || (packageName ? KNOWN_ICONS[packageName] : null);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center bg-bg-card p-4 rounded-2xl border border-border mb-2"
    >
      {/* App Icon */}
      <View className="w-12 h-12 rounded-xl bg-bg-elevated items-center justify-center mr-3">
        {resolvedIcon ? (
          <Image source={{ uri: resolvedIcon }} className="w-10 h-10 rounded-lg" />
        ) : (
          <Text className="text-text-primary font-bold text-lg">{initial}</Text>
        )}
      </View>

      {/* Name + usage */}
      <View className="flex-1">
        <Text className="text-text-primary font-semibold text-base" numberOfLines={1}>
          {appName}
        </Text>
        <Text className="text-text-muted text-xs mt-0.5">
          Today: {formatMinutes(todayMinutes)}
        </Text>
      </View>

      {/* Rule badge */}
      <RuleBadge status={ruleStatus} />
    </TouchableOpacity>
  );
}
