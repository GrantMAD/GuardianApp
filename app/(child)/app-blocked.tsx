import React, { useState } from 'react';
import { View, StatusBar, Modal, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockOverlay } from '@/components/ui/BlockOverlay';
import { supabase } from '@/services/supabase';
import { useFamilyStore } from '@/store/familyStore';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BlockReason = 'time_limit' | 'blocked_by_parent' | 'schedule';

export default function AppBlockedScreen() {
  const { reason, appName, appId } = useLocalSearchParams<{
    reason: BlockReason;
    appName: string;
    appId?: string;
  }>();
  const router  = useRouter();
  const { selectedChildId, children } = useFamilyStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const child = children.find(c => c.id === selectedChildId);

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

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 4) return;
    if (!child?.emergency_pin_hash) {
      Toast.show({ type: 'error', text1: 'Not Configured', text2: 'No emergency PIN has been set by your parent.' });
      return;
    }

    setVerifying(true);
    try {
      const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
      if (pinHash !== child.emergency_pin_hash) {
        Toast.show({ type: 'error', text1: 'Incorrect PIN', text2: 'The PIN you entered is wrong.' });
        setPin('');
        setVerifying(false);
        return;
      }

      // PIN is correct. Set override until 15 minutes from now.
      const overrideUntil = Date.now() + 15 * 60 * 1000;
      await AsyncStorage.setItem('emergency_override_until', overrideUntil.toString());

      // Notify parent
      await supabase.from('notifications_log').insert({
        family_id: child.family_id,
        type: 'emergency_override',
        title: '🚨 Emergency Override Used',
        body: `${child.name} has suspended restrictions for 15 minutes.`,
        target_role: 'parent',
      });

      Toast.show({ type: 'success', text1: 'Restrictions Suspended', text2: 'You have 15 minutes of access.' });
      router.replace('/(child)/home');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'An error occurred while verifying the PIN.' });
    } finally {
      setVerifying(false);
    }
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
          onEmergencyAccess={() => setShowPinModal(true)}
          resetTime={resetText}
        />

        <Modal visible={showPinModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/60 justify-center items-center px-4">
            <View className="bg-bg-card w-full max-w-sm rounded-3xl p-6 border border-border">
              <Text className="text-white text-xl font-bold text-center mb-2">Emergency Override</Text>
              <Text className="text-text-muted text-sm text-center mb-6">Enter the 4-digit PIN provided by your parent to suspend all restrictions for 15 minutes.</Text>
              
              <TextInput
                keyboardType="number-pad"
                maxLength={4}
                placeholder="0000"
                placeholderTextColor="#808080"
                secureTextEntry
                value={pin}
                onChangeText={setPin}
                className="bg-bg-elevated border border-border rounded-xl px-4 py-4 text-white text-2xl mb-6 text-center tracking-[0.5em]"
                autoFocus
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setShowPinModal(false); setPin(''); }}
                  className="flex-1 border border-border rounded-xl py-3.5 items-center"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleVerifyPin}
                  disabled={verifying || pin.length !== 4}
                  className={`flex-1 rounded-xl py-3.5 items-center ${pin.length === 4 ? 'bg-danger' : 'bg-bg-elevated'}`}
                >
                  {verifying ? <ActivityIndicator color="#fff" /> : (
                    <Text className={`${pin.length === 4 ? 'text-white' : 'text-text-muted'} font-bold`}>Override</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
