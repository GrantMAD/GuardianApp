import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { signOut } from '@/services/authService';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export function TopNavbar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamilyStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  const navigateTo = (path: any) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  return (
    <>
      <View 
        className="flex-row items-center justify-between px-5 pb-3 bg-bg-primary border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <TouchableOpacity 
          id="btn-hamburger-menu"
          onPress={() => setIsMenuOpen(true)}
          className="w-10 h-10 bg-bg-elevated rounded-full items-center justify-center border border-border"
        >
          <Text style={{ fontSize: 20 }}>☰</Text>
        </TouchableOpacity>

        {/* Space in the middle */}
        <View className="flex-1" />

        <TouchableOpacity
          id="btn-notifications"
          onPress={() => router.push('/(parent)/notifications')}
          className="w-10 h-10 bg-bg-elevated rounded-full items-center justify-center border border-border"
        >
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View className="flex-1 flex-row">
          {/* Sidebar Menu */}
          <View 
            className="h-full bg-bg-card border-r border-border shadow-lg z-50"
            style={{ width: SIDEBAR_WIDTH, paddingTop: Math.max(insets.top, 20) }}
          >
            <View className="px-5 pb-6 border-b border-border">
              <Text className="text-text-muted text-sm mb-1">Signed in as</Text>
              <Text className="text-text-primary text-xl font-bold">{family?.name ?? 'Your Family'}</Text>
            </View>

            <View className="flex-1 pt-4">
              <TouchableOpacity
                className="px-5 py-4 flex-row items-center"
                onPress={() => navigateTo('/(parent)/settings')}
              >
                <Text className="text-2xl mr-4">⚙️</Text>
                <Text className="text-text-primary text-lg font-medium">Settings</Text>
              </TouchableOpacity>
            </View>

            <View className="pb-8 px-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
              <TouchableOpacity
                className="py-4 flex-row items-center border-t border-border"
                onPress={handleLogout}
              >
                <Text className="text-2xl mr-4">🚪</Text>
                <Text className="text-red-500 text-lg font-medium">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overlay to close menu when tapping outside */}
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View className="flex-1 bg-black/50" />
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </>
  );
}
