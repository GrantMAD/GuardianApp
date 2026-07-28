import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center my-4">
      <Text className="text-text-primary text-lg font-bold">{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-accent text-sm font-medium">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
