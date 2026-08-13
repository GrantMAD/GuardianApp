import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  Platform, Linking, Alert, AppState, AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBlockerModule from '@/modules/android/AppBlockerModule';

const SETUP_KEY = 'guardian_setup_complete';

interface Step {
  id: string;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
}

export async function isSetupComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SETUP_KEY);
  return val === 'true';
}

export default function SetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [granted, setGranted] = useState({ usage: false, accessibility: false, admin: false });

  const markComplete = async () => {
    await AsyncStorage.setItem(SETUP_KEY, 'true');
    router.replace('/(child)/home');
  };

  const openUsageSettings = () => {
    if (Platform.OS === 'android') {
      if (AppBlockerModule.openUsageSettings) {
        AppBlockerModule.openUsageSettings();
      } else {
        Linking.openSettings();
      }
    }
  };

  const openAccessibilitySettings = () => {
    if (Platform.OS === 'android') {
      if (AppBlockerModule.openAccessibilitySettings) {
        AppBlockerModule.openAccessibilitySettings();
      } else {
        Linking.openSettings();
      }
    }
  };

  const requestDeviceAdmin = () => {
    Alert.alert(
      'Device Administrator',
      'GuardianApp needs Device Administrator access to prevent it from being uninstalled by your child.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            if (AppBlockerModule.requestDeviceAdmin) {
              AppBlockerModule.requestDeviceAdmin();
            }
            // Poll for device admin a few seconds later, or rely on AppState
            setTimeout(checkPermissions, 3000);
          },
        },
      ]
    );
  };

  const checkPermissions = async () => {
    try {
      const hasUsage = await AppBlockerModule.hasUsageStatsPermission?.() ?? false;
      const hasAccess = await AppBlockerModule.isAccessibilityEnabled?.() ?? false;
      const hasAdmin = await AppBlockerModule.isDeviceAdminEnabled?.() ?? false;
      setGranted({ usage: hasUsage, accessibility: hasAccess, admin: hasAdmin });
    } catch (e) {
      console.warn('Failed to check permissions', e);
    }
  };

  useEffect(() => {
    // Initial check
    checkPermissions();

    // Check when returning to app from settings
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const steps: Step[] = [
    {
      id: 'usage',
      emoji: '📊',
      title: 'Usage Access',
      description:
        'GuardianApp needs permission to see which apps are being used and for how long. Go to Settings → Usage Access and enable GuardianApp.',
      actionLabel: 'Open Settings',
      onAction: () => {
        openUsageSettings();
        setGranted((g) => ({ ...g, usage: true }));
      },
    },
    {
      id: 'accessibility',
      emoji: '♿',
      title: 'Accessibility Service',
      description:
        'This allows GuardianApp to enforce app blocks. Go to Settings → Accessibility → GuardianApp Service and turn it on.',
      actionLabel: 'Open Accessibility Settings',
      onAction: () => {
        openAccessibilitySettings();
        setGranted((g) => ({ ...g, accessibility: true }));
      },
    },
    {
      id: 'admin',
      emoji: '🔒',
      title: 'Device Administrator',
      description:
        'This prevents your child from uninstalling the GuardianApp without parent permission, keeping protection active.',
      actionLabel: 'Enable Device Admin',
      onAction: requestDeviceAdmin,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isCurrentGranted = granted[current.id as keyof typeof granted];

  const handleNext = () => {
    if (!isCurrentGranted) {
      Alert.alert('Permission Required', 'Please complete this step before continuing.');
      return;
    }
    
    if (isLast) {
      markComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Progress */}
      <View className="flex-row gap-x-2 justify-center pt-6 pb-2">
        {steps.map((_, i) => (
          <View
            key={i}
            className="h-2 rounded-full"
            style={{
              width: i === step ? 28 : 8,
              backgroundColor: i <= step ? '#7C6AF5' : '#2A2A3E',
            }}
          />
        ))}
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View className="w-32 h-32 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mb-8">
          <Text style={{ fontSize: 56 }}>{current.emoji}</Text>
        </View>

        <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-2">
          Step {step + 1} of {steps.length}
        </Text>
        <Text className="text-text-primary text-2xl font-bold text-center mb-4">
          {current.title}
        </Text>
        <Text className="text-text-muted text-base text-center leading-6 mb-6">
          {current.description}
        </Text>

        {/* Status Indicator */}
        <View className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isCurrentGranted ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          <Text className="text-lg">{isCurrentGranted ? '✅' : '❌'}</Text>
          <Text className={`font-bold ${isCurrentGranted ? 'text-emerald-400' : 'text-red-400'}`}>
            {isCurrentGranted ? 'Permission Granted' : 'Permission Missing'}
          </Text>
        </View>
      </View>

      <View className="px-8 pb-8 gap-y-3">
        {/* Primary action */}
        <TouchableOpacity
          id={`btn-setup-action-${current.id}`}
          onPress={current.onAction}
          className="border border-accent/60 py-4 rounded-2xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-accent font-semibold">{current.actionLabel}</Text>
        </TouchableOpacity>

        {/* Next / Done */}
        <TouchableOpacity
          id="btn-setup-next"
          onPress={handleNext}
          className={`py-4 rounded-2xl items-center ${isCurrentGranted ? 'bg-accent' : 'bg-bg-elevated opacity-50'}`}
          activeOpacity={0.85}
          disabled={!isCurrentGranted}
        >
          <Text className={`font-bold text-base ${isCurrentGranted ? 'text-white' : 'text-text-muted'}`}>
            {isLast ? 'Finish Setup' : 'Done — Next Step'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
