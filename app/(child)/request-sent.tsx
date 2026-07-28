import React, { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequestSentScreen() {
  const router = useRouter();

  // Auto-navigate back home after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(child)/home'), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center px-8">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Animated checkmark area */}
      <View className="w-28 h-28 rounded-full bg-success/20 border-2 border-success items-center justify-center mb-6">
        <Text style={{ fontSize: 52 }}>✅</Text>
      </View>

      <Text className="text-text-primary text-2xl font-bold text-center mb-2">
        Request Sent!
      </Text>
      <Text className="text-text-muted text-sm text-center leading-6 mb-8">
        Your parent has been notified. You'll get a response shortly — hang tight!
      </Text>

      <View className="bg-bg-card rounded-2xl p-4 border border-border w-full items-center">
        <Text className="text-text-muted text-xs text-center">
          You'll be taken back to your home screen in a moment…
        </Text>
      </View>
    </SafeAreaView>
  );
}
