export {};

declare global {
  interface Window {
    subtrackSyncAppBadge?: (payload: number | import("@/lib/pwa/register-app-badge-bridge").LauncherBadgeSyncPayload) => void;
    subtrackTestLauncherBadge?: (
      opts?: import("@/lib/pwa/test-launcher-badge").TestLauncherBadgeOptions,
    ) => Promise<import("@/lib/pwa/test-launcher-badge").TestLauncherBadgeResult>;
    subtrackRefreshLauncherBadge?: () => void;
    subtrackDebugLauncherBadge?: () => Promise<Record<string, unknown>>;
  }
}
