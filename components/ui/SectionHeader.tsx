import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  description?: string;
}

export function SectionHeader({ title, icon, actionLabel, onAction, description }: SectionHeaderProps) {
  return (
    <View className="my-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          {icon && <Text className="text-xl mr-2">{icon}</Text>}
          <Text className="text-text-primary text-lg font-bold">{title}</Text>
        </View>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction}>
            <Text className="text-accent text-sm font-bold">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {description && (
        <Text className="text-text-muted text-sm mt-1">{description}</Text>
      )}
    </View>
  );
}
