import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFamilyStore } from '@/store/familyStore';
import { supabase } from '@/services/supabase';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '👀',
    title: 'Real-Time Monitoring',
    description:
      'See exactly which apps your child is using and for how long — updated every minute, live on your dashboard.',
    accent: '#7C6AF5',
  },
  {
    emoji: '⏱️',
    title: 'Time Limits',
    description:
      'Set a daily limit per app. When your child hits 10 minutes remaining, they get a warning. When time is up, the app is blocked automatically.',
    accent: '#F5A623',
  },
  {
    emoji: '🗓️',
    title: 'Smart Schedules',
    description:
      'Create bedtime or homework modes that block apps on a recurring schedule — no manual intervention needed.',
    accent: '#4CAF82',
  },
  {
    emoji: '💬',
    title: 'Permission Requests',
    description:
      'Your child can ask for extra time directly from their device. You approve or deny with one tap — and they get the response instantly.',
    accent: '#E91E8C',
  },
  {
    emoji: '🛡️',
    title: 'You\'re In Control',
    description:
      'Start by adding your first child profile, then pair their device using a 6-digit code found in their profile settings.',
    accent: '#7C6AF5',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { family } = useFamilyStore();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const markComplete = async () => {
    if (family) {
      await supabase
        .from('families')
        .update({ has_completed_onboarding: true })
        .eq('id', family.id);
    }
    router.replace('/(parent)/dashboard');
  };

  const handleNext = () => {
    if (isLast) {
      markComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => markComplete();

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Skip button */}
      <View className="flex-row justify-end px-5 pt-4">
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-text-muted font-medium">Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Icon bubble */}
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: current.accent + '22', borderWidth: 1.5, borderColor: current.accent + '55' }}
        >
          <Text style={{ fontSize: 56 }}>{current.emoji}</Text>
        </View>

        <Text className="text-text-primary text-3xl font-bold text-center mb-4">
          {current.title}
        </Text>
        <Text className="text-text-muted text-base text-center leading-6">
          {current.description}
        </Text>
      </View>

      {/* Step indicators */}
      <View className="flex-row justify-center gap-x-2 mb-6">
        {STEPS.map((_, i) => (
          <View
            key={i}
            className="h-2 rounded-full"
            style={{
              width: i === step ? 24 : 8,
              backgroundColor: i === step ? '#7C6AF5' : '#2A2A3E',
            }}
          />
        ))}
      </View>

      {/* Action button */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          id="btn-onboarding-next"
          onPress={handleNext}
          className="py-4 rounded-2xl items-center"
          style={{ backgroundColor: '#7C6AF5' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">
            {isLast ? "Let's Get Started" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
