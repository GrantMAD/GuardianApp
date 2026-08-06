import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import Svg, {
  Defs, LinearGradient, Stop, Rect, Circle, Path, G,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import BackButton from '@/components/ui/BackButton';

const { width } = Dimensions.get('window');

// ─── Gradient button ──────────────────────────────────────────────────────────
function GradientButton({ label, onPress, id }: { label: string; onPress: () => void; id: string }) {
  return (
    <TouchableOpacity id={id} onPress={onPress} activeOpacity={0.85} style={styles.gradientBtn}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#7C6AF5" />
            <Stop offset="1" stopColor="#4ECDC4" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={14} fill={`url(#grad-${id})`} />
      </Svg>
      <Text style={styles.gradientBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Role card ────────────────────────────────────────────────────────────────
function RoleCard({
  id,
  icon,
  title,
  description,
  isPrimary,
  onPress,
  colors,
  isDark,
}: {
  id: string;
  icon: string;
  title: string;
  description: string;
  isPrimary: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn  = () => { scale.value = withTiming(0.975, { duration: 100, easing: Easing.out(Easing.quad) }); };
  const handlePressOut = () => { scale.value = withTiming(1,     { duration: 150, easing: Easing.out(Easing.quad) }); };

  const borderColor = isPrimary ? 'rgba(124,106,245,0.45)' : colors.border;
  const bgColor     = isPrimary
    ? (isDark ? 'rgba(124,106,245,0.07)' : 'rgba(124,106,245,0.04)')
    : colors.bgCard;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        id={id}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, { backgroundColor: bgColor, borderColor }]}
      >
        {/* Subtle top-right glow for primary card */}
        {isPrimary && (
          <Svg style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} width="100%" height="100%">
            <Defs>
              <LinearGradient id="cardGlow" x1="1" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#7C6AF5" stopOpacity="0.1" />
                <Stop offset="1" stopColor="#7C6AF5" stopOpacity="0"   />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={24} fill="url(#cardGlow)" />
          </Svg>
        )}

        {/* Icon badge */}
        <View style={[
          styles.iconBadge,
          { backgroundColor: isPrimary ? 'rgba(124,106,245,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') },
        ]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.cardDesc,  { color: colors.textMuted   }]}>{description}</Text>

        {/* CTA row */}
        <View style={styles.cardCta}>
          {isPrimary ? (
            <GradientButton id={`${id}-cta`} label={`Set up as ${title}`} onPress={onPress} />
          ) : (
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.ghostCardBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.ghostCardBtnLabel, { color: colors.textPrimary }]}>
                Set up as {title}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();
  const { colors, isDark } = useAppTheme();

  const handleParent = () => { setRole('parent'); router.push('/(auth)/sign-up'); };
  const handleChild  = () => { setRole('child');  router.push('/(auth)/child-pairing'); };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgPrimary}
      />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} id="btn-back" />
      </View>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Who are you?</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Choose how you'll use Guardian on this device.
        </Text>
      </View>

      {/* Role cards */}
      <View style={styles.cards}>
        <RoleCard
          id="btn-role-parent"
          icon="👨‍👩‍👧"
          title="Parent"
          description="Manage your children's screen time, set limits, create schedules, and monitor usage from your dashboard."
          isPrimary
          onPress={handleParent}
          colors={colors}
          isDark={isDark}
        />
        <RoleCard
          id="btn-role-child"
          icon="👦"
          title="Child Device"
          description="Link this device to your family using the 6-digit pairing code from your parent's phone."
          isPrimary={false}
          onPress={handleChild}
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* Footer note */}
      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        You can change this later in settings
      </Text>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
  },
  backArrow: {
    fontSize: 20,
  },
  titleBlock: {
    marginTop: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cards: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    overflow: 'hidden',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  cardCta: {},
  gradientBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientBtnLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostCardBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostCardBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },
});
