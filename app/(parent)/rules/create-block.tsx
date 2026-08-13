import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { createRule } from '@/services/ruleService';
import { getInstalledApps } from '@/services/usageService';
import { APP_CATEGORIES, AppCategory } from '@/constants/categories';
import Toast from 'react-native-toast-message';
import BackButton from '@/components/ui/BackButton';

export default function CreateBlockRuleScreen() {
  const router = useRouter();
  const { selectedChildId } = useFamilyStore();

  const [apps, setApps]         = useState<any[]>([]);
  const [mode, setMode]         = useState<'app' | 'category'>('app');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | undefined>();
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [appsLoaded, setAppsLoaded] = useState(false);

  const loadApps = async () => {
    if (!selectedChildId || appsLoaded) return;
    try {
      const data = await getInstalledApps(selectedChildId);
      setApps(data ?? []);
      setAppsLoaded(true);
    } catch {}
  };

  useEffect(() => { loadApps(); }, []);

  const handleSave = async () => {
    if (!selectedChildId) { Toast.show({ type: 'error', text1: 'Validation Error', text2: 'No child selected.' }); return; }
    setLoading(true);
    try {
      const appIdParam = mode === 'app' ? selectedId : undefined;
      const categoryParam = mode === 'category' ? selectedCategory : undefined;
      await createRule(selectedChildId, 'BLOCK', appIdParam, categoryParam);
      
      const successText = mode === 'category' && selectedCategory 
        ? `Category blocked.` 
        : (selectedApp ? `${selectedApp.app_name} blocked.` : 'All apps blocked.');
        
      Toast.show({ type: 'success', text1: 'Rule Created', text2: successText });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Creation Failed', text2: e.message ?? 'Failed to create rule.' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = apps.filter((a) =>
    a.app_name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedApp = apps.find((a) => a.id === selectedId);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        <BackButton onPress={() => router.back()} />

        <Text className="text-2xl mb-4 text-center">🔒</Text>
        <Text className="text-text-primary text-2xl font-bold mb-1 text-center">Block an App</Text>
        <Text className="text-text-muted text-sm mb-8 text-center">
          The child cannot open this app until the block is removed.
        </Text>

        <View className="flex-row bg-bg-elevated rounded-xl p-1 mb-6">
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
            {/* Selected app banner */}
            {selectedApp ? (
              <View className="flex-row items-center bg-danger/10 border border-danger/40 rounded-xl px-4 py-3 mb-4 justify-between">
                <Text className="text-danger font-semibold">🚫 {selectedApp.app_name}</Text>
                <TouchableOpacity onPress={() => setSelectedId(undefined)}>
                  <Text className="text-text-muted text-xs">Clear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-bg-card border border-dashed border-border rounded-xl px-4 py-3 mb-4">
                <Text className="text-text-muted text-sm text-center">
                  No app selected — will block ALL apps
                </Text>
              </View>
            )}

            {/* Search */}
            <TextInput
              id="search-app-to-block"
              value={search}
              onChangeText={setSearch}
              placeholder="Search apps…"
              placeholderTextColor="#9090A8"
              className="bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary text-base mb-3"
            />

            {filtered.slice(0, 12).map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setSelectedId(a.id === selectedId ? undefined : a.id)}
                className={`px-4 py-3 rounded-xl mb-2 flex-row items-center justify-between border ${
                  selectedId === a.id ? 'bg-danger/10 border-danger/40' : 'bg-bg-elevated border-border'
                }`}
              >
                <Text className="text-text-primary">{a.app_name}</Text>
                {selectedId === a.id && <Text className="text-danger font-bold">✓</Text>}
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
                  selectedCategory === c.value ? 'bg-danger/10 border-danger/40' : 'bg-bg-elevated border-border'
                }`}
              >
                <Text className="text-xl mr-3">{c.emoji}</Text>
                <Text className="text-text-primary flex-1">{c.label}</Text>
                {selectedCategory === c.value && <Text className="text-danger font-bold">✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          id="btn-save-block"
          onPress={handleSave}
          disabled={loading}
          className="bg-danger py-4 rounded-2xl items-center mt-6 mb-8"
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-bold text-base">
              {mode === 'category' 
                ? (selectedCategory ? `Block Category` : 'Block All Apps')
                : (selectedApp ? `Block ${selectedApp.app_name}` : 'Block All Apps')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
