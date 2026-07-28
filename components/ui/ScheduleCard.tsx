import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import type { Schedule } from '@/utils/scheduleEvaluator';
import { isScheduleActive } from '@/utils/scheduleEvaluator';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface ScheduleCardProps {
  schedule: Schedule;
  onToggle?: (scheduleId: string, isActive: boolean) => void;
  onDelete?: (scheduleId: string) => void;
}

export function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  const isNowActive = isScheduleActive(schedule);

  return (
    <View className="bg-bg-card p-4 rounded-2xl border border-border mb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{schedule.name}</Text>
          {isNowActive && (
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-success mr-1.5" />
              <Text className="text-success text-xs font-medium">Active now</Text>
            </View>
          )}
        </View>
        <Switch
          value={schedule.is_active}
          onValueChange={(v) => onToggle?.(schedule.id, v)}
          trackColor={{ false: '#2A2A3E', true: '#7C6AF5' }}
          thumbColor="#F1F1F5"
        />
      </View>

      {/* Time */}
      <Text className="text-accent font-semibold text-sm mb-2">
        {schedule.start_time} – {schedule.end_time}
      </Text>

      {/* Days */}
      <View className="flex-row gap-x-1 mb-2">
        {DAY_LABELS.map((d, i) => (
          <View
            key={i}
            className={`w-7 h-7 rounded-full items-center justify-center ${
              schedule.days_of_week.includes(i) ? 'bg-accent' : 'bg-bg-elevated'
            }`}
          >
            <Text className={`text-xs font-medium ${schedule.days_of_week.includes(i) ? 'text-white' : 'text-text-muted'}`}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Scope */}
      <View className="flex-row items-center justify-between">
        <Text className="text-text-muted text-xs capitalize">
          {schedule.block_type === 'block' ? '🚫' : '✅'}{' '}
          {schedule.scope === 'all' ? 'All apps' : schedule.scope === 'category' ? schedule.category : 'Specific apps'}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(schedule.id)}>
            <Text className="text-danger text-xs font-medium">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
