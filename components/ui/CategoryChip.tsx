import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { APP_CATEGORIES, AppCategory } from '@/constants/categories';

interface CategoryChipProps {
  category: AppCategory;
  isSelected?: boolean;
  onPress?: (category: AppCategory) => void;
}

export function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  const catInfo = APP_CATEGORIES.find((c) => c.value === category);
  if (!catInfo) return null;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(category)}
      disabled={!onPress}
      className={`px-3 py-1.5 rounded-full flex-row items-center mr-2 border ${
        isSelected
          ? 'bg-accent/20 border-accent'
          : 'bg-bg-elevated border-border'
      }`}
    >
      <Text className="mr-1">{catInfo.emoji}</Text>
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-accent-light' : 'text-text-primary'
        }`}
      >
        {catInfo.label}
      </Text>
    </TouchableOpacity>
  );
}
