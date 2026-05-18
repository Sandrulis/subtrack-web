export {};

declare global {
  interface Window {
    __SUBTRACK_DEMO_DASHBOARD__?: boolean;
    /** `/demo/analytics`: FS neaizstāj bootstrap ar API. */
    __SUBTRACK_DEMO_ANALYTICS__?: boolean;
    subtrackReloadSubscriptionsFromBootstrap?: () => void;
    fsBootDashboard?: () => void;
    fsBootAnalytics?: () => void;
    fsBootDashAlerts?: () => void;
  }
}
