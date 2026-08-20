import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { useAppTheme } from '@/hooks/useAppTheme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View 
      className="items-center justify-center w-20 py-1.5 rounded-2xl"
      style={{ backgroundColor: focused ? `${colors.accent}20` : 'transparent' }}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          fontWeight: focused ? '700' : '500',
          color: focused ? colors.textPrimary : colors.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ParentLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        animation: 'shift',
        headerShown: true,
        header: () => <TopNavbar />,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 86,
          paddingTop: 16,
          paddingBottom: 16,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📱" label="Apps" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Rules" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" label="Rewards" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      {/* Hidden screens — no tab bar entry */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />

      {/* Hide all sub-routes from tab bar */}
      <Tabs.Screen name="settings/add-child" options={{ href: null }} />
      <Tabs.Screen name="settings/notifications" options={{ href: null }} />
      <Tabs.Screen name="settings/privacy" options={{ href: null }} />
      <Tabs.Screen name="settings/terms" options={{ href: null }} />
      <Tabs.Screen name="settings/child/[childId]" options={{ href: null }} />

      <Tabs.Screen name="rules/create-block" options={{ href: null }} />
      <Tabs.Screen name="rules/create-limit" options={{ href: null }} />
      <Tabs.Screen name="rules/schedules" options={{ href: null }} />
      <Tabs.Screen name="rules/schedules/create" options={{ href: null }} />

      <Tabs.Screen name="apps/[appId]" options={{ href: null }} />
      <Tabs.Screen name="locations" options={{ href: null }} />
    </Tabs>
  );
}
