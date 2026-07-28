import React from 'react';
import { View, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockOverlay } from '@/components/ui/BlockOverlay';
import { supabase } from '@/services/supabase';
import { useFamilyStore } from '@/store/familyStore';

type BlockReason = 'time_limit' | 'blocked_by_parent' | 'schedule';

export default function AppBlockedScreen() {
  const { reason, appName, appId } = useLocalSearchParams<{
    reason: BlockReason;
    appName: string;
    appId?: string;
  }>();
  const router  = useRouter();
  const { selectedChildId } = useFamilyStore();

  const handleRequestAccess = async () => {
    if (!selectedChildId) return;
    try {
      await supabase.from('permission_requests').insert({
        child_id: selectedChildId,
        app_id: appId ?? null,
        request_type: reason === 'time_limit' ? 'extra_time' : 'unblock',
        status: 'pending',
      });
    } catch {}
    router.replace('/(child)/request-sent');
  };

  const resetText =
    reason === 'time_limit' ? 'Resets at midnight tonight' : undefined;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <View className="flex-1">
        <BlockOverlay
          appName={appName ?? 'This App'}
          reason={reason ?? 'blocked_by_parent'}
          onRequestAccess={handleRequestAccess}
          resetTime={resetText}
        />
      </View>
    </SafeAreaView>
  );
}
