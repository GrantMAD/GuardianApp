import { NativeModules, Platform } from 'react-native';

export interface AppBlockerModule {
  blockApp(packageName: string): Promise<void>;
  unblockApp(packageName: string): Promise<void>;
  isAccessibilityEnabled(): Promise<boolean>;
  hasUsageStatsPermission(): Promise<boolean>;
  isDeviceAdminEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  openUsageSettings(): void;
  requestDeviceAdmin(): void;
}

const { AppBlockerModule } = NativeModules;

const AppBlockerModuleWrapper: AppBlockerModule = Platform.OS === 'android' && AppBlockerModule
  ? AppBlockerModule
  : {
      blockApp: async (packageName: string) => {
        console.warn(`[AppBlockerModule] blockApp(${packageName}) called (STUB/UNSUPPORTED)`);
      },
      unblockApp: async (packageName: string) => {
        console.warn(`[AppBlockerModule] unblockApp(${packageName}) called (STUB/UNSUPPORTED)`);
      },
      isAccessibilityEnabled: async () => {
        if (Platform.OS === 'web') return true;
        console.warn('[AppBlockerModule] isAccessibilityEnabled called (STUB/UNSUPPORTED)');
        return false;
      },
      hasUsageStatsPermission: async () => {
        if (Platform.OS === 'web') return true;
        console.warn('[AppBlockerModule] hasUsageStatsPermission called (STUB/UNSUPPORTED)');
        return false;
      },
      isDeviceAdminEnabled: async () => {
        if (Platform.OS === 'web') return true;
        console.warn('[AppBlockerModule] isDeviceAdminEnabled called (STUB/UNSUPPORTED)');
        return false;
      },
      openAccessibilitySettings: () => {
        console.warn('[AppBlockerModule] openAccessibilitySettings called (STUB/UNSUPPORTED)');
      },
      openUsageSettings: () => {
        console.warn('[AppBlockerModule] openUsageSettings called (STUB/UNSUPPORTED)');
      },
      requestDeviceAdmin: () => {
        console.warn('[AppBlockerModule] requestDeviceAdmin called (STUB/UNSUPPORTED)');
      },
    };

export default AppBlockerModuleWrapper;
