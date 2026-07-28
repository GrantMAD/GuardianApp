// Android permission strings
export const ANDROID_PERMISSIONS = {
  USAGE_STATS:        'android.permission.PACKAGE_USAGE_STATS',
  SYSTEM_ALERT:       'android.permission.SYSTEM_ALERT_WINDOW',
  BOOT_COMPLETED:     'android.permission.RECEIVE_BOOT_COMPLETED',
  FOREGROUND_SERVICE: 'android.permission.FOREGROUND_SERVICE',
  POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
} as const;

// iOS entitlements (for reference — applied in Xcode)
export const IOS_ENTITLEMENTS = {
  FAMILY_CONTROLS: 'com.apple.developer.family-controls',
} as const;
