import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.52;

// ─── Pulsing ring ─────────────────────────────────────────────────────────────
function PulseRing({ delay, size }: { delay: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0.55, 0.15, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1]) }],
    width: size,
    height: size,
    borderRadius: size / 2,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        { position: 'absolute', borderWidth: 1.5, borderColor: '#7C6AF5' },
      ]}
    />
  );
}

// ─── Shield SVG ───────────────────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <Svg width={72} height={80} viewBox="0 0 72 80" fill="none">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0" y1="0" x2="72" y2="80" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#9B8FF7" />
          <Stop offset="1" stopColor="#4ECDC4" />
        </LinearGradient>
      </Defs>
      <Path
        d="M36 2L6 14v22c0 18 13 34 30 38 17-4 30-20 30-38V14L36 2z"
        fill="url(#shieldGrad)"
        opacity={0.18}
      />
      <Path
        d="M36 2L6 14v22c0 18 13 34 30 38 17-4 30-20 30-38V14L36 2z"
        stroke="url(#shieldGrad)"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M24 40l8 8 16-18"
        stroke="#9B8FF7"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Hero background — adapts tint based on theme ────────────────────────────
function HeroBackground({ isDark }: { isDark: boolean }) {
  const from = isDark ? '#1A1730' : '#EEEBff';
  const mid  = isDark ? '#130F1E' : '#F3F1FF';
  const to   = isDark ? '#0F0F14' : '#F4F6FB';

  return (
    <Svg width={width} height={HERO_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="heroBg" x1="0" y1="0" x2={width} y2={HERO_HEIGHT} gradientUnits="userSpaceOnUse">
          <Stop offset="0"   stopColor={from} />
          <Stop offset="0.6" stopColor={mid}  />
          <Stop offset="1"   stopColor={to}   />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={HERO_HEIGHT} fill="url(#heroBg)" />
      <Circle cx={width * 0.85} cy={HERO_HEIGHT * 0.15} r={110} fill="#7C6AF5" opacity={0.06} />
      <Circle cx={width * 0.1}  cy={HERO_HEIGHT * 0.8}  r={90}  fill="#4ECDC4" opacity={0.05} />
    </Svg>
  );
}

// ─── Feature pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon, label, colors }: { icon: string; label: string; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

// ─── Gradient CTA button ──────────────────────────────────────────────────────
function GradientButton({ label, onPress, id }: { label: string; onPress: () => void; id: string }) {
  return (
    <TouchableOpacity id={id} onPress={onPress} activeOpacity={0.85} style={styles.gradientBtnWrapper}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#7C6AF5" />
            <Stop offset="1" stopColor="#4ECDC4" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={16} fill="url(#btnGrad)" />
      </Svg>
      <Text style={styles.gradientBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  // Floating shield
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);
  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1A1730' : '#EEEBff'}
      />

      {/* ── Hero ── */}
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <HeroBackground isDark={isDark} />

        <View style={styles.ringsContainer}>
          <PulseRing size={320} delay={0} />
          <PulseRing size={240} delay={700} />
          <PulseRing size={160} delay={1400} />

          <Animated.View style={[
            styles.shieldBox,
            shieldStyle,
            { backgroundColor: 'rgba(124,106,245,0.08)', borderColor: 'rgba(124,106,245,0.25)' },
          ]}>
            <ShieldIcon />
          </Animated.View>
        </View>

        {/* Hero text */}
        <View style={styles.heroText}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Guardian</Text>
          <Text style={styles.tagline}>Smart parental controls, simplified</Text>
        </View>
      </View>

      {/* ── Bottom panel ── */}
      <View style={[styles.panel, { backgroundColor: colors.bgPrimary }]}>

        {/* Feature pills */}
        <View style={styles.pillsContainer}>
          <FeaturePill icon="📊" label="Usage monitoring" colors={colors} />
          <FeaturePill icon="⏱️" label="Time limits"      colors={colors} />
          <FeaturePill icon="🔒" label="App blocking"     colors={colors} />
          <FeaturePill icon="📅" label="Schedules"        colors={colors} />
          <FeaturePill icon="🔔" label="Alerts"           colors={colors} />
        </View>

        {/* Body copy */}
        <Text style={[styles.bodyCopy, { color: colors.textMuted }]}>
          Keep your children safe and balanced — set rules, monitor usage, and stay in control from anywhere.
        </Text>

        {/* CTAs */}
        <View style={styles.ctas}>
          <GradientButton
            id="btn-get-started"
            label="Get Started"
            onPress={() => router.push('/(auth)/role-select')}
          />

          <TouchableOpacity
            id="btn-sign-in"
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
            style={styles.ghostBtn}
          >
            <Text style={[styles.ghostBtnLabel, { color: colors.textMuted }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  shieldBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 1,
  },
  heroText: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#9B8FF7',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  panel: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pillIcon: {
    fontSize: 15,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bodyCopy: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ctas: {
    gap: 12,
  },
  gradientBtnWrapper: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  ghostBtnLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
