import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StatusBar, ActivityIndicator, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getDailyUsage, getInstalledApps } from '@/services/usageService';
import { getRules, createRule, deleteRule } from '@/services/ruleService';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { UsageBarChart } from '@/components/ui/UsageBarChart';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TimeRing } from '@/components/ui/TimeRing';
import { formatMinutes } from '@/utils/formatTime';
import { KNOWN_ICONS } from '@/constants/appIcons';
import BackButton from '@/components/ui/BackButton';

export default function AppDetailScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [rules, setRules]     = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [todayMins, setTodayMins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [showDeleteLimit, setShowDeleteLimit] = useState(false);

  const loadData = async () => {
    if (!selectedChildId || !appId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [allRules, todayUsage, installedApps] = await Promise.all([
        getRules(selectedChildId),
        getDailyUsage(selectedChildId, today),
        getInstalledApps(selectedChildId),
      ]);
      const appRules = allRules.filter((r) => r.app_id === appId);
      setRules(appRules);
      const todayEntry = todayUsage?.find((u: any) => u.app_id === appId);
      setTodayMins(todayEntry?.usage_minutes ?? 0);
      
      const info = installedApps?.find((a: any) => a.id === appId);
      if (info) setAppInfo(info);

      // Build last 7 days chart data
      const bars: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en', { weekday: 'short' });
        bars.push({ label, minutes: i === 0 ? (todayEntry?.usage_minutes ?? 0) : 0 });
      }
      setWeekData(bars);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [appId]);

  const timeLimit = rules.find((r) => r.rule_type === 'TIME_LIMIT');
  const isBlocked = rules.some((r) => r.rule_type === 'BLOCK');

  const handleToggleBlock = async () => {
    if (!selectedChildId) return;

    if (isBlocked) {
      const blockRule = rules.find((r) => r.rule_type === 'BLOCK');
      if (!blockRule) return;
      await deleteRule(blockRule.id);
      setRules((prev) => prev.filter((r) => r.id !== blockRule.id));
    } else {
      const newRule = await createRule(selectedChildId, 'BLOCK', appId);
      setRules((prev) => [...prev, newRule]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#7C6AF5" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        {/* Back */}
        <View className="mb-4">
          <BackButton onPress={() => router.push('/(parent)/apps')} />
        </View>

        {/* App header */}
        <View className="flex-row items-center bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <View className="w-14 h-14 rounded-xl bg-bg-elevated items-center justify-center mr-4">
            {(appInfo?.icon_url || KNOWN_ICONS[appInfo?.package_name]) ? (
              <Image
                source={{ uri: appInfo?.icon_url || KNOWN_ICONS[appInfo?.package_name] }}
                style={{ width: 44, height: 44, borderRadius: 10 }}
              />
            ) : (
              <Text className="text-text-primary text-2xl font-bold">
                {(appInfo?.app_name ?? '?').charAt(0)}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-lg">{appInfo?.app_name ?? 'Unknown App'}</Text>
            <Text className="text-text-muted text-xs capitalize">{appInfo?.category ?? 'other'}</Text>
          </View>
        </View>

        {/* Today ring + stats */}
        {timeLimit && (
          <View className="items-center mb-4">
            <TimeRing
              usedMinutes={todayMins}
              limitMinutes={timeLimit.daily_limit_minutes}
              size={120}
              label="remaining today"
            />
            <Text className="text-text-muted text-sm mt-2">
              {formatMinutes(todayMins)} used of {formatMinutes(timeLimit.daily_limit_minutes)} limit
            </Text>
          </View>
        )}

        {/* Weekly chart */}
        <SectionHeader
          title="Last 7 Days"
          icon="📆"
          description="Review the child\u2019s usage trend over the last week."
        />
        <View className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <UsageBarChart data={weekData} />
        </View>

        {/* Rules */}
        <SectionHeader
          title="Rules"
          icon="🛡️"
          description="Manage blocking and time limit rules for this app."
          actionLabel="Add Limit"
          onAction={() => router.push('/(parent)/rules/create-limit')}
        />

        {/* Block toggle */}
        <View className="bg-bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-text-primary font-semibold">Block App</Text>
            <Text className="text-text-muted text-xs mt-0.5">Child cannot open this app</Text>
          </View>
          <Switch
            value={isBlocked}
            onValueChange={handleToggleBlock}
            trackColor={{ false: '#2A2A3E', true: '#EF4444' }}
            thumbColor="#F1F1F5"
          />
        </View>

        {/* Time limit rule */}
        {timeLimit ? (
          <View className="bg-bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-text-primary font-semibold">Daily Limit</Text>
              <Text className="text-accent text-sm font-medium">{formatMinutes(timeLimit.daily_limit_minutes)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDeleteLimit(true)}>
              <Text className="text-danger text-sm font-medium">Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-bg-card rounded-2xl p-4 border border-dashed border-border mb-3 items-center">
            <Text className="text-text-muted text-sm">No time limit set</Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent)/rules/create-limit')}
              className="mt-2"
            >
              <Text className="text-accent text-sm font-medium">+ Add Time Limit</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
      <ConfirmModal
        visible={showDeleteLimit}
        title="Delete Rule"
        message="Are you sure you want to delete this time limit?"
        onConfirm={() => timeLimit && deleteRule(timeLimit.id).then(loadData)}
        onCancel={() => setShowDeleteLimit(false)}
      />
    </SafeAreaView>
  );
}
