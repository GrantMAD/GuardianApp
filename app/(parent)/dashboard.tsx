import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { useAuthStore } from '@/store/authStore';
import { getFamily, getChildren, createFamily } from '@/services/childService';
import { getDailyUsage, getDailyScreenTimeSummary } from '@/services/usageService';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { StatCard } from '@/components/ui/StatCard';
import { UsageBarChart } from '@/components/ui/UsageBarChart';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatMinutes } from '@/utils/formatTime';
import { signOut } from '@/services/authService';
import { CATEGORY_COLORS } from '@/constants/categories';
import { supabase } from '@/services/supabase';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getPendingRequests, updateRequestStatus, PermissionRequest } from '@/services/permissionRequestService';
import { PermissionRequestCard } from '@/components/ui/PermissionRequestCard';

async function registerForPushNotificationsAsync(familyId: string) {
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

  await supabase.from('families').update({ push_token: token }).eq('id', familyId);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { family, children, selectedChildId, setFamily, setChildren, setSelectedChildId } = useFamilyStore();

  const [refreshing, setRefreshing]   = useState(false);
  const [usageData, setUsageData]     = useState<any[]>([]);
  const [totalMins, setTotalMins]     = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const load = async () => {
    try {
      let fam = family;
      if (!fam) {
        fam = await getFamily();
        if (!fam) {
          // Fallback: If family is missing (e.g., due to email confirmation bypassing it), create a default one
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const defaultName = currentUser?.user_metadata?.family_name || 'My Family';
          console.log(`No family found for this user, auto-creating family: ${defaultName}`);
          fam = await createFamily(defaultName);
        }
        
        if (fam) {
          setFamily(fam);
          // First-time user: redirect to onboarding
          if (!fam.has_completed_onboarding) {
            router.replace('/(parent)/onboarding');
            return;
          }
        }
      }
      if (fam) {
        const kids = await getChildren(fam.id);
        setChildren(kids);
        if (!selectedChildId && kids.length > 0) setSelectedChildId(kids[0].id);

        // Push notifications & requests
        registerForPushNotificationsAsync(fam.id);
        const reqs = await getPendingRequests(fam.id);
        setPendingRequests(reqs);
      }
      if (selectedChildId) {
        const [usage, summary] = await Promise.all([
          getDailyUsage(selectedChildId, today),
          getDailyScreenTimeSummary(selectedChildId, today),
        ]);
        setUsageData(usage ?? []);
        setTotalMins(summary?.total_minutes ?? 0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => { load(); }, [selectedChildId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleApproveRequest = async (requestId: string, extraMinutes: number) => {
    const success = await updateRequestStatus(requestId, 'approved', extraMinutes);
    if (success) {
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    const success = await updateRequestStatus(requestId, 'denied');
    if (success) {
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const chartData = usageData.slice(0, 5).map((u: any) => ({
    label: u.installed_apps?.app_name ?? 'Unknown',
    minutes: u.usage_minutes,
    color: CATEGORY_COLORS[u.installed_apps?.category as keyof typeof CATEGORY_COLORS] ?? '#7C6AF5',
    iconUrl: u.installed_apps?.icon_url,
    packageName: u.installed_apps?.package_name,
  }));

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6AF5" />}
      >
        {/* Greeting Area */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">{getGreetingIcon()}</Text>
            <Text className="text-text-muted text-sm">Good{getGreeting()},</Text>
          </View>
          <Text className="text-text-primary text-2xl font-bold">
            {family?.name 
              ? (family.name.toLowerCase().endsWith('family') ? family.name : `${family.name} Family`) 
              : 'Your Family'}
          </Text>
        </View>

        {/* Child Selector */}
        {children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-3">
            {children.map((child) => (
              <View key={child.id} className="mr-4">
                <ChildAvatar
                  name={child.name}
                  avatarUrl={child.avatar_url}
                  isSelected={child.id === selectedChildId}
                  onPress={() => setSelectedChildId(child.id)}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={() => router.push('/(parent)/settings/add-child')}
              className="w-14 h-14 rounded-full bg-bg-elevated border border-dashed border-border items-center justify-center mr-4"
            >
              <Text className="text-accent text-2xl">+</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {children.length === 0 && !loading && (
          <View className="mx-5 mt-4 bg-bg-card border border-border rounded-2xl p-6 items-center">
            <Text className="text-3xl mb-2">👶</Text>
            <Text className="text-text-primary font-semibold mb-1">No children yet</Text>
            <Text className="text-text-muted text-sm text-center mb-4">
              Add a child profile to start monitoring their screen time.
            </Text>
            <TouchableOpacity
              id="btn-add-first-child"
              onPress={() => router.push('/(parent)/settings/add-child')}
              className="bg-accent px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Add Child</Text>
            </TouchableOpacity>
          </View>
        )}

        {pendingRequests.length > 0 && (
          <View className="px-5 mt-4">
            <SectionHeader 
              title="Pending Requests" 
              icon="🔔" 
              description="Approve or deny extra time requests."
            />
            {pendingRequests.map(req => (
              <PermissionRequestCard
                key={req.id}
                request={req}
                onApprove={(mins) => handleApproveRequest(req.id, mins)}
                onDeny={() => handleDenyRequest(req.id)}
              />
            ))}
          </View>
        )}

        {selectedChild && (
          <View className="px-5 mt-2">
            {/* Stats row */}
            <View className="flex-row gap-x-3 mb-1">
              <StatCard
                label="Screen time today"
                value={loading ? '...' : formatMinutes(totalMins ?? 0)}
              />
              <StatCard
                label="Apps used"
                value={loading ? '...' : String(usageData.length)}
              />
            </View>

            {/* Top apps chart */}
            <SectionHeader
              title="Top Apps Today"
              icon="📱"
              description="Most used applications for the current day."
              actionLabel="See all"
              onAction={() => router.push('/(parent)/apps')}
            />
            {loading ? (
              <ActivityIndicator color="#7C6AF5" className="my-4" />
            ) : chartData.length > 0 ? (
              <View className="bg-bg-card rounded-2xl p-4 border border-border">
                <UsageBarChart data={chartData} />
              </View>
            ) : (
              <View className="bg-bg-card rounded-2xl p-6 border border-border items-center">
                <Text className="text-text-muted text-sm">No usage data yet for today.</Text>
              </View>
            )}

            {/* Quick actions */}
            <SectionHeader 
              title="Quick Actions" 
              icon="⚡" 
              description="Fast access to common management tools."
            />
            <View className="flex-row gap-x-3 mb-8">
              <TouchableOpacity
                id="btn-add-rule"
                onPress={() => router.push('/(parent)/rules')}
                className="flex-1 bg-bg-card border border-border rounded-2xl p-4 items-center"
              >
                <Text className="text-2xl mb-1">⏱️</Text>
                <Text className="text-text-primary text-xs font-semibold">Add Limit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                id="btn-view-schedules"
                onPress={() => router.push('/(parent)/rules/schedules')}
                className="flex-1 bg-bg-card border border-border rounded-2xl p-4 items-center"
              >
                <Text className="text-2xl mb-1">🕐</Text>
                <Text className="text-text-primary text-xs font-semibold">Schedules</Text>
              </TouchableOpacity>
              <TouchableOpacity
                id="btn-view-reports"
                onPress={() => router.push('/(parent)/reports')}
                className="flex-1 bg-bg-card border border-border rounded-2xl p-4 items-center"
              >
                <Text className="text-2xl mb-1">📈</Text>
                <Text className="text-text-primary text-xs font-semibold">Reports</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return ' morning';
  if (h < 17) return ' afternoon';
  return ' evening';
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '⛅';
  return '🌙';
}
