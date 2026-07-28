import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();

  const handleParent = () => {
    setRole('parent');
    router.push('/(auth)/sign-up');
  };

  const handleChild = () => {
    setRole('child');
    router.push('/(auth)/child-pairing');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary px-8">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-10">
        <Text className="text-text-muted text-base">← Back</Text>
      </TouchableOpacity>

      <Text className="text-text-primary text-3xl font-bold mb-2">Who are you?</Text>
      <Text className="text-text-muted text-sm mb-10">
        Choose how you'll use GuardianApp on this device.
      </Text>

      {/* Parent card */}
      <TouchableOpacity
        id="btn-role-parent"
        onPress={handleParent}
        activeOpacity={0.85}
        className="bg-bg-card border border-accent/40 rounded-3xl p-6 mb-4"
      >
        <Text className="text-4xl mb-3">👨‍👩‍👧</Text>
        <Text className="text-text-primary text-xl font-bold mb-1">Parent</Text>
        <Text className="text-text-muted text-sm leading-5">
          Manage your children's screen time, set rules and monitor usage from the dashboard.
        </Text>
        <View className="mt-4 bg-accent rounded-xl py-2.5 items-center">
          <Text className="text-white font-semibold text-sm">Set up as Parent</Text>
        </View>
      </TouchableOpacity>

      {/* Child card */}
      <TouchableOpacity
        id="btn-role-child"
        onPress={handleChild}
        activeOpacity={0.85}
        className="bg-bg-card border border-border rounded-3xl p-6"
      >
        <Text className="text-4xl mb-3">👦</Text>
        <Text className="text-text-primary text-xl font-bold mb-1">Child Device</Text>
        <Text className="text-text-muted text-sm leading-5">
          Link this device to your family using the 6-digit pairing code from your parent's phone.
        </Text>
        <View className="mt-4 border border-border rounded-xl py-2.5 items-center">
          <Text className="text-text-primary font-semibold text-sm">Set up as Child Device</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
