import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Modal, TextInput,
  ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgentStore } from '@/store/agentStore';
import { useFamilyStore } from '@/store/familyStore';
import { getRules } from '@/services/ruleService';
import { getWeeklyUsageByApp } from '@/services/reportService';
import { getSchedules } from '@/services/scheduleService';
import { getDailyUsage, getInstalledApps, UsageLog, InstalledApp } from '@/services/usageService';
import { supabase } from '@/services/supabase';
import { TimeRing } from '@/components/ui/TimeRing';
import { formatMinutes } from '@/utils/formatTime';
import { isScheduleActive, isAppBlockedBySchedule } from '@/utils/scheduleEvaluator';
import AppBlockerModule from '@/modules/android/AppBlockerModule';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { getTodayApprovedExtraMinutes } from '@/services/permissionRequestService';
import { getTasks, updateTaskStatus, getTodayCompletedTaskMinutes, RewardTask } from '@/services/rewardTaskService';
import { isSetupComplete } from '@/app/(child)/setup';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocationProfiles, resolveActiveProfile, LocationProfile } from '@/services/locationProfileService';
import { LocationConsentBanner } from '@/components/ui/LocationConsentBanner';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  const [usageData, setUsageData]   = useState<UsageLog[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const previouslyBlockedPackages = useRef<Set<string>>(new Set());
  const warnedApps = useRef<Set<string>>(new Set());
  
  const [refreshing, setRefreshing] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestAppId, setRequestAppId] = useState<string | null>(null);
  const [requestMinutes, setRequestMinutes] = useState(15);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState<Record<string, number>>({});
  const [weeklyUsage, setWeeklyUsage] = useState<Record<string, number>>({});
  const [rewardTasks, setRewardTasks] = useState<RewardTask[]>([]);

  // Location awareness
  const [locationProfiles, setLocationProfiles] = useState<LocationProfile[]>([]);
  const [activeLocationProfileId, setActiveLocationProfileId] = useState<string | null>(null);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const child = children.find((c) => c.id === selectedChildId);
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    if (!selectedChildId) return;
    try {
      const [rules, schedules, usage, apps, approvedMins, completedTaskMins, fetchedTasks, weeklyByApp] = await Promise.all([
        getRules(selectedChildId),
        getSchedules(selectedChildId),
        getDailyUsage(selectedChildId, today),
        getInstalledApps(selectedChildId),
        getTodayApprovedExtraMinutes(selectedChildId),
        getTodayCompletedTaskMinutes(selectedChildId),
        getTasks(selectedChildId),
        getWeeklyUsageByApp(selectedChildId),
      ]);
      setActiveRules(rules ?? []);
      setActiveSchedules(schedules ?? []);
      setUsageData(usage ?? []);
      setInstalledApps(apps ?? []);
      setWeeklyUsage(weeklyByApp ?? {});
      
      const combinedMins = { ...approvedMins };
      for (const [appId, mins] of Object.entries(completedTaskMins)) {
        combinedMins[appId] = (combinedMins[appId] || 0) + mins;
      }
      setExtraMinutes(combinedMins);
      setRewardTasks(fetchedTasks ?? []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  // Load location profiles whenever child changes
  useEffect(() => {
    if (!selectedChildId || Platform.OS !== 'android') return;
    getLocationProfiles(selectedChildId)
      .then(setLocationProfiles)
      .catch(() => {});
  }, [selectedChildId]);

  // One-time consent + location polling setup
  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedChildId) return;

    const initLocation = async () => {
      const consentGiven = await AsyncStorage.getItem('location_consent_given');
      if (consentGiven === 'declined') return;
      if (consentGiven !== 'accepted') {
        // Show consent banner only when there are active location profiles
        const profiles = await getLocationProfiles(selectedChildId);
        if (profiles.length > 0) setShowLocationConsent(true);
        return;
      }
      // Permission already granted — start polling
      startLocationPolling();
    };

    initLocation();

    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [selectedChildId]);

  const startLocationPolling = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    // Also request background for more accurate geofencing
    await Location.requestBackgroundPermissionsAsync();

    const poll = async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const profiles = await getLocationProfiles(selectedChildId!);
        setLocationProfiles(profiles);
        const matched = resolveActiveProfile(profiles, pos.coords.latitude, pos.coords.longitude);
        setActiveLocationProfileId(matched);
      } catch {
        // Silently fail — fall back to global rules
      }
    };

    poll(); // immediate first run
    locationInterval.current = setInterval(poll, 5 * 60 * 1000); // every 5 minutes
  };

  const handleLocationConsentAccept = async () => {
    setShowLocationConsent(false);
    await AsyncStorage.setItem('location_consent_given', 'accepted');
    startLocationPolling();
  };

  const handleLocationConsentDecline = async () => {
    setShowLocationConsent(false);
    await AsyncStorage.setItem('location_consent_given', 'declined');
  };

  // Sync & Realtime listener
  useEffect(() => {
    if (!selectedChildId) return;
    
    // Initial sync
    import('@/services/usageService').then(({ syncInstalledApps, syncUsageStats }) => {
      syncInstalledApps(selectedChildId).then(() => {
        syncUsageStats(selectedChildId);
        load();
      });
    });

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
            load(); // Reload extra minutes
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rules',
          filter: `child_id=eq.${selectedChildId}`,
        },
        () => {
          load(); // Reload rules
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_usage_logs',
          filter: `child_id=eq.${selectedChildId}`,
        },
        () => {
          // If usage changes (from background agent), reload UI
          load(); 
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_tasks',
          filter: `child_id=eq.${selectedChildId}`,
        },
        () => {
          load(); // Reload tasks and extra time
        }
      )
      .subscribe();

    // Lightweight local timer to sync usage from native to DB without full reload every tick
    const syncInterval = setInterval(() => {
      import('@/services/usageService').then(({ syncUsageStats }) => {
        syncUsageStats(selectedChildId); // just sync to DB, let realtime trigger UI reload if needed
      });
      enforceBlocks(); // Re-evaluate in case emergency override expired
    }, 60000);

    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [selectedChildId]);

  const enforceBlocks = async () => {
    if (!installedApps.length || !selectedChildId) return;

    // Check emergency override
    const overrideStr = await AsyncStorage.getItem('emergency_override_until');
    if (overrideStr) {
      const overrideUntil = parseInt(overrideStr, 10);
      if (Date.now() < overrideUntil) {
        // Currently overridden. Unblock everything.
        const prevBlocked = previouslyBlockedPackages.current;
        for (const pkg of prevBlocked) {
          AppBlockerModule.unblockApp(pkg);
        }
        previouslyBlockedPackages.current = new Set();
        return; // Skip normal block enforcement
      }
    }

    const currentlyBlockedPackages = new Set<string>();

    // Filter rules by active location profile:
    // - Rules with null location_profile_id are global (always apply)
    // - Rules with a specific location_profile_id only apply when that profile is active
    const effectiveRules = activeRules.filter((r) =>
      r.location_profile_id === null || r.location_profile_id === undefined
        ? true
        : r.location_profile_id === activeLocationProfileId
    );

    installedApps.forEach((app) => {
      const { id: appId, package_name: packageName, category } = app;
      let isBlocked = false;

      // 1. Evaluate Manual Blocks
      const blockRule = effectiveRules.find((r) => (r.app_id === appId || (r.category === category && !r.app_id)) && r.rule_type === 'BLOCK');
      if (blockRule) isBlocked = true;

      // 2. Evaluate Time Limits (daily + weekly, stacked independently)
      if (!isBlocked) {
        const timeRule = effectiveRules.find((r) => (r.app_id === appId || (r.category === category && !r.app_id)) && r.rule_type === 'TIME_LIMIT');
        if (timeRule) {
          const usage = usageData.find((u) => u.app_id === appId);
          const usedMinutes = usage?.usage_minutes ?? 0;
          const appExtra = (extraMinutes[appId] || 0) + (extraMinutes['any'] || 0);
          const dailyLimit = (timeRule.daily_limit_minutes ?? 0) + appExtra;

          // Daily limit check
          if (dailyLimit > 0 && usedMinutes >= dailyLimit) {
            isBlocked = true;
          } else if (dailyLimit > 0 && (dailyLimit - usedMinutes) === 10) {
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

          // Weekly limit check (stacked on top of daily)
          if (!isBlocked && timeRule.weekly_limit_minutes) {
            const weeklyUsed = weeklyUsage[appId] ?? 0;
            if (weeklyUsed >= timeRule.weekly_limit_minutes) {
              isBlocked = true;
            }
          }
        }
      }

      // 3. Evaluate Schedules
      if (!isBlocked) {
        if (isAppBlockedBySchedule(activeSchedules, packageName, category as any, appId)) {
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
  }, [activeRules, activeSchedules, usageData, installedApps, extraMinutes, activeLocationProfileId]);

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

  const handleSendUnblockRequest = async (appId: string) => {
    if (!selectedChildId) return;
    try {
      await supabase.from('permission_requests').insert({
        child_id: selectedChildId,
        request_type: 'unblock',
        app_id: appId,
        extra_minutes: null,
        message: 'Please unblock this app.',
        status: 'pending',
      });
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 3000);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not send request', text2: 'Please try again' });
    }
  };

  // Apps that have any active restriction (TIME_LIMIT or BLOCK)
  const restrictedApps = installedApps.filter((app: InstalledApp) =>
    activeRules.some((r) => r.app_id === app.id || (r.category === app.category && !r.app_id))
  );

  // Apps with a time limit rule — derived from rules so 0-usage apps still appear
  // Map category rules into app-specific rows for the UI
  const limitedApps = activeRules
    .filter((r) => r.rule_type === 'TIME_LIMIT')
    .flatMap((r) => {
      if (r.app_id) {
        const appInfo = installedApps.find((a: InstalledApp) => a.id === r.app_id);
        const usage = usageData.find((u: UsageLog) => u.app_id === r.app_id);
        const appExtra = (extraMinutes[r.app_id] || 0) + (extraMinutes['any'] || 0);
        return [{
          app_id: r.app_id,
          app_name: appInfo?.app_name ?? 'App',
          usage_minutes: usage?.usage_minutes ?? 0,
          daily_limit_minutes: (r.daily_limit_minutes ?? 0) + appExtra,
          weekly_limit_minutes: r.weekly_limit_minutes ?? null,
          weekly_usage_minutes: weeklyUsage[r.app_id] ?? 0,
        }];
      } else if (r.category) {
        // Expand category rule to all matching apps
        return installedApps
          .filter((a: InstalledApp) => a.category === r.category)
          .map((appInfo: InstalledApp) => {
            const usage = usageData.find((u: UsageLog) => u.app_id === appInfo.id);
            const appExtra = (extraMinutes[appInfo.id] || 0) + (extraMinutes['any'] || 0);
            return {
              app_id: appInfo.id,
              app_name: appInfo.app_name,
              usage_minutes: usage?.usage_minutes ?? 0,
              daily_limit_minutes: (r.daily_limit_minutes ?? 0) + appExtra,
              weekly_limit_minutes: r.weekly_limit_minutes ?? null,
              weekly_usage_minutes: weeklyUsage[appInfo.id] ?? 0,
            };
          });
      }
      return [];
    });

  // Apps that are outright blocked
  const blockedApps = activeRules
    .filter((r) => r.rule_type === 'BLOCK')
    .flatMap((r) => {
      if (r.app_id) return [r.app_id];
      if (r.category) return installedApps.filter((a: InstalledApp) => a.category === r.category).map((a: InstalledApp) => a.id);
      return [];
    });

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

  // Calculate total screen time today
  const totalUsageMinutes = usageData.reduce((acc, curr) => acc + (curr.usage_minutes || 0), 0);

  // Positive Reinforcement Logic
  const hasExceededLimit = limitedApps.some((app: any) => {
    const limit = app.daily_limit_minutes ?? 0;
    const used = app.usage_minutes ?? 0;
    return limit > 0 && used >= limit;
  });
  
  const isLateInDay = new Date().getHours() >= 17;
  const showPositiveReinforcement = isLateInDay && !hasExceededLimit && limitedApps.length > 0;

  // Build blocked app rows with icon info
  const blockedAppRows = activeRules
    .filter((r) => r.rule_type === 'BLOCK')
    .flatMap((r) => {
      if (r.app_id) {
        const appInfo = installedApps.find((a: InstalledApp) => a.id === r.app_id);
        return [{ ruleId: r.id, app_id: r.app_id, app_name: appInfo?.app_name ?? 'App', icon_url: appInfo?.icon_url ?? null }];
      } else if (r.category) {
        return installedApps
          .filter((a: InstalledApp) => a.category === r.category)
          .map((appInfo: InstalledApp) => ({
            ruleId: `${r.id}-${appInfo.id}`,
            app_id: appInfo.id,
            app_name: appInfo.app_name,
            icon_url: appInfo.icon_url ?? null
          }));
      }
      return [];
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {showLocationConsent && (
        <LocationConsentBanner
          onAccept={handleLocationConsentAccept}
          onDecline={handleLocationConsentDecline}
        />
      )}

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

            {/* Total usage banner */}
            <View
              style={{
                marginTop: 16,
                backgroundColor: 'rgba(124,106,245,0.1)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(124,106,245,0.2)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(124,106,245,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 18 }}>⏱️</Text>
              </View>
              <View>
                <Text style={{ color: '#9B8FF7', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 }}>
                  TOTAL SCREEN TIME
                </Text>
                <Text style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '700' }}>
                  {formatMinutes(totalUsageMinutes)} today
                </Text>
              </View>
            </View>

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

            {/* Positive reinforcement banner */}
            {showPositiveReinforcement && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(34,197,94,0.3)',
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🎉</Text>
                <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>
                  Great job today! You're staying within your limits.
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
              const limit = item.daily_limit_minutes ?? 60;
              const used = item.usage_minutes;
              const remaining = Math.max(limit - used, 0);
              const fraction = limit > 0 ? Math.min(used / limit, 1) : 0;
              const pct = Math.round(fraction * 100);
              const barColor = fraction >= 1 ? '#EF4444' : fraction >= 0.75 ? '#F59E0B' : '#7C6AF5';

              // Find the full app info for the icon
              const appInfo = installedApps.find((a: InstalledApp) => a.id === item.app_id);

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

                    {/* Weekly budget bar */}
                    {item.weekly_limit_minutes != null && (
                      <>
                        <View
                          style={{
                            height: 4,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            marginTop: 8,
                            marginBottom: 3,
                          }}
                        >
                          <View
                            style={{
                              height: 4,
                              width: `${Math.min((item.weekly_usage_minutes / item.weekly_limit_minutes) * 100, 100)}%`,
                              backgroundColor:
                                item.weekly_usage_minutes >= item.weekly_limit_minutes
                                  ? '#EF4444'
                                  : item.weekly_usage_minutes / item.weekly_limit_minutes >= 0.75
                                  ? '#F59E0B'
                                  : '#818CF8',
                              borderRadius: 2,
                            }}
                          />
                        </View>
                        <Text style={{ color: '#9090A8', fontSize: 10 }}>
                          📅 {formatMinutes(item.weekly_usage_minutes)} this week · {formatMinutes(item.weekly_limit_minutes)} weekly limit
                        </Text>
                      </>
                    )}
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
                <TouchableOpacity
                  onPress={() => handleSendUnblockRequest(row.app_id)}
                  style={{
                    backgroundColor: 'rgba(124,106,245,0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(124,106,245,0.3)',
                  }}
                >
                  <Text style={{ color: '#9B8FF7', fontWeight: '600', fontSize: 12 }}>Unlock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Tasks & Rewards ─────────────────────────────── */}
        {rewardTasks.length > 0 && (
          <View className="px-5 mb-2 mt-4">
            <Text
              style={{ color: '#9090A8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}
            >
              TASKS & REWARDS
            </Text>
            {rewardTasks.map((task) => (
              <View
                key={task.id}
                style={{
                  backgroundColor: '#1A1730',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: task.status === 'awaiting_approval' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)',
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(124,106,245,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🎁</Text>
                </View>
                  <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontWeight: '600', fontSize: 14, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</Text>
                  <Text style={{ color: '#7C6AF5', fontSize: 12, marginTop: 2, fontWeight: '600' }}>
                    Reward: {task.reward_minutes} min {task.installed_apps ? `for ${task.installed_apps.app_name}` : 'for any app'}
                  </Text>
                  {task.status === 'awaiting_approval' && (
                    <Text style={{ color: '#F59E0B', fontSize: 11, marginTop: 4 }}>⏳ Waiting for parent</Text>
                  )}
                  {task.status === 'completed' && (
                    <Text style={{ color: '#22C55E', fontSize: 11, marginTop: 4 }}>✅ Completed today</Text>
                  )}
                </View>
                
                {task.status === 'pending' && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await updateTaskStatus(task.id, 'awaiting_approval');
                        const res = await supabase.from('families').select('id').single();
                        if (res.data) {
                          await supabase.from('notifications_log').insert({
                            family_id: res.data.id,
                            type: 'task_done',
                            title: 'Task needs approval',
                            body: `${childName} marked "${task.title}" as done.`,
                            target_role: 'parent'
                          });
                        }
                        await load();
                      } catch(e) {}
                    }}
                    style={{
                      backgroundColor: 'rgba(124,106,245,0.15)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(124,106,245,0.3)',
                    }}
                  >
                    <Text style={{ color: '#9B8FF7', fontWeight: '600', fontSize: 12 }}>Mark Done</Text>
                  </TouchableOpacity>
                )}
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
                  {restrictedApps.map((app: InstalledApp) => (
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

