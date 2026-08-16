import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/services/authService';
import { updateFamilyTheme } from '@/services/childService';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const router  = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, signOut: clearAuth } = useAuthStore();
  const { family, children, theme, setTheme, clearFamily } = useFamilyStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          clearAuth();
          clearFamily();
          Toast.show({ type: 'info', text1: 'Signed Out', text2: 'You have been signed out of your account.' });
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleToggleTheme = async () => {
    if (!family) return;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    // Optimistic UI update
    setTheme(newTheme);
    try {
      await updateFamilyTheme(family.id, newTheme);
      Toast.show({ type: 'success', text1: 'Theme Updated', text2: `App theme changed to ${newTheme}.` });
    } catch (err) {
      setTheme(theme);
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Could not update theme.' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bgPrimary} />
      <ScrollView className="flex-1 px-5">
        <Text className="text-text-primary text-2xl font-bold pt-4 mb-5">Settings</Text>

        {/* Account card */}
        <View className="bg-bg-card rounded-2xl p-4 border border-border mb-5 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-3">
            <Text className="text-accent font-bold text-lg">
              {user?.email?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-semibold">{family?.name ?? 'My Family'}</Text>
            <Text className="text-text-muted text-xs">{user?.email}</Text>
          </View>
        </View>

        {/* Children */}
        <SectionHeader
          title="Children"
          icon="👥"
          actionLabel="+ Add Child"
          onAction={() => router.push('/(parent)/settings/add-child')}
        />
        {children.length === 0 ? (
          <View className="bg-bg-card rounded-2xl p-5 border border-border mb-5 items-center">
            <Text className="text-text-muted text-sm">No children added yet.</Text>
            <TouchableOpacity
              onPress={() => router.push('/(parent)/settings/add-child')}
              className="mt-3"
            >
              <Text className="text-accent font-medium text-sm">+ Add your first child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-bg-card rounded-2xl border border-border mb-5 overflow-hidden">
            {children.map((child, i) => (
              <TouchableOpacity
                key={child.id}
                id={`child-profile-${child.id}`}
                onPress={() => router.push(`/(parent)/settings/child/${child.id}`)}
                className={`flex-row items-center p-4 ${i < children.length - 1 ? 'border-b border-border' : ''}`}
              >
                <ChildAvatar name={child.name} avatarUrl={child.avatar_url} size="sm" />
                <View className="flex-1 ml-3">
                  <Text className="text-text-primary font-semibold">{child.name}</Text>
                  <Text className="text-text-muted text-xs">
                    {child.is_active ? '✅ Active' : '⚫ Inactive'}
                  </Text>
                </View>
                <Text className="text-text-muted">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* General settings */}
        <SectionHeader title="General" icon="⚙️" />
        <View className="bg-bg-card rounded-2xl border border-border mb-5 overflow-hidden">
          <TouchableOpacity
            id="settings-theme"
            onPress={handleToggleTheme}
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <Text className="text-text-primary">🎨 Theme Mode</Text>
            <Text className="text-text-muted capitalize">{theme} ›</Text>
          </TouchableOpacity>

          {[
            { label: '📋 Activity Log', route: '/(parent)/settings/activity-log' as const },
            { label: '🔔 Notification Settings', route: '/(parent)/settings/notifications' as const },
            { label: '🔒 Privacy Policy', route: '/(parent)/settings/privacy' as const },
            { label: '📄 Terms of Service', route: '/(parent)/settings/terms' as const },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              id={`settings-${i}`}
              onPress={() => router.push(item.route)}
              className={`flex-row items-center justify-between p-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
            >
              <Text className="text-text-primary">{item.label}</Text>
              <Text className="text-text-muted">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          id="btn-sign-out"
          onPress={handleSignOut}
          className="border border-danger/40 rounded-2xl py-4 items-center mb-8"
        >
          <Text className="text-danger font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
