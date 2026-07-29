import { Platform, Linking, Alert } from 'react-native';

// ─── Android ────────────────────────────────────────────────────────────────

/**
 * Opens the Android "Usage Access" settings screen (Special App Access).
 * The user must manually grant the PACKAGE_USAGE_STATS permission there.
 * Phase 1 stub — native module confirmation of grant happens in Phase 2.
 */
export async function requestUsageStatsPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn('[devicePermissions] requestUsageStatsPermission is Android-only.');
    return;
  }
  try {
    await Linking.openSettings();
  } catch (e) {
    Alert.alert(
      'Permission Required',
      'Please go to Special App Access > Usage Access and enable GuardianApp.'
    );
  }
}

/**
 * Opens the Android "Display over other apps" settings screen.
 * Required for the SYSTEM_ALERT_WINDOW permission (block overlay).
 * Phase 1 stub.
 */
export async function requestOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn('[devicePermissions] requestOverlayPermission is Android-only.');
    return;
  }
  try {
    await Linking.openSettings();
  } catch (e) {
    Alert.alert(
      'Permission Required',
      'Please go to Special App Access > Display over other apps and enable GuardianApp.'
    );
  }
}

/**
 * Checks whether the UsageStats permission has been granted.
 * Phase 1 stub — returns false until the Kotlin native module is implemented in Phase 2.
 */
export async function checkUsageStatsGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // TODO Phase 2: replace with UsageStatsModule.isPermissionGranted()
  console.warn('[devicePermissions] checkUsageStatsGranted: native module not yet implemented.');
  return false;
}

/**
 * Checks whether the Accessibility Service (required for app blocking overlay) is enabled.
 * Phase 1 stub — returns false until the Kotlin native module is implemented in Phase 2.
 */
export async function checkAccessibilityEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // TODO Phase 2: replace with AppBlockerModule.isAccessibilityEnabled()
  console.warn('[devicePermissions] checkAccessibilityEnabled: native module not yet implemented.');
  return false;
}

/**
 * Opens the Accessibility Settings screen so the user can enable the
 * GuardianApp Accessibility Service (required for app blocking).
 * Phase 1 stub.
 */
export async function requestAccessibilityPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.warn('[devicePermissions] requestAccessibilityPermission is Android-only.');
    return;
  }
  // TODO Phase 2: replace with AppBlockerModule.openAccessibilitySettings()
  await Linking.openSettings();
}

// ─── iOS ────────────────────────────────────────────────────────────────────

/**
 * Requests Screen Time / Family Controls authorization on iOS.
 * Requires the com.apple.developer.family-controls entitlement.
 * Phase 1 stub — returns 'denied' until the Swift native module is implemented in Phase 2.
 */
export async function requestScreenTimeAuthorization(): Promise<'authorized' | 'denied'> {
  if (Platform.OS !== 'ios') {
    console.warn('[devicePermissions] requestScreenTimeAuthorization is iOS-only.');
    return 'denied';
  }
  // TODO Phase 2: replace with ScreenTimeModule.requestAuthorization()
  console.warn('[devicePermissions] requestScreenTimeAuthorization: native module not yet implemented.');
  return 'denied';
}
