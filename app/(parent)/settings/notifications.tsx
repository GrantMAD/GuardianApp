import React, { useState } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotifSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotifSetting[]>([
    { key: 'daily_report',    label: 'Daily Report',       description: 'Morning summary of yesterday\'s usage', enabled: true  },
    { key: 'weekly_report',   label: 'Weekly Report',      description: 'Sunday evening weekly recap',           enabled: true  },
    { key: 'limit_warning',   label: 'Limit Warning',      description: 'When child is 10 min from their limit', enabled: true  },
    { key: 'threshold_alert', label: 'Threshold Alert',    description: 'When child hits 80% of daily limit',    enabled: true  },
    { key: 'late_night',      label: 'Late Night Alert',   description: 'Active usage detected past bedtime',    enabled: true  },
    { key: 'requests',        label: 'Permission Requests','description': 'When child asks for more time',       enabled: true  },
  ]);

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
          <Text className="text-text-muted text-base">← Back</Text>
        </TouchableOpacity>

        <Text className="text-text-primary text-2xl font-bold mb-1">Notifications</Text>
        <Text className="text-text-muted text-sm mb-6">
          Choose which alerts you want to receive.
        </Text>

        <View className="bg-bg-card rounded-2xl border border-border overflow-hidden mb-6">
          {settings.map((s, i) => (
            <View
              key={s.key}
              className={`flex-row items-center p-4 ${i < settings.length - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-text-primary font-semibold text-sm">{s.label}</Text>
                <Text className="text-text-muted text-xs mt-0.5">{s.description}</Text>
              </View>
              <Switch
                value={s.enabled}
                onValueChange={() => toggle(s.key)}
                trackColor={{ false: '#2A2A3E', true: '#7C6AF5' }}
                thumbColor="#F1F1F5"
              />
            </View>
          ))}
        </View>

        <View className="bg-bg-elevated rounded-2xl p-4 border border-border mb-8">
          <Text className="text-text-muted text-xs leading-5 text-center">
            Push notifications are delivered via Expo notifications. Make sure you've granted notification permission on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
