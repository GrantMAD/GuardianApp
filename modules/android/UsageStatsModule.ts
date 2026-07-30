import { NativeModules, Platform } from 'react-native';

export interface UsageStat {
  packageName: string;
  totalTimeInForeground: number; // milliseconds
  lastTimeUsed: number; // timestamp
}

export interface InstalledApp {
  packageName: string;
  appName: string;
}

export interface UsageStatsModuleType {
  getUsageStats(startTime: number, endTime: number): Promise<UsageStat[]>;
  getInstalledApps(): Promise<InstalledApp[]>;
  isPermissionGranted(): Promise<boolean>;
  openUsageAccessSettings(): void;
}

const { UsageStatsModule } = NativeModules;

const UsageStatsModuleStub: UsageStatsModuleType = {
  getUsageStats: async (startTime, endTime) => {
    console.warn('[UsageStatsModule] getUsageStats called (STUB)');
    return [];
  },
  getInstalledApps: async () => {
    console.warn('[UsageStatsModule] getInstalledApps called (STUB)');
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

export default (Platform.OS === 'android' && UsageStatsModule 
  ? UsageStatsModule as UsageStatsModuleType 
  : UsageStatsModuleStub);
