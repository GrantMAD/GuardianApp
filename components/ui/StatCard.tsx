import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string;
  delta?: string; // e.g. "+15m vs yesterday"
  isPositiveDelta?: boolean;
}

export function StatCard({ label, value, delta, isPositiveDelta }: StatCardProps) {
  return (
    <View className="bg-bg-card p-4 rounded-2xl flex-1 border border-border">
      <Text className="text-text-muted text-sm mb-1 font-medium">{label}</Text>
      <Text className="text-text-primary text-2xl font-bold">{value}</Text>
      {delta && (
        <Text className={`text-xs mt-1 ${isPositiveDelta ? 'text-danger' : 'text-success'}`}>
          {delta}
        </Text>
      )}
    </View>
  );
}
