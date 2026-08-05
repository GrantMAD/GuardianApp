import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consumePairingCode } from '@/services/pairingService';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { supabase } from '@/services/supabase';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '@/hooks/useAppTheme';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';

// ─── Gradient button ──────────────────────────────────────────────────────────
function GradientButton({
  label, onPress, id, disabled, loading,
}: {
  label: string; onPress: () => void; id: string; disabled: boolean; loading: boolean;
}) {
  return (
    <TouchableOpacity
      id={id}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[styles.gradientBtn, disabled && { opacity: 0.45 }]}
    >
      {!disabled && (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#7C6AF5" />
              <Stop offset="1" stopColor="#4ECDC4" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={16} fill="url(#btnGrad)" />
        </Svg>
      )}
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.gradientBtnLabel, disabled && { color: '#9090A8' }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Single digit box ─────────────────────────────────────────────────────────
function DigitBox({
  digit, isFocused, inputRef, index, onChange, onKeyPress, colors, isDark,
}: {
  digit: string;
  isFocused: boolean;
  inputRef: (r: TextInput | null) => void;
  index: number;
  onChange: (text: string, index: number) => void;
  onKeyPress: (e: any, index: number) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}) {
  const shake = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const borderColor = isFocused
    ? '#7C6AF5'
    : digit
    ? '#4ECDC4'
    : colors.border;

  const bgColor = digit
    ? (isDark ? 'rgba(124,106,245,0.1)' : 'rgba(124,106,245,0.06)')
    : colors.bgCard;

  return (
    <Animated.View style={[styles.digitWrapper, animStyle]}>
      <TextInput
        id={`code-digit-${index}`}
        ref={inputRef}
        value={digit}
        onChangeText={(t) => onChange(t, index)}
        onKeyPress={(e) => onKeyPress(e, index)}
        keyboardType="default"
        autoCapitalize="characters"
        maxLength={1}
        selectTextOnFocus
        style={[
          styles.digitInput,
          {
            borderColor,
            backgroundColor: bgColor,
            color: colors.textPrimary,
          },
        ]}
      />
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ChildPairingScreen() {
  const router = useRouter();
  const { setRole, setChildId, setFamilyId, setSession, setUser } = useAuthStore();
  const { setSelectedChildId } = useFamilyStore();
  const { colors, isDark } = useAppTheme();

  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [focusedIndex, setFocused] = useState<number | null>(null);
  const refs = useRef<TextInput[]>([]);

  const codeComplete = code.join('').length === 6;

  const handleInput = (text: string, index: number) => {
    // Allow letters and numbers only, auto-uppercase
    const clean = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const next = [...code];
    next[index] = clean.slice(-1);
    setCode(next);
    if (clean && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePair = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Toast.show({ type: 'error', text1: 'Pairing Failed', text2: 'Please enter the full 6-digit code.' });
      return;
    }
    setLoading(true);
    try {
      // Step 1: Sign in anonymously so the child device has a real Supabase
      // session. The RPC will use auth.uid() to link this user to the child row.
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;

      // Step 2: Consume the pairing code — RPC stores auth.uid() on the child
      const result = await consumePairingCode(fullCode, 'Android Device', 'android');

      // Step 3: Persist session and identifiers
      setSession(anonData.session);
      setUser(anonData.user);
      setRole('child');
      setChildId(result.child_id);
      setFamilyId(result.family_id);
      setSelectedChildId(result.child_id);

      Toast.show({ type: 'success', text1: 'Device Paired', text2: 'Welcome to GuardianApp.' });
      router.replace('/(child)/home');
    } catch (e: any) {
      // If pairing failed after anon sign-in, clean up the orphaned anon user
      await supabase.auth.signOut();
      Toast.show({ type: 'error', text1: 'Pairing Failed', text2: e.message ?? 'Invalid or expired code. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgPrimary}
      />

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} id="btn-back">
        <Text style={[styles.backArrow, { color: colors.textMuted }]}>←</Text>
      </TouchableOpacity>

      {/* Icon badge */}
      <View style={[
        styles.iconBadge,
        { backgroundColor: isDark ? 'rgba(124,106,245,0.12)' : 'rgba(124,106,245,0.08)' },
      ]}>
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V8.625M13.5 3L19 8.625M13.5 3V8.625H19"
            stroke="#9B8FF7"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M9 13l2 2 4-4" stroke="#4ECDC4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Pair this device</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Ask your parent for the 6-character pairing code shown in their Guardian dashboard.
      </Text>

      {/* Code input */}
      <View style={styles.codeRow}>
        {code.map((digit, i) => (
          <DigitBox
            key={i}
            index={i}
            digit={digit}
            isFocused={focusedIndex === i}
            inputRef={(r) => { if (r) refs.current[i] = r; }}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>

      {/* Helper text */}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        {codeComplete ? '✓  Code ready — tap below to pair' : 'Enter each digit one at a time'}
      </Text>

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <GradientButton
          id="btn-pair-device"
          label="Pair Device"
          onPress={handlePair}
          disabled={!codeComplete}
          loading={loading}
        />
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Where do I find the code?</Text>
        <Text style={[styles.infoBody, { color: colors.textMuted }]}>
          On the parent's phone, open Guardian → Settings → Family → Child Pairing Code.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    marginTop: 8,
    marginBottom: 28,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
  },
  backArrow: {
    fontSize: 20,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  digitWrapper: {},
  digitInput: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
    minHeight: 18,
  },
  ctaWrapper: {
    marginBottom: 28,
  },
  gradientBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(124,106,245,0.15)',
  },
  gradientBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
