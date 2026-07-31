import { NativeModules, Platform } from 'react-native';

export interface AppBlockerModule {
  blockApp(packageName: string): Promise<void>;
  unblockApp(packageName: string): Promise<void>;
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
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
        console.warn('[AppBlockerModule] isAccessibilityEnabled called (STUB/UNSUPPORTED)');
        return false;
      },
      openAccessibilitySettings: () => {
        console.warn('[AppBlockerModule] openAccessibilitySettings called (STUB/UNSUPPORTED)');
      }
    };

export default AppBlockerModuleWrapper;
