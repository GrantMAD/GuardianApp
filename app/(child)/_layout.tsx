import React from 'react';
import { Stack } from 'expo-router';

export default function ChildLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="app-blocked" />
      <Stack.Screen name="request-sent" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
