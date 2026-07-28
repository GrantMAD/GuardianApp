import React from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Background gradient blobs (CSS-style for web) */}
      <View className="absolute w-80 h-80 rounded-full bg-accent/10 -top-20 -right-20" />
      <View className="absolute w-64 h-64 rounded-full bg-accent-teal/10 bottom-40 -left-16" />

      <View className="flex-1 px-8 justify-between py-12">

        {/* Logo area */}
        <View className="items-center mt-12">
          <View className="w-24 h-24 rounded-3xl bg-accent/20 border border-accent/40 items-center justify-center mb-6">
            <Text style={{ fontSize: 44 }}>🛡️</Text>
          </View>
          <Text className="text-text-primary text-4xl font-bold tracking-tight">Guardian</Text>
          <Text className="text-accent text-lg font-medium mt-1">Parental Controls</Text>
          <Text className="text-text-muted text-sm text-center mt-4 leading-6">
            Keep your children safe and{'\n'}in control of their screen time
          </Text>
        </View>

        {/* Feature highlights */}
        <View className="gap-y-4">
          {FEATURES.map((f) => (
            <View key={f.text} className="flex-row items-center bg-bg-card rounded-2xl px-4 py-3 border border-border">
              <Text className="text-2xl mr-3">{f.icon}</Text>
              <Text className="text-text-primary text-sm font-medium flex-1">{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View className="gap-y-3">
          <TouchableOpacity
            id="btn-get-started"
            onPress={() => router.push('/(auth)/role-select')}
            className="bg-accent py-4 rounded-2xl items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            id="btn-sign-in"
            onPress={() => router.push('/(auth)/sign-in')}
            className="border border-border py-4 rounded-2xl items-center"
            activeOpacity={0.85}
          >
            <Text className="text-text-primary font-semibold text-base">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '📊', text: 'Real-time app usage monitoring' },
  { icon: '⏱️', text: 'Set daily time limits per app' },
  { icon: '🔒', text: 'Block apps instantly or on a schedule' },
];
