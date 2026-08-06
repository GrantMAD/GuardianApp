import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';

interface BackButtonProps {
  onPress: () => void;
  /** 'standalone' = floating pill button (auth/form screens)
   *  'header'     = pill icon for inline header bars  */
  variant?: 'standalone' | 'header';
  id?: string;
}

/**
 * A polished, app-wide back button.
 *
 * standalone variant — sits above the form content, left-aligned.
 * header variant    — used inside header row flex layouts.
 */
export default function BackButton({ onPress, variant = 'standalone', id }: BackButtonProps) {
  if (variant === 'header') {
    return (
      <TouchableOpacity
        id={id ?? 'btn-back'}
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.headerBtn}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="15 18 9 12 15 6" />
        </Svg>
        <Text style={styles.text}>Back</Text>
      </TouchableOpacity>
    );
  }

  // standalone
  return (
    <TouchableOpacity
      id={id ?? 'btn-back'}
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.standaloneBtn}
    >
      <View style={styles.standaloneInner}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="15 18 9 12 15 6" />
        </Svg>
        <Text style={styles.text}>Back</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── Standalone ──────────────────────────────────────────
  standaloneBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  standaloneInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 106, 245, 0.2)', // slightly more opaque to pop
    borderWidth: 1,
    borderColor: 'rgba(124, 106, 245, 0.4)',
  },

  // ── Header ──────────────────────────────────────────────
  headerBtn: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 106, 245, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 106, 245, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  // ── Text ──────────────────────────────────────────────
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  }
});
