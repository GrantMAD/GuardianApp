import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getInstalledApps, getDailyUsage } from '@/services/usageService';
import { getRules } from '@/services/ruleService';
import { AppCard } from '@/components/ui/AppCard';
import { CategoryChip } from '@/components/ui/CategoryChip';
import type { AppCategory } from '@/constants/categories';
import { APP_CATEGORIES } from '@/constants/categories';

type RuleStatus = 'blocked' | 'limited' | 'scheduled' | 'none';

export default function AppListScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [apps, setApps]           = useState<any[]>([]);
  const [usage, setUsage]         = useState<Record<string, number>>({});
  const [rules, setRules]         = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState<AppCategory | 'all'>('all');
  const [loading, setLoading]     = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!selectedChildId) return;
    (async () => {
      setLoading(true);
      try {
        const [installedApps, usageLogs, activeRules] = await Promise.all([
          getInstalledApps(selectedChildId),
          getDailyUsage(selectedChildId, today),
          getRules(selectedChildId),
        ]);
        setApps(installedApps ?? []);
        setRules(activeRules ?? []);
        const usageMap: Record<string, number> = {};
        (usageLogs ?? []).forEach((u: any) => { usageMap[u.app_id] = u.usage_minutes; });
        setUsage(usageMap);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedChildId]);

  const getRuleStatus = (appId: string): RuleStatus => {
    const appRules = rules.filter((r) => r.app_id === appId);
    if (appRules.some((r) => r.rule_type === 'BLOCK'))       return 'blocked';
    if (appRules.some((r) => r.rule_type === 'TIME_LIMIT'))  return 'limited';
    return 'none';
  };

  const filtered = apps.filter((a) => {
    const matchSearch = a.app_name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === 'all' || a.category === category;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-text-primary text-2xl font-bold mb-3">Installed Apps</Text>
        <TextInput
          id="search-apps"
          value={search}
          onChangeText={setSearch}
          placeholder="Search apps…"
          placeholderTextColor="#9090A8"
          className="bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary text-base"
        />
      </View>

      {/* Category chips */}
      <View className="h-10 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row items-center px-5">
          <TouchableOpacity
            onPress={() => setCategory('all')}
            className={`px-4 py-2 rounded-full mr-2 border ${category === 'all' ? 'bg-accent/20 border-accent' : 'bg-bg-elevated border-border'}`}
          >
            <Text className={`text-sm font-medium ${category === 'all' ? 'text-accent-light' : 'text-text-primary'}`}>All</Text>
          </TouchableOpacity>
          {APP_CATEGORIES.map((c) => (
            <CategoryChip
              key={c.value}
              category={c.value}
              isSelected={category === c.value}
              onPress={() => setCategory(category === c.value ? 'all' : c.value)}
            />
          ))}
        </View>
      </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#7C6AF5" className="mt-8" />
      ) : (
        <ScrollView className="flex-1 px-5 pt-1">
          {filtered.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-text-muted text-sm">
                {apps.length === 0 ? 'No apps synced yet from child device.' : 'No apps match your search.'}
              </Text>
            </View>
          ) : (
            filtered.map((app) => (
              <AppCard
                key={app.id}
                appName={app.app_name}
                packageName={app.package_name}
                iconUrl={app.icon_url}
                category={app.category}
                todayMinutes={usage[app.id] ?? 0}
                ruleStatus={getRuleStatus(app.id)}
                onPress={() => router.push(`/(parent)/apps/${app.id}`)}
              />
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
