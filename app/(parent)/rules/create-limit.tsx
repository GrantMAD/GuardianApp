import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useFamilyStore } from '@/store/familyStore';
import { createRule } from '@/services/ruleService';
import { getInstalledApps } from '@/services/usageService';
import { formatMinutes } from '@/utils/formatTime';

export default function CreateTimeLimitScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [limitMins, setLimitMins]   = useState(60);
  const [appId, setAppId]           = useState<string | undefined>();
  const [apps, setApps]             = useState<any[]>([]);
  const [appSearch, setAppSearch]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError]           = useState('');

  const loadApps = async () => {
    if (!selectedChildId || apps.length > 0) return;
    setAppsLoading(true);
    try {
      const data = await getInstalledApps(selectedChildId);
      setApps(data ?? []);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChildId) { setError('No child selected.'); return; }
    setLoading(true);
    setError('');
    try {
      await createRule(selectedChildId, 'TIME_LIMIT', appId, undefined, limitMins);
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create rule.');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = apps.filter((a) =>
    a.app_name.toLowerCase().includes(appSearch.toLowerCase())
  );
  const selectedApp = apps.find((a) => a.id === appId);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5" onScrollBeginDrag={loadApps}>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
          <Text className="text-text-muted text-base">← Back</Text>
        </TouchableOpacity>

        <Text className="text-text-primary text-2xl font-bold mb-1">Set Time Limit</Text>
        <Text className="text-text-muted text-sm mb-8">Choose an app and set a daily usage limit.</Text>

        {/* Limit slider */}
        <View className="bg-bg-card rounded-2xl p-5 border border-border mb-5">
          <Text className="text-text-muted text-sm mb-1">Daily limit</Text>
          <Text className="text-accent text-4xl font-bold mb-4">{formatMinutes(limitMins)}</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={480}
            step={5}
            value={limitMins}
            onValueChange={setLimitMins}
            minimumTrackTintColor="#7C6AF5"
            maximumTrackTintColor="#2A2A3E"
            thumbTintColor="#7C6AF5"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-text-muted text-xs">5 min</Text>
            <Text className="text-text-muted text-xs">8 hours</Text>
          </View>
        </View>

        {/* App selector */}
        <Text className="text-text-muted text-sm font-medium mb-2">Apply to (optional)</Text>
        <Text className="text-text-muted text-xs mb-2">Leave blank to apply to ALL apps.</Text>

        {selectedApp && (
          <View className="flex-row items-center bg-accent/10 border border-accent/40 rounded-xl px-4 py-3 mb-3 justify-between">
            <Text className="text-accent font-semibold">{selectedApp.app_name}</Text>
            <TouchableOpacity onPress={() => setAppId(undefined)}>
              <Text className="text-text-muted text-xs">Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          id="search-app-for-limit"
          value={appSearch}
          onChangeText={(t) => { setAppSearch(t); loadApps(); }}
          onFocus={loadApps}
          placeholder="Search for an app…"
          placeholderTextColor="#9090A8"
          className="bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary text-base mb-2"
        />
        {appsLoading && <ActivityIndicator color="#7C6AF5" />}
        {!appsLoading && filteredApps.slice(0, 8).map((a) => (
          <TouchableOpacity
            key={a.id}
            onPress={() => { setAppId(a.id); setAppSearch(a.app_name); }}
            className="px-4 py-3 bg-bg-elevated rounded-xl mb-1 flex-row items-center"
          >
            <Text className="text-text-primary flex-1">{a.app_name}</Text>
            {appId === a.id && <Text className="text-accent">✓</Text>}
          </TouchableOpacity>
        ))}

        {error ? (
          <View className="bg-danger/20 border border-danger/40 rounded-xl p-3 mt-4">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          id="btn-save-limit"
          onPress={handleSave}
          disabled={loading}
          className="bg-accent py-4 rounded-2xl items-center mt-6 mb-8"
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-bold text-base">Save Limit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
