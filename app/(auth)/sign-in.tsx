import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '@/services/authService';
import { getFamily, getChildren } from '@/services/childService';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import Toast from 'react-native-toast-message';
import BackButton from '@/components/ui/BackButton';

export default function SignInScreen() {
  const router = useRouter();
  const { setSession, setUser, setRole } = useAuthStore();
  const { setFamily, setChildren, setSelectedChildId } = useFamilyStore();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Sign In Failed', text2: 'Please enter your email and password.' });
      return;
    }
    setLoading(true);
    try {
      const data = await signIn(email, password);
      setSession(data.session);
      setUser(data.user);
      setRole('parent');

      // Load family & children into store
      const family = await getFamily();
      if (family) {
        setFamily(family);
        const children = await getChildren(family.id);
        setChildren(children);
        if (children.length > 0) setSelectedChildId(children[0].id);
      }
      router.replace('/(parent)/dashboard');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Sign In Failed', text2: e.message ?? 'Sign in failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Back button — stays top-left, outside the centered content */}
        <View className="mt-2 mx-8">
          <BackButton onPress={() => router.back()} />
        </View>

        <ScrollView
          className="flex-1 px-8"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          {/* Centered form content */}
          <View className="items-center w-full">
            <Text className="text-text-primary text-3xl font-bold mb-1 text-center">Welcome back</Text>
            <Text className="text-text-muted text-sm mb-8 text-center">Sign in to your parent account.</Text>

            {/* Email */}
            <Text className="text-text-muted text-sm font-medium mb-2 self-start">Email address</Text>
            <TextInput
              id="input-email"
              value={email}
              onChangeText={setEmail}
              placeholder="parent@email.com"
              placeholderTextColor="#9090A8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-4 w-full"
            />

            {/* Password */}
            <Text className="text-text-muted text-sm font-medium mb-2 self-start">Password</Text>
            <TextInput
              id="input-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor="#9090A8"
              secureTextEntry
              className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6 w-full"
            />

            {/* Submit */}
            <TouchableOpacity
              id="btn-sign-in"
              onPress={handleSignIn}
              disabled={loading}
              className="bg-accent py-4 rounded-2xl items-center mb-4 w-full"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign up link */}
            <View className="flex-row justify-center mb-8">
              <Text className="text-text-muted text-sm">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
                <Text className="text-accent text-sm font-semibold">Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
