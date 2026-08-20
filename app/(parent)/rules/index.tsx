import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getRules, deleteRule } from '@/services/ruleService';
import { getLocationProfiles, LocationProfile } from '@/services/locationProfileService';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatMinutes } from '@/utils/formatTime';
import { KNOWN_ICONS } from '@/constants/appIcons';

export default function RulesScreen() {
  const router = useRouter();
  const { selectedChildId, children } = useFamilyStore();
  const [rules, setRules]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string, type: 'time' | 'block' } | null>(null);
  const [locationProfiles, setLocationProfiles] = useState<LocationProfile[]>([]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  /** Find the display name of a location profile by id */
  const locationName = (id: string | null) =>
    id ? (locationProfiles.find((p) => p.id === id)?.name ?? '📍 Location') : null;

  /** Resolves the best available icon URI for a rule row */
  function resolveIcon(r: any): string | null {
    if (!r.installed_apps) return null;
    return r.installed_apps.icon_url || KNOWN_ICONS[r.installed_apps.package_name] || null;
  }

  /** Small square icon with initial-letter fallback */
  function AppIcon({ rule }: { rule: any }) {
    const uri = resolveIcon(rule);
    const label = (r: any) => (r.installed_apps?.app_name ?? r.category ?? 'A').charAt(0).toUpperCase();
    return (
      <View className="w-10 h-10 rounded-xl bg-bg-elevated items-center justify-center mr-3">
        {uri ? (
          <Image source={{ uri }} className="w-9 h-9 rounded-lg" resizeMode="contain" />
        ) : (
          <Text className="text-text-primary font-bold text-base">{label(rule)}</Text>
        )}
      </View>
    );
  }

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const [data, profiles] = await Promise.all([
        getRules(selectedChildId),
        getLocationProfiles(selectedChildId),
      ]);
      setRules(data);
      setLocationProfiles(profiles);
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
        <Text className="text-text-primary text-2xl font-bold pt-4 pb-1">⚙️ Rules</Text>
        {selectedChild && (
          <Text className="text-text-muted text-sm mb-4">Manage time limits and block apps for {selectedChild.name}.</Text>
        )}

        {/* Create buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
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

        {/* Locations shortcut */}
        <TouchableOpacity
          id="btn-locations"
          onPress={() => router.push('/(parent)/locations')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(34,197,94,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(34,197,94,0.2)',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 12,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 13 }}>Location Profiles</Text>
            <Text style={{ color: '#9090A8', fontSize: 11 }}>
              {locationProfiles.length === 0
                ? 'Set up location-based rules'
                : `${locationProfiles.length} location${locationProfiles.length !== 1 ? 's' : ''} configured`}
            </Text>
          </View>
          <Text style={{ color: '#9090A8' }}>›</Text>
        </TouchableOpacity>

        {loading ? (
          <View className="mt-8 gap-y-3">
            <Skeleton style={{ height: 72, width: '100%' }} />
            <Skeleton style={{ height: 72, width: '100%' }} />
            <Skeleton style={{ height: 72, width: '100%' }} />
          </View>
        ) : (
          <>
            {/* Time Limits */}
            <SectionHeader 
              title={`Time Limits (${timeLimits.length})`} 
              icon="⏳" 
              description="Set daily usage limits for specific apps or categories."
            />
            {timeLimits.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">No time limits set</Text>
            ) : timeLimits.map((r) => (
              <View key={r.id} className="bg-bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <AppIcon rule={r} />
                  <View>
                    <Text className="text-text-primary font-semibold">
                      {r.installed_apps?.app_name ?? r.category ?? 'All Apps'}
                    </Text>
                    <Text className="text-warning text-sm">⏱ {formatMinutes(r.daily_limit_minutes)} / day</Text>
                    {r.weekly_limit_minutes != null && (
                      <Text style={{ color: '#818CF8', fontSize: 12, marginTop: 2 }}>
                        📅 {formatMinutes(r.weekly_limit_minutes)} / week
                      </Text>
                    )}
                    {locationName(r.location_profile_id) && (
                      <Text style={{ color: '#4ADE80', fontSize: 11, marginTop: 2 }}>
                        📍 {locationName(r.location_profile_id)}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => setRuleToDelete({ id: r.id, type: 'time' })}>
                  <Text className="text-danger text-sm font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}


            {/* Block Rules */}
            <SectionHeader 
              title={`Blocked Apps (${blockRules.length})`} 
              icon="🛑" 
              description="Apps that are completely restricted from use."
            />
            {blockRules.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">No apps blocked</Text>
            ) : blockRules.map((r) => (
              <View key={r.id} className="bg-bg-card rounded-2xl p-4 border border-danger/30 mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <AppIcon rule={r} />
                  <View>
                    <Text className="text-text-primary font-semibold">
                      {r.installed_apps?.app_name ?? r.category ?? 'All Apps'}
                    </Text>
                    <Text className="text-danger text-sm">Blocked</Text>
                    {locationName(r.location_profile_id) && (
                      <Text style={{ color: '#4ADE80', fontSize: 11, marginTop: 2 }}>
                        📍 {locationName(r.location_profile_id)}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => setRuleToDelete({ id: r.id, type: 'block' })}>
                  <Text className="text-danger text-sm font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
      <ConfirmModal
        visible={!!ruleToDelete}
        title="Delete Rule"
        message={`Are you sure you want to delete this ${ruleToDelete?.type === 'time' ? 'time limit' : 'block rule'}?`}
        onConfirm={() => ruleToDelete && deleteRule(ruleToDelete.id).then(load)}
        onCancel={() => setRuleToDelete(null)}
      />
    </SafeAreaView>
  );
}
