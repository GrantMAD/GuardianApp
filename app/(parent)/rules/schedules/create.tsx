import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { createSchedule } from '@/services/scheduleService';
import { DayToggle } from '@/components/ui/DayToggle';

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [name, setName]           = useState('');
  const [days, setDays]           = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [startTime, setStartTime] = useState('21:00');
  const [endTime, setEndTime]     = useState('07:00');
  const [scope, setScope]         = useState<'all' | 'category' | 'specific_apps'>('all');
  const [blockType, setBlockType] = useState<'block' | 'allow_only'>('block');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSave = async () => {
    if (!selectedChildId) { setError('No child selected.'); return; }
    if (!name.trim())    { setError('Please enter a schedule name.'); return; }
    if (days.length === 0) { setError('Select at least one day.'); return; }

    setLoading(true);
    setError('');
    try {
      await createSchedule({
        child_id: selectedChildId,
        name: name.trim(),
        days_of_week: days,
        start_time: startTime,
        end_time: endTime,
        scope,
        block_type: blockType,
      });
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
          <Text className="text-text-muted text-base">← Back</Text>
        </TouchableOpacity>

        <Text className="text-text-primary text-2xl font-bold mb-1">New Schedule</Text>
        <Text className="text-text-muted text-sm mb-8">Block apps automatically during a time window.</Text>

        {/* Name */}
        <Text className="text-text-muted text-sm font-medium mb-2">Schedule name</Text>
        <TextInput
          id="input-schedule-name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bedtime, School Hours"
          placeholderTextColor="#9090A8"
          className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6"
        />

        {/* Days */}
        <Text className="text-text-muted text-sm font-medium mb-3">Days of week</Text>
        <DayToggle selectedDays={days} onChange={setDays} />

        {/* Time range */}
        <Text className="text-text-muted text-sm font-medium mb-3 mt-6">Time window</Text>
        <View className="flex-row gap-x-3 mb-6">
          <View className="flex-1">
            <Text className="text-text-muted text-xs mb-1">Start</Text>
            <TextInput
              id="input-start-time"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor="#9090A8"
              className="bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary text-base text-center"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View className="items-center justify-end pb-3">
            <Text className="text-text-muted text-lg">–</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-muted text-xs mb-1">End</Text>
            <TextInput
              id="input-end-time"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor="#9090A8"
              className="bg-bg-card border border-border rounded-xl px-4 py-3 text-text-primary text-base text-center"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        {/* Block type */}
        <Text className="text-text-muted text-sm font-medium mb-3">Restriction type</Text>
        <View className="flex-row gap-x-3 mb-6">
          {([['block', '🚫 Block apps'], ['allow_only', '✅ Allow only']] as const).map(([val, label]) => (
            <TouchableOpacity
              key={val}
              onPress={() => setBlockType(val)}
              className={`flex-1 py-3 rounded-xl border items-center ${
                blockType === val ? 'bg-accent/20 border-accent' : 'bg-bg-elevated border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${blockType === val ? 'text-accent-light' : 'text-text-muted'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scope */}
        <Text className="text-text-muted text-sm font-medium mb-3">Apply to</Text>
        <View className="gap-y-2 mb-8">
          {([
            ['all',            '📱 All apps'],
            ['category',       '🗂️  App category'],
            ['specific_apps',  '🎯 Specific apps'],
          ] as const).map(([val, label]) => (
            <TouchableOpacity
              key={val}
              onPress={() => setScope(val)}
              className={`px-4 py-3 rounded-xl border flex-row items-center justify-between ${
                scope === val ? 'bg-accent/20 border-accent' : 'bg-bg-elevated border-border'
              }`}
            >
              <Text className={`text-sm font-medium ${scope === val ? 'text-accent-light' : 'text-text-primary'}`}>
                {label}
              </Text>
              {scope === val && <Text className="text-accent">✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View className="bg-danger/20 border border-danger/40 rounded-xl p-3 mb-4">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          id="btn-save-schedule"
          onPress={handleSave}
          disabled={loading}
          className="bg-accent py-4 rounded-2xl items-center mb-8"
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-bold text-base">Save Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
