import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatMinutes, usageColor, usageFraction } from '@/utils/formatTime';

interface TimeRingProps {
  usedMinutes: number;
  limitMinutes: number;
  size?: number;
  label?: string;
}

export function TimeRing({
  usedMinutes,
  limitMinutes,
  size = 80,
  label,
}: TimeRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = usageFraction(usedMinutes, limitMinutes);
  const strokeDashoffset = circumference * (1 - fraction);
  const color = usageColor(fraction);

  const remainingMinutes = Math.max(limitMinutes - usedMinutes, 0);

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2A2A3E"
            strokeWidth={6}
            fill="transparent"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={6}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        {/* Centre text */}
        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
            {formatMinutes(remainingMinutes)}
          </Text>
        </View>
      </View>
      {label && (
        <Text className="text-text-muted text-xs mt-1 text-center" numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
}
