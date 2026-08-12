import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Modal, TextInput,
  ActivityIndicator, Platform, Image,
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
  const [requestAppId, setRequestAppId] = useState<string | null>(null);
  const [requestMinutes, setRequestMinutes] = useState(15);
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
        app_id: requestAppId,
        extra_minutes: requestMinutes,
        message: requestMsg.trim() || null,
        status: 'pending',
      });
      setShowRequest(false);
      setRequestMsg('');
      setRequestAppId(null);
      setRequestMinutes(15);
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 3000);
    } finally {
      setSendingRequest(false);
    }
  };

  // Apps that have any active restriction (TIME_LIMIT or BLOCK)
  const restrictedApps = installedApps.filter((app: any) =>
    activeRules.some((r) => r.app_id === app.id)
  );

  // Apps with a time limit rule — derived from rules so 0-usage apps still appear
  const limitedApps = activeRules
    .filter((r) => r.rule_type === 'TIME_LIMIT' && r.app_id)
    .map((r) => {
      const appInfo = installedApps.find((a: any) => a.id === r.app_id);
      const usage = usageData.find((u: any) => u.app_id === r.app_id);
      return {
        app_id: r.app_id,
        app_name: appInfo?.app_name ?? 'App',
        usage_minutes: usage?.usage_minutes ?? 0,
        daily_limit_minutes: r.daily_limit_minutes,
      };
    });

  // Apps that are outright blocked
  const blockedApps = activeRules
    .filter((r) => r.rule_type === 'BLOCK')
    .map((r) => r.app_id);

  // Apps blocked by an active schedule
  const scheduledBlock = activeSchedules.some((s) => isScheduleActive(s));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return `Good morning`;
    if (h < 18) return `Good afternoon`;
    return `Good evening`;
  };
  const childName = child?.name ?? 'there';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Build blocked app rows with icon info
  const blockedAppRows = activeRules
    .filter((r) => r.rule_type === 'BLOCK' && r.app_id)
    .map((r) => {
      const appInfo = installedApps.find((a: any) => a.id === r.app_id);
      return { ruleId: r.id, app_name: appInfo?.app_name ?? 'App', icon_url: appInfo?.icon_url ?? null };
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6AF5" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ──────────────────────────────── */}
        <View
          style={{
            backgroundColor: 'transparent',
          }}
          className="px-5 pt-6 pb-5"
        >
          <View
            style={{
              borderRadius: 24,
              padding: 20,
              backgroundColor: '#1A1730',
              borderWidth: 1,
              borderColor: 'rgba(124,106,245,0.25)',
            }}
          >
            {/* Avatar + greeting row */}
            <View className="flex-row items-center mb-3">
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(124,106,245,0.2)',
                  borderWidth: 2,
                  borderColor: 'rgba(124,106,245,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 22 }}>👤</Text>
              </View>
              <View className="flex-1">
                <Text style={{ color: '#9B8FF7', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
                  {greeting().toUpperCase()}
                </Text>
                <Text className="text-text-primary text-xl font-bold">{childName} 👋</Text>
              </View>
            </View>
            <Text style={{ color: 'rgba(144,144,168,0.8)', fontSize: 12 }}>{dateStr}</Text>

            {/* Schedule banner inline */}
            {scheduledBlock && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.3)',
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🕐</Text>
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                  Apps blocked by schedule right now
                </Text>
              </View>
            )}

            {/* Request sent banner */}
            {requestSent && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(34,197,94,0.3)',
                  padding: 10,
                }}
              >
                <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>
                  ✅ Request sent to your parent!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Time Limits ──────────────────────────────── */}
        {limitedApps.length > 0 ? (
          <View className="px-5 mb-2">
            <Text
              style={{ color: '#9090A8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}
            >
              SCREEN TIME LIMITS
            </Text>
            {limitedApps.map((item: any) => {
              const limit = (item.daily_limit_minutes ?? 60) + extraMinutes;
              const used = item.usage_minutes;
              const remaining = Math.max(limit - used, 0);
              const fraction = limit > 0 ? Math.min(used / limit, 1) : 0;
              const pct = Math.round(fraction * 100);
              const barColor = fraction >= 1 ? '#EF4444' : fraction >= 0.75 ? '#F59E0B' : '#7C6AF5';

              // Find the full app info for the icon
              const appInfo = installedApps.find((a: any) => a.id === item.app_id);

              return (
                <View
                  key={item.app_id}
                  style={{
                    backgroundColor: '#1A1730',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)',
                    padding: 16,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* App icon */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: 'rgba(124,106,245,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                      overflow: 'hidden',
                    }}
                  >
                    {appInfo?.icon_url ? (
                      <Image
                        source={{ uri: appInfo.icon_url }}
                        style={{ width: 52, height: 52, borderRadius: 14 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 26 }}>📱</Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                        {item.app_name}
                      </Text>
                      <Text style={{ color: '#9090A8', fontSize: 12 }}>
                        {formatMinutes(remaining)} left
                      </Text>
                    </View>

                    {/* Progress bar */}
                    <View
                      style={{
                        height: 6,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          width: `${pct}%`,
                          backgroundColor: barColor,
                          borderRadius: 3,
                        }}
                      />
                    </View>

                    <Text style={{ color: '#9090A8', fontSize: 11 }}>
                      {formatMinutes(used)} used · {formatMinutes(limit)} limit
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: '#1A1730',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 8 }}>✅</Text>
            <Text style={{ color: '#E8E8F0', fontWeight: '700', fontSize: 15 }}>No time limits</Text>
            <Text style={{ color: '#9090A8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Your parent hasn't set any app time limits yet.
            </Text>
          </View>
        )}

        {/* ── Blocked Apps ─────────────────────────────── */}
        {blockedAppRows.length > 0 && (
          <View className="px-5 mb-2">
            <Text
              style={{ color: '#9090A8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}
            >
              BLOCKED APPS
            </Text>
            {blockedAppRows.map((row) => (
              <View
                key={row.ruleId}
                style={{
                  backgroundColor: '#1A1730',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.2)',
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(239,68,68,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    overflow: 'hidden',
                  }}
                >
                  {row.icon_url ? (
                    <Image
                      source={{ uri: row.icon_url }}
                      style={{ width: 44, height: 44, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 22 }}>🔒</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontWeight: '600', fontSize: 14 }}>{row.app_name}</Text>
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2 }}>Blocked by parent</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="h-28" />
      </ScrollView>

      {/* ── Floating Ask Parent button ──────────────── */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <TouchableOpacity
          id="btn-ask-parent"
          onPress={() => setShowRequest(true)}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#7C6AF5',
            paddingHorizontal: 28,
            paddingVertical: 16,
            borderRadius: 100,
            shadowColor: '#7C6AF5',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>💬</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Ask Parent</Text>
        </TouchableOpacity>
      </View>

      {/* ── Request modal ────────────────────────────── */}
      <Modal visible={showRequest} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View
            style={{
              backgroundColor: '#1A1730',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: 'rgba(124,106,245,0.3)',
            }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#3A3A5C', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

            <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
              Ask for more time
            </Text>
            <Text style={{ color: '#9090A8', fontSize: 13, marginBottom: 20 }}>
              Your parent will get a notification with your request.
            </Text>

            {/* App picker */}
            {restrictedApps.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#9090A8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                  WHICH APP?
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    id="chip-app-any"
                    onPress={() => setRequestAppId(null)}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: requestAppId === null ? '#7C6AF5' : 'rgba(255,255,255,0.1)',
                      backgroundColor: requestAppId === null ? 'rgba(124,106,245,0.2)' : 'transparent',
                    }}
                  >
                    <Text style={{ color: requestAppId === null ? '#9B8FF7' : '#9090A8', fontWeight: '600', fontSize: 13 }}>
                      Any App
                    </Text>
                  </TouchableOpacity>
                  {restrictedApps.map((app: any) => (
                    <TouchableOpacity
                      key={app.id}
                      onPress={() => setRequestAppId(app.id)}
                      style={{
                        marginRight: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        borderColor: requestAppId === app.id ? '#7C6AF5' : 'rgba(255,255,255,0.1)',
                        backgroundColor: requestAppId === app.id ? 'rgba(124,106,245,0.2)' : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      {app.icon_url ? (
                        <Image
                          source={{ uri: app.icon_url }}
                          style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6 }}
                        />
                      ) : (
                        <Text style={{ marginRight: 6, fontSize: 14 }}>📱</Text>
                      )}
                      <Text style={{ color: requestAppId === app.id ? '#9B8FF7' : '#9090A8', fontWeight: '600', fontSize: 13 }}>
                        {app.app_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Time selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#9090A8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                HOW MUCH TIME?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[15, 30, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    id={`chip-time-${mins}`}
                    onPress={() => setRequestMinutes(mins)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: requestMinutes === mins ? '#7C6AF5' : 'rgba(255,255,255,0.1)',
                      backgroundColor: requestMinutes === mins ? 'rgba(124,106,245,0.2)' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: requestMinutes === mins ? '#9B8FF7' : '#9090A8', fontWeight: '700', fontSize: 15 }}>
                      {mins}
                    </Text>
                    <Text style={{ color: requestMinutes === mins ? '#9B8FF7' : '#9090A8', fontSize: 11, marginTop: 1 }}>
                      min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message input */}
            <TextInput
              id="input-request-message"
              value={requestMsg}
              onChangeText={setRequestMsg}
              placeholder="Add a message (optional)…"
              placeholderTextColor="#5A5A78"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#E8E8F0',
                fontSize: 14,
                minHeight: 70,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
            />

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowRequest(false); setRequestAppId(null); setRequestMinutes(15); }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9090A8', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                id="btn-send-request"
                onPress={handleSendRequest}
                disabled={sendingRequest}
                style={{
                  flex: 1,
                  backgroundColor: '#7C6AF5',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: '#7C6AF5',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {sendingRequest ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

