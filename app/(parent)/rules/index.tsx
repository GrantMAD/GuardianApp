import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getRules, deleteRule } from '@/services/ruleService';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatMinutes } from '@/utils/formatTime';

export default function RulesScreen() {
  const router = useRouter();
  const { selectedChildId, children } = useFamilyStore();
  const [rules, setRules]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const data = await getRules(selectedChildId);
      setRules(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const timeLimits = rules.filter((r) => r.rule_type === 'TIME_LIMIT');
  const blockRules = rules.filter((r) => r.rule_type === 'BLOCK');

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        <Text className="text-text-primary text-2xl font-bold pt-4 pb-1">Rules</Text>
        {selectedChild && (
          <Text className="text-text-muted text-sm mb-4">for {selectedChild.name}</Text>
        )}

        {/* Create buttons */}
        <View className="flex-row gap-x-3 mb-2">
          <TouchableOpacity
            id="btn-create-limit"
            onPress={() => router.push('/(parent)/rules/create-limit')}
            className="flex-1 bg-accent/20 border border-accent/40 rounded-2xl p-4 items-center"
          >
            <Text className="text-xl mb-1">⏱️</Text>
            <Text className="text-accent font-semibold text-sm">Time Limit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            id="btn-create-block"
            onPress={() => router.push('/(parent)/rules/create-block')}
            className="flex-1 bg-danger/10 border border-danger/30 rounded-2xl p-4 items-center"
          >
            <Text className="text-xl mb-1">🔒</Text>
            <Text className="text-danger font-semibold text-sm">Block App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            id="btn-schedules"
            onPress={() => router.push('/(parent)/rules/schedules')}
            className="flex-1 bg-bg-card border border-border rounded-2xl p-4 items-center"
          >
            <Text className="text-xl mb-1">🕐</Text>
            <Text className="text-text-primary font-semibold text-sm">Schedules</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#7C6AF5" className="mt-8" />
        ) : (
          <>
            {/* Time Limits */}
            <SectionHeader title={`Time Limits (${timeLimits.length})`} />
            {timeLimits.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">No time limits set</Text>
            ) : timeLimits.map((r) => (
              <View key={r.id} className="bg-bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-text-primary font-semibold">
                    {r.app_id ? 'Specific App' : r.category ?? 'All Apps'}
                  </Text>
                  <Text className="text-warning text-sm">{formatMinutes(r.daily_limit_minutes)} / day</Text>
                </View>
                <TouchableOpacity onPress={() => deleteRule(r.id).then(load)}>
                  <Text className="text-danger text-sm font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Block Rules */}
            <SectionHeader title={`Blocked Apps (${blockRules.length})`} />
            {blockRules.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">No apps blocked</Text>
            ) : blockRules.map((r) => (
              <View key={r.id} className="bg-bg-card rounded-2xl p-4 border border-danger/30 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-text-primary font-semibold">{r.app_id ? 'App' : r.category ?? 'All Apps'}</Text>
                  <Text className="text-danger text-sm">Blocked</Text>
                </View>
                <TouchableOpacity onPress={() => deleteRule(r.id).then(load)}>
                  <Text className="text-danger text-sm font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
