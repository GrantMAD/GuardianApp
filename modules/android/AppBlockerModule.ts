// Android Accessibility Service bridge for app blocking (Phase 1 Stub)
// In Phase 2, this will bridge to a Kotlin Native Module.

export interface AppBlockerModule {
  blockApp(packageName: string): Promise<void>;
  unblockApp(packageName: string): Promise<void>;
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
}

const AppBlockerModuleStub: AppBlockerModule = {
  blockApp: async (packageName) => {
    console.warn(`[AppBlockerModule] blockApp(${packageName}) called (STUB)`);
  },
  unblockApp: async (packageName) => {
    console.warn(`[AppBlockerModule] unblockApp(${packageName}) called (STUB)`);
  },
  isAccessibilityEnabled: async () => {
    console.warn('[AppBlockerModule] isAccessibilityEnabled called (STUB)');
    return false;
  },
  openAccessibilitySettings: () => {
    console.warn('[AppBlockerModule] openAccessibilitySettings called (STUB)');
  }
};

export default AppBlockerModuleStub;
