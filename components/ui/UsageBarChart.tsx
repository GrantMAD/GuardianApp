import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/theme';
import { KNOWN_ICONS } from '@/constants/appIcons';
import { formatMinutes } from '@/utils/formatTime';

interface BarData {
  label: string;
  minutes: number;
  color?: string;
  iconUrl?: string;
  packageName?: string;
}

interface UsageBarChartProps {
  data: BarData[];
  maxMinutes?: number;
}

export function UsageBarChart({ data, maxMinutes }: UsageBarChartProps) {
  const max = maxMinutes ?? Math.max(...data.map((d) => d.minutes), 1);

  return (
    <View className="gap-y-3">
      {data.map((item, index) => {
        const fraction = Math.min(item.minutes / max, 1);
        const barColor = item.color ?? COLORS.accent;
        const resolvedIcon = item.iconUrl || (item.packageName ? KNOWN_ICONS[item.packageName] : null);

        return (
          <View key={index} className="flex-row items-center">
            {/* Icon */}
            {resolvedIcon ? (
              <Image source={{ uri: resolvedIcon }} className="w-5 h-5 mr-2 rounded-md" />
            ) : (
              <View className="w-5 h-5 mr-2 rounded-md bg-bg-elevated items-center justify-center">
                <Text className="text-[10px] text-text-muted font-bold">
                  {item.label.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* Label */}
            <Text
              className="text-text-muted text-xs w-16"
              numberOfLines={1}
            >
              {item.label}
            </Text>

            {/* Bar track */}
            <View className="flex-1 h-4 bg-bg-elevated rounded-full mx-2 overflow-hidden">
              <View
                style={{
                  width: `${fraction * 100}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: 999,
                }}
              />
            </View>

            {/* Value */}
            <Text className="text-text-muted text-xs w-12 text-right">
              {formatMinutes(item.minutes)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
