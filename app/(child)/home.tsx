import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Modal, TextInput,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgentStore } from '@/store/agentStore';
import { useFamilyStore } from '@/store/familyStore';
import { getRules } from '@/services/ruleService';
import { getSchedules } from '@/services/scheduleService';
import { getDailyUsage, getInstalledApps } from '@/services/usageService';
import { supabase } from '@/services/supabase';
import { TimeRing } from '@/components/ui/TimeRing';
import { formatMinutes } from '@/utils/formatTime';
import { isScheduleActive, isAppBlockedBySchedule } from '@/utils/scheduleEvaluator';
import AppBlockerModule from '@/modules/android/AppBlockerModule';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getTodayApprovedExtraMinutes } from '@/services/permissionRequestService';
import { isSetupComplete } from '@/app/(child)/setup';
import { useRouter } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(childId: string) {
  if (!Device.isDevice) return;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Update supabase
  await supabase.from('children').update({ push_token: token }).eq('id', childId);
}

export default function ChildHomeScreen() {
  const router = useRouter();
  const { setActiveRules, setActiveSchedules, activeRules, activeSchedules } = useAgentStore();
  const { selectedChildId, children } = useFamilyStore();

  // Setup guard — redirect to wizard if permissions not yet configured
  useEffect(() => {
    if (Platform.OS === 'android') {
      isSetupComplete().then((done) => {
        if (!done) router.replace('/(child)/setup');
      });
    }
  }, []);

  const [usageData, setUsageData]   = useState<any[]>([]);
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const previouslyBlockedPackages = useRef<Set<string>>(new Set());
  const warnedApps = useRef<Set<string>>(new Set());
  
  const [refreshing, setRefreshing] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState(0);

  const child = children.find((c) => c.id === selectedChildId);
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    if (!selectedChildId) return;
    try {
      const [rules, schedules, usage, apps, approvedMins] = await Promise.all([
        getRules(selectedChildId),
        getSchedules(selectedChildId),
        getDailyUsage(selectedChildId, today),
        getInstalledApps(selectedChildId),
        getTodayApprovedExtraMinutes(selectedChildId),
      ]);
      setActiveRules(rules ?? []);
      setActiveSchedules(schedules ?? []);
      setUsageData(usage ?? []);
      setInstalledApps(apps ?? []);
      setExtraMinutes(approvedMins);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  // Register push notifications
  useEffect(() => {
    if (selectedChildId) {
      registerForPushNotificationsAsync(selectedChildId);
    }
  }, [selectedChildId]);

  // Polling loop for sync & Realtime listener
  useEffect(() => {
    if (!selectedChildId) return;
    
    // Initial sync
    import('@/services/usageService').then(({ syncInstalledApps, syncUsageStats }) => {
      syncInstalledApps(selectedChildId).then(() => {
        syncUsageStats(selectedChildId);
        load();
      });
    });

    const interval = setInterval(() => {
      import('@/services/usageService').then(({ syncUsageStats }) => {
        syncUsageStats(selectedChildId).then(() => {
          load(); // reload UI
        });
      });
    }, 60000); // 60 seconds

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'permission_requests',
          filter: `child_id=eq.${selectedChildId}`,
        },
        (payload) => {
          if (payload.new.status === 'approved') {
            load(); // Reload rules and extra minutes
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedChildId]);

  const enforceBlocks = () => {
    if (!installedApps.length || !selectedChildId) return;

    const currentlyBlockedPackages = new Set<string>();

    installedApps.forEach((app) => {
      const { id: appId, package_name: packageName, category } = app;
      let isBlocked = false;

      // 1. Evaluate Manual Blocks
      const blockRule = activeRules.find((r) => r.app_id === appId && r.rule_type === 'BLOCK');
      if (blockRule) isBlocked = true;

      // 2. Evaluate Time Limits
      if (!isBlocked) {
        const timeRule = activeRules.find((r) => r.app_id === appId && r.rule_type === 'TIME_LIMIT');
        if (timeRule) {
          const usage = usageData.find((u) => u.app_id === appId);
          const usedMinutes = usage?.usage_minutes ?? 0;
          const limit = (timeRule.daily_limit_minutes ?? 0) + extraMinutes;
          
          if (limit > 0 && usedMinutes >= limit) {
            isBlocked = true;
          } else if (limit > 0 && (limit - usedMinutes) === 10) {
            if (!warnedApps.current.has(appId)) {
               Notifications.scheduleNotificationAsync({
                 content: {
                   title: "Time Limit Warning",
                   body: `You have 10 minutes left on ${app.app_name}`,
                 },
                 trigger: null,
               });
               warnedApps.current.add(appId);
            }
          }
        }
      }

      // 3. Evaluate Schedules
      if (!isBlocked) {
        if (isAppBlockedBySchedule(activeSchedules, packageName, category, appId)) {
          isBlocked = true;
        }
      }

      if (isBlocked) {
        currentlyBlockedPackages.add(packageName);
      }
    });

    // Native Sync
    const prevBlocked = previouslyBlockedPackages.current;
    
    // Find newly blocked apps
    for (const pkg of currentlyBlockedPackages) {
      if (!prevBlocked.has(pkg)) {
        AppBlockerModule.blockApp(pkg);
      }
    }

    // Find newly unblocked apps
    for (const pkg of prevBlocked) {
      if (!currentlyBlockedPackages.has(pkg)) {
        AppBlockerModule.unblockApp(pkg);
      }
    }

    previouslyBlockedPackages.current = currentlyBlockedPackages;
  };

  useEffect(() => {
    enforceBlocks();
  }, [activeRules, activeSchedules, usageData, installedApps, extraMinutes]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSendRequest = async () => {
    if (!selectedChildId) return;
    setSendingRequest(true);
    try {
      await supabase.from('permission_requests').insert({
        child_id: selectedChildId,
        request_type: 'extra_time',
        message: requestMsg.trim() || null,
        status: 'pending',
      });
      setShowRequest(false);
      setRequestMsg('');
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 3000);
    } finally {
      setSendingRequest(false);
    }
  };

  // Apps with a time limit rule
  const limitedApps = usageData.filter((u: any) => {
    const rule = activeRules.find((r) => r.app_id === u.app_id && r.rule_type === 'TIME_LIMIT');
    return !!rule;
  });

  // Apps that are outright blocked
  const blockedApps = activeRules
    .filter((r) => r.rule_type === 'BLOCK')
    .map((r) => r.app_id);

  // Apps blocked by an active schedule
  const scheduledBlock = activeSchedules.some((s) => isScheduleActive(s));

  const greeting = `Hi ${child?.name ?? 'there'} 👋`;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6AF5" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-text-primary text-2xl font-bold">{greeting}</Text>
          <Text className="text-text-muted text-sm mt-0.5">Here's your screen time today</Text>
        </View>

        {/* Schedule banner */}
        {scheduledBlock && (
          <View className="mx-5 mt-3 bg-danger/10 border border-danger/40 rounded-2xl p-4 flex-row items-center">
            <Text className="text-xl mr-3">🕐</Text>
            <View>
              <Text className="text-danger font-semibold text-sm">Restriction active</Text>
              <Text className="text-text-muted text-xs">Apps are blocked by a schedule right now.</Text>
            </View>
          </View>
        )}

        {/* Request sent banner */}
        {requestSent && (
          <View className="mx-5 mt-3 bg-success/10 border border-success/40 rounded-2xl p-4">
            <Text className="text-success font-semibold text-sm">✅ Request sent to your parent!</Text>
          </View>
        )}

        {/* Time rings grid */}
        {limitedApps.length > 0 ? (
          <View className="px-5 mt-4">
            <Text className="text-text-muted text-xs font-medium mb-3">REMAINING TIME</Text>
            <View className="flex-row flex-wrap gap-4">
              {limitedApps.map((u: any) => {
                const rule = activeRules.find((r) => r.app_id === u.app_id && r.rule_type === 'TIME_LIMIT');
                return (
                  <View key={u.app_id} className="w-24 items-center">
                    <TimeRing
                      usedMinutes={u.usage_minutes ?? 0}
                      limitMinutes={(rule?.daily_limit_minutes ?? 60) + extraMinutes}
                      size={88}
                      label={u.installed_apps?.app_name ?? 'App'}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="mx-5 mt-4 bg-bg-card rounded-2xl p-5 border border-border items-center">
            <Text className="text-2xl mb-2">✅</Text>
            <Text className="text-text-primary font-semibold text-sm">No time limits set</Text>
            <Text className="text-text-muted text-xs text-center mt-1">
              Your parent hasn't set any app time limits yet.
            </Text>
          </View>
        )}

        {/* Blocked apps */}
        {blockedApps.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-text-muted text-xs font-medium mb-3">BLOCKED APPS</Text>
            {activeRules.filter((r) => r.rule_type === 'BLOCK').map((r) => (
              <View key={r.id} className="flex-row items-center bg-bg-card rounded-xl p-3 border border-danger/30 mb-2">
                <Text className="text-danger mr-3">🔒</Text>
                <Text className="text-text-primary text-sm flex-1">
                  {r.app_id ? 'Specific App' : 'All Apps'} — blocked by parent
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Floating Ask Parent button */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <TouchableOpacity
          id="btn-ask-parent"
          onPress={() => setShowRequest(true)}
          className="bg-accent px-8 py-4 rounded-full shadow-lg flex-row items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white mr-2 text-lg">💬</Text>
          <Text className="text-white font-bold text-base">Ask Parent</Text>
        </TouchableOpacity>
      </View>

      {/* Request modal */}
      <Modal visible={showRequest} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-bg-elevated rounded-t-3xl p-6">
            <Text className="text-text-primary text-lg font-bold mb-1">Ask for more time</Text>
            <Text className="text-text-muted text-sm mb-4">
              Your parent will get a notification with your request.
            </Text>
            <TextInput
              id="input-request-message"
              value={requestMsg}
              onChangeText={setRequestMsg}
              placeholder="Add a message (optional)…"
              placeholderTextColor="#9090A8"
              multiline
              numberOfLines={3}
              className="bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary text-base mb-4"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={() => setShowRequest(false)}
                className="flex-1 border border-border py-4 rounded-2xl items-center"
              >
                <Text className="text-text-muted font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                id="btn-send-request"
                onPress={handleSendRequest}
                disabled={sendingRequest}
                className="flex-1 bg-accent py-4 rounded-2xl items-center"
              >
                {sendingRequest ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold">Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
