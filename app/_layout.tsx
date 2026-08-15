import '../global.css';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/ToastConfig';
import { usePushToken } from '@/hooks/usePushToken';

// Theme is applied dynamically in AuthGuard using familyStore

const queryClient = new QueryClient();

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { session, role, childId, setSession, setUser } = useAuthStore();
  const { theme } = require('@/store/familyStore').useFamilyStore();

  usePushToken();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuth  = segments[0] === '(auth)';
    const inChild = segments[0] === '(child)';

    // A paired child device has no Supabase session but has role + childId
    const isPairedChild = role === 'child' && childId;

    if (!session && !isPairedChild && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if ((session || isPairedChild) && inAuth) {
      if (role === 'child') {
        router.replace('/(child)/home');
      } else {
        router.replace('/(parent)/dashboard');
      }
    }
  }, [session, role, childId, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
        </QueryClientProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
