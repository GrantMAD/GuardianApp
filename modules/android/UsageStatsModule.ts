// Android UsageStatsManager bridge (Phase 1 Stub)
// In Phase 2, this will bridge to a Kotlin Native Module.

export interface UsageStat {
  packageName: string;
  totalTimeInForeground: number; // milliseconds
  lastTimeUsed: number; // timestamp
}

export interface UsageStatsModule {
  getUsageStats(startTime: number, endTime: number): Promise<UsageStat[]>;
  isPermissionGranted(): Promise<boolean>;
  openUsageAccessSettings(): void;
}

const UsageStatsModuleStub: UsageStatsModule = {
  getUsageStats: async (startTime, endTime) => {
    console.warn('[UsageStatsModule] getUsageStats called (STUB)');
    return [];
  },
  isPermissionGranted: async () => {
    console.warn('[UsageStatsModule] isPermissionGranted called (STUB)');
    return false;
  },
  openUsageAccessSettings: () => {
    console.warn('[UsageStatsModule] openUsageAccessSettings called (STUB)');
  }
};

export default UsageStatsModuleStub;
