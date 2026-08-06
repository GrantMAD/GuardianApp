import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BackButton from '@/components/ui/BackButton';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading, installing, or using GuardianApp, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the application.',
  },
  {
    title: '2. Permitted Use',
    body: 'GuardianApp is intended for use by parents and guardians to monitor and manage screen time on devices used by their minor children. You agree to use this application only for lawful purposes and in accordance with these Terms.\n\nYou must not use GuardianApp to monitor any person without their knowledge in circumstances where they would reasonably expect privacy, or to monitor adults without their explicit consent.',
  },
  {
    title: '3. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorised use of your account. GuardianApp is not liable for any loss or damage arising from your failure to protect your credentials.',
  },
  {
    title: '4. Child Profiles',
    body: 'By creating a child profile, you confirm that you are the legal parent or guardian of the child and have the authority to consent to the collection and use of the child\'s device usage data as described in our Privacy Policy.',
  },
  {
    title: '5. Limitations of Service',
    body: 'GuardianApp provides monitoring and restriction tools on a best-effort basis. We do not guarantee that all apps will be blocked in every circumstance, as app blocking capabilities may be limited by device OS updates or OS-level restrictions beyond our control. The service is provided "as is" without warranties of any kind.',
  },
  {
    title: '6. Termination',
    body: 'We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may terminate your account at any time by deleting the app and contacting support to request data deletion.',
  },
  {
    title: '7. Changes to Terms',
    body: 'We may update these Terms of Service from time to time. Continued use of the application after any changes constitutes your acceptance of the new terms. We will make reasonable efforts to notify you of significant changes.',
  },
  {
    title: '8. Contact',
    body: 'For any questions regarding these Terms, please contact us at support@guardianapp.com.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-border">
        <BackButton onPress={() => router.back()} variant="header" />
        <Text className="text-text-primary text-xl font-bold">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-text-muted text-xs mb-6">Last updated: August 2026</Text>

        <Text className="text-text-muted text-sm leading-6 mb-6">
          Please read these Terms of Service carefully before using GuardianApp. These terms govern your use of our application and services.
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
