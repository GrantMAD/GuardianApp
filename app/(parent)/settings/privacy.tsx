import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'GuardianApp collects the following data to deliver its parental control features:\n\n• App usage statistics (which apps are open and for how long) from the child device.\n• A list of installed applications on the child device.\n• Device identifiers (device name, OS type) to associate a device with a child profile.\n• Expo push tokens to deliver notifications to parent and child devices.\n• Account information (email address) provided during parent sign-up.',
  },
  {
    title: '2. How We Use Your Data',
    body: 'All data collected is used exclusively to power the GuardianApp parental monitoring and control features. Specifically:\n\n• Usage data is displayed to parents on their dashboard.\n• Push tokens are used to send notifications about time limits, permission requests, and daily reports.\n• Device identifiers are used to link a child device to the correct family profile.\n\nWe do not sell, trade, or share your data with third parties for advertising or marketing purposes.',
  },
  {
    title: '3. Data Storage',
    body: 'All data is stored securely in a Supabase PostgreSQL database hosted on AWS infrastructure. Row Level Security (RLS) policies ensure that each family can only access their own data. Data is transmitted over HTTPS at all times.',
  },
  {
    title: '4. Data Retention',
    body: 'App usage logs are retained for up to 90 days to power weekly and monthly reports. When a child profile is deleted, all associated usage data, rules, and schedules are permanently deleted via cascade. Parent accounts can be deleted at any time by contacting support.',
  },
  {
    title: '5. Children\'s Privacy',
    body: 'GuardianApp is a tool for parents to monitor their children\'s device usage. The app does not collect data from children for commercial purposes. Children do not create independent accounts — they are added and managed entirely by the parent.',
  },
  {
    title: '6. Contact',
    body: 'If you have any questions about this Privacy Policy, please contact us at support@guardianapp.com.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-bg-elevated rounded-full items-center justify-center mr-3"
        >
          <Text className="text-text-primary text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-text-primary text-xl font-bold">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-text-muted text-xs mb-6">Last updated: August 2026</Text>

        <Text className="text-text-muted text-sm leading-6 mb-6">
          GuardianApp is committed to protecting your privacy. This policy explains what data we collect, why we collect it, and how it is used.
        </Text>

        {sections.map((s) => (
          <View key={s.title} className="mb-6">
            <Text className="text-text-primary font-bold mb-2">{s.title}</Text>
            <Text className="text-text-muted text-sm leading-6">{s.body}</Text>
          </View>
        ))}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
