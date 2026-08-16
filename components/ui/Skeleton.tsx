import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, opacity: fadeAnim },
        style,
      ]}
    />
  );
}
