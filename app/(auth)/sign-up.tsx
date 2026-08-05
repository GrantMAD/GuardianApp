import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '@/services/authService';
import { getFamily } from '@/services/childService';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import Toast from 'react-native-toast-message';
import Svg, { Path, Circle } from 'react-native-svg';

export default function SignUpScreen() {
  const router = useRouter();
  const { setSession, setUser, setRole } = useAuthStore();
  const { setFamily } = useFamilyStore();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !familyName) {
      Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: 'Please fill in all fields.' });
      return;
    }
    if (password.length < 8) {
      Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: 'Password must be at least 8 characters long.' });
      return;
    }
    setLoading(true);
    try {
      const data = await signUp(email, password, familyName);
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setRole('parent');
        router.replace('/(parent)/dashboard');
      } else {
        Toast.show({ type: 'success', text1: 'Account Created', text2: 'Check your email to confirm your account.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: e.message ?? 'Sign up failed.' });
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
          <View className="flex-row items-center mb-1">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7C6AF5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <Circle cx={9} cy={7} r={4} />
              <Path d="M23 21v-2a4 4 0 00-3-3.87" />
              <Path d="M16 3.13a4 4 0 010 7.75" />
            </Svg>
            <Text className="text-text-primary text-sm font-bold">Family Name</Text>
          </View>
          <Text className="text-text-muted text-xs mb-3">This is how your family will be identified in the app.</Text>
          <TextInput
            id="input-family-name"
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="e.g. The Smiths"
            placeholderTextColor="#9090A8"
            className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6"
          />

          {/* Email */}
          <View className="flex-row items-center mb-1">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7C6AF5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <Path d="M22 6l-10 7L2 6" />
            </Svg>
            <Text className="text-text-primary text-sm font-bold">Email address</Text>
          </View>
          <Text className="text-text-muted text-xs mb-3">We will use this to contact you and secure your account.</Text>
          <TextInput
            id="input-email"
            value={email}
            onChangeText={setEmail}
            placeholder="parent@email.com"
            placeholderTextColor="#9090A8"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6"
          />

          {/* Password */}
          <View className="flex-row items-center mb-1">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7C6AF5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </Svg>
            <Text className="text-text-primary text-sm font-bold">Password</Text>
          </View>
          <Text className="text-text-muted text-xs mb-3">Must be at least 8 characters long.</Text>
          <View className="relative justify-center mb-3">
            <TextInput
              id="input-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="#9090A8"
              secureTextEntry={!showPassword}
              className="bg-bg-card border border-border rounded-2xl pl-4 pr-12 py-4 text-text-primary text-base"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-2 p-3"
              activeOpacity={0.7}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9090A8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <><Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><Path d="M1 1l22 22" /></>
                ) : (
                  <><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx={12} cy={12} r={3} /></>
                )}
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Password Validation Bar */}
          <View className="mb-8">
            <View className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden mb-2">
              <View 
                className={`h-full rounded-full ${password.length >= 8 ? 'bg-success' : password.length > 0 ? 'bg-warning' : 'bg-transparent'}`}
                style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }}
              />
            </View>
            <Text className={`text-xs font-medium ${password.length >= 8 ? 'text-success' : password.length > 0 ? 'text-warning' : 'text-text-muted'}`}>
              {password.length >= 8 ? '✓ Password is long enough' : password.length > 0 ? `${password.length}/8 characters` : 'Enter a password'}
            </Text>
          </View>

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
