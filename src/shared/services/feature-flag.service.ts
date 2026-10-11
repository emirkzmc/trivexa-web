export type FeatureFlag = 'DEMO_MODE';

export class FeatureFlagService {
  /**
   * Check if a specific feature flag is enabled.
   * Reads from Vite environment variables.
   * @param flag The feature flag to check
   */
  static isEnabled(flag: FeatureFlag): boolean {
    if (flag === 'DEMO_MODE') {
      const demoMode = import.meta.env.VITE_FEATURE_DEMO_MODE;
      return demoMode === 'true' || demoMode === '1';
    }
    return false;
  }
}
