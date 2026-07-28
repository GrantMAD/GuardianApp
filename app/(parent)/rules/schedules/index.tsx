import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getSchedules, deleteSchedule, toggleSchedule } from '@/services/scheduleService';
import { ScheduleCard } from '@/components/ui/ScheduleCard';

export default function ScheduleListScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const data = await getSchedules(selectedChildId);
      setSchedules(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <View>
          <TouchableOpacity onPress={() => router.back()} className="mb-2">
            <Text className="text-text-muted text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Schedules</Text>
          <Text className="text-text-muted text-sm">Timed app blocking windows</Text>
        </View>
        <TouchableOpacity
          id="btn-create-schedule"
          onPress={() => router.push('/(parent)/rules/schedules/create')}
          className="bg-accent w-12 h-12 rounded-full items-center justify-center"
        >
          <Text className="text-white text-2xl font-light">+</Text>
        </TouchableOpacity>
      </View>

      {/* Preset suggestions */}
      <View className="px-5 mt-3 mb-1">
        <Text className="text-text-muted text-xs font-medium mb-2">QUICK PRESETS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              onPress={() => router.push({ pathname: '/(parent)/rules/schedules/create', params: p })}
              className="bg-bg-elevated border border-border rounded-xl px-4 py-2.5 mr-2"
            >
              <Text className="text-sm">{p.emoji}</Text>
              <Text className="text-text-primary text-xs font-medium mt-0.5">{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5 mt-3">
        {loading ? (
          <ActivityIndicator color="#7C6AF5" className="mt-8" />
        ) : schedules.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🕐</Text>
            <Text className="text-text-primary font-semibold mb-1">No schedules yet</Text>
            <Text className="text-text-muted text-sm text-center mb-6">
              Create a schedule to automatically block apps during school or bedtime.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent)/rules/schedules/create')}
              className="bg-accent px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggle={(id, active) => toggleSchedule(id, active).then(load)}
              onDelete={(id) => deleteSchedule(id).then(load)}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

const PRESETS = [
  { label: 'Bedtime',   emoji: '🌙', name: 'Bedtime',     start_time: '21:00', end_time: '07:00', scope: 'all' },
  { label: 'School',    emoji: '🏫', name: 'School Hours', start_time: '08:00', end_time: '15:30', scope: 'all' },
  { label: 'Homework',  emoji: '📚', name: 'Homework',    start_time: '16:00', end_time: '18:00', scope: 'category' },
];
