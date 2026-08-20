import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface LocationConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Shown once on the child home screen before requesting background location.
 * Explains why we need it and gives a clear decline path.
 */
export function LocationConsentBanner({ onAccept, onDecline }: LocationConsentBannerProps) {
  return (
    <View
      style={{
        margin: 16,
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#1A1A2E',
        borderWidth: 1,
        borderColor: 'rgba(124, 106, 245, 0.4)',
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 6 }}>📍</Text>
      <Text
        style={{ color: '#E8E8F0', fontWeight: '700', fontSize: 15, marginBottom: 6 }}
      >
        Location-based Rules
      </Text>
      <Text style={{ color: '#9090A8', fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
        Your parent has set up rules that change automatically based on where you are (e.g.
        stricter limits at school, relaxed rules at home). Your location is only used to
        match a nearby zone — it is never stored or shared.{'\n\n'}
        You can turn this off any time in your device Settings.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={onDecline}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#9090A8', fontWeight: '600', fontSize: 13 }}>No thanks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          style={{
            flex: 1,
            backgroundColor: '#7C6AF5',
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Allow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
