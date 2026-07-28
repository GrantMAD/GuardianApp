import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type BlockReason = 'time_limit' | 'blocked_by_parent' | 'schedule';

interface BlockOverlayProps {
  appName: string;
  reason: BlockReason;
  onRequestAccess?: () => void;
  resetTime?: string; // e.g. "resets at midnight"
}

const REASON_MAP: Record<BlockReason, { title: string; subtitle: string; emoji: string }> = {
  time_limit:       { emoji: '⏱️', title: 'Time limit reached',      subtitle: "You've used up your daily limit for this app." },
  blocked_by_parent:{ emoji: '🔒', title: 'Blocked by your parent',   subtitle: 'Your parent has restricted access to this app.' },
  schedule:         { emoji: '🕐', title: 'Restricted by schedule',   subtitle: 'This app is blocked during the current time window.' },
};

export function BlockOverlay({ appName, reason, onRequestAccess, resetTime }: BlockOverlayProps) {
  const info = REASON_MAP[reason];

  return (
    <View style={StyleSheet.absoluteFill} className="bg-bg-primary/95 items-center justify-center px-8">
      {/* Icon */}
      <View className="w-24 h-24 rounded-3xl bg-bg-elevated border border-border items-center justify-center mb-6">
        <Text style={{ fontSize: 40 }}>{info.emoji}</Text>
      </View>

      {/* App name */}
      <Text className="text-text-muted text-sm font-medium mb-1">{appName}</Text>

      {/* Reason */}
      <Text className="text-text-primary text-2xl font-bold text-center mb-2">
        {info.title}
      </Text>
      <Text className="text-text-muted text-sm text-center mb-1">
        {info.subtitle}
      </Text>
      {resetTime && (
        <Text className="text-accent text-xs text-center mb-8">{resetTime}</Text>
      )}

      {/* Divider */}
      <View className="w-16 h-px bg-border mb-8" />

      {/* Request access */}
      {onRequestAccess && (
        <TouchableOpacity
          onPress={onRequestAccess}
          className="bg-accent px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold text-base">Ask Parent for Access</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
