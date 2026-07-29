import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { DayToggle } from '@/components/ui/DayToggle';
import type { Schedule } from '@/utils/scheduleEvaluator';

interface ScheduleFormProps {
  childId: string;
  initialValues?: Partial<Schedule>;
  onSave: (schedule: Omit<Schedule, 'id' | 'is_active'>) => void;
  onCancel: () => void;
}

export function ScheduleForm({
  childId,
  initialValues,
  onSave,
  onCancel,
}: ScheduleFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [days, setDays] = useState<number[]>(initialValues?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(initialValues?.start_time ?? '21:00');
  const [endTime, setEndTime] = useState(initialValues?.end_time ?? '07:00');
  const [scheduleType, setScheduleType] = useState<'block' | 'allow_only'>(
    initialValues?.block_type ?? 'block'
  );
  
  // Stubs for time pickers (using raw text inputs for Phase 1 MVP)
  // Phase 2 will replace these with @react-native-community/datetimepicker

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      child_id: childId,
      name: name.trim(),
      days_of_week: days,
      start_time: startTime,
      end_time: endTime,
      block_type: scheduleType,
      scope: initialValues?.scope ?? 'all',
    });
  };

  return (
    <ScrollView className="bg-bg-elevated p-6 rounded-2xl gap-y-6">
      <View>
        <Text className="text-text-primary font-semibold text-lg mb-4">
          {initialValues ? 'Edit Schedule' : 'New Schedule'}
        </Text>
        
        <Text className="text-text-muted text-sm mb-2">Schedule Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bedtime, School Hours"
          placeholderTextColor="#9090A8"
          className="bg-bg-card text-text-primary p-4 rounded-xl text-base mb-6"
        />
      </View>

      <View>
        <Text className="text-text-muted text-sm mb-3">Days Active</Text>
        <DayToggle selectedDays={days} onChange={setDays} />
      </View>

      <View className="flex-row justify-between gap-x-4">
        <View className="flex-1">
          <Text className="text-text-muted text-sm mb-2">Start Time (HH:MM)</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="21:00"
            placeholderTextColor="#9090A8"
            className="bg-bg-card text-text-primary p-4 rounded-xl text-base text-center"
          />
        </View>
        <View className="flex-1">
          <Text className="text-text-muted text-sm mb-2">End Time (HH:MM)</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="07:00"
            placeholderTextColor="#9090A8"
            className="bg-bg-card text-text-primary p-4 rounded-xl text-base text-center"
          />
        </View>
      </View>

      <View>
        <Text className="text-text-muted text-sm mb-3">Behavior</Text>
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => setScheduleType('block')}
            className={`px-3 py-1.5 rounded-full border ${
              scheduleType === 'block' ? 'bg-accent/20 border-accent' : 'bg-bg-elevated border-border'
            }`}
          >
            <Text className={`text-sm font-medium ${scheduleType === 'block' ? 'text-accent-light' : 'text-text-primary'}`}>Block Device</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setScheduleType('allow_only')}
            className={`px-3 py-1.5 rounded-full border ${
              scheduleType === 'allow_only' ? 'bg-accent/20 border-accent' : 'bg-bg-elevated border-border'
            }`}
          >
            <Text className={`text-sm font-medium ${scheduleType === 'allow_only' ? 'text-accent-light' : 'text-text-primary'}`}>Allow Only</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-text-muted text-xs mt-2">
          {scheduleType === 'block'
            ? 'Device is completely locked during these hours.'
            : 'Only specific apps can be used during these hours.'}
        </Text>
      </View>

      <View className="flex-row justify-end gap-x-4 mt-6">
        <TouchableOpacity
          onPress={onCancel}
          className="px-6 py-3 rounded-xl bg-bg-card"
        >
          <Text className="text-text-primary font-medium">Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || days.length === 0}
          className={`px-6 py-3 rounded-xl ${
            name.trim() && days.length > 0 ? 'bg-accent' : 'bg-bg-card opacity-50'
          }`}
        >
          <Text className="text-white font-medium">Save Schedule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
