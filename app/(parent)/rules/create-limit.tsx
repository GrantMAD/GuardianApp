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
import { APP_CATEGORIES, AppCategory } from '@/constants/categories';
import Toast from 'react-native-toast-message';
import BackButton from '@/components/ui/BackButton';

export default function CreateTimeLimitScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [limitMins, setLimitMins]   = useState(60);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [weeklyLimitMins, setWeeklyLimitMins] = useState(300);
  const [mode, setMode]             = useState<'app' | 'category'>('app');
  const [appId, setAppId]           = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | undefined>();
  const [apps, setApps]             = useState<any[]>([]);
  const [appSearch, setAppSearch]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);

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
    if (!selectedChildId) { Toast.show({ type: 'error', text1: 'Validation Error', text2: 'No child selected.' }); return; }
    if (weeklyEnabled && weeklyLimitMins < limitMins) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Weekly limit must be ≥ daily limit.' });
      return;
    }
    setLoading(true);
    try {
      const appIdParam = mode === 'app' ? appId : undefined;
      const categoryParam = mode === 'category' ? selectedCategory : undefined;
      await createRule(
        selectedChildId,
        'TIME_LIMIT',
        appIdParam,
        categoryParam,
        limitMins,
        weeklyEnabled ? weeklyLimitMins : undefined,
      );
      Toast.show({ type: 'success', text1: 'Time Limit Created', text2: `Set to ${formatMinutes(limitMins)}.` });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Creation Failed', text2: e.message ?? 'Failed to create rule.' });
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
        <BackButton onPress={() => router.back()} />

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

        {/* Weekly budget toggle */}
        <View className="bg-bg-card rounded-2xl p-5 border border-border mb-5">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: weeklyEnabled ? 16 : 0 }}>
            <View>
              <Text className="text-text-primary font-semibold text-sm">📅 Weekly budget</Text>
              <Text className="text-text-muted text-xs mt-0.5">Cap total usage across the week</Text>
            </View>
            <TouchableOpacity
              id="toggle-weekly-budget"
              onPress={() => setWeeklyEnabled((v) => !v)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: weeklyEnabled ? '#7C6AF5' : 'rgba(255,255,255,0.1)',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#fff',
                  alignSelf: weeklyEnabled ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
          </View>

          {weeklyEnabled && (
            <>
              <Text className="text-text-muted text-sm mb-1">Weekly limit</Text>
              <Text className="text-accent text-3xl font-bold mb-4">{formatMinutes(weeklyLimitMins)}</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={30}
                maximumValue={3360}
                step={30}
                value={weeklyLimitMins}
                onValueChange={setWeeklyLimitMins}
                minimumTrackTintColor="#818CF8"
                maximumTrackTintColor="#2A2A3E"
                thumbTintColor="#818CF8"
              />
              <View className="flex-row justify-between mt-1">
                <Text className="text-text-muted text-xs">30 min</Text>
                <Text className="text-text-muted text-xs">56 hours</Text>
              </View>
              {weeklyLimitMins < limitMins && (
                <Text style={{ color: '#F59E0B', fontSize: 11, marginTop: 8 }}>
                  ⚠️ Weekly limit should be at least as large as the daily limit.
                </Text>
              )}
            </>
          )}
        </View>

        {/* App selector */}
        <Text className="text-text-muted text-sm font-medium mb-2">Apply to (optional)</Text>
        <Text className="text-text-muted text-xs mb-2">Leave blank to apply to ALL apps.</Text>
        
        <View className="flex-row bg-bg-elevated rounded-xl p-1 mb-6 mt-2">
          <TouchableOpacity 
            onPress={() => setMode('app')}
            className={`flex-1 items-center py-2 rounded-lg ${mode === 'app' ? 'bg-bg-card shadow-sm border border-border/50' : ''}`}
          >
            <Text className={`font-semibold ${mode === 'app' ? 'text-text-primary' : 'text-text-muted'}`}>Specific App</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMode('category')}
            className={`flex-1 items-center py-2 rounded-lg ${mode === 'category' ? 'bg-bg-card shadow-sm border border-border/50' : ''}`}
          >
            <Text className={`font-semibold ${mode === 'category' ? 'text-text-primary' : 'text-text-muted'}`}>App Category</Text>
          </TouchableOpacity>
        </View>

        {mode === 'app' ? (
          <>
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
          </>
        ) : (
          <>
            {APP_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setSelectedCategory(c.value === selectedCategory ? undefined : c.value)}
                className={`px-4 py-3 rounded-xl mb-2 flex-row items-center border ${
                  selectedCategory === c.value ? 'bg-accent/10 border-accent/40' : 'bg-bg-elevated border-border'
                }`}
              >
                <Text className="text-xl mr-3">{c.emoji}</Text>
                <Text className="text-text-primary flex-1">{c.label}</Text>
                {selectedCategory === c.value && <Text className="text-accent font-bold">✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

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
