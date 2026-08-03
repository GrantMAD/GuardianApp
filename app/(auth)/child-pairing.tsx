import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consumePairingCode } from '@/services/pairingService';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';

export default function ChildPairingScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();

  const [code, setCode]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<TextInput[]>([]);

  const handleInput = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;
    const next = [...code];
    next[index] = text.slice(-1);
    setCode(next);
    if (text && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePair = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Toast.show({ type: 'error', text1: 'Pairing Failed', text2: 'Please enter the full 6-digit code.' });
      return;
    }
    setLoading(true);
    try {
      await consumePairingCode(fullCode, 'Android Device', 'android');
      setRole('child');
      Toast.show({ type: 'success', text1: 'Device Paired', text2: 'Welcome to GuardianApp.' });
      router.replace('/(child)/home');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Pairing Failed', text2: 'Invalid or expired code. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary px-8">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-10">
        <Text className="text-text-muted text-base">← Back</Text>
      </TouchableOpacity>

      <Text className="text-4xl mb-4">🔗</Text>
      <Text className="text-text-primary text-3xl font-bold mb-2">Pair this device</Text>
      <Text className="text-text-muted text-sm mb-10 leading-5">
        Ask your parent for the 6-digit pairing code shown in their GuardianApp dashboard.
      </Text>

      {/* Code inputs */}
      <View className="flex-row justify-between mb-8">
        {code.map((digit, i) => (
          <TextInput
            key={i}
            id={`code-digit-${i}`}
            ref={(r) => { if (r) refs.current[i] = r; }}
            value={digit}
            onChangeText={(t) => handleInput(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            className={`w-12 h-14 bg-bg-card border rounded-2xl text-center text-text-primary text-2xl font-bold ${
              digit ? 'border-accent' : 'border-border'
            }`}
          />
        ))}
      </View>

      {/* Submit */}
      <TouchableOpacity
        id="btn-pair-device"
        onPress={handlePair}
        disabled={loading || code.join('').length < 6}
        className={`py-4 rounded-2xl items-center ${
          code.join('').length === 6 ? 'bg-accent' : 'bg-bg-elevated'
        }`}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className={`font-bold text-base ${code.join('').length === 6 ? 'text-white' : 'text-text-muted'}`}>
            Pair Device
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
