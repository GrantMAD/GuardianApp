// iOS Screen Time API bridge (Phase 1 Stub)
// In Phase 2, this will bridge to a Swift Native Module using FamilyControls.

export interface ActivityReport {
  bundleId: string;
  totalTimeInSeconds: number;
}

export interface ScreenTimeModule {
  requestAuthorization(): Promise<'authorized' | 'denied' | 'notDetermined'>;
  getActivityReport(startDate: string, endDate: string): Promise<ActivityReport[]>;
}

const ScreenTimeModuleStub: ScreenTimeModule = {
  requestAuthorization: async () => {
    console.warn('[ScreenTimeModule] requestAuthorization called (STUB)');
    return 'denied';
  },
  getActivityReport: async (startDate, endDate) => {
    console.warn('[ScreenTimeModule] getActivityReport called (STUB)');
    return [];
  }
};

export default ScreenTimeModuleStub;
