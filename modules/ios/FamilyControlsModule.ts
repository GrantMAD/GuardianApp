// iOS FamilyControls bridge (Phase 1 Stub)
// In Phase 2, this will bridge to a Swift Native Module for ManagedSettingsStore.

export interface FamilyControlsModule {
  restrictApp(bundleId: string): Promise<void>;
  unrestrictApp(bundleId: string): Promise<void>;
  isRestricted(bundleId: string): Promise<boolean>;
}

const FamilyControlsModuleStub: FamilyControlsModule = {
  restrictApp: async (bundleId) => {
    console.warn(`[FamilyControlsModule] restrictApp(${bundleId}) called (STUB)`);
  },
  unrestrictApp: async (bundleId) => {
    console.warn(`[FamilyControlsModule] unrestrictApp(${bundleId}) called (STUB)`);
  },
  isRestricted: async (bundleId) => {
    console.warn(`[FamilyControlsModule] isRestricted(${bundleId}) called (STUB)`);
    return false;
  }
};

export default FamilyControlsModuleStub;
