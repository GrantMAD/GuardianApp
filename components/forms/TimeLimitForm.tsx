import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatMinutes } from '@/utils/formatTime';

interface TimeLimitFormProps {
  childId: string;
  appId?: string;
  category?: string;
  initialMinutes?: number;
  onSave: (minutes: number) => void;
  onCancel: () => void;
}

export function TimeLimitForm({
  childId,
  appId,
  category,
  initialMinutes = 60,
  onSave,
  onCancel,
}: TimeLimitFormProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [enableWeekly, setEnableWeekly] = useState(false);
  
  // Example steps: 0, 15, 30, 45, 60, ... up to 480 (8 hours)
  const step = 15;
  const maxMinutes = 480;

  return (
    <View className="bg-bg-elevated p-6 rounded-2xl gap-y-6">
      <View>
        <Text className="text-text-primary font-semibold text-lg mb-1">
          {appId ? 'App Time Limit' : category ? 'Category Time Limit' : 'Time Limit'}
        </Text>
        <Text className="text-text-muted text-sm">
          Set the maximum daily usage allowed.
        </Text>
      </View>

      <View className="items-center py-4">
        <Text className="text-accent text-4xl font-bold mb-6">
          {formatMinutes(minutes)}
        </Text>
        
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={maxMinutes}
          step={step}
          value={minutes}
          onValueChange={setMinutes}
          minimumTrackTintColor="#7C6AF5"
          maximumTrackTintColor="#3A3A52"
          thumbTintColor="#7C6AF5"
        />
        <View className="w-full flex-row justify-between px-2 mt-2">
          <Text className="text-text-muted text-xs">0h</Text>
          <Text className="text-text-muted text-xs">8h</Text>
        </View>
      </View>

      <View className="bg-bg-card p-4 rounded-xl flex-row justify-between items-center">
        <View>
          <Text className="text-text-primary font-medium">Weekly Budget</Text>
          <Text className="text-text-muted text-xs mt-1">Optional overall limit</Text>
        </View>
        <Switch
          value={enableWeekly}
          onValueChange={setEnableWeekly}
          trackColor={{ false: '#3A3A52', true: '#7C6AF5' }}
          thumbColor={enableWeekly ? '#FFFFFF' : '#9090A8'}
        />
      </View>

      <View className="flex-row justify-end gap-x-4 mt-4">
        <TouchableOpacity
          onPress={onCancel}
          className="px-6 py-3 rounded-xl bg-bg-card"
        >
          <Text className="text-text-primary font-medium">Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onSave(minutes)}
          disabled={minutes === 0}
          className={`px-6 py-3 rounded-xl ${
            minutes > 0 ? 'bg-accent' : 'bg-bg-card opacity-50'
          }`}
        >
          <Text className="text-white font-medium">Save Limit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
