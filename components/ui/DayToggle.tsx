import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DayToggleProps {
  selectedDays: number[]; // 0=Sun … 6=Sat
  onChange: (days: number[]) => void;
}

export function DayToggle({ selectedDays, onChange }: DayToggleProps) {
  const toggle = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort();
    onChange(next);
  };

  return (
    <View className="flex-row justify-between">
      {DAY_LABELS.map((label, index) => {
        const selected = selectedDays.includes(index);
        return (
          <TouchableOpacity
            key={index}
            onPress={() => toggle(index)}
            className={`w-10 h-10 rounded-full items-center justify-center border ${
              selected
                ? 'bg-accent border-accent'
                : 'bg-bg-elevated border-border'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? 'text-white' : 'text-text-muted'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
