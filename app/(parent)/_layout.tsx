import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { TopNavbar } from '@/components/ui/TopNavbar';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          fontWeight: focused ? '700' : '500',
          color: focused ? '#7C6AF5' : '#9090A8',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <TopNavbar />,
        tabBarStyle: {
          backgroundColor: '#1A1A24',
          borderTopColor: '#2A2A3E',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
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
    </Tabs>
  );
}
