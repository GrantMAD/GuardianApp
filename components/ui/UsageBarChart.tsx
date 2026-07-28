import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/constants/theme';
import { formatMinutes } from '@/utils/formatTime';

interface BarData {
  label: string;
  minutes: number;
  color?: string;
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

        return (
          <View key={index} className="flex-row items-center">
            {/* Label */}
            <Text
              className="text-text-muted text-xs w-20"
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
