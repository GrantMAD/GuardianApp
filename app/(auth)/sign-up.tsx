import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '@/services/authService';
import { createFamily, getFamily } from '@/services/childService';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';

export default function SignUpScreen() {
  const router = useRouter();
  const { setSession, setUser, setRole } = useAuthStore();
  const { setFamily } = useFamilyStore();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !familyName) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await signUp(email, password, familyName);
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setRole('parent');
        // Create family on first sign-up
        const family = await createFamily(familyName);
        setFamily(family);
        router.replace('/(parent)/dashboard');
      } else {
        setError('Check your email to confirm your account.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed.');
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
        <ScrollView className="flex-1 px-8" keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
            <Text className="text-text-muted text-base">← Back</Text>
          </TouchableOpacity>

          <Text className="text-text-primary text-3xl font-bold mb-1">Create account</Text>
          <Text className="text-text-muted text-sm mb-8">Set up your parent account to get started.</Text>

          {/* Family Name */}
          <Text className="text-text-muted text-sm font-medium mb-2">Family Name</Text>
          <TextInput
            id="input-family-name"
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="e.g. The Smiths"
            placeholderTextColor="#9090A8"
            className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-4"
          />

          {/* Email */}
          <Text className="text-text-muted text-sm font-medium mb-2">Email address</Text>
          <TextInput
            id="input-email"
            value={email}
            onChangeText={setEmail}
            placeholder="parent@email.com"
            placeholderTextColor="#9090A8"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-4"
          />

          {/* Password */}
          <Text className="text-text-muted text-sm font-medium mb-2">Password</Text>
          <TextInput
            id="input-password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            placeholderTextColor="#9090A8"
            secureTextEntry
            className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6"
          />

          {/* Error */}
          {error ? (
            <View className="bg-danger/20 border border-danger/40 rounded-xl p-3 mb-4">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            id="btn-create-account"
            onPress={handleSignUp}
            disabled={loading}
            className="bg-accent py-4 rounded-2xl items-center mb-4"
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign in link */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-text-muted text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text className="text-accent text-sm font-semibold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
